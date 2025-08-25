import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Chip,
  Card,
  Avatar,
  ProgressBar,
  Badge,
  Menu,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { theme } from '../../utils/theme';
import { formatTimeString, calculateDuration, formatDuration } from '../../utils/dateHelpers';
import { QUICK_PROMPTS } from '../../constants';
import { Session } from '../../types';
import { NotificationCenter } from '../../components/NotificationCenter';
import { NotificationService } from '../../services/notifications';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    auth,
    connectedDevice,
    sessions,
    currentSession,
    startSession,
  } = useAppStore();

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([QUICK_PROMPTS[0]]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [todaySummary, setTodaySummary] = useState({
    sessions: 0,
    activeTime: 0,
    insights: 0,
  });

  useEffect(() => {
    // Calculate today's summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => 
      s.startTime >= today
    );
    
    const totalTime = todaySessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime.getTime() - s.startTime.getTime());
      }
      return acc;
    }, 0);

    setTodaySummary({
      sessions: todaySessions.length,
      activeTime: Math.floor(totalTime / 1000 / 60), // minutes
      insights: todaySessions.reduce((acc, s) => acc + (s.highlights?.length || 0), 0),
    });

    // Subscribe to notification updates
    const unsubscribe = NotificationService.subscribeToNotifications(() => {
      setUnreadCount(NotificationService.getUnreadCount());
    });

    // Initial unread count
    setUnreadCount(NotificationService.getUnreadCount());

    return unsubscribe;
  }, [sessions]);

  const getRecentSessions = (): Session[] => {
    return sessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 3);
  };

  const formatSessionDuration = (session: Session): string => {
    if (!session.endTime) return 'Ongoing';
    const duration = calculateDuration(session.startTime, session.endTime);
    return formatDuration(duration);
  };

  const handleStartSession = () => {
    if (!connectedDevice && !useAppStore.getState().simulatorEnabled) {
      navigation.navigate('WearablePairing' as never);
      return;
    }
    
    startSession();
    navigation.navigate('Session' as never, { prompts: selectedPrompts } as never);
  };

  const togglePrompt = (prompt: string) => {
    setSelectedPrompts(prev => 
      prev.includes(prompt)
        ? prev.filter(p => p !== prompt)
        : [...prev, prompt]
    );
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await useAppStore.getState().setAuth({
      isAuthenticated: false,
      user: undefined,
      token: undefined,
    });
    // Navigation will automatically change due to auth state update in AppNavigator
  };

  const renderConnectionStatus = () => {
    if (!connectedDevice && !useAppStore.getState().simulatorEnabled) {
      return (
        <Surface style={[styles.statusCard, styles.disconnectedCard]} elevation={2}>
          <IconButton
            icon="bluetooth-off"
            size={32}
            iconColor={theme.colors.error}
          />
          <View style={styles.statusInfo}>
            <Text variant="titleMedium">No Device Connected</Text>
            <Text variant="bodySmall" style={styles.statusSubtext}>
              Tap to connect a wearable device
            </Text>
          </View>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => navigation.navigate('WearablePairing' as never)}
          />
        </Surface>
      );
    }

    const device = connectedDevice || { 
      name: 'Simulator', 
      batteryLevel: 100, 
      rssi: -50 
    };

    return (
      <Surface style={[styles.statusCard, styles.connectedCard]} elevation={2}>
        <IconButton
          icon="watch"
          size={32}
          iconColor={theme.colors.primary}
        />
        <View style={styles.statusInfo}>
          <Text variant="titleMedium">{device.name}</Text>
          <View style={styles.statusDetails}>
            <Chip style={styles.statusChip} textStyle={styles.chipText}>
              {device.batteryLevel}% Battery
            </Chip>
            <Chip style={styles.statusChip} textStyle={styles.chipText}>
              {Math.abs(device.rssi)} dBm
            </Chip>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={handleStartSession}
          disabled={!!currentSession}
        >
          Start Session
        </Button>
      </Surface>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View>
          <Text variant="headlineLarge" style={styles.greeting}>
            Hello, {auth.user?.name || 'User'}
          </Text>
          <Text variant="bodyLarge" style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.notificationWrapper}>
            <IconButton
              icon="bell"
              size={24}
              onPress={() => setShowNotifications(!showNotifications)}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <Menu
            visible={showUserMenu}
            onDismiss={() => setShowUserMenu(false)}
            anchor={
              <TouchableOpacity onPress={() => setShowUserMenu(true)}>
                <Avatar.Icon
                  size={48}
                  icon="account"
                  style={styles.avatar}
                />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setShowUserMenu(false);
                navigation.navigate('MyProfile' as never);
              }}
              title="My Profile"
              leadingIcon="account"
            />
            <Menu.Item
              onPress={handleLogout}
              title="Logout"
              leadingIcon="logout"
            />
          </Menu>
        </View>
      </View>

      <Surface style={styles.summaryCard} elevation={2}>
        <Text variant="titleMedium" style={styles.summaryTitle}>
          Today's Summary
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {todaySummary.sessions}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Sessions
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {todaySummary.activeTime}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Minutes
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {todaySummary.insights}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Insights
            </Text>
          </View>
        </View>
      </Surface>

      {renderConnectionStatus()}

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Sessions
        </Text>
        {getRecentSessions().length > 0 ? (
          getRecentSessions().map((session) => (
            <Card
              key={session.id}
              style={styles.sessionCard}
              onPress={() => navigation.navigate('SessionDetail' as never, { sessionId: session.id } as never)}
            >
              <Card.Content>
                <View style={styles.sessionHeader}>
                  <Text variant="titleMedium">
                    {formatTimeString(session.startTime, { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <Chip compact>{formatSessionDuration(session)}</Chip>
                </View>
                <Text
                  variant="bodyMedium"
                  style={styles.sessionSummary}
                  numberOfLines={2}
                >
                  {session.summary || 'Session completed with health monitoring and AI insights.'}
                </Text>
                {session.highlights && session.highlights.length > 0 && (
                  <View style={styles.highlightChips}>
                    {session.highlights.slice(0, 3).map((highlight, index) => (
                      <Chip
                        key={index}
                        compact
                        style={styles.highlightChip}
                      >
                        {highlight}
                      </Chip>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Surface style={styles.emptyCard} elevation={1}>
            <IconButton
              icon="history"
              size={48}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No sessions yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start your first session to begin tracking
            </Text>
          </Surface>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Prompts
        </Text>
        <Text variant="bodyMedium" style={styles.promptSubtitle}>
          Select prompts for your next session
        </Text>
        <View style={styles.promptGrid}>
          {QUICK_PROMPTS.map((prompt) => (
            <Chip
              key={prompt}
              selected={selectedPrompts.includes(prompt)}
              onPress={() => togglePrompt(prompt)}
              style={styles.promptChip}
              showSelectedCheck={false}
            >
              {prompt}
            </Chip>
          ))}
        </View>
        
        {/* Demo Notification Buttons */}
        <View style={styles.demoSection}>
          <Text variant="titleMedium" style={styles.demoTitle}>
            Demo Notifications
          </Text>
          <View style={styles.demoButtons}>
            <Button
              mode="outlined"
              onPress={() => NotificationService.sendDeviceDisconnectedNotification()}
              style={styles.demoButton}
            >
              Device Alert
            </Button>
            <Button
              mode="outlined"
              onPress={() => NotificationService.sendLowBatteryNotification(25)}
              style={styles.demoButton}
            >
              Battery Alert
            </Button>
            <Button
              mode="outlined"
              onPress={() => NotificationService.sendSessionSummaryNotification(1800, 3)}
              style={styles.demoButton}
            >
              Session Complete
            </Button>
          </View>
        </View>
      </View>
      
      <NotificationCenter
        visible={showNotifications}
        onDismiss={() => setShowNotifications(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  greeting: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  date: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  summaryCard: {
    margin: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: theme.roundness,
  },
  summaryTitle: {
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.colors.surfaceVariant,
    marginVertical: 4,
  },
  statusCard: {
    margin: 20,
    marginTop: 12,
    padding: 20,
    paddingVertical: 24,
    borderRadius: theme.roundness,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedCard: {
    backgroundColor: theme.colors.surface,
  },
  disconnectedCard: {
    backgroundColor: theme.colors.errorContainer,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 8,
  },
  statusSubtext: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusDetails: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    marginRight: 8,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  sessionCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSummary: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  highlightChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  highlightChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  emptyCard: {
    padding: 32,
    borderRadius: theme.roundness,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  promptSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  promptChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  demoSection: {
    marginTop: 24,
  },
  demoTitle: {
    marginBottom: 12,
    color: theme.colors.onSurface,
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  demoButton: {
    marginRight: 8,
    marginBottom: 8,
  },
});