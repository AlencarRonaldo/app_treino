import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Vibration,
  AppState,
  AppStateStatus
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useFitness } from '../contexts/FitnessContext';
import { Treino, Serie } from '../types/fitness';
import { RootStackNavigationProp } from '../types/navigation';

interface WorkoutTimerScreenProps {
  route: {
    params: {
      workout: any;
    };
  };
  navigation: RootStackNavigationProp;
}

interface TimerState {
  isRunning: boolean;
  time: number;
  type: 'workout' | 'rest';
  currentExercise: number;
  currentSet: number;
}

export default function WorkoutTimerScreen({ route, navigation }: WorkoutTimerScreenProps) {
  const { workout } = route.params;
  const { treinos, concluirTreino, adicionarSerie } = useFitness();
  
  const [treino, setTreino] = useState<Treino | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    time: 0,
    type: 'workout',
    currentExercise: 0,
    currentSet: 1
  });
  
  const [restTime, setRestTime] = useState(60); // 60 segundos padrão
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Carregar treino
  useEffect(() => {
    if (workout) {
      setTreino(workout);
    } else {
      Alert.alert('Erro', 'Treino não encontrado', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [workout]);

  // Gerenciar estado do app (para continuar timer em background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Timer principal
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          time: prev.time + 1
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  // Detectar fim do tempo de descanso
  useEffect(() => {
    if (timerState.type === 'rest' && timerState.time >= restTime) {
      handleRestComplete();
    }
  }, [timerState.time, timerState.type, restTime]);

  // Carregar som de notificação
  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      // Por enquanto, apenas usar vibração
      // Futuro: adicionar arquivo de som personalizado
      console.log('Sistema de som inicializado');
    } catch (error) {
      console.log('Erro ao carregar som:', error);
    }
  };

  const playNotificationSound = async () => {
    try {
      // Por enquanto apenas vibração - futuro: adicionar som
      Vibration.vibrate([0, 500, 200, 500]); // Vibração customizada
    } catch (error) {
      console.log('Erro ao reproduzir notificação:', error);
      Vibration.vibrate(1000); // Fallback para vibração simples
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    setWorkoutStartTime(new Date());
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      type: 'workout',
      time: 0
    }));
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resumeTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true
    }));
  };

  const startRest = async (customRestTime?: number) => {
    const restDuration = customRestTime || restTime;
    
    // Registrar série completada
    if (treino && treino.itens && treino.itens[timerState.currentExercise]) {
      const currentItem = treino.itens[timerState.currentExercise];
      
      try {
        await adicionarSerie({
          itemTreinoId: currentItem.id,
          numeroSerie: timerState.currentSet,
          repeticoes: currentItem.repeticoes || 12, // Valor padrão
          peso: currentItem.pesoKg,
          concluida: true,
          tempoDescanso: restDuration
        });
      } catch (error) {
        console.error('Erro ao registrar série:', error);
      }
    }

    setTimerState(prev => ({
      ...prev,
      type: 'rest',
      time: 0,
      isRunning: true
    }));

    Alert.alert(
      '⏱️ Tempo de Descanso',
      `Descanse por ${restDuration} segundos`,
      [{ text: 'OK' }]
    );
  };

  const handleRestComplete = async () => {
    await playNotificationSound();
    
    Alert.alert(
      '🔔 Descanso Concluído!',
      'Hora de continuar o treino!',
      [
        { text: 'Mais 30s', onPress: () => extendRest(30) },
        { text: 'Continuar', onPress: continueWorkout }
      ]
    );
  };

  const extendRest = (additionalSeconds: number) => {
    setRestTime(prev => prev + additionalSeconds);
  };

  const continueWorkout = () => {
    setTimerState(prev => ({
      ...prev,
      type: 'workout',
      time: workoutStartTime ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000) : prev.time,
      currentSet: prev.currentSet + 1
    }));
  };

  const nextExercise = () => {
    if (!treino || !treino.itens) return;

    if (timerState.currentExercise < treino.itens.length - 1) {
      setTimerState(prev => ({
        ...prev,
        currentExercise: prev.currentExercise + 1,
        currentSet: 1
      }));
    } else {
      // Treino completo
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    try {
      await concluirTreino(treinoId);
      
      const totalTime = workoutStartTime 
        ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000)
        : timerState.time;

      Alert.alert(
        '🎉 Treino Concluído!',
        `Parabéns! Você treinou por ${formatWorkoutTime(totalTime)}`,
        [
          { text: 'Ver Progresso', onPress: () => navigation.navigate('Progress') },
          { text: 'Voltar ao Início', onPress: () => navigation.navigate('Home') }
        ]
      );
    } catch (error) {
      console.error('Erro ao concluir treino:', error);
      Alert.alert('Erro', 'Não foi possível concluir o treino');
    }
  };

  const quitWorkout = () => {
    Alert.alert(
      'Sair do Treino',
      'Tem certeza que deseja sair? O progresso será perdido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  if (!treino) {
    return (
      <FigmaScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando treino...</Text>
        </View>
      </FigmaScreen>
    );
  }

  const currentItem = treino.itens && treino.itens[timerState.currentExercise];
  const totalExercises = treino.itens?.length || 0;

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={quitWorkout} style={styles.backButton}>
            <Ionicons name="close" size={24} color={FigmaTheme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.workoutTitle}>{treino.nome}</Text>
            <Text style={styles.workoutProgress}>
              Exercício {timerState.currentExercise + 1} de {totalExercises}
            </Text>
          </View>
        </View>

        {/* Timer Principal */}
        <View style={styles.timerSection}>
          <View style={[
            styles.timerContainer,
            timerState.type === 'rest' ? styles.restTimer : styles.workoutTimer
          ]}>
            <Text style={styles.timerLabel}>
              {timerState.type === 'rest' ? '⏰ Descanso' : '💪 Treino'}
            </Text>
            <Text style={styles.timerText}>
              {timerState.type === 'rest' 
                ? formatTime(Math.max(0, restTime - timerState.time))
                : formatWorkoutTime(timerState.time)
              }
            </Text>
            <Text style={styles.timerSubtext}>
              {timerState.type === 'rest' 
                ? `${Math.max(0, restTime - timerState.time)} segundos restantes`
                : `Tempo total de treino`
              }
            </Text>
          </View>
        </View>

        {/* Exercício Atual */}
        {currentItem && (
          <View style={styles.currentExercise}>
            <Text style={styles.exerciseTitle}>{currentItem.exercicioId}</Text>
            <View style={styles.exerciseDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Série</Text>
                <Text style={styles.detailValue}>{timerState.currentSet}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Repetições</Text>
                <Text style={styles.detailValue}>{currentItem.repeticoes || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Peso</Text>
                <Text style={styles.detailValue}>
                  {currentItem.pesoKg ? `${currentItem.pesoKg}kg` : '-'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Controles */}
        <View style={styles.controls}>
          {timerState.type === 'workout' ? (
            <>
              {!timerState.isRunning && timerState.time === 0 ? (
                <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Iniciar Treino</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.workoutControls}>
                  <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={timerState.isRunning ? pauseTimer : resumeTimer}
                  >
                    <Ionicons 
                      name={timerState.isRunning ? "pause" : "play"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.controlButtonText}>
                      {timerState.isRunning ? 'Pausar' : 'Continuar'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.restButton]} 
                    onPress={() => startRest()}
                  >
                    <Ionicons name="timer" size={20} color="#FFFFFF" />
                    <Text style={styles.controlButtonText}>Descansar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.restControls}>
              <TouchableOpacity 
                style={styles.skipRestButton} 
                onPress={continueWorkout}
              >
                <Ionicons name="play-skip-forward" size={20} color="#FF6B35" />
                <Text style={styles.skipRestText}>Pular Descanso</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.extendButton} 
                onPress={() => extendRest(30)}
              >
                <Ionicons name="add-circle" size={20} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.extendText}>+30s</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Próximo Exercício */}
        {currentItem && timerState.currentExercise < totalExercises - 1 && (
          <TouchableOpacity style={styles.nextExerciseButton} onPress={nextExercise}>
            <Text style={styles.nextExerciseText}>Próximo Exercício</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        )}

        {/* Finalizar Treino */}
        {timerState.currentExercise === totalExercises - 1 && (
          <TouchableOpacity style={styles.finishButton} onPress={completeWorkout}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.finishButtonText}>Finalizar Treino</Text>
          </TouchableOpacity>
        )}
      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  workoutTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  workoutProgress: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: 20,
    minWidth: 280,
  },
  workoutTimer: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  restTimer: {
    backgroundColor: 'rgba(0, 214, 50, 0.1)',
    borderWidth: 2,
    borderColor: '#00D632',
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: FigmaTheme.colors.textSecondary,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: FigmaTheme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  timerSubtext: {
    fontSize: 14,
    color: FigmaTheme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  currentExercise: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  exerciseTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  workoutControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  restButton: {
    backgroundColor: '#00D632',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  restControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipRestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  skipRestText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  extendText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  nextExerciseText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#00D632',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});