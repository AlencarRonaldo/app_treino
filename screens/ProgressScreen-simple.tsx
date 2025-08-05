import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';

const { width } = Dimensions.get('window');

const timeRanges = [
  { id: 'semana', name: 'Semana' },
  { id: 'mes', name: 'Mês' },
  { id: 'ano', name: 'Ano' },
];

const statsData = {
  semana: {
    workouts: 5,
    time: '4h30',
    calories: 1250,
    progress: '+0.5kg',
  },
  mes: {
    workouts: 18,
    time: '16h45',
    calories: 4850,
    progress: '+2.1kg',
  },
  ano: {
    workouts: 156,
    time: '142h30',
    calories: 42650,
    progress: '+8.5kg',
  },
};

const personalRecords = [
  { exercise: 'Supino Reto', weight: '85kg', date: '15/01/2024' },
  { exercise: 'Agachamento', weight: '120kg', date: '20/01/2024' },
  { exercise: 'Levantamento Terra', weight: '140kg', date: '18/01/2024' },
  { exercise: 'Desenvolvimento', weight: '45kg', date: '12/01/2024' },
];

export default function ProgressScreen() {
  const [selectedRange, setSelectedRange] = useState('semana');
  
  const currentStats = statsData[selectedRange as keyof typeof statsData];

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progresso</Text>
          <Text style={styles.subtitle}>Acompanhe sua evolução</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.timeRangeButton,
                  selectedRange === range.id && styles.timeRangeButtonActive
                ]}
                onPress={() => setSelectedRange(range.id)}
              >
                <Text style={[
                  styles.timeRangeText,
                  selectedRange === range.id && styles.timeRangeTextActive
                ]}>
                  {range.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="barbell" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.statValue}>{currentStats.workouts}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.statValue}>{currentStats.time}</Text>
              <Text style={styles.statLabel}>Tempo</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.statValue}>{currentStats.calories}</Text>
              <Text style={styles.statLabel}>Calorias</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.statValue}>{currentStats.progress}</Text>
              <Text style={styles.statLabel}>Evolução</Text>
            </View>
          </View>

          {/* Chart Placeholder */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Evolução do Peso</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartPlaceholder}>
                <Ionicons name="analytics" size={48} color="#FF6B35" />
                <Text style={styles.chartPlaceholderText}>
                  Gráfico em desenvolvimento
                </Text>
                <Text style={styles.chartPlaceholderSubtext}>
                  Histórico de {selectedRange} será exibido aqui
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Records */}
          <View style={styles.recordsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recordes Pessoais</Text>
              <View style={styles.trophyIcon}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
              </View>
            </View>
            
            <View style={styles.recordsCard}>
              {personalRecords.map((record, index) => (
                <View key={index} style={styles.recordItem}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordExercise}>{record.exercise}</Text>
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                  <Text style={styles.recordWeight}>{record.weight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Achievement Section */}
          <View style={styles.achievementSection}>
            <Text style={styles.sectionTitle}>Conquistas Recentes</Text>
            
            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="medal" size={24} color="#FFD700" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Primeira Semana Completa!</Text>
                <Text style={styles.achievementDescription}>
                  Parabéns! Você completou 5 treinos esta semana.
                </Text>
              </View>
            </View>
            
            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="fitness" size={24} color="#FF6B35" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Novo Recorde no Supino!</Text>
                <Text style={styles.achievementDescription}>
                  Você bateu seu recorde pessoal: 85kg
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginHorizontal: 32,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  timeRangeText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  chartSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 12,
    padding: 24,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  chartPlaceholderSubtext: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  recordsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  trophyIcon: {
    marginLeft: 8,
  },
  recordsCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 12,
    padding: 16,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  recordDate: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  recordWeight: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: '700',
  },
  achievementSection: {
    marginBottom: 32,
  },
  achievementCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
});