/**
 * useConnectionStatus - Hook para monitorar status de conectividade
 * Monitora tanto a conexão real-time quanto a conectividade de rede
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useRealtime } from '../contexts/RealtimeContext';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  strength: 'excellent' | 'good' | 'poor' | 'unknown';
}

interface ConnectionStatusData {
  network: NetworkStatus;
  realtime: {
    isConnected: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'disconnected';
    isReconnecting: boolean;
    lastConnected?: Date;
    error?: string;
  };
  overall: {
    status: 'online' | 'offline' | 'limited';
    canSync: boolean;
    canReceiveRealtime: boolean;
  };
}

export function useConnectionStatus() {
  const { connectionStatus, connectionQuality, isOnline } = useRealtime();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
    strength: 'unknown'
  });

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const strength = calculateNetworkStrength(state);
      
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        strength
      });
    });

    // Get initial network state
    NetInfo.fetch().then((state) => {
      const strength = calculateNetworkStrength(state);
      
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        strength
      });
    });

    return unsubscribe;
  }, []);

  /**
   * Calcula a força do sinal de rede baseado no tipo e detalhes da conexão
   */
  const calculateNetworkStrength = (state: NetInfoState): 'excellent' | 'good' | 'poor' | 'unknown' => {
    if (!state.isConnected) return 'unknown';

    // WiFi connection
    if (state.type === 'wifi' && state.details.strength !== undefined) {
      if (state.details.strength > 70) return 'excellent';
      if (state.details.strength > 50) return 'good';
      return 'poor';
    }

    // Cellular connection
    if (state.type === 'cellular' && state.details.cellularGeneration) {
      if (['4g', '5g'].includes(state.details.cellularGeneration)) return 'excellent';
      if (state.details.cellularGeneration === '3g') return 'good';
      return 'poor';
    }

    // Other connection types - assume good if connected
    if (state.isConnected && state.isInternetReachable) return 'good';
    if (state.isConnected) return 'poor';
    
    return 'unknown';
  };

  /**
   * Determina o status geral da conectividade
   */
  const getOverallStatus = useCallback((): ConnectionStatusData['overall'] => {
    const networkConnected = networkStatus.isConnected === true && networkStatus.isInternetReachable === true;
    const realtimeConnected = isOnline;

    if (networkConnected && realtimeConnected) {
      return {
        status: 'online',
        canSync: true,
        canReceiveRealtime: true
      };
    }

    if (networkConnected && !realtimeConnected) {
      return {
        status: 'limited',
        canSync: true,
        canReceiveRealtime: false
      };
    }

    return {
      status: 'offline',
      canSync: false,
      canReceiveRealtime: false
    };
  }, [networkStatus, isOnline]);

  /**
   * Força uma verificação manual do status de conectividade
   */
  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    const strength = calculateNetworkStrength(state);
    
    setNetworkStatus({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      strength
    });
  }, []);

  const connectionStatusData: ConnectionStatusData = {
    network: networkStatus,
    realtime: {
      isConnected: isOnline,
      quality: connectionQuality,
      isReconnecting: connectionStatus.isReconnecting,
      lastConnected: connectionStatus.lastConnected,
      error: connectionStatus.connectionError
    },
    overall: getOverallStatus()
  };

  return {
    status: connectionStatusData,
    refresh,
    isOnline: connectionStatusData.overall.status === 'online',
    canSync: connectionStatusData.overall.canSync,
    canReceiveRealtime: connectionStatusData.overall.canReceiveRealtime,
    networkType: networkStatus.type,
    networkStrength: networkStatus.strength
  };
}

/**
 * Hook simplificado para verificar apenas se está online
 */
export function useIsOnline() {
  const { status } = useConnectionStatus();
  return {
    isOnline: status.overall.status === 'online',
    canSync: status.overall.canSync,
    isLimited: status.overall.status === 'limited'
  };
}