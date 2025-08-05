import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { RootStackNavigationProp } from '../types/navigation';

const studentsData = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    joinDate: '15/01/2024',
    lastWorkout: 'Hoje',
    workoutsPlan: 'Hipertrofia A/B',
    adherence: 85,
    status: 'active',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    joinDate: '10/01/2024',
    lastWorkout: 'Ontem',
    workoutsPlan: 'Força ABC',
    adherence: 92,
    status: 'active',
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@email.com',
    phone: '(11) 77777-7777',
    joinDate: '20/12/2023',
    lastWorkout: '3 dias atrás',
    workoutsPlan: 'Emagrecimento',
    adherence: 68,
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana@email.com',
    phone: '(11) 66666-6666',
    joinDate: '05/01/2024',
    lastWorkout: 'Hoje',
    workoutsPlan: 'Funcional',
    adherence: 78,
    status: 'active',
  },
];

export default function StudentsManagementScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'Todos', count: studentsData.length },
    { id: 'active', name: 'Ativos', count: studentsData.filter(s => s.status === 'active').length },
    { id: 'inactive', name: 'Inativos', count: studentsData.filter(s => s.status === 'inactive').length },
  ];

  const filteredStudents = selectedFilter === 'all' 
    ? studentsData 
    : studentsData.filter(student => student.status === selectedFilter);

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return '#00D632';
    if (adherence >= 60) return '#FFB800';
    return '#FF3B30';
  };

  const handleAddStudent = () => {
    Alert.alert('Novo Aluno', 'Funcionalidade em desenvolvimento');
  };

  const handleStudentPress = (student: any) => {
    Alert.alert(
      student.name,
      'O que você gostaria de fazer?',
      [
        { 
          text: 'Ver Perfil', 
          onPress: () => {
            Alert.alert('Perfil do Aluno', `Visualizando perfil de ${student.name}\n\nFuncionalidade será implementada em breve.`);
          }
        },
        { 
          text: 'Criar Treino', 
          onPress: () => {
            // Navegar para criar treino específico para o aluno
            navigation.navigate('CreateWorkout');
          }
        },
        { 
          text: 'Ver Progresso', 
          onPress: () => {
            Alert.alert('Progresso do Aluno', `Visualizando progresso de ${student.name}\n\nFuncionalidade será implementada em breve.`);
          }
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderStudent = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => handleStudentPress(item)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {item.name.split(' ').map((n: string) => n[0]).join('')}
          </Text>
        </View>
        
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentEmail}>{item.email}</Text>
          <Text style={styles.studentPhone}>{item.phone}</Text>
        </View>

        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.status === 'active' ? '#00D632' : '#8E8E93' }
        ]} />
      </View>

      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Plano:</Text>
          <Text style={styles.statValue}>{item.workoutsPlan}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Último treino:</Text>
          <Text style={styles.statValue}>{item.lastWorkout}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Aderência:</Text>
          <Text style={[styles.statValue, { color: getAdherenceColor(item.adherence) }]}>
            {item.adherence}%
          </Text>
        </View>
      </View>

      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person" size={16} color={FigmaTheme.colors.textSecondary} />
          <Text style={styles.actionText}>Perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="barbell" size={16} color={FigmaTheme.colors.textSecondary} />
          <Text style={styles.actionText}>Treinos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="analytics" size={16} color={FigmaTheme.colors.textSecondary} />
          <Text style={styles.actionText}>Progresso</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meus Alunos</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive
                ]}>
                  {filter.name} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Students List */}
        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.studentsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={FigmaTheme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>Nenhum aluno encontrado</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddStudent}>
                <Text style={styles.emptyStateButtonText}>Adicionar Primeiro Aluno</Text>
              </TouchableOpacity>
            </View>
          }
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersContent: {
    paddingHorizontal: 32,
    gap: 12,
  },
  filterButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  studentsList: {
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentEmail: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 2,
  },
  studentPhone: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  studentStats: {
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  statValue: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});