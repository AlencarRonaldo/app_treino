/**
 * SyncStatusIndicator - Componente para mostrar status de sincronização
 * Exibe conexão, progress e ações pendentes de forma discreta
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Portal, Card, Button, ProgressBar, Divider } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatus } from '../hooks/useOfflineSync';

interface SyncStatusIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  autoHide?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  position = 'top-right',
  size = 'medium',
  showDetails = true,
  autoHide = false
}) => {
  const {
    isOnline,
    isSyncing,
    hasQueuedActions,
    queuedCount,
    connectionStatus,
    syncProgress
  } = useSyncStatus();

  const [showModal, setShowModal] = useState(false);
  
  // Animated values
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  // Configurações de tamanho
  const sizeConfig = {
    small: { indicator: 20, icon: 12, text: 10 },
    medium: { indicator: 28, icon: 16, text: 12 },
    large: { indicator: 36, icon: 20, text: 14 }
  }[size];

  // Posicionamento
  const positionStyle = getPositionStyle(position);

  // Animações baseadas no status
  React.useEffect(() => {
    if (isSyncing) {
      // Rotação contínua quando sincronizando
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 500 });
    }

    if (hasQueuedActions && !isOnline) {
      // Pulse quando há ações pendentes offline
      pulseValue.value = withRepeat(
        withSpring(1.3, { damping: 8 }),
        -1,
        true
      );
    } else {
      pulseValue.value = withSpring(1, { damping: 12 });
    }

    // Auto-hide quando tudo OK
    if (autoHide && isOnline && !hasQueuedActions && !isSyncing) {
      opacity.value = withTiming(0.3, { duration: 1000 });
    } else {
      opacity.value = withTiming(1, { duration: 500 });
    }
  }, [isSyncing, hasQueuedActions, isOnline, autoHide]);

  // Estilo animado do indicador
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      isOnline ? 1 : 0,
      [0, 1],
      ['#F44336', '#4CAF50']
    );

    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * pulseValue.value },
        { rotate: `${rotation.value}deg` }
      ],
      backgroundColor: isSyncing ? '#FF9800' : backgroundColor
    };
  });

  // Se não deve mostrar quando tudo OK
  if (autoHide && isOnline && !hasQueuedActions && !isSyncing) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.container, positionStyle]}
        onPress={() => showDetails && setShowModal(true)}
        activeOpacity={0.8}
      >
        <Animated.View style={[
          styles.indicator,
          {
            width: sizeConfig.indicator,
            height: sizeConfig.indicator,
            borderRadius: sizeConfig.indicator / 2
          },
          animatedStyle
        ]}>
          <Ionicons
            name={connectionStatus.icon as any}
            size={sizeConfig.icon}
            color="white"
          />
        </Animated.View>

        {(hasQueuedActions || isSyncing) && (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize: sizeConfig.text - 2 }]}>
              {isSyncing ? '⟲' : queuedCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de detalhes */}
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <SyncStatusModal onClose={() => setShowModal(false)} />
        </Modal>
      </Portal>
    </>
  );
};

/**
 * Modal com detalhes completos do status de sincronização
 */
const SyncStatusModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    isOnline,
    isSyncing,
    hasQueuedActions,
    queuedCount,
    connectionStatus,
    syncProgress
  } = useSyncStatus();

  return (
    <Card style={styles.modalCard}>
      <Card.Content>
        <View style={styles.modalHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
            <View>
              <Text style={styles.statusTitle}>{connectionStatus.message}</Text>
              <Text style={styles.statusDescription}>
                {connectionStatus.description}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Divider style={styles.divider} />

        {/* Progress bar quando sincronizando */}
        {isSyncing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Sincronizando...</Text>
            <ProgressBar
              progress={syncProgress / 100}
              color="#FF9800"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round(syncProgress)}%
            </Text>
          </View>
        )}

        {/* Status de ações pendentes */}
        {hasQueuedActions && (
          <View style={styles.queueContainer}>
            <Ionicons name="cloud-upload" size={20} color="#666" />
            <Text style={styles.queueText}>
              {queuedCount} {queuedCount === 1 ? 'ação pendente' : 'ações pendentes'}
            </Text>
          </View>
        )}

        {/* Informações de conexão */}
        <View style={styles.connectionInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="wifi" size={16} color="#666" />
            <Text style={styles.infoText}>
              Status: {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="sync" size={16} color="#666" />
            <Text style={styles.infoText}>
              Sincronização: {isSyncing ? 'Ativa' : 'Inativa'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!isOnline && hasQueuedActions && (
            <Button
              mode="outlined"
              icon="refresh"
              onPress={() => {
                // TODO: Implementar retry manual
                console.log('Retry sync requested');
              }}
              style={styles.actionButton}
            >
              Tentar Novamente
            </Button>
          )}

          {hasQueuedActions && (
            <Button
              mode="text"
              textColor="#F44336"
              onPress={() => {
                // TODO: Implementar clear queue
                console.log('Clear queue requested');
              }}
              style={styles.actionButton}
            >
              Limpar Fila
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

/**
 * Indicador minimalista para barra de status
 */
export const SyncStatusBar: React.FC = () => {
  const { isOnline, isSyncing, hasQueuedActions, queuedCount } = useSyncStatus();

  if (isOnline && !hasQueuedActions && !isSyncing) return null;

  return (
    <View style={styles.statusBar}>
      <View style={styles.statusBarContent}>
        <Ionicons
          name={isSyncing ? 'sync' : isOnline ? 'cloud-done' : 'cloud-offline'}
          size={16}
          color={isOnline ? '#4CAF50' : '#F44336'}
        />
        <Text style={styles.statusBarText}>
          {isSyncing ? 'Sincronizando...' :
           hasQueuedActions ? `${queuedCount} pendentes` :
           isOnline ? 'Sincronizado' : 'Offline'}
        </Text>
      </View>
    </View>
  );
};

/**
 * Badge discreto para tabs de navegação
 */
export const SyncTabBadge: React.FC = () => {
  const { hasQueuedActions, queuedCount } = useSyncStatus();

  if (!hasQueuedActions || queuedCount === 0) return null;

  return (
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>
        {queuedCount > 99 ? '99+' : queuedCount}
      </Text>
    </View>
  );
};

/**
 * Helper para calcular posição do indicador
 */
function getPositionStyle(position: SyncStatusIndicatorProps['position']) {
  const offset = 16;
  
  switch (position) {
    case 'top-left':
      return { position: 'absolute' as const, top: offset, left: offset };
    case 'top-right':
      return { position: 'absolute' as const, top: offset, right: offset };
    case 'bottom-left':
      return { position: 'absolute' as const, bottom: offset, left: offset };
    case 'bottom-right':
      return { position: 'absolute' as const, bottom: offset, right: offset };
    default:
      return { position: 'absolute' as const, top: offset, right: offset };
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Modal
  modal: {
    margin: 20,
  },
  modalCard: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    marginVertical: 16,
  },
  
  // Progress
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Queue info
  queueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  queueText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
  
  // Connection info
  connectionInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  
  // Status Bar
  statusBar: {
    backgroundColor: '#FFF9C4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBarText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  
  // Tab Badge
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SyncStatusIndicator;