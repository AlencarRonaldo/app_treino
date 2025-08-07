/**
 * OfflineQueue - Utilitários para gerenciamento de ações offline
 * Helpers para criar e gerenciar ações que serão executadas quando online
 */

import backgroundSync, { QueuedAction } from '../services/BackgroundSync';
import { useAuth } from '../contexts/AuthContext';

export interface OfflineActionOptions {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  maxRetries?: number;
  metadata?: Record<string, any>;
}

/**
 * Helper para adicionar ações de chat à queue offline
 */
export class ChatOfflineQueue {
  
  /**
   * Envia mensagem offline
   */
  static async sendMessage(
    conversationId: string,
    messageText: string,
    senderId: string,
    messageType: string = 'text',
    options?: OfflineActionOptions
  ): Promise<string> {
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      message_text: messageText,
      message_type: messageType,
      created_at: new Date().toISOString(),
      read_at: null
    };

    return await backgroundSync.queueAction({
      type: 'message',
      action: 'create',
      data: messageData,
      userId: senderId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata
    });
  }

  /**
   * Marca mensagens como lidas offline
   */
  static async markAsRead(
    messageIds: string[],
    userId: string,
    options?: OfflineActionOptions
  ): Promise<string[]> {
    const actionIds: string[] = [];

    for (const messageId of messageIds) {
      const actionId = await backgroundSync.queueAction({
        type: 'message',
        action: 'update',
        data: {
          id: messageId,
          updates: {
            read_at: new Date().toISOString()
          }
        },
        userId,
        priority: options?.priority || 'low',
        maxRetries: options?.maxRetries || 2,
        metadata: options?.metadata
      });
      actionIds.push(actionId);
    }

    return actionIds;
  }
}

/**
 * Helper para ações de progresso offline
 */
export class ProgressOfflineQueue {
  
  /**
   * Atualiza progresso offline
   */
  static async updateProgress(
    progressId: string,
    current: number,
    userId: string,
    metadata?: any,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'progress',
      action: 'update',
      data: {
        id: progressId,
        updates: {
          current,
          updated_at: new Date().toISOString(),
          ...(metadata && { metadata })
        }
      },
      userId,
      priority: options?.priority || 'high',
      maxRetries: options?.maxRetries || 5,
      metadata: options?.metadata
    });
  }

  /**
   * Cria novo progresso offline
   */
  static async createProgress(
    progressData: any,
    userId: string,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'progress',
      action: 'create',
      data: {
        ...progressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      userId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata
    });
  }

  /**
   * Completa progresso offline
   */
  static async completeProgress(
    progressId: string,
    userId: string,
    completionData?: any,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'progress',
      action: 'update',
      data: {
        id: progressId,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(completionData && completionData)
        }
      },
      userId,
      priority: options?.priority || 'high',
      maxRetries: options?.maxRetries || 5,
      metadata: {
        isCompletion: true,
        ...options?.metadata
      }
    });
  }
}

/**
 * Helper para ações de treino offline
 */
export class WorkoutOfflineQueue {
  
  /**
   * Salva sessão de treino offline
   */
  static async saveWorkoutSession(
    workoutData: any,
    userId: string,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'workout',
      action: 'create',
      data: {
        ...workoutData,
        user_id: userId,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      },
      userId,
      priority: options?.priority || 'high',
      maxRetries: options?.maxRetries || 5,
      metadata: {
        isWorkoutSession: true,
        ...options?.metadata
      }
    });
  }

  /**
   * Atualiza treino offline
   */
  static async updateWorkout(
    workoutId: string,
    updates: any,
    userId: string,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'workout',
      action: 'update',
      data: {
        id: workoutId,
        updates: {
          ...updates,
          updated_at: new Date().toISOString()
        }
      },
      userId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata
    });
  }
}

/**
 * Helper para ações de perfil offline
 */
export class ProfileOfflineQueue {
  
  /**
   * Atualiza perfil offline
   */
  static async updateProfile(
    userId: string,
    profileUpdates: any,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'profile',
      action: 'update',
      data: {
        id: userId,
        updates: {
          ...profileUpdates,
          updated_at: new Date().toISOString()
        }
      },
      userId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata
    });
  }

  /**
   * Atualiza foto de perfil offline
   */
  static async updateProfilePicture(
    userId: string,
    imageData: string,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'profile',
      action: 'update',
      data: {
        id: userId,
        updates: {
          profile_picture_data: imageData,
          updated_at: new Date().toISOString()
        }
      },
      userId,
      priority: options?.priority || 'low',
      maxRetries: options?.maxRetries || 2,
      metadata: {
        hasFile: true,
        fileType: 'image',
        ...options?.metadata
      }
    });
  }
}

/**
 * Helper para ações de conquista offline
 */
export class AchievementOfflineQueue {
  
  /**
   * Registra conquista offline
   */
  static async unlockAchievement(
    userId: string,
    achievementType: string,
    achievementData: any,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type: 'achievement',
      action: 'create',
      data: {
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: achievementData,
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      userId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: {
        isAchievement: true,
        ...options?.metadata
      }
    });
  }
}

/**
 * Hook React para usar offline queues
 */
export function useOfflineQueue() {
  
  return {
    chat: ChatOfflineQueue,
    progress: ProgressOfflineQueue,
    workout: WorkoutOfflineQueue,
    profile: ProfileOfflineQueue,
    achievement: AchievementOfflineQueue,
    
    // Métodos gerais
    getQueueStatus: () => backgroundSync.getStatus(),
    clearQueue: () => backgroundSync.clearQueue(),
    forceSync: () => backgroundSync.forceSync(),
    removeFromQueue: (actionId: string) => backgroundSync.removeFromQueue(actionId)
  };
}

/**
 * Utilitários gerais
 */
export const OfflineQueueUtils = {
  
  /**
   * Cria uma ação customizada
   */
  async createCustomAction(
    type: QueuedAction['type'],
    action: QueuedAction['action'],
    data: any,
    userId: string,
    options?: OfflineActionOptions
  ): Promise<string> {
    return await backgroundSync.queueAction({
      type,
      action,
      data,
      userId,
      priority: options?.priority || 'medium',
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata
    });
  },

  /**
   * Verifica se há ações pendentes de um tipo específico
   */
  hasPendingActions(type?: QueuedAction['type']): boolean {
    const status = backgroundSync.getStatus();
    if (!type) return status.queuedActions > 0;
    
    // TODO: Implementar filtro por tipo se necessário
    return status.queuedActions > 0;
  },

  /**
   * Estima tempo até próximo sync
   */
  getNextSyncEstimate(): number {
    const status = backgroundSync.getStatus();
    if (status.isOnline && !status.isSyncing) return 0; // Imediato
    if (!status.isOnline) return -1; // Indefinido
    return 30; // 30 segundos (intervalo padrão)
  }
};

export default {
  ChatOfflineQueue,
  ProgressOfflineQueue,
  WorkoutOfflineQueue,
  ProfileOfflineQueue,
  AchievementOfflineQueue,
  useOfflineQueue,
  OfflineQueueUtils
};