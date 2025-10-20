import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';
import { useAppStore } from '../store';
import { NotificationService } from '../services/notifications';
import { theme } from '../utils/theme';

// Import screens
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { WearablePairingScreen } from '../screens/wearable/WearablePairingScreen';
import { SessionScreen } from '../screens/session/SessionScreen';
import { SessionDetailScreen } from '../screens/session/SessionDetailScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { MyProfileScreen } from '../screens/profile/MyProfileScreen';
import { LiveDataScreen } from '../screens/livedata/LiveDataScreen';
import { ProcessingLogsScreen } from '../screens/logs/ProcessingLogsScreen';
import { DemoConnectionScreen } from '../screens/demo/DemoConnectionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation theme that includes fonts
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    border: theme.colors.surfaceVariant,
    notification: theme.colors.error,
  },
  fonts: DefaultTheme.fonts, // Use React Navigation's default fonts
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          } else {
            iconName = 'circle';
          }

          return <IconButton icon={iconName} size={size} iconColor={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: 'History',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { auth } = useAppStore();

  useEffect(() => {
    // Initialize notifications when app starts
    if (auth.isAuthenticated) {
      NotificationService.initialize();
    }
  }, [auth.isAuthenticated]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {!auth.isAuthenticated ? (
          // Auth flow
          <>
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main app flow
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WearablePairing"
              component={WearablePairingScreen}
              options={{
                title: 'Connect Device',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{
                title: 'Active Session',
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen
              name="SessionDetail"
              component={SessionDetailScreen}
              options={{
                title: 'Session Details',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="MyProfile"
              component={MyProfileScreen}
              options={{
                title: 'My Profile',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="LiveData"
              component={LiveDataScreen}
              options={{
                title: 'Live Data Stream',
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="ProcessingLogs"
              component={ProcessingLogsScreen}
              options={{
                title: 'Processing Logs',
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="DemoConnection"
              component={DemoConnectionScreen}
              options={{
                title: 'API Demo',
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;