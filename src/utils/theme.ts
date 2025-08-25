import { MD3LightTheme, MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#4CAF50',
    tertiary: '#FF9800',
    error: '#F44336',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#E8E8E8',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    outline: '#757575',
    outlineVariant: '#C7C7C7',
    inverseSurface: '#2F2F2F',
    inverseOnSurface: '#F1F1F1',
    inversePrimary: '#B3D4FC',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
};