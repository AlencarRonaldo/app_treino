import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CacheService } from './CacheService';

export interface MediaUploadOptions {
  bucket: 'exercise-videos' | 'progress-photos' | 'avatars' | 'chat-attachments';
  folder?: string;
  compressionQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
  generateThumbnail?: boolean;
  userId: string;
}

export interface MediaItem {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  bucket: string;
  mimeType: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  thumbnailPath?: string;
  uploadedAt: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'paused';
  error?: string;
  bytesTransferred: number;
  totalBytes: number;
  estimatedTimeRemaining?: number;
}

export interface MediaCompression {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
}

/**
 * Serviço Central de Mídia para TreinosApp
 * Gerencia upload, download, compressão e otimização de mídia
 */
export class MediaService {
  private static readonly STORAGE_PATHS = {
    'exercise-videos': 'exercises/videos',
    'progress-photos': 'progress/photos', 
    'avatars': 'users/avatars',
    'chat-attachments': 'chat/attachments'
  };

  private static readonly COMPRESSION_PRESETS = {
    thumbnail: { quality: 0.6, maxWidth: 300, maxHeight: 300 },
    profile: { quality: 0.8, maxWidth: 500, maxHeight: 500 },
    progress: { quality: 0.7, maxWidth: 800, maxHeight: 800 },
    exercise: { quality: 0.9, maxWidth: 1200, maxHeight: 900 }
  };

  private static readonly MAX_FILE_SIZES = {
    'exercise-videos': 500 * 1024 * 1024, // 500MB
    'progress-photos': 10 * 1024 * 1024, // 10MB
    'avatars': 5 * 1024 * 1024, // 5MB
    'chat-attachments': 50 * 1024 * 1024 // 50MB
  };

  private static uploadQueue: Map<string, UploadProgress> = new Map();
  private static readonly CACHE_KEY_PREFIX = 'media_cache_';

  /**
   * Solicita permissões necessárias para mídia
   */
  static async solicitarPermissoes(): Promise<boolean> {
    try {
      // Permissões para câmera
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      
      // Permissões para galeria
      const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // Permissões para salvar na biblioteca de mídia
      const saveResult = await MediaLibrary.requestPermissionsAsync();

      const todasPermissoes = [
        cameraResult.status,
        mediaLibraryResult.status,
        saveResult.status
      ].every(status => status === 'granted');

      if (__DEV__) {
        console.log('📱 Status das permissões de mídia:', {
          camera: cameraResult.status,
          mediaLibrary: mediaLibraryResult.status,
          save: saveResult.status,
          todas: todasPermissoes
        });
      }

      return todasPermissoes;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      return false;
    }
  }

  /**
   * Abre seletor de mídia com configurações personalizáveis
   */
  static async abrirSeletorMidia(
    tipo: 'image' | 'video' | 'mixed' = 'mixed',
    multiplos: boolean = false,
    qualidade: number = 0.8
  ): Promise<ImagePicker.ImagePickerAsset[] | null> {
    try {
      const permissoes = await this.solicitarPermissoes();
      if (!permissoes) {
        throw new Error('Permissões de mídia não concedidas');
      }

      const mediaTypeMapping: Record<string, ImagePicker.MediaTypeOptions> = {
        'image': ImagePicker.MediaTypeOptions.Images,
        'video': ImagePicker.MediaTypeOptions.Videos,
        'mixed': ImagePicker.MediaTypeOptions.All
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeMapping[tipo],
        allowsMultipleSelection: multiplos,
        quality: qualidade,
        videoQuality: ImagePicker.VideoQuality.High,
        videoMaxDuration: 300, // 5 minutos max
        allowsEditing: !multiplos, // Só permitir edição para seleção única
        aspect: tipo === 'image' ? [4, 3] : undefined,
        exif: true
      });

      if (result.canceled) {
        if (__DEV__) console.log('📱 Seleção de mídia cancelada pelo usuário');
        return null;
      }

      if (__DEV__) {
        console.log('📱 Mídia selecionada:', {
          quantidade: result.assets.length,
          tipos: result.assets.map(asset => asset.type)
        });
      }

      return result.assets;
    } catch (error) {
      console.error('❌ Erro no seletor de mídia:', error);
      throw new Error(`Falha na seleção de mídia: ${error}`);
    }
  }

  /**
   * Captura foto com câmera
   */
  static async capturarFoto(qualidade: number = 0.8): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const permissoes = await this.solicitarPermissoes();
      if (!permissoes) {
        throw new Error('Permissões de câmera não concedidas');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: qualidade,
        allowsEditing: true,
        aspect: [4, 3],
        exif: true
      });

      if (result.canceled) {
        return null;
      }

      if (__DEV__) console.log('📸 Foto capturada:', result.assets[0]);
      return result.assets[0];
    } catch (error) {
      console.error('❌ Erro na captura de foto:', error);
      throw new Error(`Falha na captura: ${error}`);
    }
  }

  /**
   * Grava vídeo com câmera
   */
  static async gravarVideo(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const permissoes = await this.solicitarPermissoes();
      if (!permissoes) {
        throw new Error('Permissões de câmera não concedidas');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoQuality: ImagePicker.VideoQuality.High,
        videoMaxDuration: 300, // 5 minutos
        allowsEditing: true
      });

      if (result.canceled) {
        return null;
      }

      if (__DEV__) console.log('🎥 Vídeo gravado:', result.assets[0]);
      return result.assets[0];
    } catch (error) {
      console.error('❌ Erro na gravação de vídeo:', error);
      throw new Error(`Falha na gravação: ${error}`);
    }
  }

  /**
   * Upload de mídia com progresso e otimização
   */
  static async uploadMedia(
    asset: ImagePicker.ImagePickerAsset,
    options: MediaUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaItem> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Verificar conectividade
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('Dispositivo offline - upload não disponível');
      }

      // Validar tamanho do arquivo
      const maxSize = this.MAX_FILE_SIZES[options.bucket];
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error(`Arquivo muito grande. Máximo: ${this.formatFileSize(maxSize)}`);
      }

      // Inicializar progresso
      const initialProgress: UploadProgress = {
        id: uploadId,
        progress: 0,
        status: 'processing',
        bytesTransferred: 0,
        totalBytes: asset.fileSize || 0
      };

      this.uploadQueue.set(uploadId, initialProgress);
      onProgress?.(initialProgress);

      let processedAsset = asset;
      let compression: MediaCompression | undefined;

      // Processar mídia baseado no tipo
      if (asset.type === 'image') {
        const processResult = await this.processImage(asset, options);
        processedAsset = processResult.processedAsset;
        compression = processResult.compression;
      }

      // Atualizar progresso - processamento concluído
      const processingProgress: UploadProgress = {
        ...initialProgress,
        progress: 30,
        status: 'uploading'
      };
      this.uploadQueue.set(uploadId, processingProgress);
      onProgress?.(processingProgress);

      // Gerar thumbnail se necessário
      let thumbnailPath: string | undefined;
      if (options.generateThumbnail && asset.type === 'video') {
        thumbnailPath = await this.generateVideoThumbnail(processedAsset.uri);
        
        // Upload thumbnail
        if (thumbnailPath) {
          const thumbnailFileName = `thumbnail_${Date.now()}.jpg`;
          const thumbnailStoragePath = `${this.STORAGE_PATHS[options.bucket]}/${options.folder ? options.folder + '/' : ''}thumbnails/${thumbnailFileName}`;
          
          const { error: thumbnailError } = await supabase.storage
            .from(options.bucket)
            .upload(thumbnailStoragePath, {
              uri: thumbnailPath,
              type: 'image/jpeg',
              name: thumbnailFileName
            } as any);

          if (thumbnailError) {
            console.warn('⚠️ Falha no upload de thumbnail:', thumbnailError);
          }
        }
      }

      // Upload do arquivo principal
      const fileName = this.generateFileName(processedAsset, options);
      const storagePath = `${this.STORAGE_PATHS[options.bucket]}/${options.folder ? options.folder + '/' : ''}${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(storagePath, {
          uri: processedAsset.uri,
          type: processedAsset.mimeType,
          name: fileName
        } as any);

      if (uploadError) {
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      // Progresso - upload concluído
      const completedProgress: UploadProgress = {
        ...initialProgress,
        progress: 100,
        status: 'completed',
        bytesTransferred: asset.fileSize || 0
      };
      this.uploadQueue.set(uploadId, completedProgress);
      onProgress?.(completedProgress);

      // Criar registro da mídia
      const mediaItem: MediaItem = {
        id: uploadId,
        originalName: asset.fileName || 'unknown',
        fileName,
        filePath: uploadData.path,
        bucket: options.bucket,
        mimeType: processedAsset.mimeType || 'application/octet-stream',
        size: asset.fileSize || 0,
        dimensions: asset.width && asset.height ? {
          width: asset.width,
          height: asset.height
        } : undefined,
        duration: asset.duration,
        thumbnailPath,
        uploadedAt: new Date().toISOString(),
        userId: options.userId,
        metadata: {
          compression,
          originalAsset: {
            uri: asset.uri,
            width: asset.width,
            height: asset.height
          }
        }
      };

      // Cache local da mídia
      await this.cacheMediaItem(mediaItem);

      // Remover da fila de upload
      this.uploadQueue.delete(uploadId);

      if (__DEV__) {
        console.log('✅ Upload concluído:', {
          fileName,
          bucket: options.bucket,
          size: this.formatFileSize(mediaItem.size),
          compression: compression ? `${compression.compressionRatio.toFixed(1)}%` : 'N/A'
        });
      }

      return mediaItem;

    } catch (error) {
      // Marcar como erro
      const errorProgress: UploadProgress = {
        ...this.uploadQueue.get(uploadId) || initialProgress,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      this.uploadQueue.set(uploadId, errorProgress);
      onProgress?.(errorProgress);

      console.error('❌ Erro no upload de mídia:', error);
      throw error;
    }
  }

  /**
   * Download de mídia com cache
   */
  static async downloadMedia(
    bucket: string,
    path: string,
    cacheLocally: boolean = true
  ): Promise<string> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${bucket}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Verificar cache primeiro
      if (cacheLocally) {
        const cachedUrl = await CacheService.recuperarCache<string>(cacheKey);
        if (cachedUrl) {
          if (__DEV__) console.log('📦 URL recuperada do cache:', path);
          return cachedUrl;
        }
      }

      // Download do Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // URL válida por 1 hora

      if (error) {
        throw new Error(`Falha no download: ${error.message}`);
      }

      const signedUrl = data.signedUrl;

      // Cache da URL
      if (cacheLocally && signedUrl) {
        await CacheService.armazenarComExpiracao(cacheKey, signedUrl, 0.5); // Cache por 30 minutos
      }

      if (__DEV__) console.log('🌐 URL gerada para:', path);
      return signedUrl;

    } catch (error) {
      console.error('❌ Erro no download de mídia:', error);
      throw error;
    }
  }

  /**
   * Lista mídia do usuário
   */
  static async listarMediaUsuario(
    userId: string,
    bucket?: string,
    folder?: string,
    limit: number = 50
  ): Promise<MediaItem[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}list_${userId}_${bucket || 'all'}_${folder || 'root'}`;
      
      // Verificar cache
      const cachedList = await CacheService.recuperarCache<MediaItem[]>(cacheKey);
      if (cachedList) {
        if (__DEV__) console.log('📦 Lista de mídia recuperada do cache');
        return cachedList;
      }

      // Buscar do Supabase (implementar quando tiver tabela de mídia)
      // Por ora, retornar lista vazia
      const mediaList: MediaItem[] = [];

      // Cache da lista
      await CacheService.armazenarComExpiracao(cacheKey, mediaList, 0.25); // 15 minutos

      return mediaList;

    } catch (error) {
      console.error('❌ Erro ao listar mídia:', error);
      return [];
    }
  }

  /**
   * Remove mídia
   */
  static async removerMedia(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Falha na remoção: ${error.message}`);
      }

      // Limpar cache relacionado
      await this.clearMediaCache(bucket, path);

      if (__DEV__) console.log('🗑️ Mídia removida:', path);
      return true;

    } catch (error) {
      console.error('❌ Erro ao remover mídia:', error);
      return false;
    }
  }

  /**
   * Utilitários privados
   */
  private static async processImage(
    asset: ImagePicker.ImagePickerAsset,
    options: MediaUploadOptions
  ): Promise<{
    processedAsset: ImagePicker.ImagePickerAsset;
    compression: MediaCompression;
  }> {
    const originalSize = asset.fileSize || 0;

    // Determinar configurações de compressão
    let compressionConfig = this.COMPRESSION_PRESETS.exercise;
    
    if (options.bucket === 'avatars') {
      compressionConfig = this.COMPRESSION_PRESETS.profile;
    } else if (options.bucket === 'progress-photos') {
      compressionConfig = this.COMPRESSION_PRESETS.progress;
    }

    // Aplicar configurações customizadas
    const finalConfig = {
      quality: options.compressionQuality || compressionConfig.quality,
      maxWidth: options.maxWidth || compressionConfig.maxWidth,
      maxHeight: options.maxHeight || compressionConfig.maxHeight
    };

    // Manipular imagem
    const manipulatedImage = await manipulateAsync(
      asset.uri,
      [
        {
          resize: {
            width: finalConfig.maxWidth,
            height: finalConfig.maxHeight
          }
        }
      ],
      {
        compress: finalConfig.quality,
        format: SaveFormat.JPEG
      }
    );

    // Calcular compressão
    const compressedSize = manipulatedImage.width * manipulatedImage.height * 3; // Estimativa
    const compression: MediaCompression = {
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0,
      quality: finalConfig.quality
    };

    const processedAsset: ImagePicker.ImagePickerAsset = {
      ...asset,
      uri: manipulatedImage.uri,
      width: manipulatedImage.width,
      height: manipulatedImage.height,
      fileSize: compressedSize
    };

    if (__DEV__) {
      console.log('🎨 Imagem processada:', {
        original: `${asset.width}x${asset.height}`,
        processada: `${manipulatedImage.width}x${manipulatedImage.height}`,
        compressao: `${compression.compressionRatio.toFixed(1)}%`,
        tamanho: this.formatFileSize(compressedSize)
      });
    }

    return { processedAsset, compression };
  }

  private static async generateVideoThumbnail(videoUri: string): Promise<string | undefined> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // 1 segundo
        quality: 0.8
      });

      if (__DEV__) console.log('🎬 Thumbnail gerada para vídeo');
      return uri;
    } catch (error) {
      console.error('❌ Erro ao gerar thumbnail:', error);
      return undefined;
    }
  }

  private static generateFileName(
    asset: ImagePicker.ImagePickerAsset,
    options: MediaUploadOptions
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = asset.uri.split('.').pop() || 'jpg';
    
    return `${options.userId}_${timestamp}_${randomId}.${extension}`;
  }

  private static async cacheMediaItem(item: MediaItem): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}item_${item.id}`;
      await CacheService.armazenarComExpiracao(cacheKey, item, 24); // 24 horas
    } catch (error) {
      console.error('❌ Erro ao cachear item de mídia:', error);
    }
  }

  private static async clearMediaCache(bucket: string, path: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${bucket}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await CacheService.removerCache(cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache de mídia:', error);
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
   * Métodos públicos para gerenciamento de upload
   */
  static getUploadProgress(uploadId: string): UploadProgress | undefined {
    return this.uploadQueue.get(uploadId);
  }

  static getAllUploadProgress(): UploadProgress[] {
    return Array.from(this.uploadQueue.values());
  }

  static cancelUpload(uploadId: string): boolean {
    const progress = this.uploadQueue.get(uploadId);
    if (progress && progress.status === 'uploading') {
      this.uploadQueue.set(uploadId, {
        ...progress,
        status: 'error',
        error: 'Upload cancelado pelo usuário'
      });
      return true;
    }
    return false;
  }

  /**
   * Estatísticas de uso de mídia
   */
  static async obterEstatisticasUso(userId: string): Promise<{
    totalItens: number;
    tamanhoTotal: number;
    porBucket: Record<string, { itens: number; tamanho: number }>;
  }> {
    try {
      // Implementar quando tiver tabela de mídia no banco
      return {
        totalItens: 0,
        tamanhoTotal: 0,
        porBucket: {}
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalItens: 0,
        tamanhoTotal: 0,
        porBucket: {}
      };
    }
  }
}