import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar, Chip, Avatar, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../../constants/designTokens';
import { PerformanceCalculator } from '../../services/PerformanceCalculator';
import AnalyticsChart from '../../components/AnalyticsChart';
import KPIWidget from '../../components/KPIWidget';
import ComparisonChart from '../../components/ComparisonChart';
import ProgressRing from '../../components/ProgressRing';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  joinDate: string;
  lastWorkout: string;
  performanceScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  goals: string[];
  achievements: number;
}

export default function StudentPerformanceAnalyticsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudentsData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentPerformance(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudentsData = async () => {
    setLoading(true);
    try {
      // Mock students data
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Ana Silva',
          joinDate: '2024-01-15',
          lastWorkout: '2024-03-20',
          performanceScore: 85,
          riskLevel: 'low',
          goals: ['Perder peso', 'Ganhar força'],
          achievements: 12
        },
        {
          id: '2',
          name: 'Carlos Santos',
          joinDate: '2024-02-01',
          lastWorkout: '2024-03-18',
          performanceScore: 72,
          riskLevel: 'moderate',
          goals: ['Hipertrofia', 'Melhorar resistência'],
          achievements: 8
        },
        {
          id: '3',
          name: 'Maria Oliveira',
          joinDate: '2023-11-10',
          lastWorkout: '2024-03-15',
          performanceScore: 91,
          riskLevel: 'low',
          goals: ['Manter forma', 'Competir'],
          achievements: 25
        },
        {
          id: '4',
          name: 'João Costa',
          joinDate: '2024-01-20',
          lastWorkout: '2024-03-10',
          performanceScore: 58,
          riskLevel: 'high',
          goals: ['Reabilitação', 'Perder peso'],
          achievements: 4
        },
        {
          id: '5',
          name: 'Lucia Fernandes',
          joinDate: '2024-02-15',
          lastWorkout: '2024-03-21',
          performanceScore: 79,
          riskLevel: 'moderate',
          goals: ['Tonificar', 'Flexibilidade'],
          achievements: 9
        }
      ];

      setStudents(mockStudents);
      setSelectedStudent(mockStudents[0]);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentPerformance = async (studentId: string) => {
    try {
      const mockData = await PerformanceCalculator.generateMockProgressData();
      
      // Calculate additional metrics
      const injuryRisk = PerformanceCalculator.calculateInjuryRisk(
        mockData.workoutSessions,
        mockData.bodyMetrics
      );

      const strengthImprovement = PerformanceCalculator.calculateStrengthImprovement([
        { name: 'Supino Reto', records: mockData.workoutSessions.map(s => ({ date: s.date, sets: s.exercises[0].sets })) },
        { name: 'Agachamento', records: mockData.workoutSessions.map(s => ({ date: s.date, sets: s.exercises[1].sets })) }
      ]);

      setPerformanceData({
        ...mockData,
        injuryRisk,
        strengthImprovement,
        adherenceRate: 87.5,
        progressRate: 'good',
        lastAssessment: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading student performance:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return DesignTokens.colors.success;
      case 'moderate': return DesignTokens.colors.warning;
      case 'high': return DesignTokens.colors.error;
      case 'very_high': return DesignTokens.colors.error;
      default: return DesignTokens.colors.textSecondary;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return 'Baixo';
      case 'moderate': return 'Moderado';
      case 'high': return 'Alto';
      case 'very_high': return 'Muito Alto';
      default: return 'Desconhecido';
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'all' || student.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const renderStudentsList = () => (
    <View style={styles.studentsSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Alunos ({filteredStudents.length})
      </Text>

      <Searchbar
        placeholder="Buscar aluno..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'low', label: 'Baixo Risco' },
            { key: 'moderate', label: 'Risco Moderado' },
            { key: 'high', label: 'Alto Risco' }
          ].map((filter) => (
            <Chip
              key={filter.key}
              selected={filterRisk === filter.key}
              onPress={() => setFilterRisk(filter.key)}
              style={styles.filterChip}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.studentsList}>
        {filteredStudents.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[
              styles.studentCard,
              selectedStudent?.id === student.id && styles.selectedStudentCard
            ]}
            onPress={() => setSelectedStudent(student)}
          >
            <View style={styles.studentHeader}>
              <Avatar.Text 
                size={48} 
                label={student.name.split(' ').map(n => n[0]).join('')}
                style={styles.studentAvatar}
              />
              <View style={styles.studentInfo}>
                <Text variant="titleMedium" style={styles.studentName}>
                  {student.name}
                </Text>
                <Text variant="bodySmall" style={styles.studentDate}>
                  Último treino: {new Date(student.lastWorkout).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={styles.studentMetrics}>
                <Text variant="headlineSmall" style={styles.performanceScore}>
                  {student.performanceScore}
                </Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(student.riskLevel) }]}>
                  <Text style={styles.riskText}>
                    {getRiskLabel(student.riskLevel)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStudentOverview = () => {
    if (!selectedStudent || !performanceData) return null;

    const progressData = [
      {
        value: performanceData.adherenceRate,
        maxValue: 100,
        label: 'Aderência',
        color: DesignTokens.colors.primary
      },
      {
        value: selectedStudent.performanceScore,
        maxValue: 100,
        label: 'Performance',
        color: DesignTokens.colors.success
      },
      {
        value: 100 - performanceData.injuryRisk.riskScore,
        maxValue: 100,
        label: 'Segurança',
        color: DesignTokens.colors.warning
      }
    ];

    return (
      <Card style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <LinearGradient
            colors={[DesignTokens.colors.primary, `${DesignTokens.colors.primary}CC`]}
            style={styles.overviewGradient}
          >
            <Avatar.Text 
              size={64} 
              label={selectedStudent.name.split(' ').map(n => n[0]).join('')}
              style={styles.overviewAvatar}
            />
            <View style={styles.overviewInfo}>
              <Text variant="headlineSmall" style={styles.overviewName}>
                {selectedStudent.name}
              </Text>
              <Text variant="bodyMedium" style={styles.overviewSubtitle}>
                Aluno desde {new Date(selectedStudent.joinDate).toLocaleDateString('pt-BR')}
              </Text>
              <View style={styles.achievementsBadge}>
                <Ionicons name="trophy" size={16} color="white" />
                <Text style={styles.achievementsText}>
                  {selectedStudent.achievements} conquistas
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.overviewContent}>
          <View style={styles.progressSection}>
            <ProgressRing
              data={progressData}
              size={140}
              strokeWidth={8}
              showLabels={true}
              showValues={true}
            />
          </View>

          <View style={styles.goalsSection}>
            <Text variant="titleSmall" style={styles.goalsTitle}>
              Objetivos Atuais
            </Text>
            <View style={styles.goalsList}>
              {selectedStudent.goals.map((goal, index) => (
                <Chip key={index} style={styles.goalChip}>
                  {goal}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!performanceData) return null;

    const comparisonData = [
      {
        label: 'Volume Semanal',
        current: 12500,
        previous: 11200,
        unit: 'kg'
      },
      {
        label: 'Frequência',
        current: 4.2,
        previous: 3.8,
        unit: 'x/sem'
      },
      {
        label: 'Intensidade Média',
        current: 78,
        previous: 72,
        unit: '%'
      }
    ];

    return (
      <View style={styles.metricsSection}>
        <ComparisonChart
          title="Métricas de Performance"
          data={comparisonData}
          comparisonType="vs-previous"
          showPercentageImprovement={true}
        />
      </View>
    );
  };

  const renderStrengthAnalysis = () => {
    if (!performanceData?.strengthImprovement) return null;

    const strengthData = {
      labels: performanceData.strengthImprovement.map((s: any) => s.exercise.substring(0, 8)),
      datasets: [{
        data: performanceData.strengthImprovement.map((s: any) => s.improvement),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`
      }]
    };

    return (
      <View style={styles.strengthSection}>
        <AnalyticsChart
          type="bar"
          data={strengthData}
          title="Evolução da Força"
          subtitle="Melhoria percentual nos últimos 90 dias"
          height={200}
        />
      </View>
    );
  };

  const renderRiskAssessment = () => {
    if (!performanceData?.injuryRisk) return null;

    const riskData = performanceData.injuryRisk;

    return (
      <Card style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <Ionicons 
            name="shield-checkmark" 
            size={24} 
            color={getRiskColor(riskData.riskLevel)} 
          />
          <Text variant="titleMedium" style={styles.riskTitle}>
            Avaliação de Risco
          </Text>
          <View style={[styles.riskLevelBadge, { backgroundColor: getRiskColor(riskData.riskLevel) }]}>
            <Text style={styles.riskLevelText}>
              {getRiskLabel(riskData.riskLevel)}
            </Text>
          </View>
        </View>

        <View style={styles.riskContent}>
          <View style={styles.riskScore}>
            <Text variant="headlineLarge" style={[styles.riskScoreValue, { color: getRiskColor(riskData.riskLevel) }]}>
              {riskData.riskScore}%
            </Text>
            <Text variant="bodySmall" style={styles.riskScoreLabel}>
              Score de Risco
            </Text>
          </View>

          {riskData.factors.length > 0 && (
            <View style={styles.riskFactors}>
              <Text variant="titleSmall" style={styles.riskFactorsTitle}>
                Fatores de Risco Identificados
              </Text>
              {riskData.factors.map((factor, index) => (
                <View key={index} style={styles.riskFactor}>
                  <Ionicons name="warning" size={16} color={DesignTokens.colors.warning} />
                  <Text variant="bodySmall" style={styles.riskFactorText}>
                    {factor}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.recommendations}>
            <Text variant="titleSmall" style={styles.recommendationsTitle}>
              Recomendações
            </Text>
            {riskData.recommendations.slice(0, 3).map((rec, index) => (
              <View key={index} style={styles.recommendation}>
                <Ionicons name="checkmark-circle" size={16} color={DesignTokens.colors.success} />
                <Text variant="bodySmall" style={styles.recommendationText}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Performance dos Alunos
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Análise individual e comparativa
          </Text>
        </View>

        {/* Students List */}
        {renderStudentsList()}

        {selectedStudent && (
          <>
            {/* Student Overview */}
            {renderStudentOverview()}

            {/* Performance Metrics */}
            {renderPerformanceMetrics()}

            {/* Strength Analysis */}
            {renderStrengthAnalysis()}

            {/* Risk Assessment */}
            {renderRiskAssessment()}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  studentsSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  searchBar: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  filtersContainer: {
    marginBottom: DesignTokens.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  filterChip: {
    backgroundColor: DesignTokens.colors.surface,
  },
  studentsList: {
    maxHeight: 240,
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  studentCard: {
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.outline,
  },
  selectedStudentCard: {
    borderColor: DesignTokens.colors.primary,
    backgroundColor: `${DesignTokens.colors.primary}10`,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    backgroundColor: DesignTokens.colors.primary,
  },
  studentInfo: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  studentName: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  studentDate: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  studentMetrics: {
    alignItems: 'center',
  },
  performanceScore: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  riskText: {
    color: 'white',
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  overviewCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  overviewHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  overviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  overviewAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  overviewInfo: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  overviewName: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  overviewSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  achievementsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.sm,
  },
  achievementsText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  overviewContent: {
    padding: DesignTokens.spacing.lg,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  goalsSection: {
    alignItems: 'center',
  },
  goalsTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textPrimary,
  },
  goalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
  },
  goalChip: {
    backgroundColor: DesignTokens.colors.surfaceVariant,
  },
  metricsSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  strengthSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  riskCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  riskTitle: {
    flex: 1,
    marginLeft: DesignTokens.spacing.sm,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  riskLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  riskLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  riskContent: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
  },
  riskScore: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  riskScoreValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  riskScoreLabel: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  riskFactors: {
    marginBottom: DesignTokens.spacing.lg,
  },
  riskFactorsTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textPrimary,
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  riskFactorText: {
    color: DesignTokens.colors.textPrimary,
    marginLeft: DesignTokens.spacing.sm,
    flex: 1,
  },
  recommendations: {
    marginTop: DesignTokens.spacing.md,
  },
  recommendationsTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textPrimary,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  recommendationText: {
    color: DesignTokens.colors.textPrimary,
    marginLeft: DesignTokens.spacing.sm,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});