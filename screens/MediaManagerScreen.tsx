import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Alert,
  Dimensions 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  IconButton, 
  Surface, 
  Portal, 
  Modal,
  List,
  Chip,
  ProgressBar,
  Divider,
  Menu,
  Searchbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MediaService } from '../services/MediaService';
import { PhotoService } from '../services/PhotoService';
import { VideoService } from '../services/VideoService';
import { ChatAttachmentService } from '../services/ChatAttachmentService';
import { useMediaCache } from '../hooks/useMediaCache';
import { CacheService } from '../services/CacheService';
import { MediaGallery } from '../components/media/MediaGallery';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MediaStats {
  progressPhotos: {
    total: number;
    totalSize: number;
    byCategory: Record<string, number>;
  };
  exerciseVideos: {
    total: number;
    totalSize: number;
    totalDuration: number;
  };
  chatAttachments: {
    total: number;
    totalSize: number;
    byType: Record<string, number>;
  };
  totalStorageUsed: number;
  cacheStats: {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    expiredItems: number;
  };
}

interface CleanupProgress {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  itemsRemoved: number;
  spaceSaved: number;
}

export const MediaManagerScreen: React.FC = () => {
  const [stats, setStats] = useState<MediaStats>({
    progressPhotos: { total: 0, totalSize: 0, byCategory: {} },
    exerciseVideos: { total: 0, totalSize: 0, totalDuration: 0 },
    chatAttachments: { total: 0, totalSize: 0, byType: {} },
    totalStorageUsed: 0,
    cacheStats: { totalItems: 0, totalSize: 0, hitRate: 0, expiredItems: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'gallery' | 'cache' | 'cleanup'>('overview');
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState<CleanupProgress>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    itemsRemoved: 0,
    spaceSaved: 0
  });

  // Gallery filters
  const [galleryType, setGalleryType] = useState<'progress' | 'exercises' | 'mixed'>('mixed');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu states
  const [showGalleryMenu, setShowGalleryMenu] = useState(false);
  const [showCleanupMenu, setShowCleanupMenu] = useState(false);

  // Cache hook
  const { cacheStats, clearCache, optimizeCache, isCleaningUp } = useMediaCache();

  // Usuário atual (mock)
  const currentUserId = 'user123'; // TODO: Obter do contexto de auth

  // Carregar dados iniciais
  useFocusEffect(
    useCallback(() => {
      loadMediaStats();
    }, [])
  );

  const loadMediaStats = async () => {
    setIsLoading(true);
    
    try {
      const [
        progressStats,
        videoStats,
        // chatStats, // TODO: Implementar quando chat estiver pronto
        cacheStatsData
      ] = await Promise.all([
        PhotoService.obterEstatisticasProgresso(currentUserId),
        VideoService.obterEstatisticasVideos(currentUserId),
        // ChatAttachmentService.getAttachmentStats('default_chat'),
        CacheService.obterEstatisticasCache()
      ]);

      const newStats: MediaStats = {
        progressPhotos: {
          total: progressStats.totalFotos,
          totalSize: progressStats.tamanhoTotalMB * 1024 * 1024,
          byCategory: progressStats.fotosPorCategoria
        },
        exerciseVideos: {
          total: videoStats.totalVideos,
          totalSize: videoStats.tamanhoTotal,
          totalDuration: videoStats.duracaoTotal
        },
        chatAttachments: {
          total: 0, // chatStats.totalAttachments,
          totalSize: 0, // chatStats.totalSize,
          byType: {} // chatStats.byType
        },
        totalStorageUsed: (progressStats.tamanhoTotalMB * 1024 * 1024) + videoStats.tamanhoTotal,
        cacheStats: {
          totalItems: cacheStatsData.totalItens,
          totalSize: cacheStatsData.tamanhoTotal,
          hitRate: 85, // Mock - implementar cálculo real
          expiredItems: cacheStatsData.itensExpirados
        }
      };

      setStats(newStats);

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas de mídia:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMediaStats();
  }, []);

  const runCleanup = async (type: 'cache' | 'expired' | 'all') => {
    setCleanupProgress({
      isRunning: true,
      progress: 0,
      currentStep: 'Iniciando limpeza...',
      itemsRemoved: 0,
      spaceSaved: 0
    });

    try {
      let totalRemoved = 0;
      let totalSpaceSaved = 0;

      if (type === 'cache' || type === 'all') {
        // Limpeza de cache
        setCleanupProgress(prev => ({
          ...prev,
          progress: 20,
          currentStep: 'Limpando cache de mídia...'
        }));

        const cacheRemoved = await clearCache();
        totalRemoved += cacheRemoved;
      }

      if (type === 'expired' || type === 'all') {
        // Limpeza de itens expirados
        setCleanupProgress(prev => ({
          ...prev,
          progress: 50,
          currentStep: 'Removendo itens expirados...'
        }));

        const cacheCleanup = await CacheService.limparCacheExpirado();
        totalRemoved += cacheCleanup.itensRemovidos;
        totalSpaceSaved += cacheCleanup.espacoLiberado;
      }

      if (type === 'all') {
        // Otimização geral
        setCleanupProgress(prev => ({
          ...prev,
          progress: 80,
          currentStep: 'Otimizando storage...'
        }));

        await optimizeCache();
      }

      // Finalizar
      setCleanupProgress(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Limpeza concluída!',
        itemsRemoved: totalRemoved,
        spaceSaved: totalSpaceSaved
      }));

      // Recarregar estatísticas
      await loadMediaStats();

      // Mostrar resultado
      setTimeout(() => {
        Alert.alert(
          'Limpeza Concluída',
          `${totalRemoved} itens removidos\n${formatFileSize(totalSpaceSaved)} liberados`,
          [{ text: 'OK', onPress: () => setShowCleanupModal(false) }]
        );
      }, 1000);

    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      Alert.alert('Erro', 'Falha na limpeza de arquivos');
    } finally {
      setTimeout(() => {
        setCleanupProgress(prev => ({ ...prev, isRunning: false }));
      }, 2000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStorageUsagePercent = (): number => {
    const maxStorage = 1024 * 1024 * 1024; // 1GB simulado
    return (stats.totalStorageUsed / maxStorage) * 100;
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      {/* Storage Usage */}
      <Card style={styles.card}>
        <Card.Title
          title="Uso de Armazenamento"
          subtitle={`${formatFileSize(stats.totalStorageUsed)} utilizados`}
          left={(props) => <Ionicons {...props} name="server-outline" size={24} />}
        />
        <Card.Content>
          <ProgressBar 
            progress={getStorageUsagePercent() / 100}
            color={getStorageUsagePercent() > 80 ? '#F44336' : '#4CAF50'}
            style={styles.storageBar}
          />
          <Text variant="bodySmall" style={styles.storageText}>
            {Math.round(getStorageUsagePercent())}% utilizado
          </Text>
        </Card.Content>
      </Card>

      {/* Progress Photos */}
      <Card style={styles.card}>
        <Card.Title
          title="Fotos de Progresso"
          subtitle={`${stats.progressPhotos.total} fotos • ${formatFileSize(stats.progressPhotos.totalSize)}`}
          left={(props) => <Ionicons {...props} name="camera-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.categoryContainer}>
            {Object.entries(stats.progressPhotos.byCategory).map(([category, count]) => (
              <Chip key={category} style={styles.categoryChip}>
                {category}: {count}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Exercise Videos */}
      <Card style={styles.card}>
        <Card.Title
          title="Vídeos de Exercícios"
          subtitle={`${stats.exerciseVideos.total} vídeos • ${formatFileSize(stats.exerciseVideos.totalSize)}`}
          left={(props) => <Ionicons {...props} name="videocam-outline" size={24} />}
        />
        <Card.Content>
          <Text variant="bodyMedium">
            Duração total: {formatDuration(stats.exerciseVideos.totalDuration)}
          </Text>
        </Card.Content>
      </Card>

      {/* Chat Attachments */}
      <Card style={styles.card}>
        <Card.Title
          title="Anexos do Chat"
          subtitle={`${stats.chatAttachments.total} arquivos • ${formatFileSize(stats.chatAttachments.totalSize)}`}
          left={(props) => <Ionicons {...props} name="attach-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.categoryContainer}>
            {Object.entries(stats.chatAttachments.byType).map(([type, data]) => (
              <Chip key={type} style={styles.categoryChip}>
                {type}: {typeof data === 'object' ? data.count : data}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Cache Stats */}
      <Card style={styles.card}>
        <Card.Title
          title="Cache de Mídia"
          subtitle={`${stats.cacheStats.totalItems} itens • ${formatFileSize(stats.cacheStats.totalSize)}`}
          left={(props) => <Ionicons {...props} name="layers-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Taxa de acerto: {stats.cacheStats.hitRate}%</Text>
            {stats.cacheStats.expiredItems > 0 && (
              <Chip icon="alert-circle" style={styles.warningChip}>
                {stats.cacheStats.expiredItems} expirados
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderGalleryTab = () => (
    <View style={styles.tabContent}>
      {/* Gallery Controls */}
      <Surface style={styles.galleryControls} elevation={1}>
        <Searchbar
          placeholder="Buscar mídia..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.galleryTypeContainer}>
          <Menu
            visible={showGalleryMenu}
            onDismiss={() => setShowGalleryMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowGalleryMenu(true)}
                icon="filter"
                compact
              >
                {galleryType === 'progress' ? 'Progresso' : 
                 galleryType === 'exercises' ? 'Exercícios' : 'Todas'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setGalleryType('mixed'); setShowGalleryMenu(false); }} title="Todas as Mídias" />
            <Menu.Item onPress={() => { setGalleryType('progress'); setShowGalleryMenu(false); }} title="Fotos de Progresso" />
            <Menu.Item onPress={() => { setGalleryType('exercises'); setShowGalleryMenu(false); }} title="Vídeos de Exercícios" />
          </Menu>
        </View>
      </Surface>

      {/* Gallery */}
      <MediaGallery
        userId={currentUserId}
        galleryType={galleryType}
        showUploadButton={false}
        showFilters={false}
        itemsPerRow={3}
      />
    </View>
  );

  const renderCacheTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Cache Overview */}
      <Card style={styles.card}>
        <Card.Title
          title="Estatísticas do Cache"
          left={(props) => <Ionicons {...props} name="analytics-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.cacheStatGrid}>
            <View style={styles.cacheStatItem}>
              <Text variant="headlineSmall">{stats.cacheStats.totalItems}</Text>
              <Text variant="bodySmall">Itens Armazenados</Text>
            </View>
            
            <View style={styles.cacheStatItem}>
              <Text variant="headlineSmall">{formatFileSize(stats.cacheStats.totalSize)}</Text>
              <Text variant="bodySmall">Espaço Utilizado</Text>
            </View>
            
            <View style={styles.cacheStatItem}>
              <Text variant="headlineSmall">{stats.cacheStats.hitRate}%</Text>
              <Text variant="bodySmall">Taxa de Acerto</Text>
            </View>
            
            <View style={styles.cacheStatItem}>
              <Text variant="headlineSmall">{stats.cacheStats.expiredItems}</Text>
              <Text variant="bodySmall">Itens Expirados</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Cache Actions */}
      <Card style={styles.card}>
        <Card.Title title="Gerenciar Cache" />
        <Card.Content>
          <List.Item
            title="Otimizar Cache"
            description="Remove itens menos utilizados para liberar espaço"
            left={(props) => <List.Icon {...props} icon="tune" />}
            right={(props) => (
              <Button
                mode="outlined"
                onPress={() => optimizeCache()}
                loading={isCleaningUp}
                disabled={isCleaningUp}
                compact
              >
                Otimizar
              </Button>
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Limpar Cache Expirado"
            description="Remove apenas itens que já expiraram"
            left={(props) => <List.Icon {...props} icon="delete-clock" />}
            right={(props) => (
              <Button
                mode="outlined"
                onPress={() => runCleanup('expired')}
                disabled={cleanupProgress.isRunning}
                compact
              >
                Limpar
              </Button>
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Limpar Todo Cache"
            description="Remove todos os arquivos em cache"
            left={(props) => <List.Icon {...props} icon="delete-sweep" />}
            right={(props) => (
              <Button
                mode="outlined"
                onPress={() => runCleanup('cache')}
                disabled={cleanupProgress.isRunning}
                compact
              >
                Limpar Tudo
              </Button>
            )}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCleanupTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Storage Cleanup */}
      <Card style={styles.card}>
        <Card.Title
          title="Limpeza de Armazenamento"
          subtitle="Libere espaço removendo arquivos desnecessários"
          left={(props) => <Ionicons {...props} name="trash-outline" size={24} />}
        />
        <Card.Content>
          <Button
            mode="contained"
            icon="broom"
            onPress={() => setShowCleanupModal(true)}
            style={styles.cleanupButton}
            disabled={cleanupProgress.isRunning}
          >
            Iniciar Limpeza Completa
          </Button>
          
          <Text variant="bodySmall" style={styles.cleanupDescription}>
            Remove arquivos em cache expirados, otimiza o armazenamento e libera espaço desnecessário.
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title title="Ações Rápidas" />
        <Card.Content>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="image-remove"
              onPress={() => runCleanup('cache')}
              style={styles.quickAction}
              compact
            >
              Cache de Imagens
            </Button>
            
            <Button
              mode="outlined"
              icon="video-off"
              onPress={() => runCleanup('cache')}
              style={styles.quickAction}
              compact
            >
              Cache de Vídeos
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Storage Tips */}
      <Card style={styles.card}>
        <Card.Title title="Dicas de Armazenamento" />
        <Card.Content>
          <List.Item
            title="Use compressão automática"
            description="Ative para reduzir o tamanho dos arquivos automaticamente"
            left={(props) => <List.Icon {...props} icon="compress" />}
          />
          
          <List.Item
            title="Limite de cache"
            description="Configure um limite máximo para o cache de mídia"
            left={(props) => <List.Icon {...props} icon="database" />}
          />
          
          <List.Item
            title="Backup na nuvem"
            description="Mantenha backups seguros e libere espaço local"
            left={(props) => <List.Icon {...props} icon="cloud-upload" />}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCleanupModal = () => (
    <Portal>
      <Modal
        visible={showCleanupModal}
        onDismiss={() => !cleanupProgress.isRunning && setShowCleanupModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text variant="headlineSmall" style={styles.modalTitle}>
          Limpeza de Armazenamento
        </Text>
        
        {!cleanupProgress.isRunning ? (
          <View>
            <Text variant="bodyMedium" style={styles.modalDescription}>
              Escolha o tipo de limpeza que deseja realizar:
            </Text>
            
            <List.Section>
              <List.Item
                title="Limpeza Rápida"
                description="Remove apenas arquivos expirados"
                left={(props) => <List.Icon {...props} icon="timer" />}
                onPress={() => runCleanup('expired')}
              />
              
              <List.Item
                title="Limpeza de Cache"
                description="Remove todo o cache de mídia"
                left={(props) => <List.Icon {...props} icon="cached" />}
                onPress={() => runCleanup('cache')}
              />
              
              <List.Item
                title="Limpeza Completa"
                description="Otimização completa do armazenamento"
                left={(props) => <List.Icon {...props} icon="delete-sweep" />}
                onPress={() => runCleanup('all')}
              />
            </List.Section>
            
            <Button
              mode="outlined"
              onPress={() => setShowCleanupModal(false)}
              style={styles.modalCancelButton}
            >
              Cancelar
            </Button>
          </View>
        ) : (
          <View>
            <Text variant="bodyMedium" style={styles.modalDescription}>
              {cleanupProgress.currentStep}
            </Text>
            
            <ProgressBar 
              progress={cleanupProgress.progress / 100}
              style={styles.cleanupProgressBar}
            />
            
            <Text variant="bodySmall" style={styles.progressText}>
              {Math.round(cleanupProgress.progress)}%
            </Text>
            
            {cleanupProgress.itemsRemoved > 0 && (
              <Text variant="bodySmall" style={styles.cleanupStats}>
                {cleanupProgress.itemsRemoved} itens removidos • {formatFileSize(cleanupProgress.spaceSaved)} liberados
              </Text>
            )}
          </View>
        )}
      </Modal>
    </Portal>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverviewTab();
      case 'gallery': return renderGalleryTab();
      case 'cache': return renderCacheTab();
      case 'cleanup': return renderCleanupTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Gerenciador de Mídia
        </Text>
      </Surface>

      {/* Tab Navigation */}
      <Surface style={styles.tabBar} elevation={1}>
        <Button
          mode={selectedTab === 'overview' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('overview')}
          style={styles.tabButton}
          compact
        >
          Visão Geral
        </Button>
        
        <Button
          mode={selectedTab === 'gallery' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('gallery')}
          style={styles.tabButton}
          compact
        >
          Galeria
        </Button>
        
        <Button
          mode={selectedTab === 'cache' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('cache')}
          style={styles.tabButton}
          compact
        >
          Cache
        </Button>
        
        <Button
          mode={selectedTab === 'cleanup' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('cleanup')}
          style={styles.tabButton}
          compact
        >
          Limpeza
        </Button>
      </Surface>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Cleanup Modal */}
      {renderCleanupModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },

  header: {
    padding: 16,
    backgroundColor: 'white'
  },

  headerTitle: {
    fontWeight: 'bold'
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white'
  },

  tabButton: {
    flex: 1,
    marginHorizontal: 4
  },

  content: {
    flex: 1
  },

  tabContent: {
    flex: 1,
    padding: 16
  },

  card: {
    marginBottom: 16,
    backgroundColor: 'white'
  },

  storageBar: {
    height: 6,
    marginVertical: 8
  },

  storageText: {
    textAlign: 'center',
    color: '#666'
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  categoryChip: {
    marginRight: 8,
    marginBottom: 4
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  warningChip: {
    backgroundColor: '#FFF3E0'
  },

  galleryControls: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'white'
  },

  searchBar: {
    marginBottom: 12
  },

  galleryTypeContainer: {
    alignItems: 'flex-end'
  },

  cacheStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  cacheStatItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center'
  },

  divider: {
    marginVertical: 8
  },

  cleanupButton: {
    marginBottom: 12
  },

  cleanupDescription: {
    color: '#666',
    textAlign: 'center'
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },

  quickAction: {
    flex: 1,
    marginHorizontal: 4
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12
  },

  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold'
  },

  modalDescription: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666'
  },

  modalCancelButton: {
    marginTop: 16
  },

  cleanupProgressBar: {
    height: 6,
    marginVertical: 16
  },

  progressText: {
    textAlign: 'center',
    color: '#666'
  },

  cleanupStats: {
    textAlign: 'center',
    marginTop: 8,
    color: '#4CAF50'
  }
});

export default MediaManagerScreen;