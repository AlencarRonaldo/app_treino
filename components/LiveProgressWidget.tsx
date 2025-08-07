/**
 * LiveProgressWidget - Widget para mostrar progresso em tempo real
 * Usado para tracking de treinos ativos, metas e achievements
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card, ProgressBar, Chip, IconButton } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const AnimatedCard = Animated.createAnimatedComponent(Card);

export interface LiveProgressData {
  id: string;
  type: 'workout' | 'goal' | 'streak' | 'achievement';
  title: string;
  current: number;
  target: number;
  unit: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  startTime?: string;
  endTime?: string;
  studentId?: string;
  trainerId?: string;
  metadata?: Record<string, any>;
  updatedAt: string;
}

interface LiveProgressWidgetProps {
  progressId: string;
  initialData?: LiveProgressData;
  showDetails?: boolean;
  compact?: boolean;
  onProgressUpdate?: (data: LiveProgressData) => void;
  onComplete?: (data: LiveProgressData) => void;
  style?: any;
}

export const LiveProgressWidget: React.FC<LiveProgressWidgetProps> = ({
  progressId,
  initialData,
  showDetails = true,
  compact = false,
  onProgressUpdate,
  onComplete,
  style
}) => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<LiveProgressData | null>(initialData || null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animated values
  const progressValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const pulseValue = useSharedValue(1);
  const completionScale = useSharedValue(0);

  // Setup real-time subscription
  useRealtimeSubscription(`progress_${progressId}`, {
    table: 'live_progress',
    filter: `id=eq.${progressId}`,
    enabled: !!progressId,
    onData: (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const newData = payload.new as LiveProgressData;
        handleProgressUpdate(newData);
      }
    }
  });

  /**
   * Processa updates de progresso em tempo real
   */
  const handleProgressUpdate = React.useCallback((data: LiveProgressData) => {
    const oldProgress = progressData?.current || 0;
    const newProgress = data.current;
    const progressPercent = Math.min((newProgress / data.target) * 100, 100) / 100;

    setProgressData(data);
    
    // Anima progresso
    progressValue.value = withSpring(progressPercent, {
      damping: 15,
      stiffness: 100
    });

    // Anima mudança se houve progresso
    if (newProgress > oldProgress) {
      setIsAnimating(true);
      scaleValue.value = withSequence(
        withSpring(1.05, { damping: 10 }),
        withSpring(1, { damping: 15 }, (finished) => {
          if (finished) {
            runOnJS(setIsAnimating)(false);
          }
        })
      );

      // Pulse effect
      pulseValue.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }

    // Se completou, anima celebration
    if (data.status === 'completed' && oldProgress < data.target) {
      celebrateCompletion();
      onComplete?.(data);
    }

    onProgressUpdate?.(data);
  }, [progressData, onProgressUpdate, onComplete]);

  /**
   * Anima celebration quando completa
   */
  const celebrateCompletion = () => {
    completionScale.value = withSequence(
      withSpring(1, { damping: 8 }),
      withSpring(0, { damping: 12 })
    );
  };

  // Initialize progress animation
  useEffect(() => {
    if (progressData) {
      const progressPercent = Math.min((progressData.current / progressData.target) * 100, 100) / 100;
      progressValue.value = withSpring(progressPercent, { damping: 20 });
    }
  }, [progressData]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const completionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completionScale.value }],
    opacity: completionScale.value
  }));

  if (!progressData) {
    return (
      <Card style={[styles.loadingCard, style]}>
        <Card.Content>
          <Text style={styles.loadingText}>Carregando progresso...</Text>
        </Card.Content>
      </Card>
    );
  }

  const progressPercent = Math.min((progressData.current / progressData.target) * 100, 100);
  const isCompleted = progressData.status === 'completed';
  const isActive = progressData.status === 'active';

  return (
    <AnimatedCard style={[
      compact ? styles.compactCard : styles.card, 
      animatedStyle, 
      style
    ]}>
      <Card.Content style={compact ? styles.compactContent : styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={pulseStyle}>
            <Ionicons 
              name={getTypeIcon(progressData.type)} 
              size={compact ? 20 : 24} 
              color={getTypeColor(progressData.type)}
            />
          </Animated.View>
          
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title,
              compact && styles.compactTitle
            ]}>
              {progressData.title}
            </Text>
            
            {showDetails && !compact && (
              <Text style={styles.subtitle}>
                {getProgressText(progressData)}
              </Text>
            )}
          </View>

          <View style={styles.statusContainer}>
            <Chip
              mode="outlined"
              compact
              style={[
                styles.statusChip,
                { borderColor: getStatusColor(progressData.status) }
              ]}
              textStyle={{ color: getStatusColor(progressData.status) }}
            >
              {getStatusText(progressData.status)}
            </Chip>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progressPercent / 100}
            color={getTypeColor(progressData.type)}
            style={styles.progressBar}
          />
          
          <Text style={styles.progressText}>
            {progressData.current}/{progressData.target} {progressData.unit}
          </Text>
          
          <Text style={styles.percentText}>
            {Math.round(progressPercent)}%
          </Text>
        </View>

        {/* Details (se não for compact) */}
        {showDetails && !compact && (
          <View style={styles.details}>
            {progressData.startTime && (
              <Text style={styles.detailText}>
                Iniciado: {new Date(progressData.startTime).toLocaleTimeString('pt-BR')}
              </Text>
            )}
            
            {isActive && progressData.metadata?.estimatedCompletion && (
              <Text style={styles.detailText}>
                Término previsto: {new Date(progressData.metadata.estimatedCompletion).toLocaleTimeString('pt-BR')}
              </Text>
            )}
          </View>
        )}

        {/* Completion Celebration */}
        {isCompleted && (
          <Animated.View style={[styles.celebration, completionStyle]}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
            <Text style={styles.celebrationText}>Concluído! 🎉</Text>
          </Animated.View>
        )}
      </Card.Content>
    </AnimatedCard>
  );
};

/**
 * Lista de widgets de progresso ativos
 */
interface LiveProgressListProps {
  userId?: string;
  type?: LiveProgressData['type'];
  compact?: boolean;
  maxItems?: number;
}

export const LiveProgressList: React.FC<LiveProgressListProps> = ({
  userId,
  type,
  compact = false,
  maxItems = 5
}) => {
  const { user } = useAuth();
  const [progressItems, setProgressItems] = useState<LiveProgressData[]>([]);

  // Subscribe to user's progress items
  useRealtimeSubscription(`progress_list_${userId || user?.id}`, {
    table: 'live_progress',
    filter: `student_id=eq.${userId || user?.id}${type ? `,type=eq.${type}` : ''}`,
    enabled: !!(userId || user?.id),
    onData: (payload) => {
      if (payload.eventType === 'INSERT') {
        setProgressItems(prev => [...prev, payload.new as LiveProgressData]);
      } else if (payload.eventType === 'UPDATE') {
        setProgressItems(prev => 
          prev.map(item => 
            item.id === payload.new.id ? payload.new as LiveProgressData : item
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setProgressItems(prev => 
          prev.filter(item => item.id !== payload.old.id)
        );
      }
    }
  });

  const displayItems = progressItems
    .filter(item => item.status === 'active')
    .slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness" size={48} color="#999" />
        <Text style={styles.emptyText}>Nenhum progresso ativo</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {displayItems.map(item => (
        <LiveProgressWidget
          key={item.id}
          progressId={item.id}
          initialData={item}
          compact={compact}
          showDetails={!compact}
          style={styles.listItem}
        />
      ))}
    </View>
  );
};

/**
 * Helper functions
 */
function getTypeIcon(type: LiveProgressData['type']): string {
  switch (type) {
    case 'workout': return 'fitness';
    case 'goal': return 'flag';
    case 'streak': return 'flame';
    case 'achievement': return 'trophy';
    default: return 'analytics';
  }
}

function getTypeColor(type: LiveProgressData['type']): string {
  switch (type) {
    case 'workout': return '#FF6B35';
    case 'goal': return '#4CAF50';
    case 'streak': return '#FF9800';
    case 'achievement': return '#9C27B0';
    default: return '#2196F3';
  }
}

function getStatusColor(status: LiveProgressData['status']): string {
  switch (status) {
    case 'active': return '#4CAF50';
    case 'completed': return '#2196F3';
    case 'paused': return '#FF9800';
    case 'failed': return '#F44336';
    default: return '#999999';
  }
}

function getStatusText(status: LiveProgressData['status']): string {
  switch (status) {
    case 'active': return 'Ativo';
    case 'completed': return 'Concluído';
    case 'paused': return 'Pausado';
    case 'failed': return 'Falhou';
    default: return status;
  }
}

function getProgressText(data: LiveProgressData): string {
  switch (data.type) {
    case 'workout':
      return `Treino em andamento - ${data.current}/${data.target} exercícios`;
    case 'goal':
      return `Meta: ${data.title}`;
    case 'streak':
      return `Sequência de ${data.current} dias`;
    case 'achievement':
      return `Conquista: ${Math.round((data.current / data.target) * 100)}%`;
    default:
      return `${data.current}/${data.target} ${data.unit}`;
  }
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  compactCard: {
    marginBottom: 8,
    elevation: 1,
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
  },
  loadingCard: {
    marginBottom: 12,
    elevation: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusChip: {
    height: 28,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  percentText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  details: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  celebration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  }
});

export default LiveProgressWidget;