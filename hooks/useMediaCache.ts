import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CacheService } from '../services/CacheService';
import { MediaService } from '../services/MediaService';

export interface MediaCacheConfig {
  maxCacheSize?: number; // em MB
  defaultExpiryHours?: number;
  enablePrefetch?: boolean;
  enableBackgroundSync?: boolean;
  compressionEnabled?: boolean;
}

export interface CachedMedia {
  id: string;
  uri: string;
  localPath?: string;
  remotePath: string;
  bucket: string;
  mimeType: string;
  size: number;
  cachedAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccessed: string;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  availableSpace: number;
  expiredItems: number;
}

export const useMediaCache = (config: MediaCacheConfig = {}) => {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    availableSpace: 0,
    expiredItems: 0
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [prefetchQueue, setPrefetchQueue] = useState<string[]>([]);

  // Configurações padrão
  const maxCacheSize = config.maxCacheSize || 500; // 500MB
  const defaultExpiryHours = config.defaultExpiryHours || 24;
  const enablePrefetch = config.enablePrefetch !== false;
  const enableBackgroundSync = config.enableBackgroundSync !== false;

  // Refs para controle
  const cacheMapRef = useRef<Map<string, CachedMedia>>(new Map());
  const accessCounterRef = useRef<Map<string, number>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchAbortControllerRef = useRef<AbortController | null>(null);

  // Inicialização
  useEffect(() => {
    initializeCache();
    setupBackgroundSync();
    
    return () => {
      cleanup();
    };
  }, []);

  // Monitorar estado do app para pausar/resumir operações
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        pauseOperations();
      } else if (nextAppState === 'active') {
        resumeOperations();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  /**
   * Inicializar cache
   */
  const initializeCache = async () => {
    try {
      // Carregar cache existente
      await loadExistingCache();
      
      // Verificar espaço disponível
      await checkAvailableSpace();
      
      // Configurar limpeza automática
      setupAutomaticCleanup();
      
      // Atualizar estatísticas
      await updateCacheStats();
      
      setIsInitialized(true);
      
      if (__DEV__) {
        console.log('📦 Cache de mídia inicializado:', {
          itens: cacheMapRef.current.size,
          maxSize: `${maxCacheSize}MB`
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar cache:', error);
    }
  };

  /**
   * Obter mídia do cache ou baixar
   */
  const getMedia = useCallback(async (
    bucket: string,
    path: string,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      skipCache?: boolean;
      expiryHours?: number;
    }
  ): Promise<string> => {
    const cacheKey = `${bucket}:${path}`;
    const cached = cacheMapRef.current.get(cacheKey);
    
    // Verificar cache hit
    if (!options?.skipCache && cached && !isCacheExpired(cached)) {
      // Verificar se arquivo local ainda existe
      if (cached.localPath) {
        const fileExists = await FileSystem.getInfoAsync(cached.localPath);
        if (fileExists.exists) {
          // Cache hit - atualizar contadores
          updateAccessStats(cacheKey);
          return cached.localPath;
        }
      }
      
      // Cache miss - arquivo local foi removido
      cacheMapRef.current.delete(cacheKey);
    }

    // Download e cache
    return await downloadAndCache(bucket, path, {
      expiryHours: options?.expiryHours || defaultExpiryHours,
      priority: options?.priority || 'normal'
    });
  }, []);

  /**
   * Pré-carregar mídia
   */
  const prefetchMedia = useCallback(async (
    items: Array<{ bucket: string; path: string; priority?: 'low' | 'normal' | 'high' }>
  ) => {
    if (!enablePrefetch) return;

    // Cancelar prefetch anterior se existir
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
    }

    prefetchAbortControllerRef.current = new AbortController();
    
    // Ordenar por prioridade
    const sortedItems = [...items].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority || 'normal'] - priorityOrder[a.priority || 'normal'];
    });

    setPrefetchQueue(sortedItems.map(item => `${item.bucket}:${item.path}`));

    try {
      for (const item of sortedItems) {
        if (prefetchAbortControllerRef.current?.signal.aborted) break;
        
        const cacheKey = `${item.bucket}:${item.path}`;
        const cached = cacheMapRef.current.get(cacheKey);
        
        // Pular se já estiver em cache
        if (cached && !isCacheExpired(cached)) continue;
        
        try {
          await downloadAndCache(item.bucket, item.path, {
            priority: item.priority || 'low',
            isPrefetch: true
          });
          
          // Delay pequeno para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.warn(`⚠️ Erro no prefetch de ${cacheKey}:`, error);
        }
        
        // Remover da fila
        setPrefetchQueue(prev => prev.filter(key => key !== cacheKey));
      }
    } finally {
      prefetchAbortControllerRef.current = null;
      setPrefetchQueue([]);
    }
  }, [enablePrefetch]);

  /**
   * Limpar cache
   */
  const clearCache = useCallback(async (options?: {
    bucket?: string;
    olderThan?: Date;
    keepRecent?: number; // manter N itens mais recentes
  }) => {
    setIsCleaningUp(true);
    
    try {
      const itemsToRemove: string[] = [];
      const now = new Date();
      
      for (const [key, cached] of cacheMapRef.current.entries()) {
        let shouldRemove = false;
        
        // Filtrar por bucket
        if (options?.bucket && cached.bucket !== options.bucket) {
          continue;
        }
        
        // Filtrar por data
        if (options?.olderThan) {
          const cachedDate = new Date(cached.cachedAt);
          if (cachedDate > options.olderThan) {
            continue;
          }
        }
        
        // Verificar expiração
        if (isCacheExpired(cached)) {
          shouldRemove = true;
        }
        
        if (shouldRemove) {
          itemsToRemove.push(key);
        }
      }
      
      // Aplicar limite keepRecent se especificado
      if (options?.keepRecent && itemsToRemove.length > options.keepRecent) {
        // Ordenar por data de acesso (mais recentes primeiro)
        const sortedItems = itemsToRemove
          .map(key => ({ key, cached: cacheMapRef.current.get(key)! }))
          .sort((a, b) => new Date(b.cached.lastAccessed).getTime() - new Date(a.cached.lastAccessed).getTime());
        
        // Manter apenas os mais antigos para remoção
        itemsToRemove.length = 0;
        itemsToRemove.push(...sortedItems.slice(options.keepRecent).map(item => item.key));
      }
      
      // Remover itens selecionados
      for (const key of itemsToRemove) {
        await removeFromCache(key);
      }
      
      await updateCacheStats();
      
      if (__DEV__) {
        console.log(`🧹 Cache limpo: ${itemsToRemove.length} itens removidos`);
      }
      
      return itemsToRemove.length;
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return 0;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  /**
   * Otimizar cache baseado em uso
   */
  const optimizeCache = useCallback(async () => {
    if (cacheStats.totalSize < maxCacheSize * 0.8) return; // Só otimizar se >80% do limite

    setIsCleaningUp(true);
    
    try {
      const items = Array.from(cacheMapRef.current.entries())
        .map(([key, cached]) => ({
          key,
          cached,
          score: calculateCacheScore(cached)
        }))
        .sort((a, b) => a.score - b.score); // Menor score primeiro (candidatos à remoção)
      
      const targetSize = maxCacheSize * 0.6; // Reduzir para 60% do limite
      let currentSize = cacheStats.totalSize;
      let removedCount = 0;
      
      for (const item of items) {
        if (currentSize <= targetSize) break;
        
        await removeFromCache(item.key);
        currentSize -= item.cached.size;
        removedCount++;
      }
      
      await updateCacheStats();
      
      if (__DEV__) {
        console.log(`⚡ Cache otimizado: ${removedCount} itens removidos`);
      }
      
    } catch (error) {
      console.error('❌ Erro na otimização do cache:', error);
    } finally {
      setIsCleaningUp(false);
    }
  }, [cacheStats, maxCacheSize]);

  /**
   * Utilitários privados
   */
  const loadExistingCache = async () => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}media_cache/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        return;
      }
      
      // TODO: Carregar metadata do cache existente do AsyncStorage
      // Por ora, iniciar com cache vazio
      
    } catch (error) {
      console.error('❌ Erro ao carregar cache existente:', error);
    }
  };

  const downloadAndCache = async (
    bucket: string,
    path: string,
    options: {
      expiryHours?: number;
      priority?: 'low' | 'normal' | 'high';
      isPrefetch?: boolean;
    } = {}
  ): Promise<string> => {
    try {
      // Download da URL
      const signedUrl = await MediaService.downloadMedia(bucket, path, false);
      
      // Definir caminho local
      const fileName = path.split('/').pop() || 'cached_file';
      const localPath = `${FileSystem.documentDirectory}media_cache/${bucket}_${fileName}`;
      
      // Download do arquivo
      const downloadResult = await FileSystem.downloadAsync(signedUrl, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Falha no download: status ${downloadResult.status}`);
      }
      
      // Obter informações do arquivo
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const fileSize = fileInfo.size || 0;
      
      // Criar entrada no cache
      const cacheKey = `${bucket}:${path}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (options.expiryHours || defaultExpiryHours) * 60 * 60 * 1000);
      
      const cachedMedia: CachedMedia = {
        id: cacheKey,
        uri: signedUrl,
        localPath,
        remotePath: path,
        bucket,
        mimeType: getMimeTypeFromPath(path),
        size: fileSize,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        accessCount: options.isPrefetch ? 0 : 1,
        lastAccessed: now.toISOString()
      };
      
      cacheMapRef.current.set(cacheKey, cachedMedia);
      
      // Salvar metadata
      await saveCacheMetadata(cacheKey, cachedMedia);
      
      // Verificar se precisa otimizar cache
      const newTotalSize = cacheStats.totalSize + fileSize;
      if (newTotalSize > maxCacheSize * 1024 * 1024) { // Converter MB para bytes
        setTimeout(optimizeCache, 1000); // Otimizar após delay
      }
      
      return localPath;
      
    } catch (error) {
      console.error(`❌ Erro no download e cache de ${bucket}:${path}:`, error);
      throw error;
    }
  };

  const removeFromCache = async (cacheKey: string) => {
    const cached = cacheMapRef.current.get(cacheKey);
    if (!cached) return;
    
    // Remover arquivo local
    if (cached.localPath) {
      try {
        await FileSystem.deleteAsync(cached.localPath, { idempotent: true });
      } catch (error) {
        console.warn(`⚠️ Erro ao remover arquivo ${cached.localPath}:`, error);
      }
    }
    
    // Remover do mapa
    cacheMapRef.current.delete(cacheKey);
    
    // Remover metadata
    await removeCacheMetadata(cacheKey);
  };

  const isCacheExpired = (cached: CachedMedia): boolean => {
    return new Date() > new Date(cached.expiresAt);
  };

  const updateAccessStats = (cacheKey: string) => {
    const cached = cacheMapRef.current.get(cacheKey);
    if (!cached) return;
    
    cached.accessCount++;
    cached.lastAccessed = new Date().toISOString();
    
    // Atualizar contador geral
    const currentCount = accessCounterRef.current.get(cacheKey) || 0;
    accessCounterRef.current.set(cacheKey, currentCount + 1);
  };

  const calculateCacheScore = (cached: CachedMedia): number => {
    const now = Date.now();
    const daysSinceAccess = (now - new Date(cached.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceCached = (now - new Date(cached.cachedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    // Score menor = maior prioridade para remoção
    // Considera: frequência de acesso, recência do acesso, tamanho do arquivo
    const accessFrequency = cached.accessCount / Math.max(daysSinceCached, 0.1);
    const recencyScore = Math.max(0, 30 - daysSinceAccess); // Bonus para acessos recentes
    const sizeScore = cached.size / (1024 * 1024); // Penalidade por tamanho em MB
    
    return sizeScore - (accessFrequency * 10) - recencyScore;
  };

  const updateCacheStats = async () => {
    try {
      const items = Array.from(cacheMapRef.current.values());
      const totalAccesses = Array.from(accessCounterRef.current.values()).reduce((sum, count) => sum + count, 0);
      const cacheHits = items.reduce((sum, item) => sum + item.accessCount, 0);
      
      const stats: CacheStats = {
        totalItems: items.length,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        hitRate: totalAccesses > 0 ? Math.round((cacheHits / totalAccesses) * 100) : 0,
        availableSpace: await getAvailableSpace(),
        expiredItems: items.filter(item => isCacheExpired(item)).length
      };
      
      setCacheStats(stats);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas do cache:', error);
    }
  };

  const checkAvailableSpace = async (): Promise<number> => {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      return Math.round(freeSpace / (1024 * 1024)); // Converter para MB
    } catch (error) {
      console.error('❌ Erro ao verificar espaço disponível:', error);
      return 0;
    }
  };

  const getAvailableSpace = async (): Promise<number> => {
    return await checkAvailableSpace();
  };

  const setupAutomaticCleanup = () => {
    // Limpeza a cada 30 minutos
    cleanupIntervalRef.current = setInterval(async () => {
      await clearCache({ keepRecent: 100 }); // Manter 100 itens mais recentes
      await updateCacheStats();
    }, 30 * 60 * 1000);
  };

  const setupBackgroundSync = () => {
    if (!enableBackgroundSync) return;
    
    // TODO: Implementar sincronização em background
    // Verificar mudanças nos arquivos remotos e invalidar cache local
  };

  const pauseOperations = () => {
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
    }
  };

  const resumeOperations = () => {
    // Retomar prefetch se havia itens na fila
    if (prefetchQueue.length > 0) {
      // TODO: Implementar retomada de prefetch
    }
  };

  const cleanup = () => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
    }
    
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
    }
  };

  const getMimeTypeFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/avi'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  };

  const saveCacheMetadata = async (key: string, metadata: CachedMedia) => {
    try {
      await CacheService.armazenarComExpiracao(`media_cache_${key}`, metadata, metadata.expiresAt ? 
        Math.ceil((new Date(metadata.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 24);
    } catch (error) {
      console.error('❌ Erro ao salvar metadata do cache:', error);
    }
  };

  const removeCacheMetadata = async (key: string) => {
    try {
      await CacheService.removerCache(`media_cache_${key}`);
    } catch (error) {
      console.error('❌ Erro ao remover metadata do cache:', error);
    }
  };

  return {
    // Estado
    cacheStats,
    isInitialized,
    isCleaningUp,
    prefetchQueue,
    
    // Ações principais
    getMedia,
    prefetchMedia,
    clearCache,
    optimizeCache,
    
    // Utilitários
    updateCacheStats,
    
    // Informações
    maxCacheSize,
    cacheUtilization: cacheStats.totalSize / (maxCacheSize * 1024 * 1024) * 100,
    canCache: cacheStats.availableSpace > 100, // Pelo menos 100MB livre
    hasExpiredItems: cacheStats.expiredItems > 0
  };
};