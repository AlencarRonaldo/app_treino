/**
 * RealtimeService - Gerencia todas as conexões real-time do Supabase
 * Centraliza subscriptions, reconexão automática e estado de conexão
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  cleanup: () => void;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  connectionError?: string;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private connectionListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isReconnecting: false
  };

  constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Configura monitoramento de conexão
   */
  private setupConnectionMonitoring() {
    // Monitor connection status
    supabase.realtime.onOpen(() => {
      this.updateConnectionStatus({
        isConnected: true,
        isReconnecting: false,
        lastConnected: new Date(),
        connectionError: undefined
      });
    });

    supabase.realtime.onClose(() => {
      this.updateConnectionStatus({
        isConnected: false,
        isReconnecting: false
      });
    });

    supabase.realtime.onError((error) => {
      this.updateConnectionStatus({
        isConnected: false,
        isReconnecting: true,
        connectionError: error.message
      });
    });
  }

  /**
   * Atualiza status da conexão e notifica listeners
   */
  private updateConnectionStatus(status: Partial<ConnectionStatus>) {
    this.connectionStatus = { ...this.connectionStatus, ...status };
    this.connectionListeners.forEach(listener => listener(this.connectionStatus));
  }

  /**
   * Adiciona listener para mudanças no status de conexão
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.add(callback);
    // Enviar status atual imediatamente
    callback(this.connectionStatus);

    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Subscreve mudanças em uma tabela específica
   */
  subscribeToTable<T = any>(
    subscriptionId: string,
    table: string,
    filter?: string,
    callback?: (payload: RealtimePostgresChangesPayload<T>) => void
  ): RealtimeSubscription {
    // Remove subscription existente se houver
    this.unsubscribe(subscriptionId);

    const channel = supabase
      .channel(`${subscriptionId}_${table}`)
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: filter 
          }, 
          (payload) => {
            if (callback) {
              callback(payload as RealtimePostgresChangesPayload<T>);
            }
          }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      cleanup: () => {
        channel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscreve mudanças específicas (INSERT, UPDATE, DELETE)
   */
  subscribeToChanges<T = any>(
    subscriptionId: string,
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    filter?: string,
    callback?: (payload: RealtimePostgresChangesPayload<T>) => void
  ): RealtimeSubscription {
    this.unsubscribe(subscriptionId);

    const channel = supabase
      .channel(`${subscriptionId}_${table}_${event}`)
      .on('postgres_changes', 
          { 
            event, 
            schema: 'public', 
            table: table,
            filter: filter 
          }, 
          (payload) => {
            if (callback) {
              callback(payload as RealtimePostgresChangesPayload<T>);
            }
          }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      cleanup: () => {
        channel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscreve broadcast messages para features como typing indicators
   */
  subscribeToBroadcast<T = any>(
    subscriptionId: string,
    channel: string,
    event: string,
    callback: (payload: T) => void
  ): RealtimeSubscription {
    this.unsubscribe(subscriptionId);

    const realtimeChannel = supabase
      .channel(channel)
      .on('broadcast', { event }, callback)
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: realtimeChannel,
      cleanup: () => {
        realtimeChannel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Envia broadcast message
   */
  async broadcast(channel: string, event: string, payload: any): Promise<void> {
    const broadcastChannel = supabase.channel(channel);
    await broadcastChannel.send({
      type: 'broadcast',
      event,
      payload
    });
  }

  /**
   * Remove subscription específica
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.cleanup();
    }
  }

  /**
   * Remove todas as subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      subscription.cleanup();
    });
    this.subscriptions.clear();
  }

  /**
   * Reconecta todas as subscriptions
   */
  async reconnectAll(): Promise<void> {
    const currentSubscriptions = Array.from(this.subscriptions.values());
    this.unsubscribeAll();

    // Aguarda um pouco antes de reconectar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reconecta o supabase realtime
    supabase.realtime.disconnect();
    supabase.realtime.connect();
  }

  /**
   * Obtém status atual da conexão
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  /**
   * Lista todas as subscriptions ativas
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;