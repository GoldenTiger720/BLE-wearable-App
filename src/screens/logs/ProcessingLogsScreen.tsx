/**
 * ProcessingLogsScreen - Display Backend Processing Logs
 * Shows real-time logs from Clarity™, iFRS™, and Timesystems™ layers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  ActivityIndicator,
  Chip,
  List,
  useTheme,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { backendAPI, ProcessingLog } from '../../services/backendApi';

export const ProcessingLogsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await backendAPI.getProcessingLogs(100);
      setLogs(response.logs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to fetch processing logs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getLogLevelColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return '#FF5722';
      case 'WARNING':
        return '#FFC107';
      case 'INFO':
        return '#2196F3';
      case 'DEBUG':
        return '#9E9E9E';
      case 'SUCCESS':
        return '#4CAF50';
      default:
        return theme.colors.onSurface;
    }
  };

  const getLogLevelIcon = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'alert-circle';
      case 'WARNING':
        return 'alert';
      case 'INFO':
        return 'information';
      case 'DEBUG':
        return 'bug';
      case 'SUCCESS':
        return 'check-circle';
      default:
        return 'circle';
    }
  };

  const getLayerColor = (message: string): string => {
    if (message.includes('Clarity')) return '#4ECDC4';
    if (message.includes('iFRS')) return '#FF6B6B';
    if (message.includes('Timesystems')) return '#96CEB4';
    return theme.colors.onSurfaceVariant;
  };

  const filteredLogs = filterLevel
    ? logs.filter((log) => log.level.toUpperCase() === filterLevel.toUpperCase())
    : logs;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading logs...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Processing Logs
            </Text>
            <Text variant="labelSmall" style={styles.headerSubtitle}>
              Real-time layer processing activity
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={autoRefresh ? 'pause' : 'play'}
              mode="contained"
              size={24}
              onPress={toggleAutoRefresh}
            />
            <IconButton
              icon="close"
              size={24}
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <Chip
            selected={filterLevel === null}
            onPress={() => setFilterLevel(null)}
            style={styles.filterChip}
          >
            All ({logs.length})
          </Chip>
          <Chip
            selected={filterLevel === 'INFO'}
            onPress={() => setFilterLevel('INFO')}
            style={styles.filterChip}
            icon="information"
          >
            Info
          </Chip>
          <Chip
            selected={filterLevel === 'SUCCESS'}
            onPress={() => setFilterLevel('SUCCESS')}
            style={styles.filterChip}
            icon="check-circle"
          >
            Success
          </Chip>
          <Chip
            selected={filterLevel === 'WARNING'}
            onPress={() => setFilterLevel('WARNING')}
            style={styles.filterChip}
            icon="alert"
          >
            Warning
          </Chip>
          <Chip
            selected={filterLevel === 'ERROR'}
            onPress={() => setFilterLevel('ERROR')}
            style={styles.filterChip}
            icon="alert-circle"
          >
            Error
          </Chip>
        </ScrollView>
      </Surface>

      {/* Logs List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {error ? (
          <Surface style={styles.errorSurface} elevation={1}>
            <Text variant="bodyMedium" style={styles.errorText}>
              {error}
            </Text>
            <Button mode="contained" onPress={fetchLogs} style={styles.retryButton}>
              Retry
            </Button>
          </Surface>
        ) : filteredLogs.length === 0 ? (
          <View style={styles.centered}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No logs available
            </Text>
          </View>
        ) : (
          <View style={styles.logsContainer}>
            {filteredLogs.map((log, index) => (
              <React.Fragment key={`${log.timestamp}-${index}`}>
                <Surface style={styles.logCard} elevation={1}>
                  <View style={styles.logHeader}>
                    <View style={styles.logLevelBadge}>
                      <Chip
                        compact
                        icon={getLogLevelIcon(log.level)}
                        style={[
                          styles.levelChip,
                          { backgroundColor: `${getLogLevelColor(log.level)}15` },
                        ]}
                        textStyle={{
                          color: getLogLevelColor(log.level),
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        {log.level.toUpperCase()}
                      </Chip>
                    </View>
                    <Text variant="labelSmall" style={styles.timestamp}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>

                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.logMessage,
                      { color: getLayerColor(log.message) },
                    ]}
                  >
                    {log.message}
                  </Text>

                  {log.data && Object.keys(log.data).length > 0 && (
                    <Surface style={styles.logDataContainer} elevation={0}>
                      {Object.entries(log.data).map(([key, value]) => (
                        <View key={key} style={styles.logDataRow}>
                          <Text variant="labelSmall" style={styles.logDataKey}>
                            {key}:
                          </Text>
                          <Text variant="bodySmall" style={styles.logDataValue}>
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </Text>
                        </View>
                      ))}
                    </Surface>
                  )}
                </Surface>
                {index < filteredLogs.length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterContainer: {
    marginTop: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  logsContainer: {
    padding: 16,
  },
  logCard: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logLevelBadge: {
    flex: 1,
  },
  levelChip: {
    alignSelf: 'flex-start',
  },
  timestamp: {
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  logMessage: {
    lineHeight: 20,
    fontWeight: '500',
  },
  logDataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  logDataRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  logDataKey: {
    fontWeight: '600',
    marginRight: 8,
    opacity: 0.7,
  },
  logDataValue: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  divider: {
    marginVertical: 4,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyText: {
    opacity: 0.6,
  },
  errorSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
});
