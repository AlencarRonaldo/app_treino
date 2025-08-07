import { MediaService, MediaItem, MediaUploadOptions, UploadProgress } from './MediaService';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { CacheService } from './CacheService';
import * as MediaLibrary from 'expo-media-library';

export interface ProgressPhoto {
  id: string;
  userId: string;
  categoria: 'before' | 'after' | 'progress';
  partesCorpo: string[];
  dataFoto: string;
  photoPath: string;
  thumbnailPath?: string;
  peso?: number;
  medidas?: Record<string, number>; // ex: { cintura: 80, braço: 35 }
  notas?: string;
  isPrivate: boolean;
  uploadedAt: string;
  metadata: {
    dimensions: { width: number; height: number };
    size: number;
    compressionRatio: number;
  };
}

export interface ProgressComparison {
  beforePhoto: ProgressPhoto;
  afterPhoto: ProgressPhoto;
  daysBetween: number;
  pesoChange?: number;
  medidasChange?: Record<string, number>;
  improvementScore: number;
}

export interface BatchUploadResult {
  sucessos: MediaItem[];
  falhas: { asset: ImagePicker.ImagePickerAsset; erro: string }[];
  totalProcessadas: number;
  tempoTotal: number;
}

export interface PhotoOrganization {
  porCategoria: Record<string, ProgressPhoto[]>;
  porParteCorpo: Record<string, ProgressPhoto[]>;
  porMes: Record<string, ProgressPhoto[]>;
  timeline: ProgressPhoto[];
}

/**
 * Serviço especializado em fotos de progresso para TreinosApp
 * Gerencia before/after, comparações e organização por data
 */
export class PhotoService {
  private static readonly BODY_PARTS = [
    'frente', 'costas', 'lateral_esquerda', 'lateral_direita',
    'bracos', 'pernas', 'abdomen', 'peito', 'core'
  ];

  private static readonly PHOTO_CATEGORIES = ['before', 'after', 'progress'] as const;

  private static readonly COMPARISON_PRESETS = {
    standard: { width: 600, height: 800, quality: 0.8 },
    thumbnail: { width: 200, height: 266, quality: 0.6 },
    full: { width: 1200, height: 1600, quality: 0.9 }
  };

  /**
   * Upload de foto de progresso individual
   */
  static async uploadProgressPhoto(
    asset: ImagePicker.ImagePickerAsset,
    photoData: {
      userId: string;
      categoria: 'before' | 'after' | 'progress';
      partesCorpo: string[];
      peso?: number;
      medidas?: Record<string, number>;
      notas?: string;
      isPrivate?: boolean;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ProgressPhoto> {
    try {
      if (asset.type !== 'image') {
        throw new Error('Apenas fotos são aceitas para progresso');
      }

      // Validar partes do corpo
      const partesValidas = photoData.partesCorpo.filter(parte => 
        this.BODY_PARTS.includes(parte)
      );

      if (partesValidas.length === 0) {
        throw new Error('Pelo menos uma parte do corpo válida deve ser selecionada');
      }

      // Configurações de upload otimizadas para fotos de progresso
      const uploadOptions: MediaUploadOptions = {
        bucket: 'progress-photos',
        folder: `users/${photoData.userId}/${photoData.categoria}`,
        userId: photoData.userId,
        compressionQuality: 0.8,
        maxWidth: 1200,
        maxHeight: 1600
      };

      // Upload da foto principal
      const uploadedMedia = await MediaService.uploadMedia(asset, uploadOptions, onProgress);

      // Criar thumbnail otimizada para comparações
      const thumbnail = await this.createProgressThumbnail(asset.uri);
      
      // Upload do thumbnail
      let thumbnailPath: string | undefined;
      if (thumbnail) {
        const thumbnailOptions: MediaUploadOptions = {
          ...uploadOptions,
          folder: `users/${photoData.userId}/${photoData.categoria}/thumbnails`
        };
        
        const thumbnailMedia = await MediaService.uploadMedia(
          { ...asset, uri: thumbnail.uri, width: thumbnail.width, height: thumbnail.height },
          thumbnailOptions
        );
        thumbnailPath = thumbnailMedia.filePath;
      }

      // Criar registro de foto de progresso
      const progressPhoto: ProgressPhoto = {
        id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: photoData.userId,
        categoria: photoData.categoria,
        partesCorpo: partesValidas,
        dataFoto: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        photoPath: uploadedMedia.filePath,
        thumbnailPath,
        peso: photoData.peso,
        medidas: photoData.medidas,
        notas: photoData.notas,
        isPrivate: photoData.isPrivate ?? true, // Privado por padrão
        uploadedAt: new Date().toISOString(),
        metadata: {
          dimensions: uploadedMedia.dimensions!,
          size: uploadedMedia.size,
          compressionRatio: 0 // Será calculado durante o upload
        }
      };

      // Cache local
      await this.cacheProgressPhoto(progressPhoto);

      // Atualizar organização das fotos
      await this.updatePhotoOrganization(photoData.userId);

      if (__DEV__) {
        console.log('📸 Foto de progresso salva:', {
          id: progressPhoto.id,
          categoria: progressPhoto.categoria,
          partesCorpo: progressPhoto.partesCorpo,
          peso: progressPhoto.peso,
          size: this.formatFileSize(progressPhoto.metadata.size)
        });
      }

      return progressPhoto;

    } catch (error) {
      console.error('❌ Erro no upload de foto de progresso:', error);
      throw error;
    }
  }

  /**
   * Upload em lote de múltiplas fotos
   */
  static async batchUploadPhotos(
    assets: ImagePicker.ImagePickerAsset[],
    commonData: {
      userId: string;
      categoria: 'before' | 'after' | 'progress';
      peso?: number;
      medidas?: Record<string, number>;
      isPrivate?: boolean;
    },
    onProgress?: (overallProgress: number, currentFile: string) => void
  ): Promise<BatchUploadResult> {
    const startTime = Date.now();
    const result: BatchUploadResult = {
      sucessos: [],
      falhas: [],
      totalProcessadas: 0,
      tempoTotal: 0
    };

    try {
      if (__DEV__) {
        console.log('📸 Iniciando upload em lote:', {
          quantidade: assets.length,
          categoria: commonData.categoria
        });
      }

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        result.totalProcessadas++;

        try {
          // Progresso geral
          const overallProgress = ((i + 1) / assets.length) * 100;
          onProgress?.(overallProgress, asset.fileName || `foto_${i + 1}`);

          // Determinar parte do corpo baseada no índice (simplificado)
          const parteCorpo = this.determineBodyPartFromIndex(i);

          const uploadedMedia = await MediaService.uploadMedia(asset, {
            bucket: 'progress-photos',
            folder: `users/${commonData.userId}/${commonData.categoria}/batch_${startTime}`,
            userId: commonData.userId,
            compressionQuality: 0.7,
            maxWidth: 1000,
            maxHeight: 1200
          });

          result.sucessos.push(uploadedMedia);

          // Delay pequeno para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          result.falhas.push({
            asset,
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          });
          console.error(`❌ Falha no upload da foto ${i + 1}:`, error);
        }
      }

      result.tempoTotal = Date.now() - startTime;

      if (__DEV__) {
        console.log('📸 Upload em lote concluído:', {
          sucessos: result.sucessos.length,
          falhas: result.falhas.length,
          tempo: `${Math.round(result.tempoTotal / 1000)}s`
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Erro no upload em lote:', error);
      result.tempoTotal = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Lista fotos de progresso organizadas
   */
  static async listarFotosProgresso(
    userId: string,
    filtros?: {
      categoria?: 'before' | 'after' | 'progress';
      parteCorpo?: string;
      dataInicio?: string;
      dataFim?: string;
    }
  ): Promise<ProgressPhoto[]> {
    try {
      const cacheKey = `progress_photos_${userId}_${JSON.stringify(filtros || {})}`;
      
      // Verificar cache
      const cached = await CacheService.recuperarCache<ProgressPhoto[]>(cacheKey);
      if (cached) {
        if (__DEV__) console.log('📦 Fotos de progresso recuperadas do cache');
        return cached;
      }

      // TODO: Buscar do banco de dados com filtros
      const photos: ProgressPhoto[] = [];

      // Aplicar filtros se necessário
      let filteredPhotos = photos;
      
      if (filtros) {
        filteredPhotos = photos.filter(photo => {
          if (filtros.categoria && photo.categoria !== filtros.categoria) return false;
          if (filtros.parteCorpo && !photo.partesCorpo.includes(filtros.parteCorpo)) return false;
          if (filtros.dataInicio && photo.dataFoto < filtros.dataInicio) return false;
          if (filtros.dataFim && photo.dataFoto > filtros.dataFim) return false;
          return true;
        });
      }

      // Cache por 15 minutos
      await CacheService.armazenarComExpiracao(cacheKey, filteredPhotos, 0.25);

      return filteredPhotos;

    } catch (error) {
      console.error('❌ Erro ao listar fotos de progresso:', error);
      return [];
    }
  }

  /**
   * Organiza fotos por diferentes critérios
   */
  static async organizarFotosProgresso(userId: string): Promise<PhotoOrganization> {
    try {
      const todasFotos = await this.listarFotosProgresso(userId);
      
      const organization: PhotoOrganization = {
        porCategoria: {},
        porParteCorpo: {},
        porMes: {},
        timeline: todasFotos.sort((a, b) => a.dataFoto.localeCompare(b.dataFoto))
      };

      // Organizar por categoria
      for (const categoria of this.PHOTO_CATEGORIES) {
        organization.porCategoria[categoria] = todasFotos.filter(
          foto => foto.categoria === categoria
        );
      }

      // Organizar por parte do corpo
      for (const parte of this.BODY_PARTS) {
        organization.porParteCorpo[parte] = todasFotos.filter(
          foto => foto.partesCorpo.includes(parte)
        );
      }

      // Organizar por mês
      todasFotos.forEach(foto => {
        const mesAno = foto.dataFoto.substring(0, 7); // YYYY-MM
        if (!organization.porMes[mesAno]) {
          organization.porMes[mesAno] = [];
        }
        organization.porMes[mesAno].push(foto);
      });

      if (__DEV__) {
        console.log('📊 Fotos organizadas:', {
          total: todasFotos.length,
          categorias: Object.keys(organization.porCategoria).length,
          partes: Object.keys(organization.porParteCorpo).length,
          meses: Object.keys(organization.porMes).length
        });
      }

      return organization;

    } catch (error) {
      console.error('❌ Erro ao organizar fotos:', error);
      return {
        porCategoria: {},
        porParteCorpo: {},
        porMes: {},
        timeline: []
      };
    }
  }

  /**
   * Cria comparação between/after automática
   */
  static async criarComparacao(
    userId: string,
    parteCorpo: string,
    dataLimite?: string
  ): Promise<ProgressComparison[]> {
    try {
      const fotos = await this.listarFotosProgresso(userId, { 
        parteCorpo,
        dataFim: dataLimite 
      });

      const beforePhotos = fotos.filter(f => f.categoria === 'before')
        .sort((a, b) => a.dataFoto.localeCompare(b.dataFoto));

      const afterPhotos = fotos.filter(f => f.categoria === 'after')
        .sort((a, b) => b.dataFoto.localeCompare(a.dataFoto));

      const comparisons: ProgressComparison[] = [];

      // Criar comparações automáticas
      for (const beforePhoto of beforePhotos) {
        // Encontrar foto 'after' mais próxima temporalmente
        const afterPhoto = afterPhotos.find(after => 
          after.dataFoto > beforePhoto.dataFoto
        );

        if (afterPhoto) {
          const daysBetween = this.calculateDaysBetween(beforePhoto.dataFoto, afterPhoto.dataFoto);
          
          const comparison: ProgressComparison = {
            beforePhoto,
            afterPhoto,
            daysBetween,
            pesoChange: this.calculateWeightChange(beforePhoto, afterPhoto),
            medidasChange: this.calculateMeasurementChanges(beforePhoto, afterPhoto),
            improvementScore: this.calculateImprovementScore(beforePhoto, afterPhoto, daysBetween)
          };

          comparisons.push(comparison);
        }
      }

      if (__DEV__) {
        console.log('🔄 Comparações criadas:', {
          quantidade: comparisons.length,
          parteCorpo,
          periodoMedio: comparisons.length > 0 
            ? Math.round(comparisons.reduce((sum, c) => sum + c.daysBetween, 0) / comparisons.length)
            : 0
        });
      }

      return comparisons;

    } catch (error) {
      console.error('❌ Erro ao criar comparações:', error);
      return [];
    }
  }

  /**
   * Gera view de comparação lado a lado
   */
  static async gerarViewComparacao(
    comparison: ProgressComparison,
    preset: 'standard' | 'thumbnail' | 'full' = 'standard'
  ): Promise<string | null> {
    try {
      const config = this.COMPARISON_PRESETS[preset];
      
      // Baixar ambas as fotos
      const [beforeUrl, afterUrl] = await Promise.all([
        MediaService.downloadMedia('progress-photos', comparison.beforePhoto.photoPath),
        MediaService.downloadMedia('progress-photos', comparison.afterPhoto.photoPath)
      ]);

      // TODO: Implementar composição side-by-side real
      // Por ora, retornar a URL da foto 'after'
      
      if (__DEV__) {
        console.log('🖼️ View de comparação gerada:', {
          preset,
          daysBetween: comparison.daysBetween,
          improvementScore: comparison.improvementScore
        });
      }

      return afterUrl;

    } catch (error) {
      console.error('❌ Erro ao gerar view de comparação:', error);
      return null;
    }
  }

  /**
   * Remove foto de progresso
   */
  static async removerFotoProgresso(
    photoId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Buscar foto no cache
      const cacheKey = `progress_photo_${photoId}`;
      const photo = await CacheService.recuperarCache<ProgressPhoto>(cacheKey);
      
      if (!photo || photo.userId !== userId) {
        throw new Error('Foto não encontrada ou sem permissão');
      }

      // Remover do storage
      const removed = await MediaService.removerMedia('progress-photos', photo.photoPath);
      
      if (removed && photo.thumbnailPath) {
        // Remover thumbnail
        await MediaService.removerMedia('progress-photos', photo.thumbnailPath);
      }

      // Limpar cache
      await CacheService.removerCache(cacheKey);
      
      // Atualizar organização
      await this.updatePhotoOrganization(userId);

      if (__DEV__) console.log('🗑️ Foto de progresso removida:', photoId);
      return removed;

    } catch (error) {
      console.error('❌ Erro ao remover foto de progresso:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de progresso fotográfico
   */
  static async obterEstatisticasProgresso(userId: string): Promise<{
    totalFotos: number;
    fotosPorCategoria: Record<string, number>;
    fotosPorParteCorpo: Record<string, number>;
    progressoUltimos30Dias: number;
    tamanhoTotalMB: number;
    primeiraFoto?: string;
    ultimaFoto?: string;
  }> {
    try {
      const fotos = await this.listarFotosProgresso(userId);
      const organization = await this.organizarFotosProgresso(userId);
      
      // Calcular fotos dos últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      const fotosRecentes = fotos.filter(foto => 
        new Date(foto.dataFoto) >= dataLimite
      );

      const stats = {
        totalFotos: fotos.length,
        fotosPorCategoria: Object.fromEntries(
          Object.entries(organization.porCategoria).map(([cat, photos]) => [cat, photos.length])
        ),
        fotosPorParteCorpo: Object.fromEntries(
          Object.entries(organization.porParteCorpo).map(([parte, photos]) => [parte, photos.length])
        ),
        progressoUltimos30Dias: fotosRecentes.length,
        tamanhoTotalMB: Math.round(fotos.reduce((sum, f) => sum + f.metadata.size, 0) / (1024 * 1024)),
        primeiraFoto: fotos.length > 0 ? organization.timeline[0].dataFoto : undefined,
        ultimaFoto: fotos.length > 0 ? organization.timeline[fotos.length - 1].dataFoto : undefined
      };

      if (__DEV__) {
        console.log('📊 Estatísticas de progresso:', stats);
      }

      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalFotos: 0,
        fotosPorCategoria: {},
        fotosPorParteCorpo: {},
        progressoUltimos30Dias: 0,
        tamanhoTotalMB: 0
      };
    }
  }

  /**
   * Utilitários privados
   */
  private static async createProgressThumbnail(imageUri: string) {
    try {
      return await manipulateAsync(
        imageUri,
        [{ resize: this.COMPARISON_PRESETS.thumbnail }],
        {
          compress: this.COMPARISON_PRESETS.thumbnail.quality,
          format: SaveFormat.JPEG
        }
      );
    } catch (error) {
      console.error('❌ Erro ao criar thumbnail:', error);
      return null;
    }
  }

  private static determineBodyPartFromIndex(index: number): string {
    const cycle = ['frente', 'costas', 'lateral_esquerda', 'lateral_direita'];
    return cycle[index % cycle.length];
  }

  private static calculateDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private static calculateWeightChange(before: ProgressPhoto, after: ProgressPhoto): number | undefined {
    if (before.peso && after.peso) {
      return Math.round((after.peso - before.peso) * 10) / 10; // 1 casa decimal
    }
    return undefined;
  }

  private static calculateMeasurementChanges(
    before: ProgressPhoto, 
    after: ProgressPhoto
  ): Record<string, number> | undefined {
    if (!before.medidas || !after.medidas) return undefined;

    const changes: Record<string, number> = {};
    
    for (const [medida, valorBefore] of Object.entries(before.medidas)) {
      const valorAfter = after.medidas[medida];
      if (typeof valorAfter === 'number') {
        changes[medida] = Math.round((valorAfter - valorBefore) * 10) / 10;
      }
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }

  private static calculateImprovementScore(
    before: ProgressPhoto,
    after: ProgressPhoto,
    daysBetween: number
  ): number {
    // Algoritmo simples de score de melhoria (0-100)
    let score = 50; // Base score

    // Considerar mudança de peso
    if (before.peso && after.peso) {
      const weightChange = after.peso - before.peso;
      // Assumir que perda de peso é positiva (pode ser customizado)
      score += Math.max(-20, Math.min(20, -weightChange * 2));
    }

    // Considerar tempo decorrido (mais tempo = expectativa de mais progresso)
    const timeBonus = Math.min(20, daysBetween / 30 * 10);
    score += timeBonus;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static async cacheProgressPhoto(photo: ProgressPhoto): Promise<void> {
    try {
      const cacheKey = `progress_photo_${photo.id}`;
      await CacheService.armazenarComExpiracao(cacheKey, photo, 24); // 24 horas
    } catch (error) {
      console.error('❌ Erro ao cachear foto de progresso:', error);
    }
  }

  private static async updatePhotoOrganization(userId: string): Promise<void> {
    try {
      // Limpar caches relacionados para forçar atualização
      const keys = await CacheService.CACHE_KEYS;
      // TODO: Implementar limpeza específica de cache de organização
      
      if (__DEV__) console.log('🔄 Organização de fotos atualizada para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao atualizar organização de fotos:', error);
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Backup e sincronização
   */
  static async criarBackupFotos(userId: string): Promise<boolean> {
    try {
      const fotos = await this.listarFotosProgresso(userId);
      const organization = await this.organizarFotosProgresso(userId);
      
      const backupData = {
        fotos,
        organization,
        timestamp: new Date().toISOString(),
        userId,
        totalSize: fotos.reduce((sum, f) => sum + f.metadata.size, 0)
      };

      await CacheService.armazenarComExpiracao(
        `backup_photos_${userId}`, 
        backupData, 
        168 // 1 semana
      );

      if (__DEV__) {
        console.log('💾 Backup de fotos criado:', {
          fotos: fotos.length,
          tamanho: this.formatFileSize(backupData.totalSize)
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Erro ao criar backup de fotos:', error);
      return false;
    }
  }
}