import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences } from '../types';

interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: 'device' | 'session' | 'system';
  read: boolean;
}

export class NotificationService {
  private static notifications: InAppNotification[] = [];
  private static listeners: ((notifications: InAppNotification[]) => void)[] = [];

  static async initialize(): Promise<void> {
    console.log('Notification service initialized with in-app notifications (Expo Go compatible)');
    await this.loadStoredNotifications();
  }

  static async sendDeviceDisconnectedNotification(): Promise<void> {
    const notification: InAppNotification = {
      id: Date.now().toString(),
      title: 'Device Disconnected',
      body: 'Your wearable device has lost connection. Attempting to reconnect...',
      timestamp: new Date(),
      type: 'device',
      read: false,
    };

    await this.addNotification(notification);
    
    // Show alert for important notifications
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: 'OK' }]
    );
  }

  static async sendLowBatteryNotification(batteryLevel: number): Promise<void> {
    const notification: InAppNotification = {
      id: Date.now().toString(),
      title: 'Low Battery Warning',
      body: `Your wearable device battery is at ${batteryLevel}%. Please charge soon.`,
      timestamp: new Date(),
      type: 'device',
      read: false,
    };

    await this.addNotification(notification);
    
    // Show alert for battery warnings
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: 'OK' }]
    );
  }

  static async sendSessionReminderNotification(): Promise<void> {
    const notification: InAppNotification = {
      id: Date.now().toString(),
      title: 'Session Reminder',
      body: "It's been a while since your last session. Start tracking your health today!",
      timestamp: new Date(),
      type: 'session',
      read: false,
    };

    await this.addNotification(notification);
  }

  static async sendSessionSummaryNotification(sessionLength: number, insights: number): Promise<void> {
    const minutes = Math.floor(sessionLength / 60);
    const notification: InAppNotification = {
      id: Date.now().toString(),
      title: 'Session Complete',
      body: `${minutes} minute session completed with ${insights} insights generated.`,
      timestamp: new Date(),
      type: 'session',
      read: false,
    };

    await this.addNotification(notification);
    
    // Show success alert
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: 'Great!' }]
    );
  }

  private static async addNotification(notification: InAppNotification): Promise<void> {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    await this.saveNotifications();
    this.notifyListeners();
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  static async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    this.notifyListeners();
  }

  static async clearAllNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
    this.notifyListeners();
  }

  static getNotifications(): InAppNotification[] {
    return [...this.notifications];
  }

  static getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  static subscribeToNotifications(listener: (notifications: InAppNotification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  private static async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('@notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private static async loadStoredNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  // Mock methods for recurring reminders (would be implemented with background tasks in production)
  static async scheduleRecurringReminders(): Promise<void> {
    console.log('Recurring reminders would be scheduled with background tasks in production');
  }

  static async cancelAllNotifications(): Promise<void> {
    console.log('All scheduled notifications cancelled');
  }

  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem('@notification_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Default preferences
    return {
      pushEnabled: true,
      localEnabled: true,
      categories: {
        device: true,
        session: true,
        system: true,
      },
    };
  }

  static async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem('@notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  static async checkNotificationHistory(): Promise<InAppNotification[]> {
    return this.getNotifications();
  }

  // Setup method (no-op for this implementation)
  static setupNotificationHandlers(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ): void {
    console.log('Notification handlers set up');
  }
}