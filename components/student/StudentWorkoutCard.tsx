import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { FigmaTheme } from '../../constants/figmaTheme';

interface StudentWorkoutCardProps {
  workout: any;
  onPress: () => void;
  onViewDetails: () => void;
  onMarkCompleted: () => void;
  showCompletedBadge?: boolean;
  isListMode?: boolean;
}

const StudentWorkoutCard = memo(({
  workout,
  onPress,
  onViewDetails,
  onMarkCompleted,
  showCompletedBadge = false,
  isListMode = false
}: StudentWorkoutCardProps) => {
  
  const getDifficulty = (itemCount: number) => {
    if (itemCount <= 4) return 'Básico';
    if (itemCount <= 7) return 'Intermediário';
    return 'Avançado';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return '#00D632';
      case 'Intermediário': return '#FFB800';
      case 'Avançado': return '#FF3B30';
      default: return FigmaTheme.colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const difficulty = getDifficulty(workout.itens?.length || 0);

  const handleOptionsPress = () => {
    const actions = [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Ver Detalhes', onPress: onViewDetails },
    ];

    if (!workout.concluido) {
      actions.push(
        { text: 'Iniciar Treino', onPress: onPress },
        { text: 'Marcar como Concluído', onPress: onMarkCompleted }
      );
    }

    Alert.alert(workout.nome, 'O que deseja fazer?', actions as any);
  };

  const getWorkoutIcon = () => {
    if (workout.concluido) return 'checkmark-circle';
    if (workout.atribuido) return 'person';
    return 'barbell';
  };

  const getWorkoutIconColor = () => {
    if (workout.concluido) return '#00D632';
    if (workout.atribuido) return '#FF6B35';
    return '#007AFF';
  };

  if (isListMode) {
    return (
      <TouchableOpacity style={styles.listContainer} onPress={onPress}>
        <View style={styles.listIcon}>
          <Ionicons name={getWorkoutIcon()} size={24} color={getWorkoutIconColor()} />
        </View>
        
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listName} numberOfLines={1}>{workout.nome}</Text>
            <TouchableOpacity onPress={handleOptionsPress} style={styles.listOptionsButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color={FigmaTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.listDescription} numberOfLines={1}>
            {workout.descricao || `${workout.itens?.length || 0} exercícios • ${workout.duracaoMinutos} min`}
          </Text>
          
          <View style={styles.listFooter}>
            <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(difficulty) }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                {difficulty}
              </Text>
            </View>
            
            {workout.atribuido && (
              <Text style={styles.assignedLabel}>Atribuído pelo personal</Text>
            )}
            
            {showCompletedBadge && (
              <Text style={styles.completedDate}>
                Concluído em {formatDate(workout.dataFinalizacao || workout.data)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header com imagem e badge */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name={getWorkoutIcon()} size={32} color={getWorkoutIconColor()} />
        </View>
        
        <TouchableOpacity style={styles.optionsButton} onPress={handleOptionsPress}>
          <Ionicons name="ellipsis-vertical" size={16} color={FigmaTheme.colors.textSecondary} />
        </TouchableOpacity>
        
        {/* Status indicators */}
        {workout.concluido && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
        
        {workout.atribuido && !workout.concluido && (
          <View style={styles.assignedBadge}>
            <Text style={styles.badgeText}>Atribuído</Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{workout.nome}</Text>
        
        {workout.descricao && (
          <Text style={styles.description} numberOfLines={2}>
            {workout.descricao}
          </Text>
        )}
        
        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="fitness" size={14} color={FigmaTheme.colors.textSecondary} />
            <Text style={styles.infoText}>
              {workout.itens?.length || 0} exercícios
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={14} color={FigmaTheme.colors.textSecondary} />
            <Text style={styles.infoText}>{workout.duracaoMinutos} min</Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(difficulty) }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
              {difficulty}
            </Text>
          </View>
          
          <Text style={styles.dateText}>
            {showCompletedBadge && workout.concluido 
              ? formatDate(workout.dataFinalizacao || workout.data)
              : formatDate(workout.data)
            }
          </Text>
        </View>
        
        {/* Action Button */}
        {!workout.concluido && (
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { backgroundColor: workout.atribuido ? '#FF6B35' : '#007AFF' }
            ]}
            onPress={onPress}
          >
            <Ionicons name="play" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {workout.atribuido ? 'Iniciar Treino' : 'Começar Agora'}
            </Text>
          </TouchableOpacity>
        )}
        
        {workout.concluido && (
          <View style={styles.completedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#00D632" />
            <Text style={styles.completedText}>Treino Concluído</Text>
          </View>
        )}
        
        {/* Student-specific info */}
        {workout.atribuido && !workout.concluido && (
          <View style={styles.trainerInfo}>
            <Ionicons name="person" size={12} color="#FF6B35" />
            <Text style={styles.trainerText}>
              Atribuído pelo seu personal trainer
            </Text>
          </View>
        )}
        
        {/* Progress indicator for partially completed workouts */}
        {workout.progressoAtual && workout.progressoAtual > 0 && !workout.concluido && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${workout.progressoAtual}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{workout.progressoAtual}% concluído</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

StudentWorkoutCard.displayName = 'StudentWorkoutCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 260,
  },
  listContainer: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  listOptionsButton: {
    padding: 4,
  },
  listDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    height: 100,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00D632',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  name: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dateText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  assignedLabel: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '500',
  },
  completedDate: {
    color: '#00D632',
    fontSize: 11,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginTop: 'auto',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    marginTop: 'auto',
  },
  completedText: {
    color: '#00D632',
    fontSize: 14,
    fontWeight: '500',
  },
  trainerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  trainerText: {
    color: '#FF6B35',
    fontSize: 11,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    color: '#007AFF',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default StudentWorkoutCard;