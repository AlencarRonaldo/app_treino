/**
 * BackgroundSync - Serviço para sincronização em background e offline
 * Gerencia queue de ações offline e sincronização quando online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, NetInfo } from 'react-native';
import { supabase } from './supabase';
import notificationService from './NotificationService';
import { databaseUtils } from '../lib/database';

export interface QueuedAction {
  id: string;
  type: 'message' | 'progress' | 'workout' | 'profile' | 'achievement';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queuedActions: number;
  lastSyncTime?: Date;
  syncError?: string;
  pendingUploads: number;
}

const STORAGE_KEYS = {
  QUEUE: 'backgroundSyncQueue',
  LAST_SYNC: 'lastSyncTime',
  SYNC_STATUS: 'syncStatus'
};

class BackgroundSync {
  private isInitialized = false;
  private syncInterval?: NodeJS.Timer;
  private isOnline = true;
  private isSyncing = false;
  private queue: QueuedAction[] = [];
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupNetworkListener();
    this.setupAppStateListener();
  }

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing BackgroundSync...');
      
      await this.loadQueue();
      await this.setupPeriodicSync();
      
      // Sync inicial se online
      if (this.isOnline && this.queue.length > 0) {
        this.startSync();
      }

      this.isInitialized = true;
      console.log('✅ BackgroundSync initialized');
    } catch (error) {
      console.error('❌ Failed to initialize BackgroundSync:', error);
      throw error;
    }
  }

  /**
   * Configura listener para mudanças de conectividade
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;
      
      if (wasOffline && this.isOnline) {
        console.log('📶 Back online - starting sync...');
        this.startSync();
      } else if (!this.isOnline) {
        console.log('📴 Went offline - queuing actions...');
        this.stopSync();
      }

      this.notifyListeners();
    });
  }

  /**
   * Configura listener para mudanças de estado do app
   */
  private setupAppStateListener(): void {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && this.isOnline) {
        // App voltou para foreground e está online - sync
        this.startSync();
      } else if (nextAppState === 'background') {
        // App foi para background - salva queue
        this.saveQueue();
      }
    };

    AppState.addEventListener('change', handleAppStateChange);
  }

  /**
   * Configura sincronização periódica
   */
  private async setupPeriodicSync(): Promise<void> {
    // Sync a cada 30 segundos quando online e há itens na queue
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0 && !this.isSyncing) {
        this.startSync();
      }
    }, 30000);
  }

  /**
   * Adiciona ação à queue para sync posterior
   */
  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(queuedAction);
    await this.saveQueue();

    console.log(`📋 Action queued: ${queuedAction.type}/${queuedAction.action}`);

    // Se online, tenta sync imediatamente
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.startSync(), 1000); // Debounce de 1 segundo
    }

    this.notifyListeners();
    return queuedAction.id;
  }

  /**
   * Inicia processo de sincronização
   */
  private async startSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      console.log(`🔄 Starting sync... ${this.queue.length} actions in queue`);

      // Ordena queue por prioridade e timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      const processed: string[] = [];
      const failed: QueuedAction[] = [];

      // Processa ações em batches para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < sortedQueue.length; i += batchSize) {
        const batch = sortedQueue.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (action) => {
          try {
            await this.processAction(action);
            processed.push(action.id);
            console.log(`✅ Synced: ${action.type}/${action.action}`);
          } catch (error) {
            console.error(`❌ Failed to sync action ${action.id}:`, error);
            action.retries++;
            
            if (action.retries >= action.maxRetries) {
              console.warn(`🚫 Action ${action.id} exceeded max retries, dropping`);
              processed.push(action.id); // Remove da queue
            } else {
              failed.push(action);
              this.scheduleRetry(action);
            }
          }
        }));

        // Pequena pausa entre batches
        if (i + batchSize < sortedQueue.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Remove ações processadas da queue
      this.queue = this.queue.filter(action => !processed.includes(action.id));
      
      // Readiciona ações que falharam
      failed.forEach(action => {
        const existingIndex = this.queue.findIndex(q => q.id === action.id);
        if (existingIndex >= 0) {
          this.queue[existingIndex] = action;
        }
      });

      await this.saveQueue();
      
      console.log(`✅ Sync completed: ${processed.length} processed, ${failed.length} failed`);

      // Notifica sobre sync bem-sucedido se havia muitas ações
      if (processed.length > 5) {
        await notificationService.sendLocalNotification({
          title: 'Sincronização Concluída',
          body: `${processed.length} ações sincronizadas com sucesso`,
          data: { type: 'sync_completed', count: processed.length }
        });
      }

    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Processa uma ação específica
   */
  private async processAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'message':
        await this.processChatAction(action);
        break;
      case 'progress':
        await this.processProgressAction(action);
        break;
      case 'workout':
        await this.processWorkoutAction(action);
        break;
      case 'profile':
        await this.processProfileAction(action);
        break;
      case 'achievement':
        await this.processAchievementAction(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Processa ações de chat
   */
  private async processChatAction(action: QueuedAction): Promise<void> {
    switch (action.action) {
      case 'create':
        await supabase.from('chat_messages').insert(action.data);
        break;
      case 'update':
        await supabase.from('chat_messages')
          .update(action.data.updates)
          .eq('id', action.data.id);
        break;
      case 'delete':
        await supabase.from('chat_messages')
          .delete()
          .eq('id', action.data.id);
        break;
    }
  }

  /**
   * Processa ações de progresso
   */
  private async processProgressAction(action: QueuedAction): Promise<void> {
    switch (action.action) {
      case 'create':
        await supabase.from('live_progress').insert(action.data);
        break;
      case 'update':
        await supabase.from('live_progress')
          .update(action.data.updates)
          .eq('id', action.data.id);
        break;
      case 'delete':
        await supabase.from('live_progress')
          .delete()
          .eq('id', action.data.id);
        break;
    }
  }

  /**
   * Processa ações de treino
   */
  private async processWorkoutAction(action: QueuedAction): Promise<void> {
    switch (action.action) {
      case 'create':
        await supabase.from('workouts').insert(action.data);
        break;
      case 'update':
        await supabase.from('workouts')
          .update(action.data.updates)
          .eq('id', action.data.id);
        break;
    }
  }

  /**
   * Processa ações de perfil
   */
  private async processProfileAction(action: QueuedAction): Promise<void> {
    switch (action.action) {
      case 'update':
        await supabase.from('users')
          .update(action.data.updates)
          .eq('id', action.data.id);
        break;
    }
  }

  /**
   * Processa ações de conquista
   */
  private async processAchievementAction(action: QueuedAction): Promise<void> {
    switch (action.action) {
      case 'create':
        await supabase.from('achievements').insert(action.data);
        break;
    }
  }

  /**
   * Agenda retry para ação que falhou
   */
  private scheduleRetry(action: QueuedAction): void {
    // Backoff exponencial: 2^retries * 30 segundos
    const delay = Math.pow(2, action.retries) * 30 * 1000;
    const maxDelay = 10 * 60 * 1000; // Máximo 10 minutos
    const retryDelay = Math.min(delay, maxDelay);

    const timeout = setTimeout(() => {
      if (this.isOnline && !this.isSyncing) {
        this.startSync();
      }
      this.retryTimeouts.delete(action.id);
    }, retryDelay);

    this.retryTimeouts.set(action.id, timeout);
    
    console.log(`⏰ Retry scheduled for ${action.id} in ${retryDelay / 1000}s`);
  }

  /**
   * Para sincronização
   */
  private stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    // Cancela retries pendentes
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();

    this.isSyncing = false;
    this.notifyListeners();
  }

  /**
   * Carrega queue do storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      if (saved) {
        this.queue = JSON.parse(saved);
        console.log(`📋 Loaded ${this.queue.length} queued actions`);
      }
    } catch (error) {
      console.error('❌ Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Salva queue no storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ Failed to save queue:', error);
    }
  }

  /**
   * Obtém status atual do sync
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedActions: this.queue.length,
      lastSyncTime: undefined, // TODO: Implementar
      pendingUploads: this.queue.filter(a => a.type === 'profile' && a.metadata?.hasFile).length
    };
  }

  /**
   * Limpa todas as ações da queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log('🧹 Queue cleared');
  }

  /**
   * Remove ação específica da queue
   */
  async removeFromQueue(actionId: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(action => action.id !== actionId);
    
    if (this.queue.length < initialLength) {
      await this.saveQueue();
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Força sincronização manual
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Não é possível sincronizar offline');
    }

    await this.startSync();
  }

  /**
   * Sistema de listeners
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    
    // Envia status atual
    callback(this.getStatus());
    
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.syncListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.stopSync();
    this.syncListeners.clear();
    await this.saveQueue();
    console.log('🧹 BackgroundSync cleanup completed');
  }
}

export const backgroundSync = new BackgroundSync();
export default backgroundSync;