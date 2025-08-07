/**
 * useLiveWorkoutSession - Hook para sessões de treino colaborativas em tempo real
 * Permite PT acompanhar treino do aluno em tempo real e fornecer feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSubscription, useBroadcast } from './useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineQueue } from '../utils/OfflineQueue';
import notificationService from '../services/NotificationService';

export interface LiveWorkoutSession {
  id: string;
  studentId: string;
  trainerId: string;
  workoutId: string;
  workoutName: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  currentExercise?: number;
  totalExercises: number;
  exercises: LiveWorkoutExercise[];
  ptMonitoring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LiveWorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  sets: LiveWorkoutSet[];
  notes?: string;
  ptFeedback?: string;
  completedAt?: string;
  restTime?: number;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
}

export interface LiveWorkoutSet {
  id: string;
  setNumber: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  reps?: number;
  weight?: number;
  duration?: number;
  restStarted?: string;
  restCompleted?: string;
  completedAt?: string;
}

export interface WorkoutFeedback {
  id: string;
  sessionId: string;
  exerciseId: string;
  setId?: string;
  fromUserId: string;
  message: string;
  type: 'encouragement' | 'correction' | 'tip' | 'warning' | 'celebration';
  timestamp: string;
  isRead: boolean;
}

export interface SessionBroadcastData {
  sessionId: string;
  userId: string;
  userName: string;
  type: 'exercise_start' | 'exercise_complete' | 'set_complete' | 'session_pause' | 'session_complete' | 'pt_join' | 'pt_leave';
  data?: any;
  timestamp: number;
}

export function useLiveWorkoutSession(sessionId?: string) {
  const { user } = useAuth();
  const { workout: workoutQueue } = useOfflineQueue();
  
  const [session, setSession] = useState<LiveWorkoutSession | null>(null);
  const [feedback, setFeedback] = useState<WorkoutFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ptOnline, setPtOnline] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout>();

  const isTrainer = user?.user_type === 'personal';
  const isStudent = user?.user_type === 'student';

  // Subscribe to session updates
  useRealtimeSubscription(`workout_session_${sessionId}`, {
    table: 'live_workout_sessions',
    filter: `id=eq.${sessionId}`,
    enabled: !!sessionId,
    onData: (payload) => {
      if (payload.eventType === 'UPDATE') {
        setSession(payload.new as LiveWorkoutSession);
        handleSessionUpdate(payload.new as LiveWorkoutSession);
      }
    }
  });

  // Subscribe to session feedback
  useRealtimeSubscription(`workout_feedback_${sessionId}`, {
    table: 'workout_feedback',
    filter: `session_id=eq.${sessionId}`,
    enabled: !!sessionId,
    onData: (payload) => {
      if (payload.eventType === 'INSERT') {
        const newFeedback = payload.new as WorkoutFeedback;
        setFeedback(prev => [...prev, newFeedback]);
        handleNewFeedback(newFeedback);
      }
    }
  });

  // Broadcast channel para comunicação em tempo real
  const { broadcast: broadcastSessionEvent } = useBroadcast<SessionBroadcastData>(
    `session_broadcast_${sessionId}`,
    {
      channel: `workout_session_${sessionId}`,
      event: 'session_update',
      onMessage: (data) => {
        handleSessionBroadcast(data);
      }
    }
  );

  /**
   * Processa updates da sessão
   */
  const handleSessionUpdate = useCallback((updatedSession: LiveWorkoutSession) => {
    // Notifica mudanças importantes
    if (session) {
      // Exercício mudou
      if (session.currentExercise !== updatedSession.currentExercise) {
        if (isTrainer && updatedSession.ptMonitoring) {
          notificationService.sendLocalNotification({
            title: 'Novo Exercício',
            body: `Aluno iniciou: ${updatedSession.exercises[updatedSession.currentExercise || 0]?.exerciseName}`,
            data: { sessionId, type: 'exercise_change' }
          });
        }
      }

      // Status da sessão mudou
      if (session.status !== updatedSession.status) {
        handleStatusChange(session.status, updatedSession.status);
      }
    }
  }, [session, isTrainer, sessionId]);

  /**
   * Processa novo feedback
   */
  const handleNewFeedback = useCallback((newFeedback: WorkoutFeedback) => {
    // Se não é o próprio usuário, mostra notificação
    if (newFeedback.fromUserId !== user?.id) {
      const senderName = isTrainer ? 'Aluno' : 'Personal Trainer';
      
      notificationService.sendLocalNotification({
        title: `${senderName} - Feedback`,
        body: newFeedback.message,
        data: { 
          sessionId, 
          feedbackId: newFeedback.id,
          type: 'workout_feedback' 
        },
        sound: 'message'
      });
    }
  }, [user?.id, isTrainer, sessionId]);

  /**
   * Processa broadcast events
   */
  const handleSessionBroadcast = useCallback((data: SessionBroadcastData) => {
    if (data.userId === user?.id) return; // Ignora próprios eventos

    switch (data.type) {
      case 'pt_join':
        if (isStudent) {
          setPtOnline(true);
          notificationService.sendLocalNotification({
            title: 'Personal Trainer Online',
            body: `${data.userName} está acompanhando seu treino`,
            data: { sessionId, type: 'pt_monitoring' }
          });
        }
        break;
        
      case 'pt_leave':
        if (isStudent) {
          setPtOnline(false);
        }
        break;
        
      case 'exercise_complete':
        if (isTrainer) {
          const exerciseName = data.data?.exerciseName || 'exercício';
          notificationService.sendLocalNotification({
            title: 'Exercício Concluído',
            body: `${data.userName} finalizou: ${exerciseName}`,
            data: { sessionId, type: 'exercise_completed' }
          });
        }
        break;
        
      case 'session_complete':
        if (isTrainer) {
          notificationService.sendLocalNotification({
            title: 'Treino Finalizado',
            body: `${data.userName} completou o treino!`,
            data: { sessionId, type: 'session_completed' },
            sound: 'achievement'
          });
        }
        break;
    }
  }, [user?.id, isStudent, isTrainer, sessionId]);

  /**
   * Processa mudanças de status
   */
  const handleStatusChange = useCallback((oldStatus: string, newStatus: string) => {
    if (oldStatus === 'waiting' && newStatus === 'active') {
      // Treino iniciado
      if (isTrainer && session?.ptMonitoring) {
        notificationService.sendLocalNotification({
          title: 'Treino Iniciado',
          body: `Aluno iniciou o treino: ${session.workoutName}`,
          data: { sessionId, type: 'session_started' }
        });
      }
    } else if (newStatus === 'completed') {
      // Treino completado
      if (isStudent) {
        notificationService.sendAchievementNotification(
          'Parabéns! Treino completado com sucesso! 🎉'
        );
      }
    }
  }, [isTrainer, isStudent, session, sessionId]);

  /**
   * Inicia sessão de treino
   */
  const startSession = useCallback(async (): Promise<void> => {
    if (!session || !user) throw new Error('Session or user not available');

    try {
      const updates = {
        status: 'active',
        startedAt: new Date().toISOString(),
        currentExercise: 0
      };

      await updateSession(updates);
      
      // Broadcast event
      await broadcastSessionEvent({
        sessionId: session.id,
        userId: user.id,
        userName: user.name || 'Usuário',
        type: 'session_pause',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      throw error;
    }
  }, [session, user, updateSession, broadcastSessionEvent]);

  /**
   * Pausa sessão
   */
  const pauseSession = useCallback(async (): Promise<void> => {
    if (!session || !user) return;

    try {
      await updateSession({ status: 'paused' });
      
      await broadcastSessionEvent({
        sessionId: session.id,
        userId: user.id,
        userName: user.name || 'Usuário',
        type: 'session_pause',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao pausar sessão:', error);
      throw error;
    }
  }, [session, user, updateSession, broadcastSessionEvent]);

  /**
   * Completa exercício
   */
  const completeExercise = useCallback(async (exerciseIndex: number): Promise<void> => {
    if (!session || !user) return;

    try {
      const exercise = session.exercises[exerciseIndex];
      const updates = {
        exercises: session.exercises.map((ex, idx) => 
          idx === exerciseIndex 
            ? { ...ex, status: 'completed', completedAt: new Date().toISOString() }
            : ex
        ),
        currentExercise: exerciseIndex + 1 < session.exercises.length ? exerciseIndex + 1 : exerciseIndex
      };

      await updateSession(updates);

      // Broadcast completion
      await broadcastSessionEvent({
        sessionId: session.id,
        userId: user.id,
        userName: user.name || 'Usuário',
        type: 'exercise_complete',
        data: { exerciseName: exercise.exerciseName },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao completar exercício:', error);
      throw error;
    }
  }, [session, user, updateSession, broadcastSessionEvent]);

  /**
   * Completa set
   */
  const completeSet = useCallback(async (
    exerciseIndex: number, 
    setIndex: number, 
    setData: Partial<LiveWorkoutSet>
  ): Promise<void> => {
    if (!session) return;

    try {
      const updatedExercises = [...session.exercises];
      const exercise = updatedExercises[exerciseIndex];
      
      exercise.sets[setIndex] = {
        ...exercise.sets[setIndex],
        ...setData,
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      await updateSession({ exercises: updatedExercises });

    } catch (error) {
      console.error('Erro ao completar set:', error);
      throw error;
    }
  }, [session, updateSession]);

  /**
   * Envia feedback
   */
  const sendFeedback = useCallback(async (
    exerciseId: string,
    message: string,
    type: WorkoutFeedback['type'],
    setId?: string
  ): Promise<void> => {
    if (!session || !user) return;

    try {
      const feedbackData: Omit<WorkoutFeedback, 'id'> = {
        sessionId: session.id,
        exerciseId,
        setId,
        fromUserId: user.id,
        message,
        type,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Queue feedback for sync
      await workoutQueue.updateWorkout(
        `feedback_${Date.now()}`,
        { feedback: feedbackData },
        user.id,
        { priority: 'medium' }
      );

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      throw error;
    }
  }, [session, user, workoutQueue]);

  /**
   * PT inicia monitoramento
   */
  const startPTMonitoring = useCallback(async (): Promise<void> => {
    if (!isTrainer || !session || !user) return;

    try {
      await updateSession({ ptMonitoring: true });
      
      await broadcastSessionEvent({
        sessionId: session.id,
        userId: user.id,
        userName: user.name || 'PT',
        type: 'pt_join',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao iniciar monitoramento:', error);
      throw error;
    }
  }, [isTrainer, session, user, updateSession, broadcastSessionEvent]);

  /**
   * PT para monitoramento
   */
  const stopPTMonitoring = useCallback(async (): Promise<void> => {
    if (!isTrainer || !session || !user) return;

    try {
      await updateSession({ ptMonitoring: false });
      
      await broadcastSessionEvent({
        sessionId: session.id,
        userId: user.id,
        userName: user.name || 'PT',
        type: 'pt_leave',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao parar monitoramento:', error);
    }
  }, [isTrainer, session, user, updateSession, broadcastSessionEvent]);

  /**
   * Atualiza sessão (helper)
   */
  const updateSession = useCallback(async (updates: Partial<LiveWorkoutSession>): Promise<void> => {
    if (!session || !user) return;

    try {
      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Queue update
      await workoutQueue.updateWorkout(session.id, updates, user.id, { priority: 'high' });

      // Update local state otimisticamente
      setSession(updatedSession);

    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      throw error;
    }
  }, [session, user, workoutQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      
      // Se PT estava monitorando, para monitoramento
      if (isTrainer && session?.ptMonitoring && user) {
        broadcastSessionEvent({
          sessionId: session.id,
          userId: user.id,
          userName: user.name || 'PT',
          type: 'pt_leave',
          timestamp: Date.now()
        }).catch(() => {});
      }
    };
  }, [isTrainer, session, user, broadcastSessionEvent]);

  return {
    session,
    feedback,
    isLoading,
    ptOnline,
    
    // Actions
    startSession,
    pauseSession,
    completeExercise,
    completeSet,
    sendFeedback,
    startPTMonitoring,
    stopPTMonitoring,
    
    // Status checks
    canStart: session?.status === 'waiting',
    canPause: session?.status === 'active',
    canResume: session?.status === 'paused',
    isActive: session?.status === 'active',
    isCompleted: session?.status === 'completed',
    
    // Progress
    currentExercise: session?.exercises[session?.currentExercise || 0],
    progressPercent: session ? 
      Math.round(((session.currentExercise || 0) / session.totalExercises) * 100) : 0,
    
    // Feedback
    unreadFeedback: feedback.filter(f => !f.isRead && f.fromUserId !== user?.id),
    recentFeedback: feedback.slice(-5) // Últimos 5
  };
}

export default useLiveWorkoutSession;