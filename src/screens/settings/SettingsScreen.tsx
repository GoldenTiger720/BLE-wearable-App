import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Share,
  Linking,
} from 'react-native';
import {
  Text,
  List,
  Surface,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Divider,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notifications';
import { theme } from '../../utils/theme';
import { Settings } from '../../types';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { auth, settings, updateSettings, setAuth, sessions } = useAppStore();
  
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleModelChange = (model: Settings['llmModel']) => {
    updateSettings({ llmModel: model });
    setShowModelDialog(false);
    showSnackbar('Model updated successfully');
  };

  const handlePrivacyChange = (mode: Settings['privacyMode']) => {
    updateSettings({ privacyMode: mode });
    setShowPrivacyDialog(false);
    showSnackbar(`Privacy mode set to ${mode}`);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setAuth({ isAuthenticated: false });
      setShowLogoutDialog(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' as never }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleExportLogs = async () => {
    try {
      const logs = {
        user: auth.user?.email,
        settings,
        sessionCount: sessions.length,
        exportDate: new Date().toISOString(),
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0',
        },
      };
      
      const logData = JSON.stringify(logs, null, 2);
      
      await Share.share({
        message: logData,
        title: 'Wearable LLM App Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your sessions, settings, and user data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In production, clear all user data
            showSnackbar('Data deletion would be implemented in production');
          },
        },
      ]
    );
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account & Security
          </Text>
          
          <List.Item
            title="Account"
            description={auth.user?.email}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title="Biometric Authentication"
            description="Use fingerprint or face ID"
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Switch
                value={false}
                onValueChange={() => showSnackbar('Biometric auth would be implemented')}
              />
            )}
          />
          
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={() => setShowLogoutDialog(true)}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Model & Quality
          </Text>
          
          <List.Item
            title="AI Model"
            description={`Currently using ${settings.llmModel}`}
            left={(props) => <List.Icon {...props} icon="brain" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowModelDialog(true)}
          />
          
          <List.Item
            title="Response Length"
            description="Detailed responses"
            left={(props) => <List.Icon {...props} icon="text-long" />}
            right={() => (
              <Switch
                value={true}
                onValueChange={() => showSnackbar('Response length setting updated')}
              />
            )}
          />
          
          <List.Item
            title="Streaming Responses"
            description="Show responses as they generate"
            left={(props) => <List.Icon {...props} icon="stream" />}
            right={() => (
              <Switch
                value={settings.streamingEnabled}
                onValueChange={(value) => updateSettings({ streamingEnabled: value })}
              />
            )}
          />
          
          <List.Item
            title="Voice Features"
            description="Enable voice input and output"
            left={(props) => <List.Icon {...props} icon="microphone" />}
            right={() => (
              <Switch
                value={settings.enableVoice}
                onValueChange={(value) => updateSettings({ enableVoice: value })}
              />
            )}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Privacy & Data
          </Text>
          
          <List.Item
            title="Data Storage"
            description={`${settings.privacyMode === 'local' ? 'Local only' : 'Cloud sync enabled'}`}
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowPrivacyDialog(true)}
          />
          
          <List.Item
            title="Data Deletion"
            description="Delete all your data permanently"
            left={(props) => <List.Icon {...props} icon="delete-forever" />}
            onPress={handleDeleteData}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Notifications
          </Text>
          
          <List.Item
            title="Disconnect Alerts"
            description="Notify when device disconnects"
            left={(props) => <List.Icon {...props} icon="bluetooth-off" />}
            right={() => (
              <Switch
                value={settings.notifications.disconnectAlerts}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: { ...settings.notifications, disconnectAlerts: value },
                  })
                }
              />
            )}
          />
          
          <List.Item
            title="Low Battery Alerts"
            description="Warn when device battery is low"
            left={(props) => <List.Icon {...props} icon="battery-low" />}
            right={() => (
              <Switch
                value={settings.notifications.lowBatteryAlerts}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: { ...settings.notifications, lowBatteryAlerts: value },
                  })
                }
              />
            )}
          />
          
          <List.Item
            title="Session Reminders"
            description="Daily reminders to start sessions"
            left={(props) => <List.Icon {...props} icon="clock-alert" />}
            right={() => (
              <Switch
                value={settings.notifications.sessionReminders}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: { ...settings.notifications, sessionReminders: value },
                  })
                }
              />
            )}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Device & Firmware
          </Text>
          
          <List.Item
            title="Current Version"
            description="App version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <List.Item
            title="Check for Updates"
            description="Check for app updates"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={() => showSnackbar('App is up to date')}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Developer Mode
          </Text>
          
          <List.Item
            title="Simulator Mode"
            description="Use virtual sensor data"
            left={(props) => <List.Icon {...props} icon="test-tube" />}
            onPress={() => navigation.navigate('WearablePairing' as never)}
          />
          
          <List.Item
            title="View BLE Logs"
            description="Show Bluetooth connection logs"
            left={(props) => <List.Icon {...props} icon="bluetooth" />}
            onPress={() => showSnackbar('BLE logs would be shown in production')}
          />
          
          <List.Item
            title="Export Logs"
            description="Share diagnostic information"
            left={(props) => <List.Icon {...props} icon="share" />}
            onPress={handleExportLogs}
          />
        </Surface>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Wearable LLM App v1.0.0
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            Built with React Native & OpenAI
          </Text>
        </View>
      </ScrollView>

      {/* Model Selection Dialog */}
      <Portal>
        <Dialog visible={showModelDialog} onDismiss={() => setShowModelDialog(false)}>
          <Dialog.Title>Select AI Model</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={handleModelChange}
              value={settings.llmModel}
            >
              <View style={styles.radioItem}>
                <RadioButton value="gpt-4" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">GPT-4</Text>
                  <Text variant="bodySmall">Most accurate, slower responses</Text>
                </View>
              </View>
              
              <View style={styles.radioItem}>
                <RadioButton value="gpt-3.5-turbo" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">GPT-3.5 Turbo</Text>
                  <Text variant="bodySmall">Fast and reliable</Text>
                </View>
              </View>
              
              <View style={styles.radioItem}>
                <RadioButton value="llama" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">LLaMA</Text>
                  <Text variant="bodySmall">Open source alternative</Text>
                </View>
              </View>
              
              <View style={styles.radioItem}>
                <RadioButton value="mistral" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">Mistral</Text>
                  <Text variant="bodySmall">Efficient and private</Text>
                </View>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowModelDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Privacy Dialog */}
      <Portal>
        <Dialog visible={showPrivacyDialog} onDismiss={() => setShowPrivacyDialog(false)}>
          <Dialog.Title>Data Storage</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={handlePrivacyChange}
              value={settings.privacyMode}
            >
              <View style={styles.radioItem}>
                <RadioButton value="local" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">Local Only</Text>
                  <Text variant="bodySmall">Data stays on your device</Text>
                </View>
              </View>
              
              <View style={styles.radioItem}>
                <RadioButton value="cloud" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">Cloud Sync</Text>
                  <Text variant="bodySmall">Sync across devices</Text>
                </View>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPrivacyDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Logout Confirmation */}
      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Confirm Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to logout? Your data will remain on this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button onPress={handleLogout}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    margin: 16,
    marginBottom: 8,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: theme.colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioContent: {
    marginLeft: 8,
    flex: 1,
  },
});