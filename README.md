# HealthSync AI - Wearable Health Monitoring App

A modern React Native (Expo) mobile application for health monitoring with BLE wearable integration and AI-powered insights.

## Features

### Core Features
- **Email & OTP Authentication**: Secure sign-up and sign-in
- **BLE Wearable Integration**: 
  - Device scanning and connection
  - MTU configuration
  - Real-time status monitoring
  - Background reconnection
  - Firmware version checking
  - Battery and signal strength (RSSI) display
- **Wearable Simulator**: Virtual sensor data generation for device-less testing
- **AI-Powered Chat**: 
  - OpenAI integration with streaming responses
  - Context-aware health insights based on sensor data
  - Session summaries and highlights
- **Voice Features**: Speech-to-text input and text-to-speech output
- **Session Management**: Start/pause/end sessions with timeline view
- **Dashboard**: Connection status, recent sessions, quick actions
- **Notifications**: Disconnection alerts, low battery warnings, session reminders
- **Settings**: Model selection, privacy controls, diagnostic logs

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
cd wearable-llm-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory (already created with the OpenAI API key)

### Running the App

1. Start the development server:
```bash
npx expo start
```

2. Run on iOS Simulator:
```bash
npx expo run:ios
```

3. Run on Android Emulator:
```bash
npx expo run:android
```

4. Run on physical device:
- Install the Expo Go app on your device
- Scan the QR code from the terminal

## Demo Usage

### Authentication
- When prompted for OTP during sign-up/sign-in, check the console logs for the demo OTP code
- The OTP is displayed in the alert message for demo purposes

### BLE Device Connection
1. Navigate to device pairing from the dashboard
2. Enable "Simulator Mode" to use virtual sensor data
3. Or scan for real BLE devices if available

### Starting a Health Session
1. Connect a device or enable simulator mode
2. Tap "Start Session" on the dashboard
3. Use voice input (hold mic button) or type messages
4. View real-time sensor data in the timeline
5. Ask health-related questions like:
   - "How is my heart rate?"
   - "Analyze my stress levels"
   - "What's my activity summary?"

### Voice Features
- **Voice Input**: Long press the microphone button to record
- **Voice Output**: Toggle the speaker icon to enable TTS for AI responses

## Project Structure

```
wearable-llm-app/
├── App.tsx                 # Main app entry point
├── src/
│   ├── components/        # Reusable UI components
│   ├── constants/         # App constants and mock data
│   ├── navigation/        # Navigation configuration
│   ├── screens/          # All app screens
│   ├── services/         # API and device services
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Images and static assets
└── .env                  # Environment variables
```

## Key Technologies

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Zustand** for state management
- **React Native Paper** for UI components
- **OpenAI API** for AI chat functionality
- **Expo AV** for audio recording
- **Expo Speech** for text-to-speech
- **AsyncStorage** for local data persistence

## Customization

### Changing AI Models
Navigate to Settings > AI Model & Quality to select different models:
- GPT-4
- GPT-3.5 Turbo
- LLaMA (mock)
- Mistral (mock)

### Privacy Settings
- Enable "Local Storage Only" to keep all data on device
- Disable "Cloud Sync" for enhanced privacy
- Use biometric authentication for added security

## Troubleshooting

1. **Build errors**: Clear cache with `npx expo start -c`
2. **Metro bundler issues**: Reset with `npx react-native start --reset-cache`
3. **iOS build issues**: Clean build folder in Xcode
4. **Android build issues**: Clean with `cd android && ./gradlew clean`

## Future Enhancements

- Real BLE device integration with specific protocols
- Cloud backend for data synchronization
- Advanced analytics and health trends
- Integration with health platforms (Apple Health, Google Fit)
- Multi-language support
- Offline AI model support

## License

This is a demo application for educational purposes.