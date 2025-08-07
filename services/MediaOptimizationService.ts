import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import { CacheService } from './CacheService';
import { MediaCompression } from '../utils/MediaCompression';
import { MediaService } from './MediaService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MediaOptimizationConfig {
  enableAdaptiveQuality: boolean;
  enableBandwidthOptimization: boolean;
  enableBatteryOptimization: boolean;
  enablePreloading: boolean;
  maxConcurrentDownloads: number;
  prefetchDistance: number; // Number of items to prefetch ahead
}

export interface NetworkCondition {
  type: 'cellular' | 'wifi' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlink: number; // Mbps
  isExpensive: boolean;
}

export interface DeviceCondition {
  batteryLevel: number;
  isLowPowerMode: boolean;
  memoryUsage: number; // Estimated percentage
  storageAvailable: number; // MB
}

export interface OptimizationStrategy {
  compressionLevel: 'low' | 'medium' | 'high';
  preloadEnabled: boolean;
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  maxConcurrency: number;
  targetBandwidth: number; // kbps
}

/**
 * Serviço de Otimização de Mídia para TreinosApp
 * Adapta automaticamente a qualidade e estratégias baseado nas condições do dispositivo
 */
export class MediaOptimizationService {
  private static config: MediaOptimizationConfig = {
    enableAdaptiveQuality: true,
    enableBandwidthOptimization: true,
    enableBatteryOptimization: true,
    enablePreloading: true,
    maxConcurrentDownloads: 3,
    prefetchDistance: 5
  };

  private static currentStrategy: OptimizationStrategy | null = null;
  private static networkCondition: NetworkCondition | null = null;
  private static deviceCondition: DeviceCondition | null = null;
  
  // Cache de métricas para análise
  private static performanceMetrics: Map<string, {
    downloadTime: number;
    fileSize: number;
    networkType: string;
    timestamp: number;
  }> = new Map();

  /**
   * Inicializar serviço de otimização
   */
  static async initialize(config?: Partial<MediaOptimizationConfig>) {
    try {
      // Aplicar configurações customizadas
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Carregar configurações salvas
      await this.loadSavedConfig();

      // Inicializar monitoramento de condições
      await this.updateConditions();
      
      // Configurar estratégia inicial
      this.currentStrategy = this.calculateOptimalStrategy();

      // Iniciar monitoramento contínuo
      this.startConditionMonitoring();

      if (__DEV__) {
        console.log('⚡ Serviço de otimização inicializado:', {
          config: this.config,
          strategy: this.currentStrategy,
          network: this.networkCondition?.type,
          battery: `${Math.round((this.deviceCondition?.batteryLevel || 0) * 100)}%`
        });
      }

    } catch (error) {
      console.error('❌ Erro ao inicializar otimização de mídia:', error);
    }
  }

  /**
   * Obter URI otimizada para mídia
   */
  static async getOptimizedMediaUri(
    bucket: string,
    path: string,
    originalSize?: { width: number; height: number },
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    try {
      const strategy = await this.getCurrentStrategy();
      
      // Determinar se deve usar versão comprimida
      const shouldCompress = this.shouldCompressMedia(bucket, originalSize);
      
      // Gerar caminho otimizado se necessário
      let optimizedPath = path;
      if (shouldCompress) {
        optimizedPath = await this.getCompressedPath(path, strategy.compressionLevel);
      }

      // Obter URI com cache inteligente
      const cacheKey = `${bucket}:${optimizedPath}`;
      const cached = await CacheService.recuperarCache<string>(cacheKey);
      
      if (cached && !this.isExpiredCache(cached)) {
        return cached;
      }

      // Download com otimizações
      const startTime = Date.now();
      const uri = await MediaService.downloadMedia(bucket, optimizedPath, true);
      
      // Registrar métricas de performance
      this.recordPerformanceMetric(cacheKey, {
        downloadTime: Date.now() - startTime,
        fileSize: 0, // Será preenchido quando disponível
        networkType: this.networkCondition?.type || 'unknown',
        timestamp: Date.now()
      });

      return uri;

    } catch (error) {
      console.error('❌ Erro ao obter URI otimizada:', error);
      // Fallback para URI normal
      return await MediaService.downloadMedia(bucket, path, true);
    }
  }

  /**
   * Pré-carregar mídia baseado na estratégia atual
   */
  static async preloadMedia(
    mediaList: Array<{ bucket: string; path: string; priority?: 'low' | 'normal' | 'high' }>
  ): Promise<void> {
    const strategy = await this.getCurrentStrategy();
    
    if (!strategy.preloadEnabled || !this.config.enablePreloading) {
      return;
    }

    try {
      // Limitar quantidade baseado na estratégia
      const itemsToPreload = mediaList.slice(0, this.config.prefetchDistance);
      
      // Processar em lotes para controlar concorrência
      const batchSize = Math.min(strategy.maxConcurrency, itemsToPreload.length);
      
      for (let i = 0; i < itemsToPreload.length; i += batchSize) {
        const batch = itemsToPreload.slice(i, i + batchSize);
        
        // Preload em paralelo dentro do lote
        const preloadPromises = batch.map(async (item) => {
          try {
            await this.getOptimizedMediaUri(
              item.bucket, 
              item.path, 
              undefined, 
              item.priority || 'low'
            );
          } catch (error) {
            console.warn(`⚠️ Falha no preload de ${item.bucket}:${item.path}`);
          }
        });

        await Promise.all(preloadPromises);
        
        // Pequeno delay entre lotes para não sobrecarregar
        if (i + batchSize < itemsToPreload.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (__DEV__) {
        console.log('📡 Preload concluído:', {
          itens: itemsToPreload.length,
          lotes: Math.ceil(itemsToPreload.length / batchSize)
        });
      }

    } catch (error) {
      console.error('❌ Erro no preload de mídia:', error);
    }
  }

  /**
   * Compressão adaptativa baseada nas condições
   */
  static async compressForCurrentConditions(
    imageUri: string,
    targetUsage: 'avatar' | 'progress' | 'thumbnail' | 'exercise' | 'chat' = 'progress'
  ): Promise<{ uri: string; compressionRatio: number }> {
    try {
      const strategy = await this.getCurrentStrategy();
      
      // Determinar configuração de compressão
      const compressionConfig = this.getCompressionConfigForStrategy(strategy, targetUsage);
      
      // Aplicar compressão
      const result = await MediaCompression.smartCompress(
        imageUri,
        targetUsage,
        compressionConfig
      );

      return {
        uri: result.uri,
        compressionRatio: result.compressionRatio
      };

    } catch (error) {
      console.error('❌ Erro na compressão adaptativa:', error);
      return { uri: imageUri, compressionRatio: 0 };
    }
  }

  /**
   * Otimizar largura de banda para upload
   */
  static async optimizeForBandwidth(
    imageUri: string,
    maxUploadTimeSeconds: number = 30
  ): Promise<{ uri: string; estimatedUploadTime: number }> {
    try {
      const strategy = await this.getCurrentStrategy();
      
      // Calcular tamanho alvo baseado na largura de banda
      const targetBitrate = strategy.targetBandwidth * 1000; // Converter para bps
      const targetSizeBytes = (targetBitrate * maxUploadTimeSeconds) / 8;
      
      // Comprimir para atingir tamanho alvo
      const result = await MediaCompression.compressForBandwidth(
        imageUri,
        strategy.targetBandwidth,
        maxUploadTimeSeconds
      );

      // Estimar tempo de upload real
      const estimatedTime = (result.fileSize * 8) / targetBitrate;

      return {
        uri: result.uri,
        estimatedUploadTime: Math.ceil(estimatedTime)
      };

    } catch (error) {
      console.error('❌ Erro na otimização de largura de banda:', error);
      return { uri: imageUri, estimatedUploadTime: maxUploadTimeSeconds };
    }
  }

  /**
   * Obter recomendações de otimização
   */
  static async getOptimizationRecommendations(): Promise<{
    recommendations: Array<{
      type: 'cache' | 'compression' | 'network' | 'battery';
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      actionRequired: boolean;
    }>;
    currentScore: number; // 0-100
  }> {
    try {
      const recommendations: any[] = [];
      let score = 100;

      // Análise do cache
      const cacheStats = await CacheService.obterEstatisticasCache();
      if (cacheStats.fragmentacao > 50) {
        recommendations.push({
          type: 'cache',
          title: 'Cache Fragmentado',
          description: 'Execute uma limpeza de cache para melhorar performance',
          impact: 'medium',
          actionRequired: true
        });
        score -= 15;
      }

      // Análise de rede
      if (this.networkCondition?.effectiveType === '2g' || this.networkCondition?.effectiveType === '3g') {
        recommendations.push({
          type: 'network',
          title: 'Conexão Lenta Detectada',
          description: 'Compressão automática ativada para otimizar downloads',
          impact: 'high',
          actionRequired: false
        });
        score -= 20;
      }

      // Análise de bateria
      if (this.deviceCondition?.batteryLevel && this.deviceCondition.batteryLevel < 0.2) {
        recommendations.push({
          type: 'battery',
          title: 'Bateria Baixa',
          description: 'Modo de economia ativado automaticamente',
          impact: 'medium',
          actionRequired: false
        });
        score -= 10;
      }

      // Análise de compressão
      const compressionStats = await this.getCompressionStats();
      if (compressionStats.avgCompressionRatio < 30) {
        recommendations.push({
          type: 'compression',
          title: 'Compressão Ineficiente',
          description: 'Ajuste as configurações de qualidade para melhor performance',
          impact: 'medium',
          actionRequired: true
        });
        score -= 10;
      }

      return {
        recommendations,
        currentScore: Math.max(0, score)
      };

    } catch (error) {
      console.error('❌ Erro ao obter recomendações:', error);
      return { recommendations: [], currentScore: 50 };
    }
  }

  /**
   * Utilitários privados
   */
  private static async updateConditions(): Promise<void> {
    try {
      // Condições de rede
      const networkState = await Network.getNetworkStateAsync();
      this.networkCondition = {
        type: networkState.type === Network.NetworkStateType.CELLULAR ? 'cellular' : 
              networkState.type === Network.NetworkStateType.WIFI ? 'wifi' : 'unknown',
        effectiveType: '4g', // Padrão - implementar detecção real
        downlink: 10, // Mbps - implementar medição real
        isExpensive: networkState.type === Network.NetworkStateType.CELLULAR
      };

      // Condições do dispositivo
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isLowPowerMode = await Battery.isLowPowerModeEnabledAsync();
      
      this.deviceCondition = {
        batteryLevel,
        isLowPowerMode,
        memoryUsage: 50, // Estimativa - implementar medição real
        storageAvailable: 1000 // MB - implementar verificação real
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar condições:', error);
    }
  }

  private static calculateOptimalStrategy(): OptimizationStrategy {
    const network = this.networkCondition;
    const device = this.deviceCondition;
    
    // Estratégia baseada nas condições
    let strategy: OptimizationStrategy = {
      compressionLevel: 'medium',
      preloadEnabled: true,
      cacheStrategy: 'balanced',
      maxConcurrency: 3,
      targetBandwidth: 1000 // kbps
    };

    // Ajustes baseados na rede
    if (network?.type === 'cellular') {
      strategy.compressionLevel = 'high';
      strategy.maxConcurrency = 2;
      strategy.targetBandwidth = 500;
      
      if (network.effectiveType === '2g' || network.effectiveType === '3g') {
        strategy.preloadEnabled = false;
        strategy.cacheStrategy = 'conservative';
        strategy.targetBandwidth = 200;
      }
    } else if (network?.type === 'wifi') {
      strategy.compressionLevel = 'medium';
      strategy.maxConcurrency = 5;
      strategy.targetBandwidth = 2000;
    }

    // Ajustes baseados na bateria
    if (device?.batteryLevel && device.batteryLevel < 0.2) {
      strategy.compressionLevel = 'high';
      strategy.preloadEnabled = false;
      strategy.maxConcurrency = 1;
    }

    if (device?.isLowPowerMode) {
      strategy.cacheStrategy = 'conservative';
      strategy.preloadEnabled = false;
    }

    return strategy;
  }

  private static async getCurrentStrategy(): Promise<OptimizationStrategy> {
    // Atualizar condições se necessário
    const now = Date.now();
    const lastUpdate = await AsyncStorage.getItem('last_condition_update');
    
    if (!lastUpdate || now - parseInt(lastUpdate) > 30000) { // 30 segundos
      await this.updateConditions();
      this.currentStrategy = this.calculateOptimalStrategy();
      await AsyncStorage.setItem('last_condition_update', now.toString());
    }

    return this.currentStrategy || this.calculateOptimalStrategy();
  }

  private static shouldCompressMedia(
    bucket: string,
    originalSize?: { width: number; height: number }
  ): boolean {
    const strategy = this.currentStrategy;
    if (!strategy) return false;

    // Sempre comprimir em conexões lentas
    if (this.networkCondition?.effectiveType === '2g' || this.networkCondition?.effectiveType === '3g') {
      return true;
    }

    // Comprimir imagens grandes
    if (originalSize && (originalSize.width > 1200 || originalSize.height > 1200)) {
      return true;
    }

    // Comprimir para chat attachments
    if (bucket === 'chat-attachments') {
      return true;
    }

    return strategy.compressionLevel === 'high';
  }

  private static async getCompressedPath(
    originalPath: string,
    compressionLevel: 'low' | 'medium' | 'high'
  ): Promise<string> {
    // Gerar path para versão comprimida
    const pathParts = originalPath.split('.');
    const extension = pathParts.pop();
    const basePath = pathParts.join('.');
    
    return `${basePath}_${compressionLevel}.${extension}`;
  }

  private static getCompressionConfigForStrategy(
    strategy: OptimizationStrategy,
    targetUsage: string
  ): any {
    const networkType = this.networkCondition?.type || 'unknown';
    const batteryLevel = this.deviceCondition?.batteryLevel || 1;

    return {
      connectionType: networkType === 'cellular' ? 
        (this.networkCondition?.effectiveType === '2g' ? 'slow' : 'medium') : 'fast',
      devicePerformance: batteryLevel < 0.2 ? 'low' : 'medium',
      batteryLevel,
      userPreference: strategy.compressionLevel === 'high' ? 'size' : 'balanced'
    };
  }

  private static startConditionMonitoring(): void {
    // Monitorar mudanças nas condições a cada 30 segundos
    setInterval(async () => {
      const previousNetwork = this.networkCondition?.type;
      const previousBattery = this.deviceCondition?.batteryLevel;
      
      await this.updateConditions();
      
      // Recalcular estratégia se houve mudanças significativas
      const currentNetwork = this.networkCondition?.type;
      const currentBattery = this.deviceCondition?.batteryLevel || 0;
      
      if (previousNetwork !== currentNetwork || 
          Math.abs((previousBattery || 0) - currentBattery) > 0.1) {
        this.currentStrategy = this.calculateOptimalStrategy();
        
        if (__DEV__) {
          console.log('🔄 Estratégia de otimização atualizada:', this.currentStrategy);
        }
      }
    }, 30000);
  }

  private static recordPerformanceMetric(key: string, metric: any): void {
    this.performanceMetrics.set(key, metric);
    
    // Limitar tamanho do cache de métricas
    if (this.performanceMetrics.size > 1000) {
      const oldestKey = this.performanceMetrics.keys().next().value;
      this.performanceMetrics.delete(oldestKey);
    }
  }

  private static isExpiredCache(cached: string): boolean {
    // Implementar lógica de expiração baseada na estratégia
    return false; // Simplificado por ora
  }

  private static async loadSavedConfig(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('media_optimization_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração salva:', error);
    }
  }

  private static async getCompressionStats(): Promise<{
    avgCompressionRatio: number;
    totalCompressions: number;
  }> {
    // Implementar análise das métricas de compressão
    return {
      avgCompressionRatio: 45, // Mock
      totalCompressions: 100 // Mock
    };
  }

  /**
   * Métodos públicos para configuração
   */
  static async updateConfig(config: Partial<MediaOptimizationConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Salvar configuração
    await AsyncStorage.setItem('media_optimization_config', JSON.stringify(this.config));
    
    // Recalcular estratégia
    this.currentStrategy = this.calculateOptimalStrategy();
  }

  static getConfig(): MediaOptimizationConfig {
    return { ...this.config };
  }

  static getCurrentConditions(): { network: NetworkCondition | null; device: DeviceCondition | null } {
    return {
      network: this.networkCondition,
      device: this.deviceCondition
    };
  }

  static getPerformanceStats(): {
    averageDownloadTime: number;
    cacheHitRate: number;
    totalOptimizations: number;
  } {
    const metrics = Array.from(this.performanceMetrics.values());
    
    return {
      averageDownloadTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.downloadTime, 0) / metrics.length 
        : 0,
      cacheHitRate: 85, // Mock - implementar cálculo real
      totalOptimizations: metrics.length
    };
  }
}