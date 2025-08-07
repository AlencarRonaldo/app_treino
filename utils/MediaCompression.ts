import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export interface CompressionOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: SaveFormat;
  maintainAspectRatio?: boolean;
  targetSizeKB?: number; // Tamanho alvo em KB
  progressive?: boolean; // Para JPEG progressivo
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  originalSize: number;
  compressionRatio: number;
  quality: number;
  format: string;
  processingTime: number;
}

export interface SmartCompressionConfig {
  connectionType: 'slow' | 'medium' | 'fast';
  devicePerformance: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  storageAvailable?: number;
  userPreference: 'quality' | 'balanced' | 'size';
}

/**
 * Utilitário avançado de compressão de mídia para TreinosApp
 * Otimiza imagens e vídeos baseado em contexto e performance
 */
export class MediaCompression {
  
  // Presets otimizados para diferentes casos de uso
  private static readonly COMPRESSION_PRESETS = {
    // Avatares - qualidade alta, tamanho pequeno
    avatar: {
      quality: 0.85,
      maxWidth: 400,
      maxHeight: 400,
      format: SaveFormat.JPEG,
      targetSizeKB: 150
    },
    
    // Fotos de progresso - balance entre qualidade e tamanho
    progress: {
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 1200,
      format: SaveFormat.JPEG,
      targetSizeKB: 500
    },
    
    // Thumbnails - prioriza tamanho
    thumbnail: {
      quality: 0.6,
      maxWidth: 300,
      maxHeight: 300,
      format: SaveFormat.JPEG,
      targetSizeKB: 50
    },
    
    // Exercícios - alta qualidade para demonstração
    exercise: {
      quality: 0.9,
      maxWidth: 1200,
      maxHeight: 900,
      format: SaveFormat.JPEG,
      targetSizeKB: 800
    },
    
    // Chat - rápido e eficiente
    chat: {
      quality: 0.7,
      maxWidth: 600,
      maxHeight: 800,
      format: SaveFormat.JPEG,
      targetSizeKB: 300
    }
  } as const;

  // Algoritmos adaptativos baseados no contexto
  private static readonly ADAPTIVE_ALGORITHMS = {
    // Otimização para conexões lentas
    slow_connection: (originalSize: number) => ({
      quality: originalSize > 5000000 ? 0.4 : 0.6,
      maxWidth: 600,
      maxHeight: 800,
      targetSizeKB: 200
    }),
    
    // Otimização para dispositivos com baixa performance
    low_performance: (originalSize: number) => ({
      quality: 0.6,
      maxWidth: 800,
      maxHeight: 1000,
      targetSizeKB: 400
    }),
    
    // Otimização para economia de bateria
    battery_saver: (originalSize: number) => ({
      quality: 0.5,
      maxWidth: 480,
      maxHeight: 640,
      targetSizeKB: 150
    })
  };

  /**
   * Compressão inteligente baseada no contexto
   */
  static async smartCompress(
    imageUri: string,
    preset: keyof typeof MediaCompression.COMPRESSION_PRESETS,
    config?: SmartCompressionConfig
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    
    try {
      // Obter informações do arquivo original
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = fileInfo.size || 0;

      // Selecionar configuração base
      let compressionOptions = { ...this.COMPRESSION_PRESETS[preset] };

      // Aplicar otimizações adaptativas se configurado
      if (config) {
        compressionOptions = this.applyAdaptiveOptimizations(
          compressionOptions,
          config,
          originalSize
        );
      }

      if (__DEV__) {
        console.log('🎨 Iniciando compressão inteligente:', {
          preset,
          originalSize: this.formatFileSize(originalSize),
          targetSize: this.formatFileSize(compressionOptions.targetSizeKB * 1024),
          config
        });
      }

      // Primeira tentativa de compressão
      let result = await this.compressWithOptions(imageUri, compressionOptions);

      // Ajuste iterativo se não atingiu o tamanho alvo
      if (compressionOptions.targetSizeKB && result.fileSize > compressionOptions.targetSizeKB * 1024) {
        result = await this.iterativeCompress(imageUri, compressionOptions, result);
      }

      const processingTime = Date.now() - startTime;

      const compressionResult: CompressionResult = {
        ...result,
        originalSize,
        compressionRatio: ((originalSize - result.fileSize) / originalSize) * 100,
        quality: compressionOptions.quality,
        format: compressionOptions.format || SaveFormat.JPEG,
        processingTime
      };

      if (__DEV__) {
        console.log('✅ Compressão concluída:', {
          originalSize: this.formatFileSize(originalSize),
          compressedSize: this.formatFileSize(result.fileSize),
          reduction: `${compressionResult.compressionRatio.toFixed(1)}%`,
          time: `${processingTime}ms`,
          dimensions: `${result.width}x${result.height}`
        });
      }

      return compressionResult;

    } catch (error) {
      console.error('❌ Erro na compressão inteligente:', error);
      throw new Error(`Falha na compressão: ${error}`);
    }
  }

  /**
   * Compressão em lote otimizada
   */
  static async batchCompress(
    imageUris: string[],
    preset: keyof typeof MediaCompression.COMPRESSION_PRESETS,
    config?: SmartCompressionConfig,
    onProgress?: (current: number, total: number, currentFile: string) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const startTime = Date.now();

    try {
      if (__DEV__) {
        console.log('🔄 Iniciando compressão em lote:', {
          quantidade: imageUris.length,
          preset,
          config
        });
      }

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        
        try {
          onProgress?.(i + 1, imageUris.length, `imagem_${i + 1}`);
          
          const result = await this.smartCompress(uri, preset, config);
          results.push(result);
          
          // Pequeno delay para não sobrecarregar o dispositivo
          if (i < imageUris.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
        } catch (error) {
          console.error(`❌ Erro na compressão da imagem ${i + 1}:`, error);
          // Continuar com as próximas imagens mesmo se uma falhar
        }
      }

      const totalTime = Date.now() - startTime;
      const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressedSize = results.reduce((sum, r) => sum + r.fileSize, 0);
      const overallReduction = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;

      if (__DEV__) {
        console.log('✅ Compressão em lote concluída:', {
          processadas: results.length,
          falharam: imageUris.length - results.length,
          tempoTotal: `${Math.round(totalTime / 1000)}s`,
          reducaoGeral: `${overallReduction.toFixed(1)}%`,
          tamanhoOriginal: this.formatFileSize(totalOriginalSize),
          tamanhoFinal: this.formatFileSize(totalCompressedSize)
        });
      }

      return results;

    } catch (error) {
      console.error('❌ Erro na compressão em lote:', error);
      return results; // Retornar resultados parciais
    }
  }

  /**
   * Compressão adaptativa baseada em largura de banda
   */
  static async compressForBandwidth(
    imageUri: string,
    bandwidthKbps: number,
    maxUploadTimeSeconds: number = 30
  ): Promise<CompressionResult> {
    try {
      // Calcular tamanho máximo baseado na largura de banda
      const maxSizeKB = (bandwidthKbps * maxUploadTimeSeconds) / 8; // Converter para KB
      
      // Ajustar para ser conservador (usar 70% da capacidade)
      const targetSizeKB = Math.round(maxSizeKB * 0.7);

      let compressionOptions: CompressionOptions;

      // Selecionar preset baseado no tamanho alvo
      if (targetSizeKB < 100) {
        compressionOptions = {
          ...this.COMPRESSION_PRESETS.thumbnail,
          targetSizeKB
        };
      } else if (targetSizeKB < 300) {
        compressionOptions = {
          ...this.COMPRESSION_PRESETS.chat,
          targetSizeKB
        };
      } else {
        compressionOptions = {
          ...this.COMPRESSION_PRESETS.progress,
          targetSizeKB
        };
      }

      if (__DEV__) {
        console.log('📶 Compressão adaptativa para largura de banda:', {
          bandwidth: `${bandwidthKbps}kbps`,
          maxUploadTime: `${maxUploadTimeSeconds}s`,
          targetSize: this.formatFileSize(targetSizeKB * 1024)
        });
      }

      return await this.smartCompress(imageUri, 'progress', {
        connectionType: bandwidthKbps < 500 ? 'slow' : bandwidthKbps < 2000 ? 'medium' : 'fast',
        devicePerformance: 'medium',
        userPreference: 'balanced'
      });

    } catch (error) {
      console.error('❌ Erro na compressão adaptativa:', error);
      throw error;
    }
  }

  /**
   * Análise de qualidade de imagem
   */
  static async analyzeImageQuality(imageUri: string): Promise<{
    dimensions: { width: number; height: number };
    estimatedQuality: 'low' | 'medium' | 'high';
    compressionPotential: number; // Percentual de redução possível
    recommendedPreset: keyof typeof MediaCompression.COMPRESSION_PRESETS;
    fileSize: number;
    aspectRatio: number;
  }> {
    try {
      // Obter informações básicas
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSize = fileInfo.size || 0;

      // Manipular para obter dimensões (sem salvar)
      const tempResult = await manipulateAsync(imageUri, [], {});
      const { width, height } = tempResult;
      
      // Calcular métricas
      const aspectRatio = width / height;
      const pixelCount = width * height;
      const bytesPerPixel = fileSize / pixelCount;
      
      // Estimar qualidade baseada em bytes por pixel
      let estimatedQuality: 'low' | 'medium' | 'high';
      if (bytesPerPixel < 1) {
        estimatedQuality = 'low';
      } else if (bytesPerPixel < 3) {
        estimatedQuality = 'medium';
      } else {
        estimatedQuality = 'high';
      }

      // Calcular potencial de compressão
      let compressionPotential: number;
      if (estimatedQuality === 'high') {
        compressionPotential = 70; // Pode comprimir muito
      } else if (estimatedQuality === 'medium') {
        compressionPotential = 40; // Compressão moderada
      } else {
        compressionPotential = 15; // Já está comprimida
      }

      // Recomendar preset baseado no tamanho e uso
      let recommendedPreset: keyof typeof MediaCompression.COMPRESSION_PRESETS;
      if (Math.max(width, height) <= 400) {
        recommendedPreset = 'thumbnail';
      } else if (fileSize > 2000000) { // > 2MB
        recommendedPreset = 'progress';
      } else {
        recommendedPreset = 'chat';
      }

      const analysis = {
        dimensions: { width, height },
        estimatedQuality,
        compressionPotential,
        recommendedPreset,
        fileSize,
        aspectRatio: Math.round(aspectRatio * 100) / 100
      };

      if (__DEV__) {
        console.log('🔍 Análise de qualidade:', {
          ...analysis,
          fileSize: this.formatFileSize(fileSize),
          pixelCount: `${(pixelCount / 1000000).toFixed(1)}MP`,
          bytesPerPixel: bytesPerPixel.toFixed(2)
        });
      }

      // Limpar arquivo temporário
      await FileSystem.deleteAsync(tempResult.uri, { idempotent: true });

      return analysis;

    } catch (error) {
      console.error('❌ Erro na análise de qualidade:', error);
      throw error;
    }
  }

  /**
   * Utilitários privados
   */
  private static applyAdaptiveOptimizations(
    baseOptions: CompressionOptions,
    config: SmartCompressionConfig,
    originalSize: number
  ): CompressionOptions {
    let options = { ...baseOptions };

    // Ajustes baseados na conexão
    if (config.connectionType === 'slow') {
      const slowOptimizations = this.ADAPTIVE_ALGORITHMS.slow_connection(originalSize);
      options = { ...options, ...slowOptimizations };
    }

    // Ajustes baseados na performance do dispositivo
    if (config.devicePerformance === 'low') {
      const lowPerfOptimizations = this.ADAPTIVE_ALGORITHMS.low_performance(originalSize);
      options = { ...options, ...lowPerfOptimizations };
    }

    // Ajustes baseados no nível de bateria
    if (config.batteryLevel && config.batteryLevel < 0.2) { // < 20%
      const batteryOptimizations = this.ADAPTIVE_ALGORITHMS.battery_saver(originalSize);
      options = { ...options, ...batteryOptimizations };
    }

    // Ajustes baseados na preferência do usuário
    switch (config.userPreference) {
      case 'quality':
        options.quality = Math.min(1, options.quality + 0.1);
        break;
      case 'size':
        options.quality = Math.max(0.3, options.quality - 0.2);
        if (options.targetSizeKB) {
          options.targetSizeKB = Math.round(options.targetSizeKB * 0.7);
        }
        break;
      // 'balanced' mantém configurações padrão
    }

    return options;
  }

  private static async compressWithOptions(
    imageUri: string,
    options: CompressionOptions
  ): Promise<Omit<CompressionResult, 'originalSize' | 'compressionRatio' | 'quality' | 'format' | 'processingTime'>> {
    
    const manipulationActions = [];

    // Resize se necessário
    if (options.maxWidth || options.maxHeight) {
      manipulationActions.push({
        resize: {
          width: options.maxWidth,
          height: options.maxHeight
        }
      });
    }

    const result = await manipulateAsync(
      imageUri,
      manipulationActions,
      {
        compress: options.quality,
        format: options.format || SaveFormat.JPEG
      }
    );

    // Obter tamanho do arquivo resultado
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const fileSize = fileInfo.size || 0;

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize
    };
  }

  private static async iterativeCompress(
    imageUri: string,
    baseOptions: CompressionOptions,
    previousResult: Omit<CompressionResult, 'originalSize' | 'compressionRatio' | 'quality' | 'format' | 'processingTime'>
  ): Promise<Omit<CompressionResult, 'originalSize' | 'compressionRatio' | 'quality' | 'format' | 'processingTime'>> {
    
    const targetSize = (baseOptions.targetSizeKB || 500) * 1024;
    let currentResult = previousResult;
    let currentQuality = baseOptions.quality;
    let iterations = 0;
    const maxIterations = 3;

    while (currentResult.fileSize > targetSize && iterations < maxIterations && currentQuality > 0.2) {
      // Reduzir qualidade
      currentQuality *= 0.8;
      
      const newOptions = {
        ...baseOptions,
        quality: currentQuality
      };

      if (__DEV__) {
        console.log(`🔄 Iteração ${iterations + 1}: qualidade ${currentQuality.toFixed(2)}`);
      }

      currentResult = await this.compressWithOptions(imageUri, newOptions);
      iterations++;
    }

    if (__DEV__ && iterations > 0) {
      console.log(`✅ Compressão iterativa concluída em ${iterations} iterações`);
    }

    return currentResult;
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Métodos de conveniência para presets comuns
   */
  static async compressAvatar(imageUri: string): Promise<CompressionResult> {
    return this.smartCompress(imageUri, 'avatar');
  }

  static async compressProgress(imageUri: string): Promise<CompressionResult> {
    return this.smartCompress(imageUri, 'progress');
  }

  static async compressThumbnail(imageUri: string): Promise<CompressionResult> {
    return this.smartCompress(imageUri, 'thumbnail');
  }

  static async compressExercise(imageUri: string): Promise<CompressionResult> {
    return this.smartCompress(imageUri, 'exercise');
  }

  static async compressChat(imageUri: string): Promise<CompressionResult> {
    return this.smartCompress(imageUri, 'chat');
  }

  /**
   * Validação de arquivos antes da compressão
   */
  static async validateImage(imageUri: string): Promise<{
    isValid: boolean;
    error?: string;
    fileSize: number;
    dimensions?: { width: number; height: number };
  }> {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return { isValid: false, error: 'Arquivo não encontrado', fileSize: 0 };
      }

      const fileSize = fileInfo.size || 0;

      // Verificar tamanho máximo (50MB)
      if (fileSize > 50 * 1024 * 1024) {
        return { 
          isValid: false, 
          error: 'Arquivo muito grande (máximo 50MB)', 
          fileSize 
        };
      }

      // Tentar obter dimensões
      try {
        const result = await manipulateAsync(imageUri, []);
        const { width, height } = result;
        
        // Limpar arquivo temporário
        await FileSystem.deleteAsync(result.uri, { idempotent: true });

        // Verificar dimensões mínimas
        if (width < 50 || height < 50) {
          return {
            isValid: false,
            error: 'Imagem muito pequena (mínimo 50x50px)',
            fileSize,
            dimensions: { width, height }
          };
        }

        return {
          isValid: true,
          fileSize,
          dimensions: { width, height }
        };

      } catch (manipulationError) {
        return {
          isValid: false,
          error: 'Formato de imagem não suportado',
          fileSize
        };
      }

    } catch (error) {
      return {
        isValid: false,
        error: `Erro na validação: ${error}`,
        fileSize: 0
      };
    }
  }
}