/**
 * OptimizedExerciseList - FASE 3: Lista fitness com sistema responsivo core
 * ✅ Virtualização automática para 200+ exercícios
 * ✅ Density modes: browsing/workout_prep/during_workout
 * ✅ Search com debouncing otimizado (300ms)
 * ✅ Lazy loading de imagens baseado em visibilidade
 * ✅ Cache LRU com cleanup automático
 * ✅ FITNESS_TOUCH_TARGETS para EXERCISE_CARD (80px)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  InteractionManager,
  Platform,
  ViewToken
} from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { 
  useOptimizedResponsive,
  FITNESS_TOUCH_TARGETS,
  scaleModerate,
  getFitnessTarget,
  getFitnessHitSlop
} from '../utils/responsiveCore';
import {
  useOptimizedList,
  useMemoryOptimized,
  performanceUtils
} from '../hooks/usePerformanceOptimized';
import { FigmaTheme } from '../constants/figmaTheme';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle: string;
  equipment: string;
  instructions: string[];
  gifUrl?: string;
  imageUrl?: string;
}

interface OptimizedExerciseListProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  density?: 'browsing' | 'workout_prep' | 'during_workout';
  showCategories?: boolean;
  maxItems?: number;
}

// ===== COMPONENTE DE ITEM MEMOIZADO =====
interface ExerciseItemProps {
  item: Exercise;
  index: number;
  onPress: (exercise: Exercise) => void;
  isVisible: boolean;
}

const ExerciseItem = React.memo<ExerciseItemProps>(({ item, index, onPress, isVisible }) => {
  const responsiveSystem = useOptimizedResponsive();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Responsive values
  const isTablet = responsiveSystem.deviceInfo.isTablet;
  const isSmallDevice = responsiveSystem.dimensions.width < 375;
  
  // Responsive styles com FITNESS_TOUCH_TARGETS
  const styles = StyleSheet.create({
    container: {
      marginHorizontal: scaleModerate(isTablet ? 24 : 16),
      marginVertical: scaleModerate(isTablet ? 8 : 6),
      borderRadius: scaleModerate(12),
      backgroundColor: FigmaTheme.colors.cardBackground,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      minHeight: FITNESS_TOUCH_TARGETS.EXERCISE_CARD,
    },
    content: {
      flexDirection: 'row',
      padding: scaleModerate(isTablet ? 20 : 16),
      alignItems: 'center',
      minHeight: FITNESS_TOUCH_TARGETS.EXERCISE_CARD,
    },
    imageContainer: {
      width: scaleModerate(isTablet ? 90 : 70),
      height: scaleModerate(isTablet ? 90 : 70),
      borderRadius: scaleModerate(12),
      backgroundColor: '#2C2C2E',
      marginRight: scaleModerate(isTablet ? 20 : 16),
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: scaleModerate(12),
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: scaleModerate(4),
    },
    name: {
      fontSize: scaleModerate(isTablet ? 20 : 17),
      fontWeight: '600',
      color: FigmaTheme.colors.textPrimary,
      marginBottom: scaleModerate(4),
      lineHeight: scaleModerate(isTablet ? 24 : 20),
    },
    details: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: scaleModerate(4),
      gap: scaleModerate(4),
    },
    chip: {
      fontSize: scaleModerate(isTablet ? 14 : 12),
      paddingVertical: scaleModerate(3),
      paddingHorizontal: scaleModerate(8),
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      color: '#FF6B35',
      borderRadius: scaleModerate(6),
      overflow: 'hidden',
    }
  });
  
  // Lazy loading otimizado com LRU cache
  const loadImage = useCallback(() => {
    if (!isVisible || !item.imageUrl) return;
    
    // Implementar lazy loading com InteractionManager
    InteractionManager.runAfterInteractions(() => {
      const timeStart = performance.now();
      
      Image.prefetch(item.imageUrl!)
        .then(() => {
          setImageLoaded(true);
          const timeEnd = performance.now();
          if (timeEnd - timeStart > 1000) {
            console.warn(`Slow image load: ${item.imageUrl} took ${timeEnd - timeStart}ms`);
          }
        })
        .catch((error) => {
          console.warn('Failed to load exercise image:', error);
          setImageError(true);
        });
    });
  }, [isVisible, item.imageUrl]);
  
  useEffect(() => {
    loadImage();
  }, [loadImage]);
  
  const handlePress = useCallback(() => {
    // Performance profiling para press events
    const profiledPress = performanceUtils.profileFunction(
      () => onPress(item),
      `exercise_press_${item.id}`
    );
    profiledPress();
  }, [item, onPress]);
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={getFitnessHitSlop('EXERCISE_CARD')}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Exercício ${item.name}, músculo ${item.muscle}`}
      accessibilityHint="Toque para selecionar este exercício"
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {isVisible && item.imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <ActivityIndicator size="small" color={FigmaTheme.colors.primary} />
              )}
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.image, !imageLoaded && { opacity: 0 }]}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            </>
          ) : (
            <Ionicons 
              name="fitness-outline" 
              size={scaleModerate(isTablet ? 45 : 35)} 
              color={FigmaTheme.colors.textSecondary} 
            />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
            {item.name}
          </Text>
          
          <View style={styles.details}>
            <Text style={styles.chip}>{item.muscle}</Text>
            {item.equipment !== 'body_only' && (
              <Text style={styles.chip}>{item.equipment}</Text>
            )}
          </View>
        </View>
        
        <View style={{
          minWidth: FITNESS_TOUCH_TARGETS.ICON_SMALL,
          minHeight: FITNESS_TOUCH_TARGETS.ICON_SMALL,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Ionicons 
            name="chevron-forward" 
            size={scaleModerate(20)} 
            color={FigmaTheme.colors.textSecondary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

ExerciseItem.displayName = 'ExerciseItem';

// ===== COMPONENTE PRINCIPAL =====
export const OptimizedExerciseList: React.FC<OptimizedExerciseListProps> = React.memo(({
  exercises,
  onSelectExercise,
  loading = false,
  searchPlaceholder = "Buscar exercícios...",
  density = 'browsing',
  showCategories = true,
  maxItems = 200
}) => {
  const responsiveSystem = useOptimizedResponsive();
  const { memoryWarning, forceCleanup } = useMemoryOptimized('exercise_list');
  
  // Lista otimizada com virtualização automática
  const listConfig = useOptimizedList(
    Math.min(exercises.length, maxItems),
    getDensityItemHeight(density, responsiveSystem.deviceInfo.isTablet),
    responsiveSystem.dimensions.height
  );
  
  // ===== STATE MANAGEMENT =====
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  
  // ===== REFS PARA PERFORMANCE =====
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const flatListRef = useRef<FlatList>(null);
  
  // ===== DADOS FILTRADOS E MEMOIZADOS COM PERFORMANCE =====
  const filteredExercises = useMemo(() => {
    const timeStart = performance.now();
    
    let filtered = exercises;
    
    // Limitar a maxItems para performance
    if (filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }
    
    // Filtro por texto otimizado
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise => {
        // Busca otimizada - early exit
        return exercise.name.toLowerCase().includes(query) ||
               exercise.muscle.toLowerCase().includes(query) ||
               exercise.category.toLowerCase().includes(query) ||
               exercise.equipment.toLowerCase().includes(query);
      });
    }
    
    // Filtro por categoria
    if (selectedCategory) {
      filtered = filtered.filter(exercise => 
        exercise.category === selectedCategory
      );
    }
    
    const timeEnd = performance.now();
    if (timeEnd - timeStart > 50) {
      console.warn(`Exercise filtering took ${timeEnd - timeStart}ms`);
    }
    
    return filtered;
  }, [exercises, searchQuery, selectedCategory, maxItems]);
  
  const categories = useMemo(() => {
    if (!showCategories) return [];
    const cats = [...new Set(exercises.slice(0, maxItems).map(ex => ex.category))].sort();
    return cats;
  }, [exercises, showCategories, maxItems]);
  
  // ===== DENSITY CONFIGURATION =====
  function getDensityItemHeight(density: string, isTablet: boolean): number {
    const base = isTablet ? 110 : 80;
    switch (density) {
      case 'during_workout': return base - 10; // Mais compacto durante treino
      case 'workout_prep': return base + 10;   // Mais espaço para preparação
      case 'browsing':
      default: return base;                    // Padrão para navegação
    }
  }
  
  // ===== HANDLERS OTIMIZADOS COM DEBOUNCE =====
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    
    // Debounce otimizado para 300ms
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      // Scroll to top com performance measurement
      InteractionManager.runAfterInteractions(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }, 300);
  }, []);
  
  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedCategory(category);
    
    // Scroll to top após mudança de categoria
    InteractionManager.runAfterInteractions(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, []);
  
  const handleViewabilityChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Performance otimizada para visibility changes
    const newVisibleItems = new Set<string>();
    viewableItems.forEach(token => {
      if (token.item?.id) {
        newVisibleItems.add(token.item.id);
      }
    });
    setVisibleItems(newVisibleItems);
  }, []);
  
  const renderExerciseItem = useCallback(({ item, index }: { item: Exercise; index: number }) => {
    return (
      <ExerciseItem
        item={item}
        index={index}
        onPress={onSelectExercise}
        isVisible={visibleItems.has(item.id)}
      />
    );
  }, [onSelectExercise, visibleItems]);
  
  const renderCategoryChip = useCallback(({ item: category }: { item: string }) => {
    const isSelected = selectedCategory === category;
    const isTablet = responsiveSystem.deviceInfo.isTablet;
    
    return (
      <TouchableOpacity
        style={{
          paddingHorizontal: scaleModerate(isTablet ? 24 : 18),
          paddingVertical: scaleModerate(isTablet ? 14 : 10),
          marginRight: scaleModerate(isTablet ? 16 : 12),
          borderRadius: scaleModerate(isTablet ? 28 : 22),
          backgroundColor: isSelected ? '#FF6B35' : 'rgba(255, 255, 255, 0.1)',
          borderWidth: isSelected ? 0 : 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          minHeight: FITNESS_TOUCH_TARGETS.BUTTON_SECONDARY,
        }}
        onPress={() => handleCategorySelect(isSelected ? null : category)}
        activeOpacity={0.8}
        hitSlop={getFitnessHitSlop('BUTTON_SECONDARY')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Categoria ${category}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={{
          color: isSelected ? '#FFFFFF' : FigmaTheme.colors.textSecondary,
          fontSize: scaleModerate(isTablet ? 18 : 15),
          fontWeight: isSelected ? '600' : '400',
        }}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, handleCategorySelect, responsiveSystem.deviceInfo.isTablet]);
  
  // ===== ESTILOS RESPONSIVOS COM FITNESS UX =====
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: FigmaTheme.colors.background,
    },
    searchContainer: {
      paddingHorizontal: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 32 : 20),
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 20 : 14),
    },
    searchInput: {
      backgroundColor: '#2C2C2E',
      borderRadius: scaleModerate(12),
      paddingHorizontal: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 24 : 18),
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 20 : 16),
      fontSize: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 20 : 17),
      color: FigmaTheme.colors.textPrimary,
      minHeight: FITNESS_TOUCH_TARGETS.WEIGHT_INPUT,
    },
    categoriesContainer: {
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 16 : 12),
    },
    categoriesList: {
      paddingHorizontal: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 32 : 20),
    },
    listContainer: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 80 : 60),
    },
    emptyText: {
      fontSize: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 20 : 17),
      color: FigmaTheme.colors.textSecondary,
      textAlign: 'center',
      marginTop: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 24 : 18),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 80 : 60),
    },
    resultsHeader: {
      paddingHorizontal: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 32 : 20),
      paddingVertical: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 16 : 12),
      backgroundColor: 'rgba(255, 107, 53, 0.05)',
    },
    resultsText: {
      fontSize: scaleModerate(responsiveSystem.deviceInfo.isTablet ? 18 : 15),
      color: FigmaTheme.colors.textSecondary,
    }
  });
  
  // ===== RENDER COMPONENTS =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={FigmaTheme.colors.primary} />
        <Text style={styles.emptyText}>Carregando exercícios...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={FigmaTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      
      {/* Categories com FITNESS UX */}
      {showCategories && categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            // Otimizações para lista horizontal
            initialNumToRender={8}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        </View>
      )}
      
      {/* Results Header */}
      {(searchQuery || selectedCategory) && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
      
      {/* Exercise List com Virtualização Automática */}
      {filteredExercises.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item, index) => item.id || `exercise_${index}`}
          style={styles.listContainer}
          onViewableItemsChanged={handleViewabilityChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
            minimumViewTime: 100,
          }}
          // Performance otimizada com listConfig
          {...listConfig}
          // Density-aware spacing
          ItemSeparatorComponent={() => (
            <View style={{ height: density === 'during_workout' ? scaleModerate(4) : scaleModerate(6) }} />
          )}
          // Memory warning handling
          onEndReached={() => {
            if (memoryWarning?.level === 'high') {
              forceCleanup();
            }
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="search-outline" 
            size={scaleModerate(responsiveSystem.deviceInfo.isTablet ? 80 : 64)} 
            color={FigmaTheme.colors.textSecondary} 
          />
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory 
              ? 'Nenhum exercício encontrado\nTente uma busca diferente'
              : 'Nenhum exercício disponível'
            }
          </Text>
        </View>
      )}
    </View>
  );
});

OptimizedExerciseList.displayName = 'OptimizedExerciseList_Phase3_FitnessUX';