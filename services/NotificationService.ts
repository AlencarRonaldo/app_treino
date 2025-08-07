/**
 * NotificationService - Gerencia push notifications e notificações locais
 * Integra Expo Notifications com real-time features
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Configuração de comportamento padrão das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | 'workout' | 'message' | 'achievement';
  badge?: number;
  categoryId?: string;
  channelId?: string;
}

export interface ScheduledNotificationPayload extends NotificationPayload {
  trigger: Notifications.NotificationTriggerInput;
  identifier?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  workoutReminders: boolean;
  chatMessages: boolean;
  progressUpdates: boolean;
  achievements: boolean;
  scheduleChanges: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

const STORAGE_KEYS = {
  PUSH_TOKEN: 'pushToken',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  BADGE_COUNT: 'badgeCount'
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  workoutReminders: true,
  chatMessages: true,
  progressUpdates: true,
  achievements: true,
  scheduleChanges: true,
  sound: true,
  vibration: true,
  badge: true
};

class NotificationService {
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private badgeCount: number = 0;
  private isInitialized: boolean = false;

  /**
   * Inicializa o serviço de notificações
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Carrega configurações salvas
      await this.loadSettings();
      await this.loadBadgeCount();

      // Configura canais de notificação (Android)
      await this.setupNotificationChannels();

      // Registra para push notifications se habilitado
      if (this.settings.enabled) {
        await this.registerForPushNotifications(userId);
      }

      this.isInitialized = true;
      console.log('NotificationService inicializado');
    } catch (error) {
      console.error('Erro ao inicializar NotificationService:', error);
    }
  }

  /**
   * Configura canais de notificação para Android
   */
  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      // Canal para mensagens de chat
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Mensagens',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'message.wav',
        description: 'Notificações de mensagens do chat'
      });

      // Canal para treinos
      await Notifications.setNotificationChannelAsync('workout', {
        name: 'Treinos',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 500],
        sound: 'workout.wav',
        description: 'Lembretes e notificações de treino'
      });

      // Canal para conquistas
      await Notifications.setNotificationChannelAsync('achievement', {
        name: 'Conquistas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 50, 100],
        sound: 'achievement.wav',
        description: 'Notificações de conquistas e metas alcançadas'
      });

      // Canal para progresso
      await Notifications.setNotificationChannelAsync('progress', {
        name: 'Progresso',
        importance: Notifications.AndroidImportance.LOW,
        sound: 'default',
        description: 'Atualizações de progresso'
      });
    }
  }

  /**
   * Registra o dispositivo para push notifications
   */
  private async registerForPushNotifications(userId?: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications só funcionam em dispositivos físicos');
      return null;
    }

    try {
      // Verifica permissões existentes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Solicita permissão se necessário
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissão para notificações negada');
        return null;
      }

      // Obtém token do dispositivo
      const token = await Notifications.getExpoPushTokenAsync();
      this.pushToken = token.data;
      
      // Salva token
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, this.pushToken);

      // Registra token no backend se usuário logado
      if (userId && this.pushToken) {
        await this.registerTokenInBackend(userId, this.pushToken);
      }

      console.log('Push token registrado:', this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
      return null;
    }
  }

  /**
   * Registra push token no backend
   */
  private async registerTokenInBackend(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: token,
          platform: Platform.OS,
          device_info: {
            brand: Device.brand,
            model: Device.modelName,
            os: Device.osName,
            osVersion: Device.osVersion
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar push token no backend:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar token no backend:', error);
    }
  }

  /**
   * Envia notificação local
   */
  async sendLocalNotification(payload: NotificationPayload): Promise<string | null> {
    if (!this.settings.enabled) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: this.settings.sound ? (payload.sound || 'default') : false,
          badge: this.settings.badge ? (payload.badge || this.badgeCount + 1) : undefined,
          categoryIdentifier: payload.categoryId,
        },
        trigger: null, // Imediata
      });

      // Atualiza badge count
      if (this.settings.badge && payload.badge !== undefined) {
        await this.setBadgeCount(payload.badge);
      } else if (this.settings.badge) {
        await this.incrementBadgeCount();
      }

      return identifier;
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error);
      return null;
    }
  }

  /**
   * Agenda notificação para o futuro
   */
  async scheduleNotification(payload: ScheduledNotificationPayload): Promise<string | null> {
    if (!this.settings.enabled) return null;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: this.settings.sound ? (payload.sound || 'default') : false,
          badge: this.settings.badge ? payload.badge : undefined,
          categoryIdentifier: payload.categoryId,
        },
        trigger: payload.trigger,
        identifier: payload.identifier,
      });

      return identifier;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  }

  /**
   * Cancela notificação agendada
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  /**
   * Cancela todas as notificações agendadas
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar todas as notificações:', error);
    }
  }

  /**
   * Gerenciamento de badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!this.settings.badge) return;

    try {
      this.badgeCount = Math.max(0, count);
      await Notifications.setBadgeCountAsync(this.badgeCount);
      await AsyncStorage.setItem(STORAGE_KEYS.BADGE_COUNT, this.badgeCount.toString());
    } catch (error) {
      console.error('Erro ao definir badge count:', error);
    }
  }

  async incrementBadgeCount(amount: number = 1): Promise<void> {
    await this.setBadgeCount(this.badgeCount + amount);
  }

  async clearBadgeCount(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Configurações de notificação
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(this.settings));

    // Se notificações foram desabilitadas, cancela todas as agendadas
    if (!this.settings.enabled) {
      await this.cancelAllScheduledNotifications();
      await this.clearBadgeCount();
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    return { ...this.settings };
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  private async loadBadgeCount(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.BADGE_COUNT);
      if (saved) {
        this.badgeCount = parseInt(saved, 10) || 0;
      }
    } catch (error) {
      console.error('Erro ao carregar badge count:', error);
    }
  }

  /**
   * Getters públicos
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  getBadgeCount(): number {
    return this.badgeCount;
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Helpers para tipos específicos de notificação
   */
  async sendChatNotification(senderName: string, message: string, chatId: string): Promise<void> {
    if (!this.settings.chatMessages) return;

    await this.sendLocalNotification({
      title: senderName,
      body: message,
      data: { type: 'chat', chatId },
      sound: 'message',
      categoryId: 'chat',
      channelId: 'chat'
    });
  }

  async sendWorkoutReminder(workoutName: string, scheduledTime: string): Promise<void> {
    if (!this.settings.workoutReminders) return;

    await this.sendLocalNotification({
      title: 'Hora do Treino! 💪',
      body: `${workoutName} está programado para ${scheduledTime}`,
      data: { type: 'workout_reminder' },
      sound: 'workout',
      categoryId: 'workout',
      channelId: 'workout'
    });
  }

  async sendAchievementNotification(achievement: string): Promise<void> {
    if (!this.settings.achievements) return;

    await this.sendLocalNotification({
      title: 'Parabéns! 🎉',
      body: achievement,
      data: { type: 'achievement' },
      sound: 'achievement',
      categoryId: 'achievement',
      channelId: 'achievement'
    });
  }

  async sendProgressNotification(update: string): Promise<void> {
    if (!this.settings.progressUpdates) return;

    await this.sendLocalNotification({
      title: 'Progresso Atualizado',
      body: update,
      data: { type: 'progress' },
      sound: 'default',
      categoryId: 'progress',
      channelId: 'progress'
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;