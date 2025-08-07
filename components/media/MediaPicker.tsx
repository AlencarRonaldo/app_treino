import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, IconButton, Text, Portal, Modal, List, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MediaService } from '../../services/MediaService';
import { PhotoService } from '../../services/PhotoService';
import { VideoService } from '../../services/VideoService';
import { MediaCompression } from '../../utils/MediaCompression';
import { UploadProgress } from './UploadProgress';
import { Ionicons } from '@expo/vector-icons';

export interface MediaPickerProps {
  onMediaSelected: (media: ImagePicker.ImagePickerAsset[]) => void;
  onUploadComplete?: (results: any[]) => void;
  mediaType?: 'image' | 'video' | 'mixed';
  allowMultiple?: boolean;
  maxSelections?: number;
  bucketType: 'exercise-videos' | 'progress-photos' | 'avatars' | 'chat-attachments';
  userId: string;
  
  // Configurações específicas por tipo
  exerciseData?: {
    exerciseId: string;
    personalTrainerId: string;
    title: string;
    description: string;
    tags?: string[];
  };
  
  progressData?: {
    categoria: 'before' | 'after' | 'progress';
    partesCorpo: string[];
    peso?: number;
    medidas?: Record<string, number>;
    notas?: string;
    isPrivate?: boolean;
  };
}

interface SelectedMedia extends ImagePicker.ImagePickerAsset {
  compressionAnalysis?: Awaited<ReturnType<typeof MediaCompression.analyzeImageQuality>>;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
  error?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  onMediaSelected,
  onUploadComplete,
  mediaType = 'mixed',
  allowMultiple = false,
  maxSelections = 10,
  bucketType,
  userId,
  exerciseData,
  progressData
}) => {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  // Solicitar permissões na inicialização
  React.useEffect(() => {
    MediaService.solicitarPermissoes();
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    try {
      setShowOptionsModal(false);
      
      const assets = await MediaService.abrirSeletorMidia(
        mediaType,
        allowMultiple,
        0.8
      );

      if (!assets || assets.length === 0) {
        return;
      }

      // Validar quantidade
      if (assets.length > maxSelections) {
        Alert.alert(
          'Muitas mídias selecionadas',
          `Máximo permitido: ${maxSelections}. Selecionadas: ${assets.length}`,
          [{ text: 'OK' }]
        );
        return;
      }

      await processSelectedAssets(assets);
      
    } catch (error) {
      console.error('❌ Erro ao selecionar da galeria:', error);
      Alert.alert('Erro', 'Falha ao selecionar mídia da galeria');
    }
  }, [mediaType, allowMultiple, maxSelections]);

  const handleTakePhoto = useCallback(async () => {
    try {
      setShowOptionsModal(false);
      
      const asset = await MediaService.capturarFoto(0.8);
      if (!asset) return;

      await processSelectedAssets([asset]);
      
    } catch (error) {
      console.error('❌ Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Falha ao capturar foto');
    }
  }, []);

  const handleRecordVideo = useCallback(async () => {
    try {
      setShowOptionsModal(false);
      
      const asset = await MediaService.gravarVideo();
      if (!asset) return;

      await processSelectedAssets([asset]);
      
    } catch (error) {
      console.error('❌ Erro ao gravar vídeo:', error);
      Alert.alert('Erro', 'Falha ao gravar vídeo');
    }
  }, []);

  const processSelectedAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
    setIsAnalyzing(true);
    
    try {
      const processedMedia: SelectedMedia[] = [];
      
      for (const asset of assets) {
        let compressionAnalysis;
        
        // Analisar qualidade apenas para imagens
        if (asset.type === 'image') {
          try {
            compressionAnalysis = await MediaCompression.analyzeImageQuality(asset.uri);
          } catch (error) {
            console.warn('⚠️ Erro na análise de compressão:', error);
          }
        }
        
        processedMedia.push({
          ...asset,
          compressionAnalysis,
          uploadStatus: 'pending'
        });
      }
      
      setSelectedMedia(processedMedia);
      onMediaSelected(assets);
      
    } catch (error) {
      console.error('❌ Erro ao processar mídias:', error);
      Alert.alert('Erro', 'Falha ao processar mídias selecionadas');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onMediaSelected]);

  const handleUploadAll = useCallback(async () => {
    if (selectedMedia.length === 0) return;
    
    setIsUploading(true);
    const results: any[] = [];
    
    try {
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        
        // Atualizar status para uploading
        setSelectedMedia(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, uploadStatus: 'uploading', uploadProgress: 0 } : item
          )
        );

        try {
          let uploadResult;

          // Upload baseado no tipo de bucket
          if (bucketType === 'exercise-videos' && exerciseData && media.type === 'video') {
            uploadResult = await VideoService.uploadExerciseVideo(
              media,
              exerciseData,
              (progress) => {
                setSelectedMedia(prev => 
                  prev.map((item, idx) => 
                    idx === i ? { ...item, uploadProgress: progress.progress } : item
                  )
                );
              }
            );
          } else if (bucketType === 'progress-photos' && progressData && media.type === 'image') {
            uploadResult = await PhotoService.uploadProgressPhoto(
              media,
              { userId, ...progressData },
              (progress) => {
                setSelectedMedia(prev => 
                  prev.map((item, idx) => 
                    idx === i ? { ...item, uploadProgress: progress.progress } : item
                  )
                );
              }
            );
          } else {
            // Upload genérico
            uploadResult = await MediaService.uploadMedia(
              media,
              {
                bucket: bucketType,
                userId,
                generateThumbnail: media.type === 'video'
              },
              (progress) => {
                setSelectedMedia(prev => 
                  prev.map((item, idx) => 
                    idx === i ? { ...item, uploadProgress: progress.progress } : item
                  )
                );
              }
            );
          }

          results.push(uploadResult);
          
          // Marcar como concluído
          setSelectedMedia(prev => 
            prev.map((item, idx) => 
              idx === i ? { ...item, uploadStatus: 'completed', uploadProgress: 100 } : item
            )
          );

        } catch (error) {
          console.error(`❌ Erro no upload da mídia ${i + 1}:`, error);
          
          // Marcar como erro
          setSelectedMedia(prev => 
            prev.map((item, idx) => 
              idx === i ? { 
                ...item, 
                uploadStatus: 'error', 
                error: error instanceof Error ? error.message : 'Erro desconhecido'
              } : item
            )
          );
        }
      }

      setUploadResults(results);
      onUploadComplete?.(results);

      if (results.length === selectedMedia.length) {
        Alert.alert('Sucesso', 'Todos os uploads foram concluídos!');
      } else {
        Alert.alert(
          'Upload Parcial',
          `${results.length} de ${selectedMedia.length} uploads concluídos com sucesso.`
        );
      }

    } catch (error) {
      console.error('❌ Erro geral no upload:', error);
      Alert.alert('Erro', 'Falha geral no upload das mídias');
    } finally {
      setIsUploading(false);
    }
  }, [selectedMedia, bucketType, userId, exerciseData, progressData, onUploadComplete]);

  const removeMedia = useCallback((index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedMedia([]);
    setUploadResults([]);
  }, []);

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return '📸 Foto';
      case 'video': return '🎥 Vídeo';
      default: return '📄 Mídia';
    }
  };

  const getStatusColor = (status: SelectedMedia['uploadStatus']) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'uploading': return '#42A5F5';
      case 'completed': return '#66BB6A';
      case 'error': return '#EF5350';
      default: return '#9E9E9E';
    }
  };

  const getCompressionInfo = (media: SelectedMedia) => {
    if (!media.compressionAnalysis) return null;

    const { estimatedQuality, compressionPotential, recommendedPreset } = media.compressionAnalysis;
    
    return (
      <View style={styles.compressionInfo}>
        <Chip 
          icon="image" 
          compact
          style={[styles.qualityChip, { 
            backgroundColor: estimatedQuality === 'high' ? '#E8F5E8' : 
                            estimatedQuality === 'medium' ? '#FFF3E0' : '#FFEBEE'
          }]}
        >
          {estimatedQuality === 'high' ? 'Alta' : 
           estimatedQuality === 'medium' ? 'Média' : 'Baixa'}
        </Chip>
        
        {compressionPotential > 30 && (
          <Chip 
            icon="compress" 
            compact
            style={styles.compressionChip}
          >
            -{compressionPotential}%
          </Chip>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Botão principal de seleção */}
      <Button
        mode="contained"
        icon="plus"
        onPress={() => setShowOptionsModal(true)}
        style={styles.selectButton}
        disabled={isAnalyzing || isUploading}
      >
        {selectedMedia.length > 0 
          ? `${selectedMedia.length} mídia${selectedMedia.length > 1 ? 's' : ''} selecionada${selectedMedia.length > 1 ? 's' : ''}`
          : 'Selecionar Mídia'
        }
      </Button>

      {/* Modal de opções */}
      <Portal>
        <Modal
          visible={showOptionsModal}
          onDismiss={() => setShowOptionsModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Escolher Mídia
          </Text>
          
          <List.Section>
            <List.Item
              title="Galeria de Fotos"
              description="Selecionar da biblioteca de mídia"
              left={props => <List.Icon {...props} icon="image-multiple" />}
              onPress={handlePickFromGallery}
            />
            
            {(mediaType === 'image' || mediaType === 'mixed') && (
              <List.Item
                title="Tirar Foto"
                description="Usar câmera para capturar"
                left={props => <List.Icon {...props} icon="camera" />}
                onPress={handleTakePhoto}
              />
            )}
            
            {(mediaType === 'video' || mediaType === 'mixed') && (
              <List.Item
                title="Gravar Vídeo"
                description="Usar câmera para gravar"
                left={props => <List.Icon {...props} icon="video" />}
                onPress={handleRecordVideo}
              />
            )}
          </List.Section>
          
          <Button 
            mode="outlined" 
            onPress={() => setShowOptionsModal(false)}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
        </Modal>
      </Portal>

      {/* Lista de mídias selecionadas */}
      {selectedMedia.length > 0 && (
        <View style={styles.selectedMediaContainer}>
          <View style={styles.selectedHeader}>
            <Text variant="titleMedium">
              Mídias Selecionadas ({selectedMedia.length})
            </Text>
            
            <View style={styles.headerActions}>
              <IconButton
                icon="delete-sweep"
                onPress={clearAll}
                disabled={isUploading}
              />
              
              <Button
                mode="contained"
                icon="cloud-upload"
                onPress={handleUploadAll}
                disabled={isUploading || selectedMedia.every(m => m.uploadStatus === 'completed')}
                loading={isUploading}
                compact
              >
                Upload
              </Button>
            </View>
          </View>

          {selectedMedia.map((media, index) => (
            <Card key={`${media.uri}-${index}`} style={styles.mediaCard}>
              <Card.Content>
                <View style={styles.mediaHeader}>
                  <View style={styles.mediaInfo}>
                    <Text variant="bodyMedium">
                      {getMediaTypeLabel(media.type || 'unknown')} {media.fileName || `Mídia ${index + 1}`}
                    </Text>
                    
                    <Text variant="bodySmall" style={styles.mediaDetails}>
                      {media.width && media.height ? `${media.width}×${media.height} • ` : ''}
                      {media.fileSize ? `${(media.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
                      {media.duration ? ` • ${Math.round(media.duration / 1000)}s` : ''}
                    </Text>
                  </View>

                  <View style={styles.mediaActions}>
                    <View 
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(media.uploadStatus) }
                      ]} 
                    />
                    
                    {media.uploadStatus !== 'uploading' && (
                      <IconButton
                        icon="close"
                        size={16}
                        onPress={() => removeMedia(index)}
                        disabled={isUploading}
                      />
                    )}
                  </View>
                </View>

                {/* Informações de compressão */}
                {getCompressionInfo(media)}

                {/* Progresso de upload */}
                {media.uploadStatus === 'uploading' && (
                  <UploadProgress
                    progress={media.uploadProgress || 0}
                    fileName={media.fileName || `Mídia ${index + 1}`}
                    compact
                  />
                )}

                {/* Erro de upload */}
                {media.uploadStatus === 'error' && media.error && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    ❌ {media.error}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Estado de análise */}
      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <Text variant="bodyMedium">🔍 Analisando qualidade da mídia...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  
  selectButton: {
    marginVertical: 16
  },
  
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12
  },
  
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16
  },
  
  cancelButton: {
    marginTop: 16
  },
  
  selectedMediaContainer: {
    marginTop: 16
  },
  
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  mediaCard: {
    marginBottom: 8
  },
  
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  
  mediaInfo: {
    flex: 1
  },
  
  mediaDetails: {
    color: '#666',
    marginTop: 4
  },
  
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  
  compressionInfo: {
    flexDirection: 'row',
    marginVertical: 4
  },
  
  qualityChip: {
    marginRight: 4,
    height: 24
  },
  
  compressionChip: {
    backgroundColor: '#E3F2FD',
    height: 24
  },
  
  errorText: {
    color: '#EF5350',
    marginTop: 4
  },
  
  analyzingContainer: {
    padding: 16,
    alignItems: 'center'
  }
});

export default MediaPicker;