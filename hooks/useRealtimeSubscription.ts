/**
 * useRealtimeSubscription - Hook para gerenciar subscriptions real-time
 * Simplifica o uso de subscriptions com cleanup automático
 */

import { useEffect, useRef, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import realtimeService, { RealtimeSubscription } from '../services/RealtimeService';
import { useRealtime } from '../contexts/RealtimeContext';

interface UseRealtimeSubscriptionOptions<T = any> {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  enabled?: boolean;
  onData?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para subscription em mudanças de tabela
 */
export function useRealtimeSubscription<T = any>(
  subscriptionId: string,
  options: UseRealtimeSubscriptionOptions<T>
) {
  const { isOnline, realtimeEnabled } = useRealtime();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const { table, event = '*', filter, enabled = true, onData, onError } = options;

  const subscribe = useCallback(() => {
    if (!enabled || !realtimeEnabled || !isOnline) return;

    try {
      // Cleanup existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.cleanup();
        subscriptionRef.current = null;
      }

      // Create new subscription
      subscriptionRef.current = realtimeService.subscribeToChanges<T>(
        subscriptionId,
        table,
        event,
        filter,
        (payload) => {
          if (onData) {
            onData(payload);
          }
        }
      );
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      console.error(`Erro na subscription ${subscriptionId}:`, error);
    }
  }, [subscriptionId, table, event, filter, enabled, realtimeEnabled, isOnline, onData, onError]);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.cleanup();
      subscriptionRef.current = null;
    }
  }, []);

  // Setup subscription quando dependências mudarem
  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed: subscriptionRef.current !== null
  };
}

interface UseBroadcastOptions<T = any> {
  channel: string;
  event: string;
  enabled?: boolean;
  onMessage?: (payload: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para subscription em broadcast messages
 */
export function useBroadcast<T = any>(
  subscriptionId: string,
  options: UseBroadcastOptions<T>
) {
  const { isOnline, realtimeEnabled } = useRealtime();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const { channel, event, enabled = true, onMessage, onError } = options;

  const subscribe = useCallback(() => {
    if (!enabled || !realtimeEnabled || !isOnline) return;

    try {
      // Cleanup existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.cleanup();
        subscriptionRef.current = null;
      }

      // Create new subscription
      subscriptionRef.current = realtimeService.subscribeToBroadcast<T>(
        subscriptionId,
        channel,
        event,
        (payload) => {
          if (onMessage) {
            onMessage(payload);
          }
        }
      );
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      console.error(`Erro no broadcast ${subscriptionId}:`, error);
    }
  }, [subscriptionId, channel, event, enabled, realtimeEnabled, isOnline, onMessage, onError]);

  const broadcast = useCallback(async (payload: T) => {
    if (!realtimeEnabled || !isOnline) {
      throw new Error('Real-time não está habilitado ou offline');
    }

    try {
      await realtimeService.broadcast(channel, event, payload);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [channel, event, realtimeEnabled, isOnline, onError]);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.cleanup();
      subscriptionRef.current = null;
    }
  }, []);

  // Setup subscription
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    broadcast,
    isSubscribed: subscriptionRef.current !== null
  };
}

/**
 * Hook para múltiplas subscriptions com cleanup automático
 */
export function useRealtimeSubscriptions() {
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());

  const addSubscription = useCallback((subscription: RealtimeSubscription) => {
    // Remove subscription existente
    const existing = subscriptionsRef.current.get(subscription.id);
    if (existing) {
      existing.cleanup();
    }
    
    subscriptionsRef.current.set(subscription.id, subscription);
  }, []);

  const removeSubscription = useCallback((subscriptionId: string) => {
    const subscription = subscriptionsRef.current.get(subscriptionId);
    if (subscription) {
      subscription.cleanup();
      subscriptionsRef.current.delete(subscriptionId);
    }
  }, []);

  const removeAllSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      subscription.cleanup();
    });
    subscriptionsRef.current.clear();
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      removeAllSubscriptions();
    };
  }, [removeAllSubscriptions]);

  return {
    addSubscription,
    removeSubscription,
    removeAllSubscriptions,
    activeSubscriptions: Array.from(subscriptionsRef.current.keys())
  };
}