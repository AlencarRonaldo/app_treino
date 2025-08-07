import { MediaService, MediaUploadOptions, MediaItem } from './MediaService';
import { MediaCompression } from '../utils/MediaCompression';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { CacheService } from './CacheService';
import { supabase } from '../lib/supabase';

export interface ChatAttachment {
  id: string;
  chatId: string;
  messageId: string;
  senderId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  thumbnailPath?: string;
  previewUrl?: string;
  uploadedAt: string;
  downloadCount: number;
  isEncrypted: boolean;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    compression?: {
      originalSize: number;
      compressedSize: number;
      ratio: number;
    };
  };
}

export interface FilePreview {
  type: 'image' | 'video' | 'audio' | 'document' | 'unknown';
  thumbnailUri?: string;
  previewUri?: string;
  canPreview: boolean;
  metadata: Record<string, any>;
}

export interface AttachmentUploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

/**
 * Serviço de anexos para chat no TreinosApp
 * Gerencia upload, download e preview de arquivos no chat
 */
export class ChatAttachmentService {
  private static readonly SUPPORTED_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  };

  private static readonly MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 20 * 1024 * 1024 // 20MB
  };

  private static readonly PREVIEW_SIZES = {
    thumbnail: { width: 200, height: 200 },
    preview: { width: 800, height: 600 }
  };

  /**
   * Selecionar arquivo para anexo
   */
  static async selectFile(
    type: 'image' | 'video' | 'document' | 'any' = 'any'
  ): Promise<ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset | null> {
    try {
      if (type === 'image') {
        const result = await MediaService.abrirSeletorMidia('image', false, 0.8);
        return result && result.length > 0 ? result[0] : null;
        
      } else if (type === 'video') {
        const result = await MediaService.abrirSeletorMidia('video', false, 0.8);
        return result && result.length > 0 ? result[0] : null;
        
      } else {
        // Documentos e outros arquivos
        const result = await DocumentPicker.getDocumentAsync({
          type: type === 'document' ? 'application/*' : '*/*',
          copyToCacheDirectory: true,
          multiple: false
        });

        if (!result.canceled && result.assets.length > 0) {
          return result.assets[0];
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Erro ao selecionar arquivo:', error);
      throw new Error('Falha na seleção de arquivo');
    }
  }

  /**
   * Upload de anexo para chat
   */
  static async uploadAttachment(
    file: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
    chatData: {
      chatId: string;
      messageId: string;
      senderId: string;
    },
    onProgress?: (progress: AttachmentUploadProgress) => void
  ): Promise<ChatAttachment> {
    const attachmentId = `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validar arquivo
      await this.validateFile(file);

      // Determinar tipo de arquivo
      const fileType = this.getFileType(file.mimeType || '');
      
      // Progresso inicial
      onProgress?.({
        id: attachmentId,
        fileName: file.name || 'arquivo',
        progress: 0,
        status: 'processing'
      });

      // Processar arquivo baseado no tipo
      let processedFile = file;
      let thumbnailPath: string | undefined;
      let compression: any = undefined;

      if (fileType === 'image' && 'uri' in file) {
        // Comprimir imagem
        const compressionResult = await MediaCompression.compressChat(file.uri);
        
        processedFile = {
          ...file,
          uri: compressionResult.uri,
          size: compressionResult.fileSize
        } as any;

        compression = {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.fileSize,
          ratio: compressionResult.compressionRatio
        };

        // Gerar thumbnail
        thumbnailPath = await this.generateThumbnail(compressionResult.uri, fileType);

      } else if (fileType === 'video' && 'uri' in file) {
        // Gerar thumbnail para vídeo
        thumbnailPath = await this.generateThumbnail(file.uri, fileType);
      }

      // Progresso - processamento concluído
      onProgress?.({
        id: attachmentId,
        fileName: file.name || 'arquivo',
        progress: 30,
        status: 'uploading'
      });

      // Upload do arquivo principal
      const uploadOptions: MediaUploadOptions = {
        bucket: 'chat-attachments',
        folder: `chats/${chatData.chatId}`,
        userId: chatData.senderId,
        compressionQuality: 0.8
      };

      const uploadedFile = await MediaService.uploadMedia(
        processedFile as ImagePicker.ImagePickerAsset,
        uploadOptions,
        (progress) => {
          onProgress?.({
            id: attachmentId,
            fileName: file.name || 'arquivo',
            progress: 30 + (progress.progress * 0.6), // 30-90%
            status: 'uploading'
          });
        }
      );

      // Upload do thumbnail se existir
      let uploadedThumbnail: MediaItem | undefined;
      if (thumbnailPath) {
        try {
          const thumbnailOptions: MediaUploadOptions = {
            ...uploadOptions,
            folder: `chats/${chatData.chatId}/thumbnails`
          };

          uploadedThumbnail = await MediaService.uploadMedia(
            { ...processedFile, uri: thumbnailPath } as ImagePicker.ImagePickerAsset,
            thumbnailOptions
          );
        } catch (error) {
          console.warn('⚠️ Falha no upload de thumbnail:', error);
        }
      }

      // Progresso final
      onProgress?.({
        id: attachmentId,
        fileName: file.name || 'arquivo',
        progress: 100,
        status: 'completed'
      });

      // Criar registro de anexo
      const chatAttachment: ChatAttachment = {
        id: attachmentId,
        chatId: chatData.chatId,
        messageId: chatData.messageId,
        senderId: chatData.senderId,
        fileName: uploadedFile.fileName,
        originalName: file.name || 'arquivo',
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
        filePath: uploadedFile.filePath,
        thumbnailPath: uploadedThumbnail?.filePath,
        uploadedAt: new Date().toISOString(),
        downloadCount: 0,
        isEncrypted: false, // TODO: Implementar encriptação
        metadata: {
          width: 'width' in file ? file.width : undefined,
          height: 'height' in file ? file.height : undefined,
          duration: 'duration' in file ? file.duration : undefined,
          compression
        }
      };

      // Salvar no banco de dados (TODO: Implementar quando disponível)
      await this.cacheAttachment(chatAttachment);

      if (__DEV__) {
        console.log('📎 Anexo enviado:', {
          id: attachmentId,
          fileName: file.name,
          type: fileType,
          size: this.formatFileSize(file.size || 0)
        });
      }

      return chatAttachment;

    } catch (error) {
      onProgress?.({
        id: attachmentId,
        fileName: file.name || 'arquivo',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      });

      console.error('❌ Erro no upload de anexo:', error);
      throw error;
    }
  }

  /**
   * Download de anexo
   */
  static async downloadAttachment(
    attachment: ChatAttachment,
    saveToDevice: boolean = false
  ): Promise<string> {
    try {
      // Obter URL do arquivo
      const fileUrl = await MediaService.downloadMedia('chat-attachments', attachment.filePath);
      
      if (saveToDevice && 'uri' in attachment) {
        // Salvar na galeria do dispositivo se for mídia
        const fileType = this.getFileType(attachment.mimeType);
        
        if (fileType === 'image' || fileType === 'video') {
          // TODO: Implementar salvamento na galeria
          // await MediaLibrary.saveToLibraryAsync(fileUrl);
        }
      }

      // Incrementar contador de download
      await this.incrementDownloadCount(attachment.id);

      return fileUrl;

    } catch (error) {
      console.error('❌ Erro no download de anexo:', error);
      throw new Error('Falha no download do anexo');
    }
  }

  /**
   * Gerar preview do arquivo
   */
  static async generateFilePreview(
    attachment: ChatAttachment
  ): Promise<FilePreview> {
    try {
      const fileType = this.getFileType(attachment.mimeType);
      let thumbnailUri: string | undefined;
      let previewUri: string | undefined;
      let canPreview = false;

      // Obter thumbnail se disponível
      if (attachment.thumbnailPath) {
        thumbnailUri = await MediaService.downloadMedia('chat-attachments', attachment.thumbnailPath);
      }

      // Determinar capacidade de preview
      switch (fileType) {
        case 'image':
          previewUri = await MediaService.downloadMedia('chat-attachments', attachment.filePath);
          canPreview = true;
          break;
          
        case 'video':
          previewUri = await MediaService.downloadMedia('chat-attachments', attachment.filePath);
          canPreview = true;
          break;
          
        case 'audio':
          canPreview = true;
          break;
          
        case 'document':
          // Verificar se é PDF para preview
          if (attachment.mimeType === 'application/pdf') {
            canPreview = true;
          }
          break;
      }

      const preview: FilePreview = {
        type: fileType,
        thumbnailUri,
        previewUri,
        canPreview,
        metadata: attachment.metadata
      };

      return preview;

    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      return {
        type: 'unknown',
        canPreview: false,
        metadata: {}
      };
    }
  }

  /**
   * Listar anexos de um chat
   */
  static async listChatAttachments(
    chatId: string,
    type?: 'image' | 'video' | 'audio' | 'document',
    limit: number = 50
  ): Promise<ChatAttachment[]> {
    try {
      const cacheKey = `chat_attachments_${chatId}_${type || 'all'}`;
      
      // Verificar cache
      const cached = await CacheService.recuperarCache<ChatAttachment[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // TODO: Buscar do banco de dados
      const attachments: ChatAttachment[] = [];

      // Filtrar por tipo se especificado
      const filteredAttachments = type
        ? attachments.filter(att => this.getFileType(att.mimeType) === type)
        : attachments;

      // Limitar resultados
      const limitedAttachments = filteredAttachments.slice(0, limit);

      // Cache por 15 minutos
      await CacheService.armazenarComExpiracao(cacheKey, limitedAttachments, 0.25);

      return limitedAttachments;

    } catch (error) {
      console.error('❌ Erro ao listar anexos do chat:', error);
      return [];
    }
  }

  /**
   * Remover anexo
   */
  static async deleteAttachment(
    attachmentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // TODO: Verificar permissões no banco de dados
      
      // Buscar anexo no cache
      const cached = await CacheService.recuperarCache<ChatAttachment>(`attachment_${attachmentId}`);
      
      if (!cached || cached.senderId !== userId) {
        throw new Error('Anexo não encontrado ou sem permissão');
      }

      // Remover do storage
      const removed = await MediaService.removerMedia('chat-attachments', cached.filePath);
      
      // Remover thumbnail se existir
      if (cached.thumbnailPath) {
        await MediaService.removerMedia('chat-attachments', cached.thumbnailPath);
      }

      // Limpar cache
      await CacheService.removerCache(`attachment_${attachmentId}`);

      return removed;

    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas de anexos
   */
  static async getAttachmentStats(chatId: string): Promise<{
    totalAttachments: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
    mostDownloaded: ChatAttachment[];
  }> {
    try {
      const attachments = await this.listChatAttachments(chatId);
      
      const stats = {
        totalAttachments: attachments.length,
        totalSize: attachments.reduce((sum, att) => sum + att.size, 0),
        byType: {} as Record<string, { count: number; size: number }>,
        mostDownloaded: attachments
          .sort((a, b) => b.downloadCount - a.downloadCount)
          .slice(0, 5)
      };

      // Agrupar por tipo
      attachments.forEach(att => {
        const type = this.getFileType(att.mimeType);
        if (!stats.byType[type]) {
          stats.byType[type] = { count: 0, size: 0 };
        }
        stats.byType[type].count++;
        stats.byType[type].size += att.size;
      });

      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de anexos:', error);
      return {
        totalAttachments: 0,
        totalSize: 0,
        byType: {},
        mostDownloaded: []
      };
    }
  }

  /**
   * Utilitários privados
   */
  private static async validateFile(file: any): Promise<void> {
    // Verificar tamanho
    const fileType = this.getFileType(file.mimeType || '');
    const maxSize = this.MAX_FILE_SIZES[fileType as keyof typeof this.MAX_FILE_SIZES];
    
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.formatFileSize(maxSize)}`);
    }

    // Verificar tipo suportado
    const allSupportedTypes = [
      ...this.SUPPORTED_TYPES.images,
      ...this.SUPPORTED_TYPES.videos,
      ...this.SUPPORTED_TYPES.audio,
      ...this.SUPPORTED_TYPES.documents
    ];

    if (!allSupportedTypes.includes(file.mimeType)) {
      throw new Error('Tipo de arquivo não suportado');
    }
  }

  private static getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'unknown' {
    if (this.SUPPORTED_TYPES.images.includes(mimeType)) return 'image';
    if (this.SUPPORTED_TYPES.videos.includes(mimeType)) return 'video';
    if (this.SUPPORTED_TYPES.audio.includes(mimeType)) return 'audio';
    if (this.SUPPORTED_TYPES.documents.includes(mimeType)) return 'document';
    return 'unknown';
  }

  private static async generateThumbnail(
    uri: string,
    type: 'image' | 'video' | 'audio' | 'document' | 'unknown'
  ): Promise<string | undefined> {
    try {
      if (type === 'image') {
        // Gerar thumbnail da imagem
        const result = await MediaCompression.compressThumbnail(uri);
        return result.uri;
        
      } else if (type === 'video') {
        // Gerar thumbnail do vídeo
        const { VideoThumbnails } = await import('expo-video-thumbnails');
        const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
          time: 1000,
          quality: 0.8
        });
        return thumbnailUri;
      }

      return undefined;

    } catch (error) {
      console.error('❌ Erro ao gerar thumbnail:', error);
      return undefined;
    }
  }

  private static async incrementDownloadCount(attachmentId: string): Promise<void> {
    try {
      // TODO: Incrementar no banco de dados
      
      // Atualizar cache se disponível
      const cached = await CacheService.recuperarCache<ChatAttachment>(`attachment_${attachmentId}`);
      if (cached) {
        cached.downloadCount++;
        await this.cacheAttachment(cached);
      }
      
    } catch (error) {
      console.error('❌ Erro ao incrementar contador de download:', error);
    }
  }

  private static async cacheAttachment(attachment: ChatAttachment): Promise<void> {
    try {
      const cacheKey = `attachment_${attachment.id}`;
      await CacheService.armazenarComExpiracao(cacheKey, attachment, 24); // 24 horas
    } catch (error) {
      console.error('❌ Erro ao cachear anexo:', error);
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
   * Utilitários para validação de arquivos
   */
  static isImageFile(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.images.includes(mimeType);
  }

  static isVideoFile(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.videos.includes(mimeType);
  }

  static isAudioFile(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.audio.includes(mimeType);
  }

  static isDocumentFile(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.documents.includes(mimeType);
  }

  static getMaxFileSize(mimeType: string): number {
    const type = this.getFileType(mimeType);
    return this.MAX_FILE_SIZES[type as keyof typeof this.MAX_FILE_SIZES] || this.MAX_FILE_SIZES.document;
  }

  /**
   * Compressão específica para anexos de chat
   */
  static async optimizeForChat(
    file: ImagePicker.ImagePickerAsset
  ): Promise<ImagePicker.ImagePickerAsset> {
    if (file.type !== 'image') return file;

    try {
      const result = await MediaCompression.compressChat(file.uri);
      
      return {
        ...file,
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: result.fileSize
      };

    } catch (error) {
      console.error('❌ Erro na otimização para chat:', error);
      return file;
    }
  }
}