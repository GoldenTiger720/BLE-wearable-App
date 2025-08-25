import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  List,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider,
  TextInput,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BluetoothService } from '../../services/bluetooth';
import { useAppStore } from '../../store';
import { BLEDevice } from '../../types';
import { theme } from '../../utils/theme';

export const WearablePairingScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    connectedDevice,
    availableDevices,
    isScanning,
    simulatorEnabled,
    setConnectedDevice,
    setAvailableDevices,
    setIsScanning,
    setSimulatorEnabled,
    settings,
    updateSettings,
  } = useAppStore();

  const [bluetoothService] = useState(() => new BluetoothService());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [mtuInput, setMtuInput] = useState(settings.ble.mtu.toString());

  useEffect(() => {
    checkBluetoothStatus();
    return () => {
      bluetoothService.destroy();
    };
  }, []);

  const checkBluetoothStatus = async () => {
    const isOn = await bluetoothService.checkBluetoothState();
    if (!isOn && !simulatorEnabled) {
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth to connect to wearable devices.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScan = async () => {
    if (simulatorEnabled) {
      // Add mock devices for simulator
      const mockDevices: BLEDevice[] = [
        {
          id: 'mock-1',
          name: 'Fitness Band Pro',
          rssi: -65,
          batteryLevel: 85,
          isConnected: false,
        },
        {
          id: 'mock-2',
          name: 'Heart Rate Monitor',
          rssi: -72,
          batteryLevel: 92,
          isConnected: false,
        },
        {
          id: 'mock-3',
          name: 'Smart Watch X',
          rssi: -80,
          batteryLevel: 45,
          isConnected: false,
        },
      ];
      setAvailableDevices(mockDevices);
      return;
    }

    setIsScanning(true);
    setAvailableDevices([]);

    try {
      await bluetoothService.scanForDevices(
        (device) => {
          setAvailableDevices([...availableDevices, device]);
        },
        10000
      );
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (device: BLEDevice) => {
    if (simulatorEnabled) {
      // Simulate connection
      const connectedMockDevice: BLEDevice = {
        ...device,
        isConnected: true,
        firmwareVersion: '2.1.0',
        lastConnectedAt: new Date(),
      };
      setConnectedDevice(connectedMockDevice);
      Alert.alert('Connected', `Successfully connected to ${device.name}`);
      return;
    }

    try {
      const connected = await bluetoothService.connectToDevice(device.id);
      setConnectedDevice(connected);
      Alert.alert('Connected', `Successfully connected to ${device.name}`);
    } catch (error) {
      Alert.alert('Connection Failed', (error as Error).message);
    }
  };

  const handleDisconnect = async () => {
    if (simulatorEnabled) {
      setConnectedDevice(null);
      return;
    }

    try {
      await bluetoothService.disconnect();
      setConnectedDevice(null);
    } catch (error) {
      Alert.alert('Disconnect Error', 'Failed to disconnect device');
    }
  };

  const handleSaveMTU = async () => {
    const mtu = parseInt(mtuInput);
    if (isNaN(mtu) || mtu < 23 || mtu > 517) {
      Alert.alert('Invalid MTU', 'MTU must be between 23 and 517');
      return;
    }

    updateSettings({ ble: { ...settings.ble, mtu } });
    
    if (connectedDevice && !simulatorEnabled) {
      try {
        await bluetoothService.setMTU(mtu);
        Alert.alert('Success', `MTU set to ${mtu}`);
      } catch (error) {
        Alert.alert('MTU Error', 'Failed to set MTU');
      }
    }
    
    setShowAdvancedSettings(false);
  };

  const renderDeviceStatus = () => {
    if (connectedDevice) {
      return (
        <Chip
          icon="check-circle"
          mode="flat"
          style={[styles.statusChip, { backgroundColor: theme.colors.secondary }]}
          textStyle={{ color: 'white' }}
        >
          Connected
        </Chip>
      );
    } else if (isScanning) {
      return (
        <Chip
          icon="bluetooth-searching"
          mode="flat"
          style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
          textStyle={{ color: 'white' }}
        >
          Scanning...
        </Chip>
      );
    } else {
      return (
        <Chip
          icon="bluetooth-off"
          mode="flat"
          style={[styles.statusChip, { backgroundColor: theme.colors.tertiary }]}
          textStyle={{ color: 'white' }}
        >
          Awaiting Connection
        </Chip>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Wearable Devices</Text>
        {renderDeviceStatus()}
      </View>

      {connectedDevice && (
        <Surface style={styles.connectedCard} elevation={2}>
          <View style={styles.deviceInfo}>
            <IconButton
              icon="watch"
              size={40}
              iconColor={theme.colors.primary}
            />
            <View style={styles.deviceDetails}>
              <Text variant="titleMedium">{connectedDevice.name}</Text>
              <Text variant="bodySmall" style={styles.detailText}>
                Battery: {connectedDevice.batteryLevel}% • Signal: {connectedDevice.rssi} dBm
              </Text>
              <Text variant="bodySmall" style={styles.detailText}>
                Firmware: v{connectedDevice.firmwareVersion}
              </Text>
            </View>
          </View>
          <Button mode="outlined" onPress={handleDisconnect}>
            Disconnect
          </Button>
        </Surface>
      )}

      <Divider style={styles.divider} />

      <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
        {availableDevices.map((device) => (
          <Surface key={device.id} style={styles.deviceCard} elevation={1}>
            <List.Item
              title={device.name}
              description={`Signal: ${device.rssi} dBm${device.batteryLevel ? ` • Battery: ${device.batteryLevel}%` : ''}`}
              left={(props) => <List.Icon {...props} icon="bluetooth" />}
              right={() => (
                <Button
                  mode="contained"
                  onPress={() => handleConnect(device)}
                  disabled={!!connectedDevice}
                >
                  Connect
                </Button>
              )}
            />
          </Surface>
        ))}

        {!isScanning && availableDevices.length === 0 && (
          <View style={styles.emptyState}>
            <IconButton
              icon="bluetooth-searching"
              size={64}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No devices found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap scan to search for nearby devices
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.simulatorToggle}>
          <Text variant="bodyMedium">Use Simulator</Text>
          <Switch
            value={simulatorEnabled}
            onValueChange={setSimulatorEnabled}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={handleScan}
            loading={isScanning}
            disabled={isScanning || !!connectedDevice}
            style={styles.scanButton}
          >
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </Button>
          
          <Button
            mode="text"
            onPress={() => setShowAdvancedSettings(true)}
            style={styles.advancedButton}
          >
            Advanced Settings
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog
          visible={showAdvancedSettings}
          onDismiss={() => setShowAdvancedSettings(false)}
        >
          <Dialog.Title>Advanced BLE Settings</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="MTU Size (23-517)"
              value={mtuInput}
              onChangeText={setMtuInput}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginBottom: 16 }}
            />
            <View style={styles.settingRow}>
              <Text variant="bodyMedium">Auto Reconnect</Text>
              <Switch
                value={settings.ble.autoReconnect}
                onValueChange={(value) =>
                  updateSettings({ ble: { ...settings.ble, autoReconnect: value } })
                }
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdvancedSettings(false)}>Cancel</Button>
            <Button onPress={handleSaveMTU}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
  },
  connectedCard: {
    padding: 16,
    borderRadius: theme.roundness,
    marginBottom: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceDetails: {
    flex: 1,
    marginLeft: 8,
  },
  detailText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  deviceList: {
    flex: 1,
  },
  deviceCard: {
    marginBottom: 8,
    borderRadius: theme.roundness,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  simulatorToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scanButton: {
    flex: 1,
    marginRight: 8,
  },
  advancedButton: {
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});