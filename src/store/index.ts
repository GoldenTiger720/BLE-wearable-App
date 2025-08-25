import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, BLEDevice, Session, Settings, AuthState, Message, SensorEvent } from '../types';

interface AppState {
  // Auth
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  
  // BLE
  connectedDevice: BLEDevice | null;
  availableDevices: BLEDevice[];
  isScanning: boolean;
  setConnectedDevice: (device: BLEDevice | null) => void;
  setAvailableDevices: (devices: BLEDevice[]) => void;
  setIsScanning: (scanning: boolean) => void;
  
  // Sessions
  currentSession: Session | null;
  sessions: Session[];
  startSession: () => void;
  pauseSession: () => void;
  endSession: () => void;
  addMessage: (message: Message) => void;
  addSensorEvent: (event: SensorEvent) => void;
  
  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Simulator
  simulatorEnabled: boolean;
  setSimulatorEnabled: (enabled: boolean) => void;
  
  // Persistence
  loadPersistedState: () => Promise<void>;
  persistState: () => Promise<void>;
}

const defaultSettings: Settings = {
  llmModel: 'gpt-4',
  enableVoice: true,
  enableTTS: true,
  streamingEnabled: true,
  privacyMode: 'cloud',
  notifications: {
    disconnectAlerts: true,
    lowBatteryAlerts: true,
    sessionReminders: true,
  },
  ble: {
    mtu: 512,
    reconnectInterval: 5000,
    autoReconnect: true,
  },
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  auth: { 
    isAuthenticated: false,
    user: undefined,
    token: undefined
  },
  setAuth: (auth) => {
    set({ auth });
    get().persistState();
  },
  
  // BLE
  connectedDevice: null,
  availableDevices: [],
  isScanning: false,
  setConnectedDevice: (device) => {
    set({ connectedDevice: device });
    get().persistState();
  },
  setAvailableDevices: (devices) => set({ availableDevices: devices }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  
  // Sessions
  currentSession: null,
  sessions: [],
  startSession: () => {
    const newSession: Session = {
      id: Date.now().toString(),
      startTime: new Date(),
      status: 'active',
      messages: [],
      sensorEvents: [],
    };
    set({ currentSession: newSession });
  },
  pauseSession: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: { ...currentSession, status: 'paused' },
      });
    }
  },
  endSession: () => {
    const { currentSession, sessions } = get();
    if (currentSession) {
      const endedSession: Session = {
        ...currentSession,
        status: 'ended',
        endTime: new Date(),
      };
      set({
        currentSession: null,
        sessions: [...sessions, endedSession],
      });
      get().persistState();
    }
  },
  addMessage: (message) => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          messages: [...currentSession.messages, message],
        },
      });
    }
  },
  addSensorEvent: (event) => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          sensorEvents: [...currentSession.sensorEvents, event],
        },
      });
    }
  },
  
  // Settings
  settings: defaultSettings,
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    get().persistState();
  },
  
  // Simulator
  simulatorEnabled: false,
  setSimulatorEnabled: (enabled) => {
    set({ simulatorEnabled: enabled });
    get().persistState();
  },
  
  // Persistence
  loadPersistedState: async () => {
    try {
      const stored = await AsyncStorage.getItem('@app_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Convert date strings back to Date objects for sessions
        const sessions = (parsed.sessions || []).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          messages: (session.messages || []).map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          })),
          sensorEvents: (session.sensorEvents || []).map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp),
          })),
        }));

        // Convert date strings for auth user if present
        const auth = parsed.auth || { 
          isAuthenticated: false,
          user: undefined,
          token: undefined
        };
        
        if (auth.user && auth.user.createdAt) {
          auth.user.createdAt = new Date(auth.user.createdAt);
        }
        
        set({
          auth,
          sessions,
          settings: parsed.settings || defaultSettings,
          simulatorEnabled: parsed.simulatorEnabled || false,
        });
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  },
  
  persistState: async () => {
    try {
      const { auth, sessions, settings, simulatorEnabled } = get();
      await AsyncStorage.setItem(
        '@app_state',
        JSON.stringify({
          auth,
          sessions,
          settings,
          simulatorEnabled,
        })
      );
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  },
}));