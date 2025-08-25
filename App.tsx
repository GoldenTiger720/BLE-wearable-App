import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';
import { useAppStore } from './src/store';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'react-native-reanimated/plugin',
  'react-native-worklets',
  'Reanimated',
]);

export default function App() {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Load persisted state on app start
    useAppStore.getState().loadPersistedState().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AppNavigator />
    </PaperProvider>
  );
}
