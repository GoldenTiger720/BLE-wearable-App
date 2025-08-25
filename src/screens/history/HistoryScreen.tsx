import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  Button,
  Card,
  IconButton,
  Searchbar,
  Menu,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { Session } from '../../types';
import { theme } from '../../utils/theme';
import { ensureDate, calculateDuration, formatDuration } from '../../utils/dateHelpers';

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { sessions } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.messages.some((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply date filter
    const now = new Date();
    switch (selectedFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter((s) => s.startTime >= today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((s) => s.startTime >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((s) => s.startTime >= monthAgo);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return ensureDate(b.startTime).getTime() - ensureDate(a.startTime).getTime();
      } else {
        const aDuration = calculateDuration(a.startTime, a.endTime);
        const bDuration = calculateDuration(b.startTime, b.endTime);
        return bDuration - aDuration;
      }
    });

    return filtered;
  }, [sessions, searchQuery, selectedFilter, sortBy]);

  const formatSessionDuration = (session: Session): string => {
    if (!session.endTime) return 'Ongoing';
    const duration = calculateDuration(session.startTime, session.endTime);
    return formatDuration(duration);
  };

  const formatSessionDate = (session: Session): string => {
    const now = new Date();
    const sessionDate = ensureDate(session.startTime);
    
    // Check if it's today
    if (
      sessionDate.getDate() === now.getDate() &&
      sessionDate.getMonth() === now.getMonth() &&
      sessionDate.getFullYear() === now.getFullYear()
    ) {
      try {
        return sessionDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      } catch (error) {
        return `${sessionDate.getHours()}:${sessionDate.getMinutes().toString().padStart(2, '0')}`;
      }
    }
    
    // Check if it's this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (sessionDate > weekAgo) {
      try {
        return sessionDate.toLocaleDateString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        });
      } catch (error) {
        return `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
      }
    }
    
    // Older dates
    try {
      return sessionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      return `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
    }
  };

  const getSessionIcon = (session: Session): string => {
    if (session.status === 'active') return 'play-circle';
    if (session.status === 'paused') return 'pause-circle';
    return 'check-circle';
  };

  const getSessionColor = (session: Session): string => {
    if (session.status === 'active') return theme.colors.primary;
    if (session.status === 'paused') return theme.colors.tertiary;
    return theme.colors.secondary;
  };

  const handleSessionPress = (session: Session) => {
    navigation.navigate('SessionDetail' as never, { sessionId: session.id } as never);
  };

  const renderSessionCard = (session: Session) => (
    <Card
      key={session.id}
      style={styles.sessionCard}
      onPress={() => handleSessionPress(session)}
    >
      <Card.Content>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <IconButton
              icon={getSessionIcon(session)}
              size={24}
              iconColor={getSessionColor(session)}
              style={styles.sessionIcon}
            />
            <View>
              <Text variant="titleMedium">{formatSessionDate(session)}</Text>
              <Text variant="bodySmall" style={styles.sessionMeta}>
                {formatSessionDuration(session)} • {session.messages.length} messages
              </Text>
            </View>
          </View>
          <Chip compact>{session.status}</Chip>
        </View>

        <Text
          variant="bodyMedium"
          style={styles.sessionSummary}
          numberOfLines={2}
        >
          {session.summary ||
            session.messages[0]?.content ||
            'Health monitoring session'}
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
            {session.highlights.length > 3 && (
              <Chip compact style={styles.highlightChip}>
                +{session.highlights.length - 3} more
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Session History
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {sessions.length} sessions • {filteredSessions.length} shown
        </Text>
      </View>

      <View style={styles.filterBar}>
        <Searchbar
          placeholder="Search sessions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <IconButton
              icon="filter-variant"
              size={24}
              onPress={() => setFilterMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            title="All Sessions"
            onPress={() => {
              setSelectedFilter('all');
              setFilterMenuVisible(false);
            }}
            leadingIcon={selectedFilter === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            title="Today"
            onPress={() => {
              setSelectedFilter('today');
              setFilterMenuVisible(false);
            }}
            leadingIcon={selectedFilter === 'today' ? 'check' : undefined}
          />
          <Menu.Item
            title="This Week"
            onPress={() => {
              setSelectedFilter('week');
              setFilterMenuVisible(false);
            }}
            leadingIcon={selectedFilter === 'week' ? 'check' : undefined}
          />
          <Menu.Item
            title="This Month"
            onPress={() => {
              setSelectedFilter('month');
              setFilterMenuVisible(false);
            }}
            leadingIcon={selectedFilter === 'month' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item
            title="Sort by Date"
            onPress={() => {
              setSortBy('date');
              setFilterMenuVisible(false);
            }}
            leadingIcon={sortBy === 'date' ? 'check' : undefined}
          />
          <Menu.Item
            title="Sort by Duration"
            onPress={() => {
              setSortBy('duration');
              setFilterMenuVisible(false);
            }}
            leadingIcon={sortBy === 'duration' ? 'check' : undefined}
          />
        </Menu>
      </View>

      {selectedFilter !== 'all' && (
        <View style={styles.activeFilter}>
          <Chip
            icon="filter"
            onClose={() => setSelectedFilter('all')}
            style={styles.filterChip}
          >
            {selectedFilter === 'today' && 'Today'}
            {selectedFilter === 'week' && 'This Week'}
            {selectedFilter === 'month' && 'This Month'}
          </Chip>
        </View>
      )}

      <ScrollView
        style={styles.sessionList}
        showsVerticalScrollIndicator={false}
      >
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => renderSessionCard(session))
        ) : (
          <Surface style={styles.emptyState} elevation={1}>
            <IconButton
              icon="history"
              size={64}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              {searchQuery || selectedFilter !== 'all'
                ? 'No sessions found'
                : 'No sessions yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start your first session to begin tracking'}
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Dashboard' as never)}
                style={styles.startButton}
              >
                Start First Session
              </Button>
            )}
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    color: theme.colors.onSurface,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  activeFilter: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChip: {
    alignSelf: 'flex-start',
  },
  sessionList: {
    flex: 1,
    paddingHorizontal: 20,
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
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionIcon: {
    margin: 0,
    marginRight: 8,
  },
  sessionMeta: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sessionSummary: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  emptyState: {
    padding: 32,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyTitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    marginTop: 16,
  },
});