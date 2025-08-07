/**
 * useOfflineSync - Hook principal para gerenciar sincronização offline-online
 * Coordena BackgroundSync, OfflineQueue e real-time features
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import backgroundSync, { SyncStatus } from '../services/BackgroundSync';
import { useOfflineQueue } from '../utils/OfflineQueue';
import { useConnectionStatus } from './useConnectionStatus';
import notificationService from '../services/NotificationService';

export interface OfflineSyncData {
  syncStatus: SyncStatus;
  connectionStatus: 'online' | 'offline' | 'limited' | 'syncing';
  queuedActions: number;
  lastSyncTime?: Date;
  pendingUploads: number;
  syncProgress: number; // 0-100
  isInitialized: boolean;
}

export interface SyncConflict {
  id: string;
  type: 'data' | 'version' | 'permission';
  localData: any;
  serverData: any;
  resolution: 'manual' | 'auto_local' | 'auto_server';
  resolvedAt?: string;
}

export function useOfflineSync() {
  const { user } = useAuth();
  const { isOnline, connectionQuality } = useRealtime();
  const { status: connectionStatus, canSync } = useConnectionStatus();
  const queue = useOfflineQueue();
  
  const [syncData, setSyncData] = useState<OfflineSyncData>({
    syncStatus: backgroundSync.getStatus(),
    connectionStatus: 'offline',
    queuedActions: 0,
    pendingUploads: 0,
    syncProgress: 0,
    isInitialized: false
  });
  
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncStrategy, setSyncStrategy] = useState<'aggressive' | 'conservative' | 'manual'>('conservative');

  /**
   * Inicializa sistema de sync offline
   */
  const initializeSync = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 Initializing offline sync system...');
      
      // Inicializa background sync
      await backgroundSync.initialize();
      
      // Configura listener para mudanças de status
      const unsubscribe = backgroundSync.onStatusChange((status) => {
        setSyncData(prev => ({
          ...prev,
          syncStatus: status,
          queuedActions: status.queuedActions,
          pendingUploads: status.pendingUploads,
          syncProgress: calculateSyncProgress(status)
        }));
      });

      setSyncData(prev => ({
        ...prev,
        isInitialized: true
      }));

      console.log('✅ Offline sync system initialized');
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Failed to initialize offline sync:', error);
    }
  }, [user]);

  /**
   * Calcula progresso da sincronização
   */
  const calculateSyncProgress = useCallback((status: SyncStatus): number => {
    if (!status.isSyncing || status.queuedActions === 0) return 100;
    
    // Estimativa baseada no número de ações restantes
    const totalActions = status.queuedActions + 10; // Estimativa inicial
    const remaining = status.queuedActions;
    return Math.max(0, Math.min(100, ((totalActions - remaining) / totalActions) * 100));
  }, []);

  /**
   * Atualiza status de conexão
   */
  const updateConnectionStatus = useCallback(() => {
    let status: OfflineSyncData['connectionStatus'] = 'offline';
    
    if (syncData.syncStatus.isSyncing) {
      status = 'syncing';
    } else if (isOnline && canSync) {
      status = 'online';
    } else if (canSync && !isOnline) {
      status = 'limited'; // Tem internet mas sem real-time
    } else {
      status = 'offline';
    }

    setSyncData(prev => ({ ...prev, connectionStatus: status }));
  }, [isOnline, canSync, syncData.syncStatus.isSyncing]);

  /**
   * Força sincronização manual
   */
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (!canSync) {
      throw new Error('Não é possível sincronizar no momento');
    }

    try {
      await backgroundSync.forceSync();
      
      // Notifica usuário sobre sync bem-sucedido
      if (syncData.queuedActions > 0) {
        await notificationService.sendLocalNotification({
          title: 'Sincronização Concluída',
          body: `${syncData.queuedActions} ações sincronizadas com sucesso`,
          data: { type: 'sync_completed' }
        });
      }

      return true;
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      
      await notificationService.sendLocalNotification({
        title: 'Erro na Sincronização',
        body: 'Falha ao sincronizar dados. Tentaremos novamente em breve.',
        data: { type: 'sync_error' }
      });

      return false;
    }
  }, [canSync, syncData.queuedActions]);

  /**
   * Limpa fila de sincronização
   */
  const clearSyncQueue = useCallback(async (): Promise<void> => {
    await backgroundSync.clearQueue();
    await notificationService.sendLocalNotification({
      title: 'Fila Limpa',
      body: 'Todas as ações pendentes foram removidas',
      data: { type: 'queue_cleared' }
    });
  }, []);

  /**
   * Configura estratégia de sincronização
   */
  const configureSyncStrategy = useCallback((strategy: typeof syncStrategy) => {
    setSyncStrategy(strategy);
    
    // Ajusta comportamento baseado na estratégia
    switch (strategy) {
      case 'aggressive':
        // Sync mais frequente e imediato
        setAutoSyncEnabled(true);
        break;
      case 'conservative':
        // Sync menos frequente, mais cuidadoso
        setAutoSyncEnabled(true);
        break;
      case 'manual':
        // Apenas sync manual
        setAutoSyncEnabled(false);
        break;
    }
  }, []);

  /**
   * Resolve conflito de sincronização
   */
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'use_local' | 'use_server' | 'merge'
  ): Promise<void> => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      // Implementa resolução baseada na escolha
      let resolvedData;
      
      switch (resolution) {
        case 'use_local':
          resolvedData = conflict.localData;
          break;
        case 'use_server':
          resolvedData = conflict.serverData;
          break;
        case 'merge':
          // TODO: Implementar merge inteligente
          resolvedData = { ...conflict.serverData, ...conflict.localData };
          break;
      }

      // Remove conflito da lista
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      
      console.log(`Conflito ${conflictId} resolvido usando ${resolution}`);
      
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
    }
  }, [conflicts]);

  /**
   * Obtém estatísticas de sincronização
   */
  const getSyncStats = useCallback(() => {
    const { syncStatus } = syncData;
    
    return {
      totalQueued: syncStatus.queuedActions,
      pendingUploads: syncStatus.pendingUploads,
      isOnline: isOnline,
      canSync: canSync,
      connectionQuality: connectionQuality,
      lastSyncTime: syncStatus.lastSyncTime,
      syncProgress: syncData.syncProgress,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      strategy: syncStrategy,
      autoSyncEnabled: autoSyncEnabled
    };
  }, [syncData, isOnline, canSync, connectionQuality, conflicts.length, syncStrategy, autoSyncEnabled]);

  /**
   * Helpers para diferentes tipos de sync
   */
  const syncHelpers = {
    // Chat messages
    queueChatMessage: async (conversationId: string, message: string) => {
      if (!user) return null;
      return await queue.chat.sendMessage(conversationId, message, user.id);
    },

    // Progress updates
    queueProgressUpdate: async (progressId: string, current: number, metadata?: any) => {
      if (!user) return null;
      return await queue.progress.updateProgress(progressId, current, user.id, metadata);
    },

    // Workout sessions
    queueWorkoutSession: async (workoutData: any) => {
      if (!user) return null;
      return await queue.workout.saveWorkoutSession(workoutData, user.id);
    },

    // Profile updates
    queueProfileUpdate: async (updates: any) => {
      if (!user) return null;
      return await queue.profile.updateProfile(user.id, updates);
    },

    // Achievements
    queueAchievement: async (type: string, data: any) => {
      if (!user) return null;
      return await queue.achievement.unlockAchievement(user.id, type, data);
    }
  };

  /**
   * Estado de conexão para UI
   */
  const getConnectionStatusInfo = useCallback(() => {
    const { connectionStatus } = syncData;
    
    switch (connectionStatus) {
      case 'online':
        return {
          status: 'online',
          color: '#4CAF50',
          icon: 'wifi',
          message: 'Online - Sincronizado',
          description: 'Todos os dados estão atualizados'
        };
      case 'syncing':
        return {
          status: 'syncing',
          color: '#FF9800',
          icon: 'sync',
          message: 'Sincronizando...',
          description: `${syncData.queuedActions} ações pendentes`
        };
      case 'limited':
        return {
          status: 'limited',
          color: '#FF9800',
          icon: 'wifi-off',
          message: 'Conexão Limitada',
          description: 'Alguns recursos podem não funcionar'
        };
      case 'offline':
        return {
          status: 'offline',
          color: '#F44336',
          icon: 'cloud-offline',
          message: 'Offline',
          description: `${syncData.queuedActions} ações aguardando sincronização`
        };
      default:
        return {
          status: 'unknown',
          color: '#9E9E9E',
          icon: 'help-circle',
          message: 'Status desconhecido',
          description: 'Verificando conexão...'
        };
    }
  }, [syncData]);

  // Inicializa sistema
  useEffect(() => {
    if (user && !syncData.isInitialized) {
      initializeSync();
    }
  }, [user, syncData.isInitialized, initializeSync]);

  // Atualiza status de conexão quando dependências mudam
  useEffect(() => {
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Auto-sync quando volta online (se habilitado)
  useEffect(() => {
    if (autoSyncEnabled && isOnline && canSync && syncData.queuedActions > 0 && syncStrategy !== 'manual') {
      const timeout = setTimeout(() => {
        forceSync().catch(console.error);
      }, 2000); // Delay de 2 segundos

      return () => clearTimeout(timeout);
    }
  }, [autoSyncEnabled, isOnline, canSync, syncData.queuedActions, syncStrategy, forceSync]);

  return {
    // Estado principal
    syncData,
    conflicts,
    
    // Actions
    forceSync,
    clearSyncQueue,
    configureSyncStrategy,
    resolveConflict,
    
    // Helpers
    ...syncHelpers,
    
    // Stats e status
    stats: getSyncStats(),
    connectionInfo: getConnectionStatusInfo(),
    
    // Configuration
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncStrategy,
    
    // Status checks
    hasQueuedActions: syncData.queuedActions > 0,
    hasConflicts: conflicts.length > 0,
    isSyncing: syncData.syncStatus.isSyncing,
    canSync: canSync && isOnline,
    needsAttention: conflicts.length > 0 || 
                    (syncData.queuedActions > 10 && connectionStatus === 'offline')
  };
}

/**
 * Hook simplificado para components que só precisam do status
 */
export function useSyncStatus() {
  const { syncData, connectionInfo, stats } = useOfflineSync();
  
  return {
    isOnline: connectionInfo.status === 'online',
    isSyncing: stats.isOnline && syncData.syncStatus.isSyncing,
    hasQueuedActions: stats.totalQueued > 0,
    queuedCount: stats.totalQueued,
    connectionStatus: connectionInfo,
    canSync: stats.canSync,
    syncProgress: syncData.syncProgress
  };
}

export default useOfflineSync;