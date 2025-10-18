export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  batteryLevel?: number;
  firmwareVersion?: string;
  isConnected: boolean;
  lastConnectedAt?: Date;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'ended';
  messages: Message[];
  sensorEvents: SensorEvent[];
  summary?: string;
  highlights?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

export interface SensorEvent {
  id: string;
  type: 'heartRate' | 'steps' | 'activity' | 'battery' | 'custom' | 'spo2' | 'temperature' | 'wellness';
  value: any;
  timestamp: Date;
}

// Backend-specific biosignal data
export interface BiosignalReading {
  heart_rate: number;
  spo2: number;
  temperature: number;
  activity: number;
  timestamp: Date;
}

// Wellness metrics from LIA engine
export interface WellnessMetrics {
  overall_wellness: number;
  cardiovascular_health: number;
  respiratory_health: number;
  activity_level: number;
  stress_level: number;
}

// Health condition from LIA
export interface HealthCondition {
  condition: string;
  confidence: number;
  probabilities: Record<string, number>;
  recommendation: string;
}

// Signal quality assessment
export interface SignalQuality {
  quality_score: number;
  signal_to_noise_ratio: number;
  quality_assessment: 'excellent' | 'good' | 'fair' | 'poor';
  artifacts_detected: string[];
}

export interface Settings {
  llmModel: 'gpt-4' | 'gpt-3.5-turbo' | 'llama' | 'mistral';
  enableVoice: boolean;
  enableTTS: boolean;
  streamingEnabled: boolean;
  privacyMode: 'local' | 'cloud';
  notifications: {
    disconnectAlerts: boolean;
    lowBatteryAlerts: boolean;
    sessionReminders: boolean;
  };
  ble: {
    mtu: number;
    reconnectInterval: number;
    autoReconnect: boolean;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  localEnabled: boolean;
  categories: {
    device: boolean;
    session: boolean;
    system: boolean;
  };
}