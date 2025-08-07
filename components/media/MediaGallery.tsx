import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { Image } from 'expo-image';
import { 
  Text, 
  Card, 
  Chip, 
  IconButton, 
  Menu, 
  Divider,
  Surface,
  Badge,
  ActivityIndicator,
  Searchbar
} from 'react-native-paper';
import { MediaService, MediaItem } from '../../services/MediaService';
import { PhotoService, ProgressPhoto, PhotoOrganization } from '../../services/PhotoService';
import { VideoService, CustomExerciseVideo } from '../../services/VideoService';
import { MediaViewer } from './MediaViewer';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 colunas com margem

export interface MediaGalleryProps {
  userId: string;
  galleryType: 'progress' | 'exercises' | 'mixed';
  
  // Filtros específicos
  progressFilters?: {
    categoria?: 'before' | 'after' | 'progress';
    parteCorpo?: string;
    dataInicio?: string;
    dataFim?: string;
  };
  
  exerciseFilters?: {
    exerciseId?: string;
    tags?: string[];
  };

  // Configurações
  allowSelection?: boolean;
  selectionMode?: 'single' | 'multiple';
  showUploadButton?: boolean;
  showFilters?: boolean;
  itemsPerRow?: number;
  
  // Callbacks
  onSelectionChange?: (selectedItems: any[]) => void;
  onItemPress?: (item: any, index: number) => void;
  onUploadPress?: () => void;
}

interface GalleryItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  title: string;
  subtitle?: string;
  date: string;
  thumbnail?: string;
  duration?: number;
  isSelected?: boolean;
  originalData: ProgressPhoto | CustomExerciseVideo | MediaItem;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  userId,
  galleryType,
  progressFilters,
  exerciseFilters,
  allowSelection = false,
  selectionMode = 'single',
  showUploadButton = true,
  showFilters = true,
  itemsPerRow = 3,
  onSelectionChange,
  onItemPress,
  onUploadPress
}) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showMenus, setShowMenus] = useState<Record<string, boolean>>({});

  // Estatísticas da galeria
  const [stats, setStats] = useState({
    totalItems: 0,
    totalSize: 0,
    imageCount: 0,
    videoCount: 0
  });

  const itemSize = useMemo(() => (SCREEN_WIDTH - 16 * (itemsPerRow + 1)) / itemsPerRow, [itemsPerRow]);

  // Carregar dados iniciais
  useFocusEffect(
    useCallback(() => {
      loadGalleryData();
    }, [galleryType, progressFilters, exerciseFilters, userId])
  );

  // Aplicar filtros e busca
  useEffect(() => {
    applyFiltersAndSearch();
  }, [items, searchQuery, sortBy, sortOrder]);

  const loadGalleryData = async () => {
    setIsLoading(true);
    
    try {
      let galleryItems: GalleryItem[] = [];
      
      if (galleryType === 'progress') {
        const progressPhotos = await PhotoService.listarFotosProgresso(userId, progressFilters);
        
        galleryItems = await Promise.all(progressPhotos.map(async (photo) => {
          const uri = await MediaService.downloadMedia('progress-photos', photo.photoPath);
          
          return {
            id: photo.id,
            uri,
            type: 'image' as const,
            title: `${photo.categoria} - ${photo.partesCorpo.join(', ')}`,
            subtitle: photo.peso ? `${photo.peso}kg` : undefined,
            date: photo.dataFoto,
            thumbnail: photo.thumbnailPath ? await MediaService.downloadMedia('progress-photos', photo.thumbnailPath) : uri,
            isSelected: false,
            originalData: photo
          };
        }));

      } else if (galleryType === 'exercises') {
        const exerciseVideos = await VideoService.listarVideosPersonalizados(userId, exerciseFilters?.exerciseId);
        
        galleryItems = await Promise.all(exerciseVideos.map(async (video) => {
          const uri = await MediaService.downloadMedia('exercise-videos', video.videoPath);
          const thumbnail = video.thumbnailPath 
            ? await MediaService.downloadMedia('exercise-videos', video.thumbnailPath)
            : uri;
          
          return {
            id: video.id,
            uri,
            type: 'video' as const,
            title: video.title,
            subtitle: video.description,
            date: video.uploadedAt.split('T')[0],
            thumbnail,
            duration: video.duration,
            isSelected: false,
            originalData: video
          };
        }));

      } else if (galleryType === 'mixed') {
        // Combinar fotos de progresso e vídeos de exercícios
        const [progressPhotos, exerciseVideos] = await Promise.all([
          PhotoService.listarFotosProgresso(userId),
          VideoService.listarVideosPersonalizados(userId)
        ]);

        // Converter fotos de progresso
        const progressItems = await Promise.all(progressPhotos.map(async (photo) => {
          const uri = await MediaService.downloadMedia('progress-photos', photo.photoPath);
          return {
            id: photo.id,
            uri,
            type: 'image' as const,
            title: `${photo.categoria} - ${photo.partesCorpo.join(', ')}`,
            subtitle: photo.peso ? `${photo.peso}kg` : undefined,
            date: photo.dataFoto,
            thumbnail: photo.thumbnailPath ? await MediaService.downloadMedia('progress-photos', photo.thumbnailPath) : uri,
            isSelected: false,
            originalData: photo
          };
        }));

        // Converter vídeos de exercícios
        const exerciseItems = await Promise.all(exerciseVideos.map(async (video) => {
          const uri = await MediaService.downloadMedia('exercise-videos', video.videoPath);
          const thumbnail = video.thumbnailPath 
            ? await MediaService.downloadMedia('exercise-videos', video.thumbnailPath)
            : uri;
          
          return {
            id: video.id,
            uri,
            type: 'video' as const,
            title: video.title,
            subtitle: video.description,
            date: video.uploadedAt.split('T')[0],
            thumbnail,
            duration: video.duration,
            isSelected: false,
            originalData: video
          };
        }));

        galleryItems = [...progressItems, ...exerciseItems];
      }

      setItems(galleryItems);
      
      // Calcular estatísticas
      const newStats = {
        totalItems: galleryItems.length,
        totalSize: 0, // TODO: Calcular baseado nos dados
        imageCount: galleryItems.filter(item => item.type === 'image').length,
        videoCount: galleryItems.filter(item => item.type === 'video').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erro ao carregar galeria:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...items];

    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query))
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'size':
          // TODO: Implementar ordenação por tamanho quando disponível
          comparison = 0;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredItems(filtered);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGalleryData();
  }, []);

  const handleItemPress = (item: GalleryItem, index: number) => {
    if (allowSelection) {
      toggleItemSelection(item);
    } else {
      // Abrir visualizador
      setViewerIndex(index);
      setShowViewerModal(true);
      onItemPress?.(item.originalData, index);
    }
  };

  const handleItemLongPress = (item: GalleryItem) => {
    if (allowSelection) {
      toggleItemSelection(item);
    }
  };

  const toggleItemSelection = (item: GalleryItem) => {
    if (!allowSelection) return;

    const isCurrentlySelected = selectedItems.find(selected => selected.id === item.id);
    let newSelected: GalleryItem[];

    if (isCurrentlySelected) {
      // Remover seleção
      newSelected = selectedItems.filter(selected => selected.id !== item.id);
    } else {
      // Adicionar seleção
      if (selectionMode === 'single') {
        newSelected = [item];
      } else {
        newSelected = [...selectedItems, item];
      }
    }

    setSelectedItems(newSelected);
    
    // Atualizar estado visual dos itens
    setFilteredItems(prev =>
      prev.map(prevItem => ({
        ...prevItem,
        isSelected: newSelected.find(selected => selected.id === prevItem.id) !== undefined
      }))
    );

    onSelectionChange?.(newSelected.map(item => item.originalData));
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setFilteredItems(prev =>
      prev.map(item => ({ ...item, isSelected: false }))
    );
    onSelectionChange?.([]);
  };

  const toggleMenu = (itemId: string) => {
    setShowMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderGalleryItem = ({ item, index }: { item: GalleryItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.galleryItem,
        { width: itemSize, height: itemSize },
        item.isSelected && styles.selectedItem
      ]}
      onPress={() => handleItemPress(item, index)}
      onLongPress={() => handleItemLongPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail || item.uri }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />

      {/* Overlay de seleção */}
      {item.isSelected && (
        <View style={styles.selectionOverlay}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
      )}

      {/* Badge de tipo para vídeos */}
      {item.type === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play-circle" size={16} color="white" />
          {item.duration && (
            <Text variant="labelSmall" style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          )}
        </View>
      )}

      {/* Data */}
      <View style={styles.dateContainer}>
        <Text variant="labelSmall" style={styles.dateText}>
          {formatDate(item.date)}
        </Text>
      </View>

      {/* Menu de ações */}
      <View style={styles.itemActions}>
        <Menu
          visible={showMenus[item.id] || false}
          onDismiss={() => toggleMenu(item.id)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={16}
              iconColor="white"
              onPress={() => toggleMenu(item.id)}
              style={styles.menuButton}
            />
          }
        >
          <Menu.Item onPress={() => {}} title="Compartilhar" leadingIcon="share" />
          <Menu.Item onPress={() => {}} title="Editar" leadingIcon="pencil" />
          <Divider />
          <Menu.Item onPress={() => {}} title="Excluir" leadingIcon="delete" />
        </Menu>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={galleryType === 'progress' ? 'camera-outline' : 'videocam-outline'} 
        size={64} 
        color="#ccc" 
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        Nenhuma mídia encontrada
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        {galleryType === 'progress' 
          ? 'Adicione suas primeiras fotos de progresso'
          : 'Crie seus primeiros vídeos de exercícios'
        }
      </Text>
      
      {showUploadButton && (
        <Button
          mode="contained"
          icon="plus"
          onPress={onUploadPress}
          style={styles.emptyButton}
        >
          Adicionar Mídia
        </Button>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Estatísticas */}
      <Surface style={styles.statsContainer} elevation={1}>
        <View style={styles.statItem}>
          <Text variant="headlineSmall">{stats.totalItems}</Text>
          <Text variant="bodySmall">Total</Text>
        </View>
        
        {stats.imageCount > 0 && (
          <View style={styles.statItem}>
            <Text variant="headlineSmall">{stats.imageCount}</Text>
            <Text variant="bodySmall">Fotos</Text>
          </View>
        )}
        
        {stats.videoCount > 0 && (
          <View style={styles.statItem}>
            <Text variant="headlineSmall">{stats.videoCount}</Text>
            <Text variant="bodySmall">Vídeos</Text>
          </View>
        )}
      </Surface>

      {/* Barra de busca */}
      {showFilters && (
        <Searchbar
          placeholder="Buscar mídia..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      )}

      {/* Controles de ordenação */}
      <View style={styles.controlsContainer}>
        <View style={styles.sortControls}>
          <Chip
            selected={sortBy === 'date'}
            onPress={() => setSortBy('date')}
            style={styles.sortChip}
          >
            Data
          </Chip>
          
          <Chip
            selected={sortBy === 'name'}
            onPress={() => setSortBy('name')}
            style={styles.sortChip}
          >
            Nome
          </Chip>
          
          <IconButton
            icon={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
            onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          />
        </View>

        {allowSelection && selectedItems.length > 0 && (
          <View style={styles.selectionControls}>
            <Text variant="bodyMedium">
              {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
            </Text>
            
            <Button mode="outlined" onPress={clearSelection} compact>
              Limpar
            </Button>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        numColumns={itemsPerRow}
        contentContainerStyle={styles.gallery}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading inicial */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Carregando galeria...
          </Text>
        </View>
      )}

      {/* Media Viewer */}
      <MediaViewer
        visible={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        mediaList={filteredItems.map(item => ({
          id: item.id,
          uri: item.uri,
          type: item.type,
          title: item.title,
          description: item.subtitle
        }))}
        initialIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        allowZoom
        allowShare
        allowDelete
        showInfo
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },

  header: {
    padding: 16,
    paddingBottom: 8
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12
  },

  statItem: {
    alignItems: 'center'
  },

  searchBar: {
    marginBottom: 12
  },

  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  sortControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  sortChip: {
    marginRight: 8
  },

  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  gallery: {
    paddingHorizontal: 8
  },

  galleryItem: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },

  selectedItem: {
    borderWidth: 3,
    borderColor: '#4CAF50'
  },

  itemImage: {
    width: '100%',
    height: '100%'
  },

  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 2
  },

  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },

  durationText: {
    color: 'white',
    marginLeft: 4
  },

  dateContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },

  dateText: {
    color: 'white'
  },

  itemActions: {
    position: 'absolute',
    top: 4,
    right: 4
  },

  menuButton: {
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32
  },

  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },

  emptyDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24
  },

  emptyButton: {
    marginTop: 16
  },

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)'
  },

  loadingText: {
    marginTop: 16,
    color: '#666'
  }
});

export default MediaGallery;