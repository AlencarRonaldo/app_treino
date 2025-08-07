import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Text, Card, Chip, Avatar, Surface, Button, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../../constants/designTokens';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: 'workout' | 'strength' | 'endurance' | 'consistency' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  earned: boolean;
  earnedDate?: string;
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
  requirements: string[];
}

interface Badge {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  level: number;
  nextLevel?: {
    requirement: string;
    progress: number;
  };
}

export default function AchievementsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showShareSnackbar, setShowShareSnackbar] = useState(false);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    earnedAchievements: 0,
    currentLevel: 0,
    streak: 0
  });

  useEffect(() => {
    loadAchievements();
    loadBadges();
    loadUserStats();
  }, []);

  const loadAchievements = async () => {
    // Mock achievements data
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Primeira Vitória',
        description: 'Complete seu primeiro treino',
        icon: 'trophy',
        category: 'milestone',
        rarity: 'common',
        points: 50,
        earned: true,
        earnedDate: '2024-01-15',
        requirements: ['Completar 1 treino']
      },
      {
        id: '2',
        title: 'Semana de Ouro',
        description: 'Treine todos os dias da semana',
        icon: 'medal',
        category: 'consistency',
        rarity: 'rare',
        points: 200,
        earned: true,
        earnedDate: '2024-02-20',
        requirements: ['Treinar 7 dias consecutivos']
      },
      {
        id: '3',
        title: 'Força Bruta',
        description: 'Atinja 100kg no supino',
        icon: 'barbell',
        category: 'strength',
        rarity: 'epic',
        points: 500,
        earned: false,
        progress: {
          current: 82,
          target: 100,
          unit: 'kg'
        },
        requirements: ['Supino reto com 100kg', '1 repetição máxima']
      },
      {
        id: '4',
        title: 'Maratonista',
        description: 'Corra 42km em uma sessão',
        icon: 'footsteps',
        category: 'endurance',
        rarity: 'legendary',
        points: 1000,
        earned: false,
        progress: {
          current: 15,
          target: 42,
          unit: 'km'
        },
        requirements: ['Correr 42.195km', 'Em uma única sessão']
      },
      {
        id: '5',
        title: 'Social Fitness',
        description: 'Compartilhe 10 conquistas',
        icon: 'share-social',
        category: 'social',
        rarity: 'rare',
        points: 300,
        earned: false,
        progress: {
          current: 6,
          target: 10,
          unit: 'compartilhamentos'
        },
        requirements: ['Compartilhar 10 conquistas nas redes sociais']
      },
      {
        id: '6',
        title: 'Volume Master',
        description: 'Mova 50 toneladas em uma semana',
        icon: 'cube',
        category: 'workout',
        rarity: 'epic',
        points: 750,
        earned: true,
        earnedDate: '2024-03-01',
        requirements: ['Volume total de 50.000kg', 'Em 7 dias consecutivos']
      },
      {
        id: '7',
        title: 'Dedication',
        description: '100 dias de treino',
        icon: 'calendar',
        category: 'consistency',
        rarity: 'legendary',
        points: 1500,
        earned: false,
        progress: {
          current: 78,
          target: 100,
          unit: 'dias'
        },
        requirements: ['100 dias de treino', 'Não precisam ser consecutivos']
      },
      {
        id: '8',
        title: 'Speed Demon',
        description: 'Corra 5km em menos de 20 minutos',
        icon: 'speedometer',
        category: 'endurance',
        rarity: 'epic',
        points: 600,
        earned: false,
        progress: {
          current: 22.5,
          target: 20,
          unit: 'min'
        },
        requirements: ['5km em sub-20 minutos', 'Tempo verificado']
      }
    ];

    setAchievements(mockAchievements);
  };

  const loadBadges = async () => {
    // Mock badges data
    const mockBadges: Badge[] = [
      {
        id: '1',
        name: 'Iniciante',
        icon: 'flag',
        color: DesignTokens.colors.success,
        description: 'Primeiros passos na jornada fitness',
        level: 3,
        nextLevel: {
          requirement: '20 treinos para Intermediário',
          progress: 85
        }
      },
      {
        id: '2',
        name: 'Consistente',
        icon: 'calendar-check',
        color: DesignTokens.colors.primary,
        description: 'Mantém regularidade nos treinos',
        level: 2,
        nextLevel: {
          requirement: '50 dias consecutivos para Mestre',
          progress: 60
        }
      },
      {
        id: '3',
        name: 'Forte',
        icon: 'barbell',
        color: DesignTokens.colors.warning,
        description: 'Demonstra força excepcional',
        level: 1,
        nextLevel: {
          requirement: '90kg supino para Bronze',
          progress: 75
        }
      },
      {
        id: '4',
        name: 'Resistente',
        icon: 'heart',
        color: DesignTokens.colors.error,
        description: 'Excelente capacidade cardiovascular',
        level: 2,
        nextLevel: {
          requirement: '10km sub-45min para Ouro',
          progress: 40
        }
      }
    ];

    setBadges(mockBadges);
  };

  const loadUserStats = async () => {
    const earned = achievements.filter(a => a.earned).length;
    const totalPoints = achievements
      .filter(a => a.earned)
      .reduce((sum, a) => sum + a.points, 0);

    setUserStats({
      totalPoints,
      earnedAchievements: earned,
      currentLevel: Math.floor(totalPoints / 500) + 1,
      streak: 12 // Mock streak
    });
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return DesignTokens.colors.textSecondary;
      case 'rare': return DesignTokens.colors.info;
      case 'epic': return DesignTokens.colors.warning;
      case 'legendary': return DesignTokens.colors.error;
      default: return DesignTokens.colors.textSecondary;
    }
  };

  const getRarityLabel = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return 'Comum';
    }
  };

  const getBadgeLevel = (level: number) => {
    const levels = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
    return levels[Math.min(level - 1, levels.length - 1)] || 'Bronze';
  };

  const shareAchievement = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `🏆 Acabei de conquistar "${achievement.title}" no TreinosApp! ${achievement.description}`,
        title: achievement.title
      });
      setShowShareSnackbar(true);
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const renderUserProfile = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={[DesignTokens.colors.primary, `${DesignTokens.colors.primary}CC`]}
          style={styles.profileGradient}
        >
          <Avatar.Text 
            size={64} 
            label="EU"
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text variant="headlineSmall" style={styles.profileName}>
              Meu Progresso
            </Text>
            <Text variant="bodyMedium" style={styles.profileLevel}>
              Nível {userStats.currentLevel} • {userStats.totalPoints} pontos
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Text variant="headlineSmall" style={styles.profileStatValue}>
            {userStats.earnedAchievements}
          </Text>
          <Text variant="bodySmall" style={styles.profileStatLabel}>
            Conquistas
          </Text>
        </View>
        <View style={styles.profileStat}>
          <Text variant="headlineSmall" style={styles.profileStatValue}>
            {userStats.streak}
          </Text>
          <Text variant="bodySmall" style={styles.profileStatLabel}>
            Sequência (dias)
          </Text>
        </View>
        <View style={styles.profileStat}>
          <Text variant="headlineSmall" style={styles.profileStatValue}>
            {Math.round((userStats.earnedAchievements / achievements.length) * 100)}%
          </Text>
          <Text variant="bodySmall" style={styles.profileStatLabel}>
            Completude
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderBadges = () => (
    <View style={styles.badgesSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Badges
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.badgesList}>
          {badges.map((badge) => (
            <TouchableOpacity key={badge.id} style={styles.badgeCard}>
              <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                <Ionicons name={badge.icon} size={28} color="white" />
              </View>
              <Text variant="bodySmall" style={styles.badgeName}>
                {badge.name}
              </Text>
              <Text variant="bodySmall" style={styles.badgeLevel}>
                {getBadgeLevel(badge.level)}
              </Text>
              {badge.nextLevel && (
                <View style={styles.badgeProgress}>
                  <View style={styles.badgeProgressBar}>
                    <View 
                      style={[
                        styles.badgeProgressFill,
                        { width: `${badge.nextLevel.progress}%`, backgroundColor: badge.color }
                      ]} 
                    />
                  </View>
                  <Text variant="bodySmall" style={styles.badgeProgressText}>
                    {badge.nextLevel.progress}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCategoryFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'Todas', icon: 'apps' },
            { key: 'milestone', label: 'Marcos', icon: 'flag' },
            { key: 'strength', label: 'Força', icon: 'barbell' },
            { key: 'endurance', label: 'Resistência', icon: 'heart' },
            { key: 'consistency', label: 'Consistência', icon: 'calendar' },
            { key: 'workout', label: 'Treino', icon: 'fitness' },
            { key: 'social', label: 'Social', icon: 'people' }
          ].map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              icon={category.icon}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && {
                  backgroundColor: DesignTokens.colors.primary
                }
              ]}
              textStyle={selectedCategory === category.key ? { color: 'white' } : {}}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderAchievementCard = (achievement: Achievement) => {
    const progressPercentage = achievement.progress 
      ? (achievement.progress.current / achievement.progress.target) * 100 
      : 0;

    return (
      <Card 
        key={achievement.id} 
        style={[
          styles.achievementCard,
          achievement.earned && styles.earnedCard
        ]}
      >
        <View style={styles.achievementHeader}>
          <View style={[
            styles.achievementIcon,
            { backgroundColor: achievement.earned ? getRarityColor(achievement.rarity) : DesignTokens.colors.surfaceVariant }
          ]}>
            <Ionicons 
              name={achievement.icon} 
              size={32} 
              color={achievement.earned ? 'white' : DesignTokens.colors.textSecondary} 
            />
          </View>

          <View style={styles.achievementInfo}>
            <View style={styles.achievementTitleRow}>
              <Text 
                variant="titleMedium" 
                style={[
                  styles.achievementTitle,
                  !achievement.earned && styles.lockedTitle
                ]}
              >
                {achievement.title}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                <Text style={styles.rarityText}>
                  {getRarityLabel(achievement.rarity)}
                </Text>
              </View>
            </View>

            <Text 
              variant="bodySmall" 
              style={[
                styles.achievementDescription,
                !achievement.earned && styles.lockedDescription
              ]}
            >
              {achievement.description}
            </Text>

            <View style={styles.achievementMeta}>
              <View style={styles.achievementPoints}>
                <Ionicons name="star" size={16} color={DesignTokens.colors.warning} />
                <Text variant="bodySmall" style={styles.pointsText}>
                  {achievement.points} pontos
                </Text>
              </View>
              
              {achievement.earned && achievement.earnedDate && (
                <Text variant="bodySmall" style={styles.earnedDate}>
                  {new Date(achievement.earnedDate).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {achievement.progress && !achievement.earned && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" style={styles.progressLabel}>
                Progresso: {achievement.progress.current} / {achievement.progress.target} {achievement.progress.unit}
              </Text>
              <Text variant="bodySmall" style={styles.progressPercentage}>
                {progressPercentage.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: getRarityColor(achievement.rarity) }
                ]} 
              />
            </View>
          </View>
        )}

        <View style={styles.requirementsSection}>
          <Text variant="bodySmall" style={styles.requirementsTitle}>
            Requisitos:
          </Text>
          {achievement.requirements.map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <Ionicons 
                name={achievement.earned ? "checkmark-circle" : "ellipse-outline"} 
                size={12} 
                color={achievement.earned ? DesignTokens.colors.success : DesignTokens.colors.textSecondary} 
              />
              <Text variant="bodySmall" style={styles.requirementText}>
                {req}
              </Text>
            </View>
          ))}
        </View>

        {achievement.earned && (
          <View style={styles.achievementActions}>
            <Button 
              mode="outlined" 
              onPress={() => shareAchievement(achievement)}
              icon="share"
              style={styles.shareButton}
            >
              Compartilhar
            </Button>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Conquistas
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Celebre suas vitórias fitness
          </Text>
        </View>

        {/* User Profile */}
        {renderUserProfile()}

        {/* Badges */}
        {renderBadges()}

        {/* Category Filters */}
        {renderCategoryFilters()}

        {/* Achievements List */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map(achievement => renderAchievementCard(achievement))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Snackbar
        visible={showShareSnackbar}
        onDismiss={() => setShowShareSnackbar(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setShowShareSnackbar(false),
        }}
      >
        Conquista compartilhada! 🎉
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  headerTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  headerSubtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  profileCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  profileHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  profileAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileInfo: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  profileName: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  profileLevel: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.lg,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  profileStatLabel: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  badgesSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  badgesList: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  badgeCard: {
    alignItems: 'center',
    width: 120,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    ...DesignTokens.shadows.sm,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  badgeName: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
    marginBottom: 2,
  },
  badgeLevel: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  badgeProgress: {
    width: '100%',
    alignItems: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: DesignTokens.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    color: DesignTokens.colors.textSecondary,
  },
  filtersContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  categoryChip: {
    backgroundColor: DesignTokens.colors.surface,
  },
  achievementsList: {
    paddingHorizontal: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  achievementCard: {
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
    padding: DesignTokens.spacing.lg,
    opacity: 0.7,
  },
  earnedCard: {
    opacity: 1,
    borderWidth: 2,
    borderColor: DesignTokens.colors.success,
  },
  achievementHeader: {
    flexDirection: 'row',
    marginBottom: DesignTokens.spacing.md,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.sm,
  },
  achievementTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
    flex: 1,
    marginRight: DesignTokens.spacing.sm,
  },
  lockedTitle: {
    color: DesignTokens.colors.textSecondary,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    textTransform: 'uppercase',
  },
  achievementDescription: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    lineHeight: 18,
  },
  lockedDescription: {
    fontStyle: 'italic',
  },
  achievementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    color: DesignTokens.colors.textPrimary,
    marginLeft: 4,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  earnedDate: {
    color: DesignTokens.colors.success,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  progressSection: {
    marginBottom: DesignTokens.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  progressLabel: {
    color: DesignTokens.colors.textPrimary,
  },
  progressPercentage: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  progressBar: {
    height: 8,
    backgroundColor: DesignTokens.colors.outline,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  requirementsSection: {
    marginBottom: DesignTokens.spacing.md,
  },
  requirementsTitle: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    marginBottom: DesignTokens.spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    color: DesignTokens.colors.textSecondary,
    marginLeft: DesignTokens.spacing.sm,
    flex: 1,
  },
  achievementActions: {
    alignItems: 'flex-end',
  },
  shareButton: {
    borderColor: DesignTokens.colors.primary,
  },
  bottomSpacing: {
    height: 100,
  },
});