import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import Constants from 'expo-constants';
import { theme } from '../utils/theme';

const isExpoGo = Constants.appOwnership === 'expo';

export const ExpoGoWarning: React.FC = () => {
  if (!isExpoGo) return null;

  return (
    <Banner
      visible={true}
      actions={[]}
      icon="information-outline"
      style={styles.banner}
    >
      <Text variant="bodySmall" style={styles.text}>
        Running in Expo Go: Using in-app notifications for demo. 
        For push notifications, use a development build.
      </Text>
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.primaryContainer,
    marginBottom: 8,
  },
  text: {
    color: theme.colors.onPrimaryContainer,
    lineHeight: 18,
  },
});