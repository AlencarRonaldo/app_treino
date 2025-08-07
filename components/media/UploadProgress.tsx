import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, ProgressBar, Card, IconButton, Chip } from 'react-native-paper';
import { UploadProgress as UploadProgressType } from '../../services/MediaService';
import { Ionicons } from '@expo/vector-icons';

interface UploadProgressProps {
  progress: number; // 0-100
  fileName?: string;
  status?: 'uploading' | 'processing' | 'completed' | 'error' | 'paused';
  error?: string;
  bytesTransferred?: number;
  totalBytes?: number;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number; // bytes per second
  compact?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName = 'Arquivo',
  status = 'uploading',
  error,
  bytesTransferred = 0,
  totalBytes = 0,
  estimatedTimeRemaining,
  uploadSpeed = 0,
  compact = false,
  onCancel,
  onRetry,
  showDetails = true
}) => {
  const [animatedProgress] = useState(new Animated.Value(0));
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Atualizar progresso animado
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [progress]);

  // Calcular tempo decorrido
  useEffect(() => {
    if (status === 'uploading' || status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, startTime]);

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading': return 'cloud-upload-outline';
      case 'processing': return 'cog-outline';
      case 'completed': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'paused': return 'pause-circle';
      default: return 'cloud-upload-outline';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading': return '#2196F3';
      case 'processing': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'error': return '#F44336';
      case 'paused': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Enviando...';
      case 'processing': return 'Processando...';
      case 'completed': return 'Concluído!';
      case 'error': return 'Erro no upload';
      case 'paused': return 'Pausado';
      default: return 'Preparando...';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculateUploadSpeed = (): string => {
    if (elapsedTime === 0 || bytesTransferred === 0) return '0 KB/s';
    
    const speedBytesPerSecond = (bytesTransferred / elapsedTime) * 1000;
    return `${formatBytes(speedBytesPerSecond)}/s`;
  };

  const calculateETA = (): string => {
    if (status === 'completed') return '';
    if (elapsedTime === 0 || bytesTransferred === 0 || totalBytes === 0) return '';
    
    const speedBytesPerSecond = (bytesTransferred / elapsedTime) * 1000;
    const remainingBytes = totalBytes - bytesTransferred;
    const etaSeconds = remainingBytes / speedBytesPerSecond;
    
    return formatTime(etaSeconds * 1000);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={16} 
            color={getStatusColor()} 
            style={styles.compactIcon}
          />
          
          <Text variant="bodySmall" style={styles.compactText}>
            {fileName} • {Math.round(progress)}%
          </Text>
          
          {status === 'uploading' && onCancel && (
            <IconButton
              icon="close"
              size={16}
              onPress={onCancel}
              style={styles.compactCancel}
            />
          )}
        </View>
        
        <ProgressBar
          progress={progress / 100}
          color={getStatusColor()}
          style={styles.compactProgressBar}
        />
      </View>
    );
  }

  return (
    <Card style={styles.container} elevation={2}>
      <Card.Content>
        {/* Header com nome e status */}
        <View style={styles.header}>
          <View style={styles.fileInfo}>
            <Ionicons 
              name={getStatusIcon() as any} 
              size={24} 
              color={getStatusColor()} 
              style={styles.statusIcon}
            />
            
            <View style={styles.fileDetails}>
              <Text variant="titleSmall" numberOfLines={1}>
                {fileName}
              </Text>
              
              <Text variant="bodySmall" style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {status === 'uploading' && onCancel && (
              <IconButton
                icon="close"
                size={20}
                onPress={onCancel}
                iconColor="#666"
              />
            )}
            
            {status === 'error' && onRetry && (
              <IconButton
                icon="refresh"
                size={20}
                onPress={onRetry}
                iconColor="#2196F3"
              />
            )}
          </View>
        </View>

        {/* Barra de progresso */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress / 100}
            color={getStatusColor()}
            style={styles.progressBar}
          />
          
          <Text variant="bodySmall" style={styles.progressText}>
            {Math.round(progress)}%
          </Text>
        </View>

        {/* Detalhes do upload */}
        {showDetails && (status === 'uploading' || status === 'processing') && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              {/* Tamanhos */}
              {totalBytes > 0 && (
                <Chip icon="database" compact style={styles.detailChip}>
                  {formatBytes(bytesTransferred)} / {formatBytes(totalBytes)}
                </Chip>
              )}
              
              {/* Velocidade */}
              {status === 'uploading' && elapsedTime > 2000 && (
                <Chip icon="speedometer" compact style={styles.detailChip}>
                  {calculateUploadSpeed()}
                </Chip>
              )}
              
              {/* Tempo decorrido */}
              {elapsedTime > 1000 && (
                <Chip icon="clock-outline" compact style={styles.detailChip}>
                  {formatTime(elapsedTime)}
                </Chip>
              )}
            </View>

            {/* ETA */}
            {status === 'uploading' && (
              <View style={styles.detailsRow}>
                {calculateETA() && (
                  <Chip icon="timer-outline" compact style={styles.etaChip}>
                    ETA: {calculateETA()}
                  </Chip>
                )}
              </View>
            )}
          </View>
        )}

        {/* Mensagem de erro */}
        {status === 'error' && error && (
          <View style={styles.errorContainer}>
            <Text variant="bodySmall" style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        {/* Sucesso */}
        {status === 'completed' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text variant="bodySmall" style={styles.successText}>
              Upload concluído com sucesso!
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },

  fileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8
  },

  statusIcon: {
    marginRight: 12,
    marginTop: 2
  },

  fileDetails: {
    flex: 1
  },

  statusText: {
    marginTop: 2
  },

  actions: {
    flexDirection: 'row'
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  progressBar: {
    flex: 1,
    height: 6,
    marginRight: 8
  },

  progressText: {
    minWidth: 40,
    textAlign: 'right',
    color: '#666'
  },

  detailsContainer: {
    marginTop: 8
  },

  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4
  },

  detailChip: {
    marginRight: 6,
    marginBottom: 4,
    backgroundColor: '#F5F5F5'
  },

  etaChip: {
    backgroundColor: '#E3F2FD'
  },

  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginTop: 8
  },

  errorText: {
    color: '#C62828'
  },

  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 4,
    marginTop: 8
  },

  successText: {
    color: '#2E7D2E',
    marginLeft: 6
  },

  // Estilos compactos
  compactContainer: {
    marginVertical: 4
  },

  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },

  compactIcon: {
    marginRight: 6
  },

  compactText: {
    flex: 1,
    color: '#666'
  },

  compactCancel: {
    marginLeft: 4
  },

  compactProgressBar: {
    height: 3
  }
});

export default UploadProgress;