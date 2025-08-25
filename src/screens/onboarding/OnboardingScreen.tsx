import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AudioRecorder } from 'expo-audio';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  permission?: () => Promise<boolean>;
}

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    bluetooth: false,
    notifications: false,
    microphone: false,
  });

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome to Wearable LLM',
      description: 'Your AI-powered health companion that connects with your wearable devices for personalized insights.',
      icon: 'heart-pulse',
    },
    {
      id: 1,
      title: 'Bluetooth Permission',
      description: 'We need Bluetooth access to connect with your wearable devices and receive real-time health data.',
      icon: 'bluetooth',
      permission: async () => {
        // In production, request actual Bluetooth permission
        setPermissions(prev => ({ ...prev, bluetooth: true }));
        return true;
      },
    },
    {
      id: 2,
      title: 'Notifications',
      description: 'Stay informed about device status, low battery alerts, and important health insights.',
      icon: 'bell',
      permission: async () => {
        // For demo purposes, always grant notification permissions
        // In production, you could implement platform-specific permission requests
        console.log('In-app notifications enabled');
        setPermissions(prev => ({ ...prev, notifications: true }));
        return true;
      },
    },
    {
      id: 3,
      title: 'Microphone Access',
      description: 'Enable voice input for hands-free interaction with your AI assistant.',
      icon: 'microphone',
      permission: async () => {
        try {
          const recorder = new AudioRecorder();
          await recorder.requestPermissionsAsync();
          setPermissions(prev => ({ ...prev, microphone: true }));
          return true;
        } catch (error) {
          setPermissions(prev => ({ ...prev, microphone: false }));
          return false;
        }
      },
    },
  ];

  const handleNext = async () => {
    const step = steps[currentStep];
    
    if (step.permission) {
      await step.permission();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={handleSkip}
          style={styles.skipButton}
        >
          Skip
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.iconContainer} elevation={2}>
          <IconButton
            icon={currentStepData.icon}
            size={80}
            iconColor={theme.colors.primary}
          />
        </Surface>

        <Text variant="headlineMedium" style={styles.title}>
          {currentStepData.title}
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          {currentStepData.description}
        </Text>

        {currentStepData.permission && (
          <View style={styles.permissionStatus}>
            <IconButton
              icon={permissions[currentStepData.icon as keyof typeof permissions] ? 'check-circle' : 'circle-outline'}
              size={24}
              iconColor={permissions[currentStepData.icon as keyof typeof permissions] ? theme.colors.secondary : theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={styles.permissionText}>
              {permissions[currentStepData.icon as keyof typeof permissions] ? 'Permission granted' : 'Permission not granted'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {currentStep === 0 ? 'Get Started' : 
           currentStepData.permission ? 'Allow & Continue' : 
           currentStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    marginRight: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: theme.colors.surface,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  description: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  permissionText: {
    marginLeft: 8,
    color: theme.colors.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  button: {
    borderRadius: 28,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});