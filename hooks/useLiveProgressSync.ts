/**
 * useLiveProgressSync - Hook para sincronização de progresso em tempo real
 * Monitora mudanças de progresso entre Personal Trainer e Aluno
 */

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineQueue } from '../utils/OfflineQueue';
import notificationService from '../services/NotificationService';

export interface ProgressUpdate {
  id: string;
  userId: string;
  trainerId?: string;
  type: 'workout' | 'body_measurement' | 'goal' | 'streak' | 'pr';
  category: string;
  current: number;
  target: number;
  unit: string;
  metadata: Record<string, any>;
  updatedAt: string;
  updatedBy: string;
}

export interface LiveProgressSyncOptions {
  userId?: string;
  trainerId?: string;
  autoSync?: boolean;
  enableNotifications?: boolean;
}

export function useLiveProgressSync(options: LiveProgressSyncOptions = {}) {
  const { user } = useAuth();
  const { progress: progressQueue } = useOfflineQueue();
  const [progressData, setProgressData] = useState<ProgressUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const targetUserId = options.userId || user?.id;
  const isTrainer = user?.user_type === 'personal';
  const isStudent = user?.user_type === 'student';

  // Subscribe to progress updates for specific user
  useRealtimeSubscription(`progress_sync_${targetUserId}`, {
    table: 'progress_tracking',
    filter: `user_id=eq.${targetUserId}`,
    enabled: !!targetUserId,
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        handleProgressUpdate(payload.new as ProgressUpdate);
      } else if (payload.eventType === 'DELETE') {
        handleProgressDelete(payload.old.id);
      }
    }
  });

  // Subscribe to trainer's students progress (se for PT)
  useRealtimeSubscription(`trainer_students_progress_${user?.id}`, {
    table: 'progress_tracking',
    filter: `trainer_id=eq.${user?.id}`,
    enabled: isTrainer,
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        handleStudentProgressUpdate(payload.new as ProgressUpdate);
      }
    }
  });

  /**
   * Processa update de progresso do usuário principal
   */
  const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
    setProgressData(prev => {
      const existing = prev.findIndex(p => p.id === update.id);
      
      if (existing >= 0) {
        // Atualiza existente
        const updated = [...prev];
        updated[existing] = update;
        return updated;
      } else {
        // Adiciona novo
        return [...prev, update];
      }
    });

    setLastUpdate(new Date());

    // Envia notificação se habilitado e não foi o próprio usuário que atualizou
    if (options.enableNotifications && update.updatedBy !== user?.id) {
      sendProgressNotification(update);
    }
  }, [user?.id, options.enableNotifications]);

  /**
   * Processa update de progresso de estudante (para PT)
   */
  const handleStudentProgressUpdate = useCallback(async (update: ProgressUpdate) => {
    if (!isTrainer || update.updatedBy === user?.id) return;

    // Notifica PT sobre progresso do aluno
    const studentName = update.metadata?.studentName || 'Aluno';
    
    await notificationService.sendProgressNotification(
      `${studentName} atualizou: ${update.category} - ${update.current}/${update.target} ${update.unit}`
    );
  }, [isTrainer, user?.id]);

  /**
   * Processa remoção de progresso
   */
  const handleProgressDelete = useCallback((progressId: string) => {
    setProgressData(prev => prev.filter(p => p.id !== progressId));
    setLastUpdate(new Date());
  }, []);

  /**
   * Envia notificação de progresso
   */
  const sendProgressNotification = useCallback(async (update: ProgressUpdate) => {
    try {
      let message = '';
      const trainerName = update.metadata?.trainerName || 'Personal Trainer';
      const current = update.current;
      const target = update.target;
      const percentage = Math.round((current / target) * 100);

      switch (update.type) {
        case 'workout':
          message = `Treino atualizado: ${update.category} - ${current}/${target} ${update.unit}`;
          break;
        case 'body_measurement':
          message = `Medida atualizada: ${update.category} - ${current} ${update.unit}`;
          break;
        case 'goal':
          message = `Meta ${percentage}% concluída: ${update.category}`;
          break;
        case 'streak':
          message = `Sequência de ${current} dias em ${update.category}!`;
          break;
        case 'pr':
          message = `Novo recorde pessoal: ${update.category} - ${current} ${update.unit}! 🏆`;
          break;
        default:
          message = `Progresso atualizado: ${update.category}`;
      }

      if (isStudent && update.updatedBy !== user?.id) {
        // Aluno recebendo update do PT
        await notificationService.sendProgressNotification(
          `${trainerName}: ${message}`
        );
      }

      // Celebra conquistas especiais
      if (current >= target && update.type === 'goal') {
        await notificationService.sendAchievementNotification(
          `Meta alcançada: ${update.category}! Parabéns! 🎉`
        );
      }

      if (update.type === 'pr') {
        await notificationService.sendAchievementNotification(
          `Novo recorde pessoal em ${update.category}! 💪`
        );
      }

    } catch (error) {
      console.error('Erro ao enviar notificação de progresso:', error);
    }
  }, [isStudent, user?.id]);

  /**
   * Atualiza progresso (com offline support)
   */
  const updateProgress = useCallback(async (
    progressId: string,
    updates: Partial<ProgressUpdate>,
    options: { immediate?: boolean } = {}
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updateData = {
        ...updates,
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      };

      if (options.immediate) {
        // Update imediato (quando online)
        // TODO: Implementar update direto no Supabase
        console.log('Immediate update:', updateData);
      } else {
        // Queue para sincronização offline
        await progressQueue.updateProgress(
          progressId,
          updates.current || 0,
          user.id,
          updates.metadata,
          { priority: 'high' }
        );
      }

      // Update local otimista
      setProgressData(prev => 
        prev.map(p => 
          p.id === progressId 
            ? { ...p, ...updateData } as ProgressUpdate
            : p
        )
      );

      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  }, [user, progressQueue]);

  /**
   * Cria novo progresso
   */
  const createProgress = useCallback(async (
    progressData: Omit<ProgressUpdate, 'id' | 'updatedAt' | 'updatedBy'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newProgress: ProgressUpdate = {
        ...progressData,
        id: `progress_${Date.now()}`,
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      };

      // Queue para sincronização
      await progressQueue.createProgress(newProgress, user.id, { priority: 'medium' });

      // Update local otimista
      setProgressData(prev => [...prev, newProgress]);
      setLastUpdate(new Date());

      return newProgress.id;
    } catch (error) {
      console.error('Erro ao criar progresso:', error);
      throw error;
    }
  }, [user, progressQueue]);

  /**
   * Obtém progresso por categoria
   */
  const getProgressByCategory = useCallback((category: string): ProgressUpdate[] => {
    return progressData.filter(p => p.category === category);
  }, [progressData]);

  /**
   * Obtém progresso por tipo
   */
  const getProgressByType = useCallback((type: ProgressUpdate['type']): ProgressUpdate[] => {
    return progressData.filter(p => p.type === type);
  }, [progressData]);

  /**
   * Calcula estatísticas de progresso
   */
  const getProgressStats = useCallback(() => {
    const totalProgress = progressData.length;
    const completedGoals = progressData.filter(p => 
      p.type === 'goal' && p.current >= p.target
    ).length;
    const activeGoals = progressData.filter(p => 
      p.type === 'goal' && p.current < p.target
    ).length;
    const personalRecords = progressData.filter(p => p.type === 'pr').length;
    const currentStreaks = progressData.filter(p => 
      p.type === 'streak' && p.current > 0
    ).length;

    return {
      totalProgress,
      completedGoals,
      activeGoals,
      personalRecords,
      currentStreaks,
      completionRate: totalProgress > 0 ? (completedGoals / totalProgress) * 100 : 0
    };
  }, [progressData]);

  // Load initial data
  useEffect(() => {
    // TODO: Load initial progress data from database
    setIsLoading(false);
  }, [targetUserId]);

  return {
    progressData,
    isLoading,
    lastUpdate,
    updateProgress,
    createProgress,
    getProgressByCategory,
    getProgressByType,
    getProgressStats,
    // Status
    hasProgress: progressData.length > 0,
    recentUpdates: progressData.filter(p => {
      if (!lastUpdate) return false;
      const updateTime = new Date(p.updatedAt);
      const timeDiff = lastUpdate.getTime() - updateTime.getTime();
      return timeDiff < 5 * 60 * 1000; // Últimos 5 minutos
    })
  };
}

/**
 * Hook específico para Personal Trainers monitorarem progresso de todos os alunos
 */
export function useTrainerProgressOverview() {
  const { user } = useAuth();
  const [studentsProgress, setStudentsProgress] = useState<Record<string, ProgressUpdate[]>>({});
  
  // Subscribe to all students' progress
  useRealtimeSubscription(`trainer_overview_${user?.id}`, {
    table: 'progress_tracking',
    filter: `trainer_id=eq.${user?.id}`,
    enabled: user?.user_type === 'personal',
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const update = payload.new as ProgressUpdate;
        setStudentsProgress(prev => ({
          ...prev,
          [update.userId]: [
            ...(prev[update.userId] || []).filter(p => p.id !== update.id),
            update
          ]
        }));
      }
    }
  });

  const getStudentProgress = useCallback((studentId: string): ProgressUpdate[] => {
    return studentsProgress[studentId] || [];
  }, [studentsProgress]);

  const getAllStudentsStats = useCallback(() => {
    const stats: Record<string, any> = {};
    
    Object.entries(studentsProgress).forEach(([studentId, progress]) => {
      const completedGoals = progress.filter(p => p.type === 'goal' && p.current >= p.target).length;
      const totalGoals = progress.filter(p => p.type === 'goal').length;
      const recentActivity = progress.filter(p => {
        const updateTime = new Date(p.updatedAt);
        const now = new Date();
        return now.getTime() - updateTime.getTime() < 24 * 60 * 60 * 1000; // Últimas 24h
      }).length;

      stats[studentId] = {
        totalProgress: progress.length,
        completedGoals,
        totalGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        recentActivity,
        lastUpdate: progress.length > 0 ? 
          progress.reduce((latest, p) => 
            new Date(p.updatedAt) > new Date(latest.updatedAt) ? p : latest
          ).updatedAt : null
      };
    });

    return stats;
  }, [studentsProgress]);

  return {
    studentsProgress,
    getStudentProgress,
    getAllStudentsStats,
    totalStudents: Object.keys(studentsProgress).length
  };
}