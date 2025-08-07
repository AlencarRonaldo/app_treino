import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { FigmaTheme } from '../../constants/figmaTheme';

interface TrainerWorkoutCardProps {
  workout: any;
  onPress: () => void;
  onAction: (action: string) => void;
  showAssignOption?: boolean;
  showTemplateOption?: boolean;
}

const TrainerWorkoutCard = memo(({
  workout,
  onPress,
  onAction,
  showAssignOption = true,
  showTemplateOption = true
}: TrainerWorkoutCardProps) => {
  
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

  const handleMenuPress = () => {
    const actions = [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => onAction('edit') },
      { text: 'Duplicar', onPress: () => onAction('duplicate') },
    ];

    if (showAssignOption) {
      actions.push({ text: 'Atribuir', onPress: () => onAction('assign') });
    }

    if (showTemplateOption) {
      const templateText = workout.template ? 'Remover Template' : 'Salvar como Template';
      actions.push({ text: templateText, onPress: () => onAction('template') });
    }

    actions.push(
      { text: 'Arquivar', onPress: () => onAction('archive') },
      { text: 'Excluir', style: 'destructive', onPress: () => onAction('delete') }
    );

    Alert.alert(workout.nome, 'Escolha uma ação:', actions as any);
  };

  const getStatusIndicator = () => {
    if (workout.template) {
      return { color: '#007AFF', text: 'Template' };
    }
    if (workout.atribuido) {
      return { color: '#FF6B35', text: 'Atribuído' };
    }
    if (workout.concluido) {
      return { color: '#00D632', text: 'Concluído' };
    }
    return null;
  };

  const statusIndicator = getStatusIndicator();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header com imagem e menu */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="barbell" size={32} color="#FF6B35" />
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Ionicons name="ellipsis-vertical" size={16} color={FigmaTheme.colors.textSecondary} />
        </TouchableOpacity>
        
        {/* Status Badge */}
        {statusIndicator && (
          <View style={[styles.statusBadge, { backgroundColor: statusIndicator.color }]}>
            <Text style={styles.statusText}>{statusIndicator.text}</Text>
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
          
          <View style={styles.metaInfo}>
            {workout.atribuido && (
              <View style={styles.assignedInfo}>
                <Ionicons name="person" size={12} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.assignedText}>
                  {workout.alunosAtribuidos?.length || 1} aluno{(workout.alunosAtribuidos?.length || 1) > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            
            <Text style={styles.dateText}>
              {workout.concluido ? 'Concluído' : formatDate(workout.data)}
            </Text>
          </View>
        </View>
        
        {/* Professional Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onAction('edit')}
          >
            <Ionicons name="create-outline" size={16} color="#FF6B35" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          
          {showAssignOption && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onAction('assign')}
            >
              <Ionicons name="person-add-outline" size={16} color="#007AFF" />
              <Text style={styles.actionText}>Atribuir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

TrainerWorkoutCard.displayName = 'TrainerWorkoutCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 280,
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
  menuButton: {
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
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
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
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 11,
  },
  dateText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3C',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TrainerWorkoutCard;