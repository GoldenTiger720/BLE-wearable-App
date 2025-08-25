import { BleManager, Device, State, BleError } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { BLE_SERVICE_UUID, BLE_CHARACTERISTIC_UUID } from '../constants';
import { BLEDevice, SensorEvent } from '../types';

export class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isSimulated: boolean = false;
  
  constructor() {
    try {
      // Only initialize BleManager on native platforms
      if (Platform.OS === 'web') {
        console.warn('Bluetooth not supported on web platform, using simulation mode');
        this.isSimulated = true;
      } else {
        this.manager = new BleManager();
      }
    } catch (error) {
      console.warn('Failed to initialize BleManager, using simulation mode:', error);
      this.isSimulated = true;
    }
  }

  async checkBluetoothState(): Promise<boolean> {
    if (this.isSimulated || !this.manager) {
      // Simulate bluetooth is always available in demo mode
      return true;
    }
    
    try {
      const state = await this.manager.state();
      return state === State.PoweredOn;
    } catch (error) {
      console.warn('Error checking Bluetooth state:', error);
      return false;
    }
  }

  async scanForDevices(
    onDeviceFound: (device: BLEDevice) => void,
    duration: number = 10000
  ): Promise<void> {
    if (this.isSimulated || !this.manager) {
      // Simulate finding mock devices
      return new Promise((resolve) => {
        const mockDevices = [
          { id: 'mock-1', name: 'WearableAI Watch', rssi: -45 },
          { id: 'mock-2', name: 'Health Tracker Pro', rssi: -62 },
          { id: 'mock-3', name: 'Fitness Band X', rssi: -78 },
        ];

        mockDevices.forEach((device, index) => {
          setTimeout(() => {
            const bleDevice: BLEDevice = {
              ...device,
              isConnected: false,
            };
            onDeviceFound(bleDevice);
          }, (index + 1) * 1000);
        });

        setTimeout(resolve, Math.min(duration, 4000));
      });
    }

    return new Promise((resolve, reject) => {
      const devices = new Map<string, BLEDevice>();
      
      this.manager!.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            reject(error);
            return;
          }

          if (device && device.name) {
            const bleDevice: BLEDevice = {
              id: device.id,
              name: device.name,
              rssi: device.rssi || -100,
              isConnected: false,
            };
            
            if (!devices.has(device.id)) {
              devices.set(device.id, bleDevice);
              onDeviceFound(bleDevice);
            }
          }
        }
      );

      setTimeout(() => {
        this.manager!.stopDeviceScan();
        resolve();
      }, duration);
    });
  }

  async connectToDevice(deviceId: string): Promise<BLEDevice> {
    if (this.isSimulated || !this.manager) {
      // Simulate device connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
      
      const mockDeviceNames = {
        'mock-1': 'WearableAI Watch',
        'mock-2': 'Health Tracker Pro',
        'mock-3': 'Fitness Band X',
      };

      const bleDevice: BLEDevice = {
        id: deviceId,
        name: mockDeviceNames[deviceId as keyof typeof mockDeviceNames] || 'Mock Device',
        rssi: -45,
        batteryLevel: Math.floor(Math.random() * 40) + 60,
        firmwareVersion: '1.2.3',
        isConnected: true,
        lastConnectedAt: new Date(),
      };

      return bleDevice;
    }

    try {
      const device = await this.manager!.connectToDevice(deviceId, {
        autoConnect: false,
        timeout: 10000,
      });
      
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      // Get battery level (mock for demo)
      const batteryLevel = Math.floor(Math.random() * 40) + 60;
      const firmwareVersion = '1.2.3';

      const bleDevice: BLEDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        rssi: device.rssi || -100,
        batteryLevel,
        firmwareVersion,
        isConnected: true,
        lastConnectedAt: new Date(),
      };

      // Set up disconnect handler
      device.onDisconnected(() => {
        this.handleDisconnection();
      });

      return bleDevice;
    } catch (error) {
      throw new Error(`Failed to connect: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isSimulated || !this.manager) {
      // Simulate disconnection
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleDisconnection(): void {
    this.connectedDevice = null;
    // Implement auto-reconnect logic if enabled
  }

  async setMTU(mtu: number): Promise<number> {
    if (this.isSimulated || !this.manager) {
      // Simulate MTU negotiation
      return mtu;
    }

    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }
    
    const negotiatedMTU = await this.connectedDevice.requestMTU(mtu);
    return negotiatedMTU;
  }

  // Mock sensor data subscription for demo
  subscribeSensorData(
    onSensorEvent: (event: SensorEvent) => void
  ): () => void {
    const interval = setInterval(() => {
      // Generate mock sensor events
      const eventTypes: SensorEvent['type'][] = ['heartRate', 'steps', 'activity'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      let value: any;
      switch (randomType) {
        case 'heartRate':
          value = Math.floor(Math.random() * 40) + 60;
          break;
        case 'steps':
          value = Math.floor(Math.random() * 100);
          break;
        case 'activity':
          value = ['Walking', 'Resting', 'Running'][Math.floor(Math.random() * 3)];
          break;
      }

      onSensorEvent({
        id: Date.now().toString(),
        type: randomType,
        value,
        timestamp: new Date(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }

  destroy(): void {
    this.disconnect();
    if (this.manager && !this.isSimulated) {
      this.manager.destroy();
    }
  }
}