# Mobile App Integration Guide
## Connecting React Native App to FastAPI Backend

This guide shows how to integrate the React Native mobile app with the FastAPI backend to display real-time biosignal data from all three proprietary layers (Clarity™, iFRS™, Timesystems™).

---

## ✅ What's Been Implemented

### 1. Backend API Service (`src/services/backendApi.ts`)
Complete TypeScript service for FastAPI backend integration:
- ✅ Health check endpoint
- ✅ Device connection
- ✅ Real-time stream data retrieval
- ✅ Prediction endpoints
- ✅ Session management
- ✅ Processing logs
- ✅ WebSocket support
- ✅ Polling alternative for compatibility
- ✅ Automatic platform detection (iOS/Android)

### 2. UI Components

#### BiosignalCard (`src/components/BiosignalCard.tsx`)
- Displays individual biosignal metrics (HR, SpO2, Temp, Activity)
- Shows signal quality from Clarity™ layer
- Visual indicators for normal/abnormal ranges
- Trend indicators (up/down/stable)

#### WellnessCard (`src/components/WellnessCard.tsx`)
- Comprehensive wellness assessment display
- 5 wellness dimensions with progress bars
- Health condition with confidence score
- Risk factors and positive indicators
- Personalized recommendations

#### LayerProcessingCard (`src/components/LayerProcessingCard.tsx`)
- Expandable sections for each layer
- Clarity™: Quality metrics, SNR, artifacts
- iFRS™: HRV features, frequency bands, rhythm classification
- Timesystems™: Pattern recognition, circadian alignment

### 3. Live Data Screen (`src/screens/livedata/LiveDataScreen.tsx`)
Complete screen for real-time backend data:
- Auto-refreshing at 1-second intervals
- Pull-to-refresh support
- Connection status indicator
- Real-time biosignal cards
- Wellness assessment
- Layer processing details
- Error handling with retry

### 4. Updated Types (`src/types/index.ts`)
- BiosignalReading interface
- WellnessMetrics interface
- HealthCondition interface
- SignalQuality interface

---

## 🚀 Quick Start Integration

### Step 1: Install Dependencies (Already Done)

The app already has all necessary dependencies in `package.json`.

### Step 2: Start the Backend

```bash
# In one terminal
cd /home/administrator/Documents/Wearable/backend
python main.py
```

Server starts at: `http://localhost:8000`

### Step 3: Add Live Data Screen to Navigation

**File**: `src/navigation/AppNavigator.tsx`

Add the LiveDataScreen to your navigation:

```typescript
import { LiveDataScreen } from '../screens/livedata/LiveDataScreen';

// In your Stack.Navigator, add:
<Stack.Screen
  name="LiveData"
  component={LiveDataScreen}
  options={{
    headerShown: false,
    presentation: 'modal',
  }}
/>
```

### Step 4: Add Navigation Button to Dashboard

**File**: `src/screens/dashboard/DashboardScreen.tsx`

Add a button to navigate to Live Data:

```typescript
import { useNavigation } from '@react-navigation/native';

// In your component:
const navigation = useNavigation();

// Add this button somewhere in your UI:
<Button
  mode="contained"
  icon="chart-line"
  onPress={() => navigation.navigate('LiveData' as never)}
  style={{ margin: 16 }}
>
  View Live Biosignal Data
</Button>
```

### Step 5: Run the Mobile App

```bash
# In another terminal
cd /home/administrator/Documents/Wearable/BLE-wearable-App
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Or scan QR code with Expo Go on physical device

---

## 📱 Platform-Specific Configuration

### iOS Simulator
The app automatically uses `http://localhost:8000`

No additional configuration needed.

### Android Emulator
The app automatically uses `http://10.0.2.2:8000`

This is Android's special IP for the host machine.

### Physical Device
Update the IP address in `src/services/backendApi.ts`:

```typescript
// Find your computer's IP address
// On Linux/Mac: ifconfig
// On Windows: ipconfig

// Then update:
export const BACKEND_CONFIG = {
  BASE_URL: 'http://YOUR_COMPUTER_IP:8000',  // e.g., http://192.168.1.100:8000
  // ...
};
```

**Important**: Make sure your computer and phone are on the same WiFi network.

---

## 🔌 API Integration Examples

### 1. Check Backend Health

```typescript
import { backendAPI } from '../services/backendApi';

const checkBackend = async () => {
  const health = await backendAPI.checkHealth();
  if (health && health.status === 'healthy') {
    console.log('Backend is running!');
    console.log('Connected clients:', health.connected_clients);
  }
};
```

### 2. Connect Device

```typescript
const connectDevice = async (userId: string) => {
  const response = await backendAPI.connectDevice(
    userId,
    'mobile_app',
    userId
  );

  console.log('Session ID:', response.session_id);
  console.log('Battery:', response.device_status.battery_level);
};
```

### 3. Get Stream Data

```typescript
const getData = async () => {
  const streamData = await backendAPI.getStreamData();

  // Raw signals
  console.log('Heart Rate:', streamData.raw_signals.heart_rate);
  console.log('SpO2:', streamData.raw_signals.spo2);

  // Clarity layer
  console.log('Signal Quality:', streamData.clarity_layer.quality_score);

  // iFRS layer
  console.log('HRV Score:', streamData.ifrs_layer.hrv_features.hrv_score);

  // Timesystems layer
  console.log('Circadian Phase:', streamData.timesystems_layer.circadian_phase);

  // LIA insights
  console.log('Condition:', streamData.lia_insights.condition);
  console.log('Wellness:', streamData.lia_insights.wellness_score);
};
```

### 4. Continuous Polling

```typescript
// Start polling
const stopPolling = backendAPI.startPolling(
  (data) => {
    // Update UI with new data every second
    console.log('New data:', data.lia_insights.wellness_score);
  },
  1000,  // 1 second interval
  (error) => {
    console.error('Polling error:', error);
  }
);

// Stop polling when done
stopPolling();
```

### 5. WebSocket Streaming (Advanced)

```typescript
backendAPI.connectWebSocket(
  (data) => {
    // Real-time updates at 10 Hz
    console.log('WebSocket data:', data);
  },
  (error) => {
    console.error('WebSocket error:', error);
  },
  () => {
    console.log('WebSocket disconnected');
  }
);

// Disconnect when done
backendAPI.disconnectWebSocket();
```

---

## 🎨 UI Components Usage

### BiosignalCard

```typescript
import { BiosignalCard } from '../components/BiosignalCard';

<BiosignalCard
  type="heart_rate"
  value={75.2}
  unit="BPM"
  quality={0.92}  // From Clarity layer
  trend="stable"
/>
```

### WellnessCard

```typescript
import { WellnessCard } from '../components/WellnessCard';

<WellnessCard
  wellnessMetrics={{
    overall_wellness: 85.3,
    cardiovascular_health: 88.5,
    respiratory_health: 92.1,
    activity_level: 78.3,
    stress_level: 82.0,
  }}
  healthCondition={{
    condition: "Normal Resting",
    confidence: 0.92,
    probabilities: {...},
    recommendation: "Maintain current activity levels",
  }}
  riskFactors={[]}
  positiveIndicators={["Excellent HRV", "Good SpO2"]}
/>
```

### LayerProcessingCard

```typescript
import { LayerProcessingCard } from '../components/LayerProcessingCard';

<LayerProcessingCard streamData={streamDataFromBackend} />
```

---

## 🔧 Customization

### Change Polling Interval

In `LiveDataScreen.tsx`:

```typescript
pollingStopFn.current = backendAPI.startPolling(
  (data) => { ... },
  2000,  // Change to 2 seconds (2000ms)
  (err) => { ... }
);
```

### Change Backend URL

In `src/services/backendApi.ts`:

```typescript
export const BACKEND_CONFIG = {
  BASE_URL: 'http://your-backend-url:8000',
  // ...
};
```

Or use environment variable:

```bash
# .env file
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
EXPO_PUBLIC_WS_URL=ws://your-backend-url:8000
```

### Add to Existing Screen

```typescript
import { backendAPI, StreamDataResponse } from '../services/backendApi';
import { BiosignalCard } from '../components/BiosignalCard';
import { useState, useEffect } from 'react';

const YourScreen = () => {
  const [data, setData] = useState<StreamDataResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const streamData = await backendAPI.getStreamData();
      setData(streamData);
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <ActivityIndicator />;

  return (
    <View>
      <BiosignalCard
        type="heart_rate"
        value={data.raw_signals.heart_rate}
        unit="BPM"
        quality={data.clarity_layer.quality_metrics.heart_rate_quality}
      />
      {/* Add more components */}
    </View>
  );
};
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Check**:
1. Backend is running: `python backend/main.py`
2. Backend is accessible: Visit `http://localhost:8000` in browser
3. Correct IP address for your platform

**Fix**:
```bash
# Check backend health
curl http://localhost:8000/api/v1/health

# If using physical device, update IP in backendApi.ts
```

### "Network request failed" on Android

Android emulator uses special IP `10.0.2.2` for localhost. The app handles this automatically, but if issues persist:

```typescript
// In src/services/backendApi.ts, manually set:
BASE_URL: 'http://10.0.2.2:8000',
```

### "WebSocket connection failed"

WebSocket may not work in all environments. Use polling instead:

```typescript
// LiveDataScreen.tsx already uses polling by default
// This works reliably across all platforms
```

### Data not updating

**Check**:
1. Auto-refresh is enabled (play icon, not pause)
2. Backend is sending data: Check backend console logs
3. No network errors in console

**Fix**:
Pull down to refresh manually or toggle auto-refresh off and on.

---

## 📊 Data Flow Diagram

```
Mobile App (React Native)
    ↓
backendAPI Service
    ↓
HTTP GET /api/v1/stream
    ↓
FastAPI Backend (Port 8000)
    ↓
BLE Simulator → Clarity™ → iFRS™ → Timesystems™ → LIA
    ↓
StreamDataResponse (JSON)
    ↓
Components (BiosignalCard, WellnessCard, LayerProcessingCard)
    ↓
UI Display
```

---

## 📁 Files Created/Modified

### New Files:
1. `src/services/backendApi.ts` - Complete backend integration service
2. `src/components/BiosignalCard.tsx` - Biosignal display component
3. `src/components/WellnessCard.tsx` - Wellness assessment component
4. `src/components/LayerProcessingCard.tsx` - Layer processing visualization
5. `src/screens/livedata/LiveDataScreen.tsx` - Live data screen
6. `INTEGRATION_GUIDE.md` - This file

### Modified Files:
1. `src/types/index.ts` - Added backend-specific types

### To Modify (Your Part):
1. `src/navigation/AppNavigator.tsx` - Add LiveDataScreen to navigation
2. `src/screens/dashboard/DashboardScreen.tsx` - Add navigation button

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Mobile app starts without errors
- [ ] Can navigate to Live Data screen
- [ ] Connection status shows "Connected"
- [ ] Biosignal cards show data
- [ ] Data updates automatically (every 1 second)
- [ ] Pull-to-refresh works
- [ ] Pause/play button works
- [ ] Wellness card displays correctly
- [ ] Layer processing cards expand/collapse
- [ ] Error handling works (stop backend, app shows error)

---

## 🎉 Next Steps

1. Add LiveDataScreen to navigation (5 minutes)
2. Add button to Dashboard (2 minutes)
3. Test on iOS Simulator (immediate)
4. Test on Android Emulator (if available)
5. Customize polling interval if needed
6. Add additional features as desired

---

## 🆘 Support

If you encounter issues:

1. **Check Backend**: `curl http://localhost:8000/api/v1/health`
2. **Check Console**: Look for errors in Metro bundler
3. **Check Network**: Ensure firewall allows port 8000
4. **Test API**: Use Postman with `backend/POSTMAN_COLLECTION.json`

---

## 📚 Additional Resources

- **Backend Documentation**: `backend/TECHNICAL_DOCUMENTATION.md`
- **Quick Start**: `GETTING_STARTED.md`
- **Project Summary**: `PROJECT_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs (when backend running)

---

## 🎯 Summary

You now have:
- ✅ Complete backend API service
- ✅ Professional UI components for all data types
- ✅ Working live data screen
- ✅ Real-time polling (1-second updates)
- ✅ Error handling and retry logic
- ✅ Platform-specific configuration

Just add it to navigation and you're ready to demo!
