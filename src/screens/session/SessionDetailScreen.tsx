import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Surface,
  Card,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { theme } from '../../utils/theme';
import { ensureDate, formatTimeString, formatDateString, calculateDuration, formatDuration } from '../../utils/dateHelpers';
import { Session, SensorEvent } from '../../types';

interface SessionDetailRouteParams {
  sessionId: string;
}

export const SessionDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params as SessionDetailRouteParams;
  
  const { sessions } = useAppStore((state) => ({
    sessions: state.sessions,
  }));

  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return (
      <View style={styles.container}>
        <Surface style={styles.errorCard} elevation={2}>
          <Text variant="titleLarge" style={styles.errorTitle}>
            Session Not Found
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            The session you're looking for doesn't exist or has been removed.
          </Text>
          <IconButton
            icon="arrow-left"
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </Surface>
      </View>
    );
  }

  const getSessionDuration = (session: Session): string => {
    if (!session.endTime) return 'In progress...';
    
    const duration = calculateDuration(session.startTime, session.endTime);
    return formatDuration(duration);
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.secondary;
      case 'paused':
        return theme.colors.tertiary;
      case 'ended':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.primary;
    }
  };

  const getSensorIcon = (type: SensorEvent['type']) => {
    switch (type) {
      case 'heartRate':
        return 'heart-pulse';
      case 'steps':
        return 'walk';
      case 'activity':
        return 'run';
      case 'battery':
        return 'battery';
      default:
        return 'chart-line';
    }
  };

  const formatSensorValue = (event: SensorEvent) => {
    switch (event.type) {
      case 'heartRate':
        return `${event.value} BPM`;
      case 'steps':
        return `${event.value} steps`;
      case 'battery':
        return `${event.value}%`;
      default:
        return String(event.value);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Session Header */}
      <Surface style={styles.headerCard} elevation={3}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={styles.sessionTitle}>
              Session Details
            </Text>
            <Text variant="bodyLarge" style={styles.sessionDate}>
              {formatDateString(session.startTime, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text variant="bodyMedium" style={styles.sessionTime}>
              {formatTimeString(session.startTime, {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })} - {session.endTime ? formatTimeString(session.endTime, {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }) : 'Ongoing'}
            </Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: `${getStatusColor(session.status)}15` }]}
            textStyle={{ color: getStatusColor(session.status) }}
          >
            {session.status.toUpperCase()}
          </Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>Duration</Text>
            <Text variant="titleMedium" style={styles.statValue}>
              {getSessionDuration(session)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>Messages</Text>
            <Text variant="titleMedium" style={styles.statValue}>
              {session.messages.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>Sensor Events</Text>
            <Text variant="titleMedium" style={styles.statValue}>
              {session.sensorEvents.length}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Session Summary */}
      {session.summary && (
        <Card style={styles.summaryCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              <IconButton icon="clipboard-text" size={20} style={styles.inlineIcon} />
              Summary
            </Text>
            <Text variant="bodyMedium" style={styles.summaryText}>
              {session.summary}
            </Text>
            
            {session.highlights && session.highlights.length > 0 && (
              <View style={styles.highlightsContainer}>
                <Text variant="labelLarge" style={styles.highlightsTitle}>
                  Key Highlights:
                </Text>
                {session.highlights.map((highlight, index) => (
                  <View key={index} style={styles.highlightItem}>
                    <Text variant="bodySmall" style={styles.highlightText}>
                      • {highlight}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Messages */}
      <Card style={styles.messagesCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <IconButton icon="message-text" size={20} style={styles.inlineIcon} />
            Conversation ({session.messages.length})
          </Text>
          
          {session.messages.length > 0 ? (
            <View style={styles.messagesContainer}>
              {session.messages.map((message, index) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageItem,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text variant="labelSmall" style={styles.messageRole}>
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                      {message.isVoice && (
                        <IconButton icon="microphone" size={14} style={styles.voiceIcon} />
                      )}
                    </Text>
                    <Text variant="labelSmall" style={styles.messageTime}>
                      {formatTimeString(message.timestamp, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.messageContent}>
                    {message.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No messages in this session.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Sensor Events */}
      <Card style={styles.sensorCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <IconButton icon="chart-line" size={20} style={styles.inlineIcon} />
            Sensor Data ({session.sensorEvents.length})
          </Text>
          
          {session.sensorEvents.length > 0 ? (
            <View style={styles.sensorContainer}>
              {session.sensorEvents.map((event) => (
                <View key={event.id} style={styles.sensorItem}>
                  <IconButton
                    icon={getSensorIcon(event.type)}
                    size={24}
                    iconColor={theme.colors.primary}
                    style={styles.sensorIcon}
                  />
                  <View style={styles.sensorDetails}>
                    <Text variant="bodyMedium" style={styles.sensorType}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Text>
                    <Text variant="bodySmall" style={styles.sensorTime}>
                      {formatTimeString(event.timestamp, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text variant="titleSmall" style={styles.sensorValue}>
                    {formatSensorValue(event)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No sensor events recorded.
            </Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  sessionDate: {
    marginBottom: 2,
    color: theme.colors.onSurface,
  },
  sessionTime: {
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    marginLeft: 16,
  },
  divider: {
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  messagesCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sensorCard: {
    borderRadius: 12,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  inlineIcon: {
    margin: 0,
    marginRight: 4,
  },
  summaryText: {
    marginBottom: 12,
    lineHeight: 20,
    color: theme.colors.onSurface,
  },
  highlightsContainer: {
    marginTop: 8,
  },
  highlightsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  highlightItem: {
    marginBottom: 4,
  },
  highlightText: {
    color: theme.colors.onSurfaceVariant,
  },
  messagesContainer: {
    gap: 12,
  },
  messageItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: `${theme.colors.primary}05`,
    borderColor: `${theme.colors.primary}20`,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageRole: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  messageTime: {
    color: theme.colors.onSurfaceVariant,
  },
  messageContent: {
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  voiceIcon: {
    margin: 0,
    marginLeft: 4,
  },
  sensorContainer: {
    gap: 8,
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  sensorIcon: {
    margin: 0,
    marginRight: 12,
  },
  sensorDetails: {
    flex: 1,
  },
  sensorType: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  sensorTime: {
    color: theme.colors.onSurfaceVariant,
  },
  sensorValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 20,
  },
  errorCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: 12,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
  },
});