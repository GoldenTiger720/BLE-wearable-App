/**
 * FastAPI Backend Integration Service
 * Connects to the Wearable Biosignal Analysis Backend
 *
 * Features:
 * - Device connection management
 * - Real-time biosignal streaming
 * - Layer processing data (Clarity™, iFRS™, Timesystems™)
 * - LIA health insights
 * - Session management
 * - WebSocket support for live streaming
 */

import { Platform } from 'react-native';

// Backend API Configuration
export const BACKEND_CONFIG = {
  // Automatically select correct URL based on platform
  BASE_URL: Platform.select({
    ios: 'http://localhost:8000',      // iOS Simulator
    android: 'http://10.0.2.2:8000',   // Android Emulator
    default: 'http://localhost:8000',  // Web/Other
  }),
  WS_URL: Platform.select({
    ios: 'ws://localhost:8000',
    android: 'ws://10.0.2.2:8000',
    default: 'ws://localhost:8000',
  }),
  TIMEOUT: 10000, // 10 seconds
};

// Override with environment variable if available
if (process.env.EXPO_PUBLIC_API_URL) {
  BACKEND_CONFIG.BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

if (process.env.EXPO_PUBLIC_WS_URL) {
  BACKEND_CONFIG.WS_URL = process.env.EXPO_PUBLIC_WS_URL;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BiosignalData {
  heart_rate: number;
  spo2: number;
  temperature: number;
  activity: number;
}

export interface QualityMetrics {
  heart_rate_quality: number;
  spo2_quality: number;
  temperature_quality: number;
  activity_quality: number;
  overall_quality: number;
}

export interface ClarityLayerResult {
  processed_data: BiosignalData;
  quality_score: number;
  signal_to_noise_ratio: number;
  noise_reduction_applied: boolean;
  quality_metrics: QualityMetrics;
  quality_assessment: 'excellent' | 'good' | 'fair' | 'poor';
  artifacts_detected: string[];
  processing_notes: string;
}

export interface FrequencyBands {
  vlf: number;
  lf: number;
  hf: number;
  lf_hf_ratio: number;
}

export interface HRVFeatures {
  rmssd: number;
  sdnn: number;
  pnn50: number;
  hrv_score: number;
}

export interface iFRSLayerResult {
  enhanced_data: BiosignalData;
  dominant_frequency: number;
  frequency_bands: FrequencyBands;
  hrv_features: HRVFeatures;
  rhythm_classification: 'normal_sinus' | 'athletic' | 'elevated' | 'low' | 'irregular';
  respiratory_rate: number;
  frequency_stability: number;
  processing_notes: string;
}

export interface PatternRecognition {
  short_term_trend: string;
  long_term_trend: string;
  periodicity_detected: boolean;
  period_length_seconds: number | null;
  pattern_confidence: number;
}

export interface CircadianAlignment {
  expected_heart_rate: number;
  actual_heart_rate: number;
  alignment_score: number;
  phase_shift_minutes: number;
}

export interface TimesystemsLayerResult {
  synchronized_data: BiosignalData;
  pattern_type: 'stable' | 'increasing' | 'decreasing' | 'oscillating' | 'irregular';
  temporal_consistency: number;
  circadian_phase: 'morning' | 'afternoon' | 'evening' | 'night';
  time_of_day_analysis: any;
  pattern_recognition: PatternRecognition;
  circadian_alignment: CircadianAlignment;
  rhythm_score: number;
  processing_notes: string;
}

export interface WellnessAssessment {
  cardiovascular_health: number;
  respiratory_health: number;
  activity_level: number;
  stress_level: number;
  overall_wellness: number;
}

export interface LIAInsights {
  condition: string;
  confidence: number;
  wellness_score: number;
  probabilities: Record<string, number>;
  recommendation: string;
  wellness_assessment: WellnessAssessment;
  risk_factors: string[];
  positive_indicators: string[];
}

export interface StreamDataResponse {
  timestamp: string;
  raw_signals: BiosignalData;
  clarity_layer: ClarityLayerResult;
  ifrs_layer: iFRSLayerResult;
  timesystems_layer: TimesystemsLayerResult;
  lia_insights: LIAInsights;
}

export interface DeviceStatus {
  device_id: string;
  is_connected: boolean;
  battery_level: number;
  signal_strength: number;
  firmware_version: string;
  last_updated: string;
}

export interface ConnectionResponse {
  success: boolean;
  message: string;
  session_id: string;
  device_status: DeviceStatus;
  available_features: string[];
}

export interface PredictionResponse {
  timestamp: string;
  condition: string;
  confidence: number;
  wellness_score: number;
  probabilities: Record<string, number>;
  signal_quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
  metrics: Record<string, number>;
}

export interface SessionResponse {
  session_id: string;
  device_id: string;
  user_id: string | null;
  session_type: 'workout' | 'meditation' | 'sleep' | 'daily_monitoring' | 'clinical';
  start_time: string;
  end_time: string | null;
  status: string;
  data_points_collected: number;
  average_wellness_score: number | null;
  summary: string | null;
  metadata: Record<string, any>;
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  services: Record<string, boolean>;
  connected_clients: number;
  active_sessions: number;
}

export interface ProcessingLog {
  timestamp: string;
  level: string;
  message: string;
  data?: Record<string, any>;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class BackendAPIService {
  private baseURL: string;
  private wsURL: string;
  private timeout: number;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.baseURL = BACKEND_CONFIG.BASE_URL;
    this.wsURL = BACKEND_CONFIG.WS_URL;
    this.timeout = BACKEND_CONFIG.TIMEOUT;
  }

  /**
   * Make HTTP request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<SystemStatus | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/health`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return null;
    }
  }

  /**
   * Connect device to backend
   */
  async connectDevice(
    deviceId: string,
    deviceType: 'bracelet' | 'clip' | 'watch' | 'band' | 'mobile_app' = 'mobile_app',
    userId?: string
  ): Promise<ConnectionResponse> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/connect`, {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        device_type: deviceType,
        app_version: '1.0.0',
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get real-time stream data (single request)
   */
  async getStreamData(): Promise<StreamDataResponse> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/stream`);

    if (!response.ok) {
      throw new Error(`Stream data failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get health prediction
   */
  async getPrediction(): Promise<PredictionResponse> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/predict`);

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new session
   */
  async createSession(
    deviceId: string,
    userId?: string,
    sessionType: 'workout' | 'meditation' | 'sleep' | 'daily_monitoring' | 'clinical' = 'daily_monitoring'
  ): Promise<SessionResponse> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        user_id: userId,
        session_type: sessionType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Session creation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/api/v1/sessions/${sessionId}`
    );

    if (!response.ok) {
      throw new Error(`Get session failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get processing logs
   */
  async getProcessingLogs(limit: number = 100): Promise<{ total: number; logs: ProcessingLog[] }> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/api/v1/logs/processing?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Get logs failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get layer processing demonstration
   */
  async getLayerDemo(): Promise<any> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/api/v1/demo/layers`);

    if (!response.ok) {
      throw new Error(`Layer demo failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Connect to WebSocket for real-time streaming
   */
  connectWebSocket(
    onMessage: (data: StreamDataResponse) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): void {
    try {
      this.ws = new WebSocket(`${this.wsURL}/ws/stream`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'stream_data' && message.data) {
            onMessage(message.data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (onClose) onClose();

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
            this.connectWebSocket(onMessage, onError, onClose);
          }, this.reconnectDelay);

          // Exponential backoff
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      if (onError) onError(error as Event);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Poll for stream data at regular intervals
   * Alternative to WebSocket for React Native compatibility
   */
  startPolling(
    onData: (data: StreamDataResponse) => void,
    interval: number = 1000,
    onError?: (error: Error) => void
  ): () => void {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const data = await this.getStreamData();
        onData(data);
      } catch (error) {
        console.error('Polling error:', error);
        if (onError) onError(error as Error);
      }

      if (isPolling) {
        setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();

    // Return stop function
    return () => {
      isPolling = false;
    };
  }
}

// Export singleton instance
export const backendAPI = new BackendAPIService();

// Export class for testing
export { BackendAPIService };
