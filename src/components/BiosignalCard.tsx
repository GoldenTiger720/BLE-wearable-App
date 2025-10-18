/**
 * BiosignalCard Component
 * Displays real-time biosignal data from the backend
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BiosignalCardProps {
  type: 'heart_rate' | 'spo2' | 'temperature' | 'activity';
  value: number;
  unit: string;
  quality?: number; // 0-1 score from Clarity layer
  trend?: 'up' | 'down' | 'stable';
}

const signalConfig = {
  heart_rate: {
    icon: 'heart-pulse',
    label: 'Heart Rate',
    color: '#FF6B6B',
    normalRange: [60, 100],
  },
  spo2: {
    icon: 'water-percent',
    label: 'SpO₂',
    color: '#4ECDC4',
    normalRange: [95, 100],
  },
  temperature: {
    icon: 'thermometer',
    label: 'Temperature',
    color: '#45B7D1',
    normalRange: [36.0, 37.5],
  },
  activity: {
    icon: 'run',
    label: 'Activity',
    color: '#96CEB4',
    normalRange: [0, 150],
  },
};

export const BiosignalCard: React.FC<BiosignalCardProps> = ({
  type,
  value,
  unit,
  quality,
  trend,
}) => {
  const theme = useTheme();
  const config = signalConfig[type];

  // Determine if value is in normal range
  const [min, max] = config.normalRange;
  const isNormal = value >= min && value <= max;

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'trending-neutral';
  };

  // Get quality color
  const getQualityColor = () => {
    if (!quality) return theme.colors.outline;
    if (quality >= 0.9) return '#4CAF50'; // Excellent - Green
    if (quality >= 0.75) return '#8BC34A'; // Good - Light Green
    if (quality >= 0.5) return '#FFC107'; // Fair - Amber
    return '#FF5722'; // Poor - Red
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={32}
              color={config.color}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text variant="labelMedium" style={styles.label}>
              {config.label}
            </Text>
            {quality !== undefined && (
              <Text variant="labelSmall" style={{ color: getQualityColor() }}>
                Signal: {(quality * 100).toFixed(0)}%
              </Text>
            )}
          </View>
          {trend && (
            <MaterialCommunityIcons
              name={getTrendIcon() as any}
              size={20}
              color={theme.colors.onSurface}
            />
          )}
        </View>

        <View style={styles.valueContainer}>
          <Text
            variant="displaySmall"
            style={[
              styles.value,
              { color: isNormal ? config.color : theme.colors.error },
            ]}
          >
            {value.toFixed(type === 'temperature' ? 1 : 0)}
          </Text>
          <Text variant="labelLarge" style={styles.unit}>
            {unit}
          </Text>
        </View>

        {quality !== undefined && (
          <View style={styles.qualityBar}>
            <ProgressBar
              progress={quality}
              color={getQualityColor()}
              style={styles.progressBar}
            />
          </View>
        )}

        {!isNormal && (
          <View style={styles.warningContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color={theme.colors.error}
            />
            <Text variant="labelSmall" style={{ color: theme.colors.error, marginLeft: 4 }}>
              Outside normal range ({min}-{max} {unit})
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  unit: {
    opacity: 0.7,
  },
  qualityBar: {
    marginVertical: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 4,
  },
});
