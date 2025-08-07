import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as NetInfo from '@react-native-community/netinfo';
import { MediaService, MediaUploadOptions, UploadProgress } from '../services/MediaService';
import { PhotoService } from '../services/PhotoService';
import { VideoService } from '../services/VideoService';
import { MediaCompression } from '../utils/MediaCompression';

export interface UseMediaUploadConfig {
  bucketType: 'exercise-videos' | 'progress-photos' | 'avatars' | 'chat-attachments';
  userId: string;
  
  // Configurações automáticas
  autoCompress?: boolean;
  compressionQuality?: 'low' | 'medium' | 'high';
  maxFileSize?: number; // em bytes
  allowedTypes?: ('image' | 'video')[];
  
  // Background upload
  enableBackgroundUpload?: boolean;
  retryAttempts?: number;
  
  // Callbacks
  onUploadStart?: (asset: ImagePicker.ImagePickerAsset) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: Error, asset: ImagePicker.ImagePickerAsset) => void;
  onBatchComplete?: (results: any[], errors: any[]) => void;
}

export interface UploadState {
  isUploading: boolean;
  uploadQueue: Array<{
    asset: ImagePicker.ImagePickerAsset;
    options: MediaUploadOptions;
    progress: UploadProgress;
    attempts: number;
  }>;
  completedUploads: any[];
  failedUploads: Array<{
    asset: ImagePicker.ImagePickerAsset;
    error: string;
    attempts: number;
  }>;
}

export const useMediaUpload = (config: UseMediaUploadConfig) => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadQueue: [],
    completedUploads: [],
    failedUploads: []
  });

  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const uploadQueueRef = useRef<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitorar conectividade de rede
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkInfo(state);
      
      // Resumir uploads quando conexão for restaurada
      if (state.isConnected && !state.isUploading && uploadQueueRef.current.length > 0) {
        resumeFailedUploads();
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Upload de mídia única
   */
  const uploadMedia = useCallback(async (
    asset: ImagePicker.ImagePickerAsset,
    specificOptions?: Partial<MediaUploadOptions>
  ) => {
    try {
      // Verificar conectividade
      if (!networkInfo?.isConnected) {
        throw new Error('Dispositivo offline. Upload será retomado quando conectar.');
      }

      // Validações iniciais
      await validateAsset(asset);

      // Configurações de upload
      const uploadOptions: MediaUploadOptions = {
        bucket: config.bucketType,
        userId: config.userId,
        compressionQuality: getCompressionQuality(),
        generateThumbnail: asset.type === 'video',
        ...specificOptions
      };

      // Aplicar compressão se habilitada
      let processedAsset = asset;
      if (config.autoCompress && asset.type === 'image') {
        const compressionResult = await MediaCompression.smartCompress(
          asset.uri,
          getCompressionPreset(),
          getSmartCompressionConfig()
        );
        
        processedAsset = {
          ...asset,
          uri: compressionResult.uri,
          fileSize: compressionResult.fileSize,
          width: compressionResult.width,
          height: compressionResult.height
        };
      }

      setState(prev => ({ ...prev, isUploading: true }));
      config.onUploadStart?.(processedAsset);

      // Upload baseado no tipo de bucket
      let result;
      if (config.bucketType === 'exercise-videos' && asset.type === 'video') {
        // Verificar se temos dados necessários para vídeo de exercício
        result = await MediaService.uploadMedia(processedAsset, uploadOptions, config.onUploadProgress);
      } else if (config.bucketType === 'progress-photos' && asset.type === 'image') {
        // Upload genérico para fotos de progresso - dados específicos devem ser fornecidos separadamente
        result = await MediaService.uploadMedia(processedAsset, uploadOptions, config.onUploadProgress);
      } else {
        // Upload genérico
        result = await MediaService.uploadMedia(processedAsset, uploadOptions, config.onUploadProgress);
      }

      setState(prev => ({
        ...prev,
        isUploading: false,
        completedUploads: [...prev.completedUploads, result]
      }));

      config.onUploadComplete?.(result);
      return result;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro desconhecido no upload');
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        failedUploads: [...prev.failedUploads, {
          asset,
          error: errorObj.message,
          attempts: 1
        }]
      }));

      config.onUploadError?.(errorObj, asset);
      throw errorObj;
    }
  }, [config, networkInfo]);

  /**
   * Upload em lote com controle de concorrência
   */
  const uploadBatch = useCallback(async (
    assets: ImagePicker.ImagePickerAsset[],
    specificOptions?: Partial<MediaUploadOptions>,
    maxConcurrent: number = 3
  ) => {
    if (assets.length === 0) return { results: [], errors: [] };

    setState(prev => ({ ...prev, isUploading: true }));

    const results: any[] = [];
    const errors: any[] = [];
    
    // Processar uploads em lotes para controlar concorrência
    for (let i = 0; i < assets.length; i += maxConcurrent) {
      const batch = assets.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (asset, index) => {
        try {
          const result = await uploadMedia(asset, {
            ...specificOptions,
            folder: `${specificOptions?.folder || 'batch'}_${Date.now()}`
          });
          return { success: true, result, asset };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido', 
            asset 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
          const { success, result, error, asset } = promiseResult.value;
          if (success) {
            results.push(result);
          } else {
            errors.push({ asset, error });
          }
        }
      });

      // Pequeno delay entre lotes
      if (i + maxConcurrent < assets.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setState(prev => ({ ...prev, isUploading: false }));
    config.onBatchComplete?.(results, errors);

    return { results, errors };
  }, [uploadMedia, config]);

  /**
   * Upload específico para foto de progresso
   */
  const uploadProgressPhoto = useCallback(async (
    asset: ImagePicker.ImagePickerAsset,
    progressData: {
      categoria: 'before' | 'after' | 'progress';
      partesCorpo: string[];
      peso?: number;
      medidas?: Record<string, number>;
      notas?: string;
      isPrivate?: boolean;
    }
  ) => {
    if (asset.type !== 'image') {
      throw new Error('Apenas imagens são aceitas para fotos de progresso');
    }

    return await PhotoService.uploadProgressPhoto(
      asset,
      { userId: config.userId, ...progressData },
      config.onUploadProgress
    );
  }, [config]);

  /**
   * Upload específico para vídeo de exercício
   */
  const uploadExerciseVideo = useCallback(async (
    asset: ImagePicker.ImagePickerAsset,
    exerciseData: {
      exerciseId: string;
      personalTrainerId: string;
      title: string;
      description: string;
      tags?: string[];
    }
  ) => {
    if (asset.type !== 'video') {
      throw new Error('Apenas vídeos são aceitos para exercícios');
    }

    return await VideoService.uploadExerciseVideo(
      asset,
      exerciseData,
      config.onUploadProgress
    );
  }, [config]);

  /**
   * Cancelar upload atual
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isUploading: false,
      uploadQueue: []
    }));
  }, []);

  /**
   * Retomar uploads falhos
   */
  const resumeFailedUploads = useCallback(async () => {
    const { failedUploads } = state;
    
    if (failedUploads.length === 0 || !networkInfo?.isConnected) return;

    setState(prev => ({ 
      ...prev, 
      failedUploads: [],
      isUploading: true 
    }));

    for (const failedUpload of failedUploads) {
      if (failedUpload.attempts < (config.retryAttempts || 3)) {
        try {
          await uploadMedia(failedUpload.asset);
        } catch (error) {
          // Upload ainda falhou, será adicionado novamente aos falhos
        }
      }
    }

    setState(prev => ({ ...prev, isUploading: false }));
  }, [state.failedUploads, uploadMedia, networkInfo, config.retryAttempts]);

  /**
   * Limpar estado de uploads
   */
  const clearUploads = useCallback(() => {
    setState({
      isUploading: false,
      uploadQueue: [],
      completedUploads: [],
      failedUploads: []
    });
  }, []);

  /**
   * Utilitários privados
   */
  const validateAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    // Verificar tipo permitido
    if (config.allowedTypes && !config.allowedTypes.includes(asset.type as any)) {
      throw new Error(`Tipo de mídia não permitido: ${asset.type}`);
    }

    // Verificar tamanho
    if (config.maxFileSize && asset.fileSize && asset.fileSize > config.maxFileSize) {
      const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
      const fileSizeMB = Math.round(asset.fileSize / (1024 * 1024));
      throw new Error(`Arquivo muito grande: ${fileSizeMB}MB (máximo: ${maxSizeMB}MB)`);
    }

    // Validação de imagem
    if (asset.type === 'image') {
      const validation = await MediaCompression.validateImage(asset.uri);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Imagem inválida');
      }
    }
  };

  const getCompressionQuality = (): number => {
    switch (config.compressionQuality) {
      case 'low': return 0.5;
      case 'medium': return 0.7;
      case 'high': return 0.9;
      default: return 0.8;
    }
  };

  const getCompressionPreset = (): 'avatar' | 'progress' | 'thumbnail' | 'exercise' | 'chat' => {
    switch (config.bucketType) {
      case 'avatars': return 'avatar';
      case 'progress-photos': return 'progress';
      case 'exercise-videos': return 'exercise';
      case 'chat-attachments': return 'chat';
      default: return 'progress';
    }
  };

  const getSmartCompressionConfig = () => ({
    connectionType: (networkInfo?.type === 'cellular' && networkInfo?.details?.cellularGeneration === '2g') ? 'slow' as const : 
                   (networkInfo?.type === 'cellular' && networkInfo?.details?.cellularGeneration === '3g') ? 'medium' as const : 
                   'fast' as const,
    devicePerformance: 'medium' as const,
    userPreference: 'balanced' as const
  });

  /**
   * Estatísticas de upload
   */
  const getUploadStats = useCallback(() => {
    const { completedUploads, failedUploads } = state;
    
    return {
      totalUploads: completedUploads.length + failedUploads.length,
      successfulUploads: completedUploads.length,
      failedUploads: failedUploads.length,
      successRate: completedUploads.length > 0 
        ? Math.round((completedUploads.length / (completedUploads.length + failedUploads.length)) * 100)
        : 0,
      totalSize: completedUploads.reduce((sum, upload) => sum + (upload.size || 0), 0)
    };
  }, [state]);

  return {
    // Estado
    ...state,
    networkInfo,
    
    // Ações
    uploadMedia,
    uploadBatch,
    uploadProgressPhoto,
    uploadExerciseVideo,
    cancelUpload,
    resumeFailedUploads,
    clearUploads,
    
    // Utilitários
    getUploadStats,
    
    // Flags de conveniência
    canUpload: !!networkInfo?.isConnected && !state.isUploading,
    hasFailedUploads: state.failedUploads.length > 0,
    hasCompletedUploads: state.completedUploads.length > 0,
    isOffline: !networkInfo?.isConnected
  };
};