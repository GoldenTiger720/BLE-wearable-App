// Backend API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
export const BLE_CHARACTERISTIC_UUID = "12345678-1234-5678-1234-56789abcdef1";

export const QUICK_PROMPTS = [
  "How was my workout today?",
  "Analyze my stress levels",
  "Summarize my activity",
  "Health insights for today",
  "Sleep quality analysis"
];

export const MOCK_SENSOR_DATA = {
  heartRate: { min: 60, max: 180, normal: 75 },
  steps: { daily: 10000 },
  activities: ['Walking', 'Running', 'Resting', 'Working', 'Exercising']
};

export const SESSION_STATUS_COLORS = {
  active: '#4CAF50',
  paused: '#FF9800',
  ended: '#9E9E9E',
  collecting: '#2196F3',
  waiting: '#FFC107',
  offline: '#F44336'
};