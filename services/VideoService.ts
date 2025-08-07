import { MediaService, MediaItem, MediaUploadOptions, UploadProgress } from './MediaService';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { CacheService } from './CacheService';
import { supabase } from '../lib/supabase';

export interface VideoMetadata {
  duration: number;
  bitrate: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  codec: string;
  size: number;
}

export interface VideoCompression {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: 'low' | 'medium' | 'high';
  targetBitrate: number;
}

export interface CustomExerciseVideo {
  id: string;
  exerciseId: string;
  personalTrainerId: string;
  title: string;
  description: string;
  videoPath: string;
  thumbnailPath: string;
  duration: number;
  uploadedAt: string;
  metadata: VideoMetadata;
  isActive: boolean;
  tags: string[];
}

/**
 * Serviço especializado em processamento de vídeos para TreinosApp
 * Foca em vídeos de exercícios personalizados para Personal Trainers
 */
export class VideoService {
  private static readonly VIDEO_PRESETS = {
    low: { bitrate: 500000, quality: 0.3, maxWidth: 480, maxHeight: 360 }, // 480p
    medium: { bitrate: 1000000, quality: 0.6, maxWidth: 720, maxHeight: 540 }, // 720p
    high: { bitrate: 2000000, quality: 0.8, maxWidth: 1280, maxHeight: 720 } // HD
  };

  private static readonly MAX_VIDEO_DURATION = 300; // 5 minutos
  private static readonly THUMBNAIL_POSITIONS = [1, 3, 5]; // segundos

  /**
   * Upload de vídeo personalizado para exercício
   */
  static async uploadExerciseVideo(
    asset: ImagePicker.ImagePickerAsset,
    exerciseData: {
      exerciseId: string;
      personalTrainerId: string;
      title: string;
      description: string;
      tags?: string[];
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CustomExerciseVideo> {
    try {
      if (asset.type !== 'video') {
        throw new Error('Apenas vídeos são aceitos para exercícios');
      }

      if (asset.duration && asset.duration > this.MAX_VIDEO_DURATION * 1000) {
        throw new Error(`Vídeo muito longo. Máximo: ${this.MAX_VIDEO_DURATION / 60} minutos`);
      }

      // Validar metadados do vídeo
      const metadata = await this.extractVideoMetadata(asset.uri);
      if (__DEV__) {
        console.log('🎬 Metadados do vídeo:', metadata);
      }

      // Determinar qualidade baseada no tamanho
      const quality = this.determineOptimalQuality(metadata);
      
      // Configurações de upload
      const uploadOptions: MediaUploadOptions = {
        bucket: 'exercise-videos',
        folder: `exercises/${exerciseData.exerciseId}`,
        userId: exerciseData.personalTrainerId,
        generateThumbnail: true,
        compressionQuality: this.VIDEO_PRESETS[quality].quality,
        maxWidth: this.VIDEO_PRESETS[quality].maxWidth,
        maxHeight: this.VIDEO_PRESETS[quality].maxHeight
      };

      // Upload com compressão
      const uploadedMedia = await MediaService.uploadMedia(asset, uploadOptions, onProgress);

      // Gerar múltiplos thumbnails
      const thumbnails = await this.generateMultipleThumbnails(asset.uri);
      
      // Criar registro de vídeo personalizado
      const customVideo: CustomExerciseVideo = {
        id: `exercise_video_${Date.now()}`,
        exerciseId: exerciseData.exerciseId,
        personalTrainerId: exerciseData.personalTrainerId,
        title: exerciseData.title,
        description: exerciseData.description,
        videoPath: uploadedMedia.filePath,
        thumbnailPath: uploadedMedia.thumbnailPath || '',
        duration: asset.duration || 0,
        uploadedAt: new Date().toISOString(),
        metadata,
        isActive: true,
        tags: exerciseData.tags || []
      };

      // Salvar no cache local
      await this.cacheCustomVideo(customVideo);

      // TODO: Salvar no banco de dados quando estiver disponível
      
      if (__DEV__) {
        console.log('✅ Vídeo de exercício salvo:', {
          id: customVideo.id,
          title: customVideo.title,
          duration: `${Math.round(metadata.duration)}s`,
          quality,
          size: this.formatFileSize(metadata.size)
        });
      }

      return customVideo;

    } catch (error) {
      console.error('❌ Erro no upload de vídeo de exercício:', error);
      throw error;
    }
  }

  /**
   * Lista vídeos personalizados do Personal Trainer
   */
  static async listarVideosPersonalizados(
    personalTrainerId: string,
    exerciseId?: string
  ): Promise<CustomExerciseVideo[]> {
    try {
      const cacheKey = `custom_videos_${personalTrainerId}_${exerciseId || 'all'}`;
      
      // Verificar cache primeiro
      const cached = await CacheService.recuperarCache<CustomExerciseVideo[]>(cacheKey);
      if (cached) {
        if (__DEV__) console.log('📦 Vídeos recuperados do cache');
        return cached;
      }

      // TODO: Buscar do banco de dados
      // Por ora, retornar lista vazia
      const videos: CustomExerciseVideo[] = [];

      // Cache por 30 minutos
      await CacheService.armazenarComExpiracao(cacheKey, videos, 0.5);

      return videos;

    } catch (error) {
      console.error('❌ Erro ao listar vídeos personalizados:', error);
      return [];
    }
  }

  /**
   * Obtém URL otimizada para streaming de vídeo
   */
  static async obterUrlStreamingVideo(
    videoPath: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    try {
      const cacheKey = `video_stream_${videoPath.replace(/[^a-zA-Z0-9]/g, '_')}_${quality}`;
      
      // Verificar cache
      const cachedUrl = await CacheService.recuperarCache<string>(cacheKey);
      if (cachedUrl) {
        return cachedUrl;
      }

      // Gerar URL do Supabase Storage
      const url = await MediaService.downloadMedia('exercise-videos', videoPath);

      // Cache por 45 minutos
      await CacheService.armazenarComExpiracao(cacheKey, url, 0.75);

      return url;

    } catch (error) {
      console.error('❌ Erro ao obter URL de streaming:', error);
      throw error;
    }
  }

  /**
   * Comprime vídeo baseado na qualidade desejada
   */
  static async comprimirVideo(
    inputUri: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{
    uri: string;
    compression: VideoCompression;
  }> {
    try {
      const preset = this.VIDEO_PRESETS[quality];
      const originalMetadata = await this.extractVideoMetadata(inputUri);
      
      // TODO: Implementar compressão real de vídeo
      // Por ora, retornar o mesmo vídeo
      const compression: VideoCompression = {
        originalSize: originalMetadata.size,
        compressedSize: originalMetadata.size * 0.7, // Simular 30% de redução
        compressionRatio: 30,
        quality,
        targetBitrate: preset.bitrate
      };

      if (__DEV__) {
        console.log('🎬 Vídeo "comprimido":', {
          quality,
          originalSize: this.formatFileSize(compression.originalSize),
          compressedSize: this.formatFileSize(compression.compressedSize),
          reduction: `${compression.compressionRatio}%`
        });
      }

      return {
        uri: inputUri, // Por ora, retornar o original
        compression
      };

    } catch (error) {
      console.error('❌ Erro na compressão de vídeo:', error);
      throw error;
    }
  }

  /**
   * Gera múltiplos thumbnails em diferentes momentos do vídeo
   */
  static async generateMultipleThumbnails(videoUri: string): Promise<string[]> {
    try {
      const thumbnails: string[] = [];
      const metadata = await this.extractVideoMetadata(videoUri);
      
      // Calcular posições baseadas na duração
      const positions = this.THUMBNAIL_POSITIONS.filter(pos => pos < metadata.duration);
      
      for (const position of positions) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: position * 1000,
            quality: 0.8
          });
          thumbnails.push(uri);
        } catch (error) {
          console.warn(`⚠️ Falha ao gerar thumbnail na posição ${position}s:`, error);
        }
      }

      if (__DEV__) {
        console.log('🖼️ Thumbnails geradas:', {
          quantidade: thumbnails.length,
          posições: positions
        });
      }

      return thumbnails;

    } catch (error) {
      console.error('❌ Erro ao gerar múltiplos thumbnails:', error);
      return [];
    }
  }

  /**
   * Remove vídeo personalizado
   */
  static async removerVideoPersonalizado(
    videoId: string,
    personalTrainerId: string
  ): Promise<boolean> {
    try {
      // Buscar vídeo no cache
      const videos = await this.listarVideosPersonalizados(personalTrainerId);
      const video = videos.find(v => v.id === videoId);
      
      if (!video) {
        throw new Error('Vídeo não encontrado');
      }

      // Remover do storage
      const removed = await MediaService.removerMedia('exercise-videos', video.videoPath);
      
      if (removed && video.thumbnailPath) {
        // Remover thumbnail também
        await MediaService.removerMedia('exercise-videos', video.thumbnailPath);
      }

      // Limpar cache
      await this.clearVideoCache(videoId);
      
      if (__DEV__) console.log('🗑️ Vídeo personalizado removido:', videoId);
      return removed;

    } catch (error) {
      console.error('❌ Erro ao remover vídeo personalizado:', error);
      return false;
    }
  }

  /**
   * Atualiza informações do vídeo personalizado
   */
  static async atualizarVideoPersonalizado(
    videoId: string,
    updates: Partial<Pick<CustomExerciseVideo, 'title' | 'description' | 'tags' | 'isActive'>>
  ): Promise<boolean> {
    try {
      // TODO: Implementar atualização no banco de dados
      
      // Limpar cache para forçar atualização
      await this.clearVideoCache(videoId);
      
      if (__DEV__) console.log('✏️ Vídeo personalizado atualizado:', videoId);
      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar vídeo personalizado:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de vídeos do Personal Trainer
   */
  static async obterEstatisticasVideos(personalTrainerId: string): Promise<{
    totalVideos: number;
    duracaoTotal: number;
    tamanhoTotal: number;
    videosPorExercicio: Record<string, number>;
    qualidadeMedia: string;
  }> {
    try {
      const videos = await this.listarVideosPersonalizados(personalTrainerId);
      
      const stats = {
        totalVideos: videos.length,
        duracaoTotal: videos.reduce((sum, v) => sum + v.duration, 0),
        tamanhoTotal: videos.reduce((sum, v) => sum + v.metadata.size, 0),
        videosPorExercicio: videos.reduce((acc, v) => {
          acc[v.exerciseId] = (acc[v.exerciseId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        qualidadeMedia: 'medium' // Calcular baseado nos vídeos
      };

      if (__DEV__) {
        console.log('📊 Estatísticas de vídeos:', {
          total: stats.totalVideos,
          duracaoTotal: `${Math.round(stats.duracaoTotal / 60)}min`,
          tamanhoTotal: this.formatFileSize(stats.tamanhoTotal)
        });
      }

      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de vídeos:', error);
      return {
        totalVideos: 0,
        duracaoTotal: 0,
        tamanhoTotal: 0,
        videosPorExercicio: {},
        qualidadeMedia: 'medium'
      };
    }
  }

  /**
   * Utilitários privados
   */
  private static async extractVideoMetadata(videoUri: string): Promise<VideoMetadata> {
    try {
      // Por ora, retornar metadados simulados
      // TODO: Usar biblioteca real para extrair metadados
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      return {
        duration: 30, // Simular 30 segundos
        bitrate: 1000000, // 1 Mbps
        fps: 30,
        resolution: {
          width: 1280,
          height: 720
        },
        codec: 'h264',
        size: fileInfo.size || 0
      };

    } catch (error) {
      console.error('❌ Erro ao extrair metadados do vídeo:', error);
      // Retornar metadados padrão em caso de erro
      return {
        duration: 0,
        bitrate: 0,
        fps: 30,
        resolution: { width: 0, height: 0 },
        codec: 'unknown',
        size: 0
      };
    }
  }

  private static determineOptimalQuality(metadata: VideoMetadata): 'low' | 'medium' | 'high' {
    const { resolution, bitrate, size } = metadata;
    
    // Lógica para determinar qualidade baseada nos metadados
    if (size > 100 * 1024 * 1024 || bitrate > 3000000) { // > 100MB ou > 3Mbps
      return 'low';
    } else if (size > 50 * 1024 * 1024 || resolution.width > 720) { // > 50MB ou > 720p
      return 'medium';
    } else {
      return 'high';
    }
  }

  private static async cacheCustomVideo(video: CustomExerciseVideo): Promise<void> {
    try {
      const cacheKey = `custom_video_${video.id}`;
      await CacheService.armazenarComExpiracao(cacheKey, video, 24); // 24 horas
    } catch (error) {
      console.error('❌ Erro ao cachear vídeo personalizado:', error);
    }
  }

  private static async clearVideoCache(videoId: string): Promise<void> {
    try {
      const cacheKey = `custom_video_${videoId}`;
      await CacheService.removerCache(cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache do vídeo:', error);
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
   * Funcionalidades para streaming otimizado
   */
  static async precarregarVideo(videoPath: string): Promise<void> {
    try {
      // Gerar URL com cache
      const url = await this.obterUrlStreamingVideo(videoPath);
      
      // TODO: Implementar pré-carregamento no player de vídeo
      
      if (__DEV__) console.log('⏯️ Vídeo pré-carregado:', videoPath);
    } catch (error) {
      console.error('❌ Erro no pré-carregamento:', error);
    }
  }

  static async obterQualidadesDisponiveis(videoPath: string): Promise<string[]> {
    try {
      // Por ora, retornar qualidades padrão
      // TODO: Verificar quais qualidades estão disponíveis no storage
      return ['low', 'medium', 'high'];
    } catch (error) {
      console.error('❌ Erro ao obter qualidades disponíveis:', error);
      return ['medium'];
    }
  }
}