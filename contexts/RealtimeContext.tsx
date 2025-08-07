/**
 * RealtimeContext - Contexto global para gerenciar estado real-time
 * Gerencia conexão, subscriptions e sincronização
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConnectionStatus } from '../services/RealtimeService';
import realtimeService from '../services/RealtimeService';
import { useAuth } from './AuthContext';
import { AppState, AppStateStatus } from 'react-native';

interface RealtimeContextData {
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  reconnect: () => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
  realtimeEnabled: boolean;
  // Connection quality
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface RealtimeProviderProps {
  children: ReactNode;
}

const RealtimeContext = createContext<RealtimeContextData | undefined>(undefined);

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false
  });
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');

  // Monitor connection status
  useEffect(() => {
    if (!user || !realtimeEnabled) return;

    const cleanup = realtimeService.onConnectionChange((status) => {
      setConnectionStatus(status);
      updateConnectionQuality(status);
    });

    return cleanup;
  }, [user, realtimeEnabled]);

  // Monitor app state for background/foreground
  useEffect(() => {
    if (!user || !realtimeEnabled) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App voltou para foreground - reconectar se necessário
        if (!connectionStatus.isConnected) {
          await reconnect();
        }
      } else if (nextAppState === 'background') {
        // App foi para background - manter conexões essenciais
        // Mantém subscriptions para notificações push
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user, realtimeEnabled, connectionStatus.isConnected]);

  /**
   * Atualiza qualidade da conexão baseada no status
   */
  const updateConnectionQuality = (status: ConnectionStatus) => {
    if (!status.isConnected) {
      setConnectionQuality('disconnected');
    } else if (status.connectionError) {
      setConnectionQuality('poor');
    } else if (status.isReconnecting) {
      setConnectionQuality('poor');
    } else if (status.lastConnected && (new Date().getTime() - status.lastConnected.getTime()) > 30000) {
      setConnectionQuality('good'); // Conexão estável mas não muito recente
    } else {
      setConnectionQuality('excellent'); // Conexão recente e estável
    }
  };

  /**
   * Reconecta o serviço real-time
   */
  const reconnect = async (): Promise<void> => {
    if (!user || !realtimeEnabled) return;
    
    try {
      await realtimeService.reconnectAll();
    } catch (error) {
      console.error('Erro ao reconectar real-time:', error);
    }
  };

  /**
   * Habilita funcionalidades real-time
   */
  const enableRealtime = () => {
    setRealtimeEnabled(true);
  };

  /**
   * Desabilita funcionalidades real-time
   */
  const disableRealtime = () => {
    setRealtimeEnabled(false);
    realtimeService.unsubscribeAll();
  };

  const value: RealtimeContextData = {
    connectionStatus,
    isOnline: connectionStatus.isConnected,
    reconnect,
    enableRealtime,
    disableRealtime,
    realtimeEnabled,
    connectionQuality
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextData => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;