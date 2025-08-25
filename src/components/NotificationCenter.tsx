import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Badge,
  List,
  Button,
  Divider,
} from 'react-native-paper';
import { NotificationService } from '../services/notifications';
import { theme } from '../utils/theme';

interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: 'device' | 'session' | 'system';
  read: boolean;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const NotificationCenter: React.FC<Props> = ({ visible, onDismiss }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    if (visible) {
      const unsubscribe = NotificationService.subscribeToNotifications(setNotifications);
      setNotifications(NotificationService.getNotifications());
      
      return unsubscribe;
    }
  }, [visible]);

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead();
  };

  const handleClearAll = async () => {
    await NotificationService.clearAllNotifications();
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'device':
        return 'bluetooth';
      case 'session':
        return 'play-circle';
      case 'system':
        return 'information';
      default:
        return 'bell';
    }
  };

  if (!visible) return null;

  return (
    <Surface style={styles.container} elevation={4}>
      <View style={styles.header}>
        <Text variant="titleLarge">Notifications</Text>
        <View style={styles.headerActions}>
          {notifications.some(n => !n.read) && (
            <Button mode="text" onPress={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
          />
        </View>
      </View>

      <Divider />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <IconButton
              icon="bell-outline"
              size={64}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No notifications yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              You'll see device alerts and session updates here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <Surface
                style={[
                  styles.notificationItem,
                  !notification.read && styles.unreadNotification,
                ]}
                elevation={0}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <IconButton
                      icon={getNotificationIcon(notification.type)}
                      size={20}
                      style={styles.notificationIcon}
                    />
                    <View style={styles.notificationText}>
                      <Text
                        variant="titleSmall"
                        style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadText,
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={styles.notificationBody}
                        numberOfLines={2}
                      >
                        {notification.body}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.timestamp}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>
                </View>
                {!notification.read && (
                  <View style={styles.unreadIndicator} />
                )}
              </Surface>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {notifications.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="text"
            onPress={handleClearAll}
            textColor={theme.colors.error}
          >
            Clear All
          </Button>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    maxHeight: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    maxHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  notificationItem: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
  },
  unreadNotification: {
    backgroundColor: theme.colors.primaryContainer,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    margin: 0,
    marginRight: 8,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationBody: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  timestamp: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
});