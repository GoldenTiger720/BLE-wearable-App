/**
 * LiveDataScreen - Real-time Backend Data Display
 * Shows real-time biosignal data processed through all three proprietary layers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { backendAPI, StreamDataResponse } from '../../services/backendApi';
import { BiosignalCard } from '../../components/BiosignalCard';
import { WellnessCard } from '../../components/WellnessCard';
import { LayerProcessingCard } from '../../components/LayerProcessingCard';
import type { WellnessMetrics, HealthCondition } from '../../types';

export const LiveDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { auth, connectedDevice } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [streamData, setStreamData] = useState<StreamDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const pollingStopFn = useRef<(() => void) | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Start/stop auto-refresh
  useEffect(() => {
    if (autoRefresh && isBackendConnected) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [autoRefresh, isBackendConnected]);

  const checkBackendHealth = async () => {
    try {
      const health = await backendAPI.checkHealth();
      if (health && health.status === 'healthy') {
        setIsBackendConnected(true);
        setError(null);
        // Connect device if not already connected
        if (auth.user?.id) {
          await connectToBackend();
        }
        // Fetch initial data
        await fetchData();
      } else {
        setIsBackendConnected(false);
        setError('Backend is not responding');
      }
    } catch (err) {
      setIsBackendConnected(false);
      setError('Cannot connect to backend. Make sure the server is running.');
      console.error('Backend health check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToBackend = async () => {
    if (!auth.user) return;

    try {
      const response = await backendAPI.connectDevice(
        auth.user.id,
        'mobile_app',
        auth.user.id
      );
      console.log('Connected to backend:', response.session_id);
    } catch (err) {
      console.error('Failed to connect device:', err);
    }
  };

  const fetchData = async () => {
    try {
      const data = await backendAPI.getStreamData();
      setStreamData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stream data:', err);
      setError('Failed to fetch data from backend');
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingStopFn.current) {
      pollingStopFn.current();
      pollingStopFn.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling(); // Stop any existing polling

    pollingStopFn.current = backendAPI.startPolling(
      (data) => {
        setStreamData(data);
        setLastUpdate(new Date());
        setError(null);
      },
      1000, // 1 second interval
      (err) => {
        console.error('Polling error:', err);
        setError('Polling error occurred');
      }
    );
  }, [stopPolling]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Convert backend data to app types
  const getWellnessMetrics = (): WellnessMetrics | null => {
    if (!streamData) return null;
    return {
      overall_wellness: streamData.lia_insights.wellness_score,
      cardiovascular_health: streamData.lia_insights.wellness_assessment.cardiovascular_health,
      respiratory_health: streamData.lia_insights.wellness_assessment.respiratory_health,
      activity_level: streamData.lia_insights.wellness_assessment.activity_level,
      stress_level: streamData.lia_insights.wellness_assessment.stress_level,
    };
  };

  const getHealthCondition = (): HealthCondition | null => {
    if (!streamData) return null;
    return {
      condition: streamData.lia_insights.condition,
      confidence: streamData.lia_insights.confidence,
      probabilities: streamData.lia_insights.probabilities,
      recommendation: streamData.lia_insights.recommendation,
    };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Connecting to backend...
        </Text>
      </View>
    );
  }

  if (!isBackendConnected || error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Surface style={styles.errorSurface} elevation={2}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Backend Not Connected
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {error || 'Cannot connect to the backend server'}
          </Text>
          <Text variant="bodySmall" style={styles.errorHint}>
            Make sure the FastAPI backend is running:
          </Text>
          <Surface style={styles.codeBlock} elevation={1}>
            <Text variant="bodySmall" style={styles.codeText}>
              cd backend && python main.py
            </Text>
          </Surface>
          <Button
            mode="contained"
            onPress={checkBackendHealth}
            style={styles.retryButton}
            icon="refresh"
          >
            Retry Connection
          </Button>
        </Surface>
      </View>
    );
  }

  const wellnessMetrics = getWellnessMetrics();
  const healthCondition = getHealthCondition();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Live Biosignal Data
            </Text>
            <View style={styles.statusRow}>
              <Chip
                compact
                icon="circle"
                style={[styles.statusChip, { backgroundColor: '#4CAF5015' }]}
                textStyle={{ color: '#4CAF50' }}
              >
                Connected
              </Chip>
              <Text variant="labelSmall" style={styles.lastUpdateText}>
                Updated: {lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
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
      </Surface>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {streamData ? (
          <>
            {/* Raw Biosignals */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Real-Time Biosignals
              </Text>
              <View style={styles.biosignalGrid}>
                <BiosignalCard
                  type="heart_rate"
                  value={streamData.raw_signals.heart_rate}
                  unit="BPM"
                  quality={streamData.clarity_layer.quality_metrics.heart_rate_quality}
                />
                <BiosignalCard
                  type="spo2"
                  value={streamData.raw_signals.spo2}
                  unit="%"
                  quality={streamData.clarity_layer.quality_metrics.spo2_quality}
                />
                <BiosignalCard
                  type="temperature"
                  value={streamData.raw_signals.temperature}
                  unit="°C"
                  quality={streamData.clarity_layer.quality_metrics.temperature_quality}
                />
                <BiosignalCard
                  type="activity"
                  value={streamData.raw_signals.activity}
                  unit="steps/min"
                  quality={streamData.clarity_layer.quality_metrics.activity_quality}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Wellness Assessment */}
            {wellnessMetrics && healthCondition && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  LIA Health Insights
                </Text>
                <WellnessCard
                  wellnessMetrics={wellnessMetrics}
                  healthCondition={healthCondition}
                  riskFactors={streamData.lia_insights.risk_factors}
                  positiveIndicators={streamData.lia_insights.positive_indicators}
                />
              </View>
            )}

            <Divider style={styles.divider} />

            {/* Layer Processing Details */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Processing Layers
              </Text>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Clarity™ • iFRS™ • Timesystems™
              </Text>
              <LayerProcessingCard streamData={streamData} />
            </View>

            {/* Spacer for bottom */}
            <View style={{ height: 100 }} />
          </>
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading data...
            </Text>
          </View>
        )}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  lastUpdateText: {
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    opacity: 0.6,
    marginBottom: 8,
  },
  biosignalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  divider: {
    marginVertical: 8,
  },
  loadingText: {
    marginTop: 16,
  },
  errorSurface: {
    padding: 24,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  errorHint: {
    opacity: 0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  codeBlock: {
    padding: 12,
    backgroundColor: '#0001',
    borderRadius: 4,
    marginBottom: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 8,
  },
});
