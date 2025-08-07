/**
 * useNotifications - Hook para gerenciar notificações push em tempo real
 * Integra Expo Notifications com real-time features e context awareness
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import notificationService, { NotificationSettings } from '../services/NotificationService';
import { useNavigation } from '@react-navigation/native';

export interface NotificationData {
  id: string;
  type: 'chat' | 'workout' | 'progress' | 'achievement' | 'schedule' | 'reminder';
  title: string;
  body: string;
  data?: Record<string, any>;
  received_at: string;
  is_read: boolean;
  action_taken?: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const { isOnline } = useRealtime();
  const navigation = useNavigation();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Inicializa sistema de notificações
   */
  const initialize = useCallback(async () => {
    if (isInitialized || !user) return;

    try {
      console.log('🔔 Initializing notification system...');
      
      // Inicializa notification service
      await notificationService.initialize(user.id);
      
      // Carrega configurações
      const currentSettings = await notificationService.getSettings();
      setSettings(currentSettings);
      
      // Setup listeners
      setupNotificationListeners();
      
      // Carrega badge count
      const currentBadgeCount = notificationService.getBadgeCount();
      setBadgeCount(currentBadgeCount);
      
      setIsInitialized(true);
      console.log('✅ Notification system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }, [isInitialized, user]);

  /**
   * Configura listeners de notificação
   */
  const setupNotificationListeners = useCallback(() => {
    // Listener para notificações recebidas (app em foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      
      const notificationData: NotificationData = {
        id: notification.request.identifier,
        type: notification.request.content.data?.type || 'general',
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        received_at: new Date().toISOString(),
        is_read: false,
        action_taken: false
      };

      // Adiciona à lista local
      setNotifications(prev => [notificationData, ...prev]);
      
      // Incrementa badge
      setBadgeCount(prev => prev + 1);
      
      // Context-aware actions baseado no tipo
      handleContextAwareNotification(notificationData);
    });

    // Listener para quando usuário interage com notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const notificationData = response.notification.request.content.data;
      handleNotificationAction(notificationData);
    });
  }, []);

  /**
   * Processa notificações com context awareness
   */
  const handleContextAwareNotification = useCallback((notification: NotificationData) => {
    switch (notification.type) {
      case 'chat':
        // Se está na tela de chat da conversa, marca como lida automaticamente
        // TODO: Implementar verificação de tela ativa
        break;
        
      case 'workout':
        // Se está em uma sessão de treino, prioriza notificação
        break;
        
      case 'progress':
        // Atualiza progress widgets automaticamente
        break;
        
      case 'achievement':
        // Celebra conquista com animação especial
        break;
        
      default:
        break;
    }
  }, []);

  /**
   * Processa ação da notificação (quando usuário toca)
   */
  const handleNotificationAction = useCallback((data: any) => {
    if (!data || !navigation) return;

    // Deep linking baseado no tipo de notificação
    switch (data.type) {
      case 'chat':
        if (data.chatId) {
          // Navigate to specific chat
          navigation.navigate('Chat', { chatId: data.chatId });
        }
        break;
        
      case 'workout':
        if (data.sessionId) {
          // Navigate to workout session
          navigation.navigate('WorkoutSession', { sessionId: data.sessionId });
        } else {
          // Navigate to workouts list
          navigation.navigate('Workouts');
        }
        break;
        
      case 'progress':
        // Navigate to progress screen
        navigation.navigate('Progress');
        break;
        
      case 'achievement':
        // Navigate to achievements screen
        navigation.navigate('Achievements');
        break;
        
      case 'schedule':
        // Navigate to calendar/schedule
        navigation.navigate('Schedule');
        break;
        
      default:
        // Navigate to home
        navigation.navigate('Home');
        break;
    }

    // Marca notificação como acionada
    markNotificationAsActioned(data.notificationId);
  }, [navigation]);

  /**
   * Envia notificação local
   */
  const sendLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: {
      sound?: string;
      categoryId?: string;
      badge?: number;
    }
  ): Promise<string | null> => {
    if (!settings?.enabled) return null;

    return await notificationService.sendLocalNotification({
      title,
      body,
      data,
      sound: options?.sound as any,
      categoryId: options?.categoryId,
      badge: options?.badge
    });
  }, [settings]);

  /**
   * Agenda notificação futura
   */
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledFor: Date,
    data?: Record<string, any>,
    options?: {
      identifier?: string;
      sound?: string;
      repeat?: boolean;
    }
  ): Promise<string | null> => {
    if (!settings?.enabled) return null;

    const trigger: Notifications.NotificationTriggerInput = {
      date: scheduledFor,
      repeats: options?.repeat || false
    };

    return await notificationService.scheduleNotification({
      title,
      body,
      data,
      trigger,
      identifier: options?.identifier,
      sound: options?.sound as any
    });
  }, [settings]);

  /**
   * Marca notificação como lida
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, is_read: true }
          : n
      )
    );

    // Decrementa badge
    setBadgeCount(prev => Math.max(0, prev - 1));
    await notificationService.setBadgeCount(Math.max(0, badgeCount - 1));
  }, [badgeCount]);

  /**
   * Marca notificação como acionada
   */
  const markNotificationAsActioned = useCallback(async (notificationId: string): Promise<void> => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, action_taken: true, is_read: true }
          : n
      )
    );
  }, []);

  /**
   * Limpa todas as notificações
   */
  const clearAllNotifications = useCallback(async (): Promise<void> => {
    setNotifications([]);
    setBadgeCount(0);
    await notificationService.clearBadgeCount();
  }, []);

  /**
   * Atualiza configurações de notificação
   */
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    const updatedSettings = { ...settings!, ...newSettings };
    setSettings(updatedSettings);
    await notificationService.updateSettings(newSettings);
  }, [settings]);

  /**
   * Helpers para tipos específicos de notificação
   */
  const sendChatNotification = useCallback(async (
    senderName: string, 
    message: string, 
    chatId: string
  ): Promise<void> => {
    if (!settings?.chatMessages) return;

    await notificationService.sendChatNotification(senderName, message, chatId);
  }, [settings]);

  const sendWorkoutReminder = useCallback(async (
    workoutName: string, 
    scheduledTime: string
  ): Promise<void> => {
    if (!settings?.workoutReminders) return;

    await notificationService.sendWorkoutReminder(workoutName, scheduledTime);
  }, [settings]);

  const sendAchievementNotification = useCallback(async (
    achievement: string
  ): Promise<void> => {
    if (!settings?.achievements) return;

    await notificationService.sendAchievementNotification(achievement);
  }, [settings]);

  const sendProgressNotification = useCallback(async (
    update: string
  ): Promise<void> => {
    if (!settings?.progressUpdates) return;

    await notificationService.sendProgressNotification(update);
  }, [settings]);

  // Initialize on mount
  useEffect(() => {
    if (user && !isInitialized) {
      initialize();
    }
  }, [user, isInitialized, initialize]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Auto-clear old notifications (keep last 50)
  useEffect(() => {
    if (notifications.length > 50) {
      setNotifications(prev => prev.slice(0, 50));
    }
  }, [notifications.length]);

  return {
    // Estado
    notifications,
    settings,
    isInitialized,
    badgeCount,
    unreadCount: notifications.filter(n => !n.is_read).length,
    
    // Actions
    sendLocalNotification,
    scheduleNotification,
    markAsRead,
    clearAllNotifications,
    updateSettings,
    
    // Specific notification types
    sendChatNotification,
    sendWorkoutReminder,
    sendAchievementNotification,
    sendProgressNotification,
    
    // Utilities
    hasUnreadNotifications: notifications.some(n => !n.is_read),
    recentNotifications: notifications.slice(0, 10),
    notificationsByType: (type: NotificationData['type']) => 
      notifications.filter(n => n.type === type),
    
    // Permission status
    hasPermission: settings?.enabled || false,
    pushToken: notificationService.getPushToken(),
  };
}

/**
 * Hook para gerenciar contexto de notificações baseado na tela ativa
 */
export function useNotificationContext() {
  const [currentScreen, setCurrentScreen] = useState<string>('');
  const [contextData, setContextData] = useState<Record<string, any>>({});

  const updateContext = useCallback((screen: string, data?: Record<string, any>) => {
    setCurrentScreen(screen);
    setContextData(data || {});
  }, []);

  const shouldShowNotification = useCallback((notificationType: string, notificationData?: any): boolean => {
    // Não mostrar notificações de chat se já está na conversa
    if (notificationType === 'chat' && currentScreen === 'Chat') {
      return notificationData?.chatId !== contextData?.chatId;
    }

    // Não mostrar notificações de treino se já está na sessão
    if (notificationType === 'workout' && currentScreen === 'WorkoutSession') {
      return notificationData?.sessionId !== contextData?.sessionId;
    }

    // Por padrão, mostra todas as outras notificações
    return true;
  }, [currentScreen, contextData]);

  return {
    currentScreen,
    contextData,
    updateContext,
    shouldShowNotification
  };
}

export default useNotifications;