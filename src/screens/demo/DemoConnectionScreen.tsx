/**
 * DemoConnectionScreen - API Communication Demonstration
 * Shows mock connections and demonstrates how the app communicates with the backend
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Chip,
  List,
  useTheme,
  ActivityIndicator,
  Divider,
  Card,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { backendAPI, SystemStatus } from '../../services/backendApi';
import { useAppStore } from '../../store';

interface APITest {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: 'pending' | 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export const DemoConnectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { auth } = useAppStore();

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [tests, setTests] = useState<APITest[]>([
    {
      id: 'health',
      name: 'Health Check',
      description: 'Verify backend is running',
      endpoint: '/api/v1/health',
      status: 'pending',
    },
    {
      id: 'connect',
      name: 'Device Connection',
      description: 'Connect mobile app to backend',
      endpoint: '/api/v1/connect',
      status: 'pending',
    },
    {
      id: 'stream',
      name: 'Stream Data',
      description: 'Fetch real-time biosignal stream',
      endpoint: '/api/v1/stream',
      status: 'pending',
    },
    {
      id: 'predict',
      name: 'LIA Prediction',
      description: 'Get health prediction from LIA',
      endpoint: '/api/v1/predict',
      status: 'pending',
    },
    {
      id: 'layers',
      name: 'Layer Demo',
      description: 'Demonstrate all three processing layers',
      endpoint: '/api/v1/demo/layers',
      status: 'pending',
    },
    {
      id: 'logs',
      name: 'Processing Logs',
      description: 'Fetch backend processing logs',
      endpoint: '/api/v1/logs/processing',
      status: 'pending',
    },
  ]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await backendAPI.checkHealth();
      setSystemStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runTest = async (testId: string) => {
    const startTime = Date.now();

    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'running', error: undefined } : t))
    );

    try {
      let response: any;

      switch (testId) {
        case 'health':
          response = await backendAPI.checkHealth();
          break;

        case 'connect':
          response = await backendAPI.connectDevice(
            auth.user?.id || 'demo-user',
            'mobile_app',
            auth.user?.id
          );
          break;

        case 'stream':
          response = await backendAPI.getStreamData();
          break;

        case 'predict':
          response = await backendAPI.getPrediction();
          break;

        case 'layers':
          response = await backendAPI.getLayerDemo();
          break;

        case 'logs':
          response = await backendAPI.getProcessingLogs(10);
          break;

        default:
          throw new Error('Unknown test');
      }

      const duration = Date.now() - startTime;

      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? { ...t, status: 'success', response, duration }
            : t
        )
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? { ...t, status: 'error', error: error.message, duration }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const resetTests = () => {
    setTests((prev) =>
      prev.map((t) => ({
        ...t,
        status: 'pending',
        response: undefined,
        error: undefined,
        duration: undefined,
      }))
    );
    setExpandedTest(null);
  };

  const getStatusIcon = (status: APITest['status']): string => {
    switch (status) {
      case 'pending':
        return 'circle-outline';
      case 'running':
        return 'loading';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
    }
  };

  const getStatusColor = (status: APITest['status']): string => {
    switch (status) {
      case 'pending':
        return '#9E9E9E';
      case 'running':
        return '#2196F3';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF5722';
    }
  };

  const completedTests = tests.filter((t) => t.status === 'success').length;
  const totalTests = tests.length;
  const progress = totalTests > 0 ? completedTests / totalTests : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              API Demo & Testing
            </Text>
            <Text variant="labelSmall" style={styles.headerSubtitle}>
              Test backend connections and endpoints
            </Text>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>
      </Surface>

      <ScrollView style={styles.scrollView}>
        {/* System Status */}
        <Surface style={styles.statusCard} elevation={1}>
          <View style={styles.statusHeader}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              Backend System Status
            </Text>
            <IconButton
              icon="refresh"
              size={20}
              onPress={checkHealth}
              disabled={isCheckingHealth}
            />
          </View>

          {isCheckingHealth ? (
            <View style={styles.statusLoading}>
              <ActivityIndicator size="small" />
            </View>
          ) : systemStatus ? (
            <>
              <View style={styles.statusRow}>
                <Chip
                  compact
                  icon="circle"
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        systemStatus.status === 'healthy' ? '#4CAF5015' : '#FF572215',
                    },
                  ]}
                  textStyle={{
                    color: systemStatus.status === 'healthy' ? '#4CAF50' : '#FF5722',
                  }}
                >
                  {systemStatus.status.toUpperCase()}
                </Chip>
                <Text variant="labelSmall" style={styles.statusTime}>
                  {new Date(systemStatus.timestamp).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.statusMetrics}>
                <View style={styles.statusMetric}>
                  <Text variant="labelSmall" style={styles.metricLabel}>
                    Active Sessions
                  </Text>
                  <Text variant="titleLarge" style={styles.metricValue}>
                    {systemStatus.active_sessions}
                  </Text>
                </View>
                <View style={styles.statusMetric}>
                  <Text variant="labelSmall" style={styles.metricLabel}>
                    Connected Clients
                  </Text>
                  <Text variant="titleLarge" style={styles.metricValue}>
                    {systemStatus.connected_clients}
                  </Text>
                </View>
              </View>

              {systemStatus.services && (
                <View style={styles.servicesContainer}>
                  <Text variant="labelSmall" style={styles.servicesTitle}>
                    Services Status:
                  </Text>
                  <View style={styles.servicesGrid}>
                    {Object.entries(systemStatus.services).map(([service, status]) => (
                      <Chip
                        key={service}
                        compact
                        icon={status ? 'check' : 'close'}
                        style={[
                          styles.serviceChip,
                          { backgroundColor: status ? '#4CAF5015' : '#FF572215' },
                        ]}
                        textStyle={{
                          color: status ? '#4CAF50' : '#FF5722',
                          fontSize: 11,
                        }}
                      >
                        {service}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text variant="bodyMedium" style={styles.statusError}>
              Backend not connected. Make sure the server is running at localhost:8000
            </Text>
          )}
        </Surface>

        {/* Test Progress */}
        <Surface style={styles.progressCard} elevation={1}>
          <Text variant="titleSmall" style={styles.progressTitle}>
            Test Progress ({completedTests}/{totalTests})
          </Text>
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={runAllTests}
              icon="play"
              style={styles.actionButton}
              disabled={!systemStatus}
            >
              Run All Tests
            </Button>
            <Button
              mode="outlined"
              onPress={resetTests}
              icon="refresh"
              style={styles.actionButton}
            >
              Reset
            </Button>
          </View>
        </Surface>

        {/* API Tests */}
        <Surface style={styles.testsCard} elevation={1}>
          <Text variant="titleMedium" style={styles.testsTitle}>
            API Endpoint Tests
          </Text>

          {tests.map((test, index) => (
            <React.Fragment key={test.id}>
              <List.Accordion
                title={test.name}
                description={`${test.endpoint} ${test.duration ? `(${test.duration}ms)` : ''}`}
                expanded={expandedTest === test.id}
                onPress={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={getStatusIcon(test.status)}
                    color={getStatusColor(test.status)}
                  />
                )}
                right={(props) => (
                  <View style={styles.testActions}>
                    <IconButton
                      icon="play"
                      size={20}
                      onPress={() => runTest(test.id)}
                      disabled={test.status === 'running' || !systemStatus}
                    />
                  </View>
                )}
              >
                <View style={styles.testContent}>
                  <Text variant="bodySmall" style={styles.testDescription}>
                    {test.description}
                  </Text>

                  {test.status === 'running' && (
                    <View style={styles.testLoading}>
                      <ActivityIndicator size="small" />
                      <Text variant="bodySmall" style={styles.loadingText}>
                        Running test...
                      </Text>
                    </View>
                  )}

                  {test.error && (
                    <Surface style={styles.errorBox} elevation={0}>
                      <Text variant="labelSmall" style={styles.errorLabel}>
                        ERROR
                      </Text>
                      <Text variant="bodySmall" style={styles.errorMessage}>
                        {test.error}
                      </Text>
                    </Surface>
                  )}

                  {test.response && (
                    <Surface style={styles.responseBox} elevation={0}>
                      <Text variant="labelSmall" style={styles.responseLabel}>
                        RESPONSE
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.responseScroll}
                      >
                        <Text variant="bodySmall" style={styles.responseText}>
                          {JSON.stringify(test.response, null, 2)}
                        </Text>
                      </ScrollView>
                    </Surface>
                  )}
                </View>
              </List.Accordion>
              {index < tests.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Surface>

        {/* Info Card */}
        <Card style={styles.infoCard} mode="outlined">
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>
              About This Demo
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              This screen demonstrates the complete API communication between the mobile app and the backend system. Each test validates a different endpoint and showcases:
            </Text>
            <View style={styles.infoList}>
              <Text variant="bodySmall" style={styles.infoItem}>
                • Real-time biosignal streaming
              </Text>
              <Text variant="bodySmall" style={styles.infoItem}>
                • Three-layer processing (Clarity™, iFRS™, Timesystems™)
              </Text>
              <Text variant="bodySmall" style={styles.infoItem}>
                • LIA health insights and predictions
              </Text>
              <Text variant="bodySmall" style={styles.infoItem}>
                • Device connection management
              </Text>
              <Text variant="bodySmall" style={styles.infoItem}>
                • Processing logs and diagnostics
              </Text>
            </View>
          </Card.Content>
        </Card>

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
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontWeight: '600',
  },
  statusLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusChip: {
    height: 28,
  },
  statusTime: {
    opacity: 0.6,
  },
  statusMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statusMetric: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  metricLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: 'bold',
  },
  servicesContainer: {
    marginTop: 8,
  },
  servicesTitle: {
    opacity: 0.6,
    marginBottom: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    marginBottom: 4,
  },
  statusError: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 20,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  testsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  testsTitle: {
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  testActions: {
    marginRight: -8,
  },
  testContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  testDescription: {
    opacity: 0.7,
    marginBottom: 12,
  },
  testLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: '#FF572210',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5722',
    marginTop: 8,
  },
  errorLabel: {
    color: '#FF5722',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorMessage: {
    color: '#FF5722',
    fontFamily: 'monospace',
  },
  responseBox: {
    backgroundColor: '#4CAF5010',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    marginTop: 8,
  },
  responseLabel: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  responseScroll: {
    maxHeight: 200,
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    opacity: 0.7,
    lineHeight: 20,
  },
});
