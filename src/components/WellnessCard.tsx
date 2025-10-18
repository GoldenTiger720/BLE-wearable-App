/**
 * WellnessCard Component
 * Displays comprehensive wellness assessment from LIA engine
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { WellnessMetrics, HealthCondition } from '../types';

interface WellnessCardProps {
  wellnessMetrics: WellnessMetrics;
  healthCondition: HealthCondition;
  riskFactors?: string[];
  positiveIndicators?: string[];
}

export const WellnessCard: React.FC<WellnessCardProps> = ({
  wellnessMetrics,
  healthCondition,
  riskFactors = [],
  positiveIndicators = [],
}) => {
  const theme = useTheme();

  // Get wellness color based on score
  const getWellnessColor = (score: number): string => {
    if (score >= 85) return '#4CAF50'; // Excellent
    if (score >= 70) return '#8BC34A'; // Good
    if (score >= 55) return '#FFC107'; // Fair
    return '#FF5722'; // Needs attention
  };

  // Get wellness label
  const getWellnessLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Needs Attention';
  };

  const overallScore = wellnessMetrics.overall_wellness;
  const wellnessColor = getWellnessColor(overallScore);

  const metrics = [
    {
      label: 'Cardiovascular',
      value: wellnessMetrics.cardiovascular_health,
      icon: 'heart-pulse',
    },
    {
      label: 'Respiratory',
      value: wellnessMetrics.respiratory_health,
      icon: 'lungs',
    },
    {
      label: 'Activity',
      value: wellnessMetrics.activity_level,
      icon: 'run-fast',
    },
    {
      label: 'Stress',
      value: wellnessMetrics.stress_level,
      icon: 'brain',
    },
  ];

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        {/* Overall Wellness Score */}
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons
            name="heart-circle"
            size={40}
            color={wellnessColor}
          />
          <View style={styles.headerTextContainer}>
            <Text variant="labelMedium" style={styles.headerLabel}>
              Overall Wellness
            </Text>
            <View style={styles.scoreContainer}>
              <Text
                variant="headlineMedium"
                style={[styles.score, { color: wellnessColor }]}
              >
                {overallScore.toFixed(0)}
              </Text>
              <Text variant="titleMedium" style={styles.scoreLabel}>
                /100 • {getWellnessLabel(overallScore)}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Health Condition */}
        <View style={styles.conditionContainer}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Current Condition
          </Text>
          <View style={styles.conditionBadge}>
            <Chip
              icon="information"
              textStyle={styles.conditionChip}
              style={[styles.chipStyle, { backgroundColor: `${wellnessColor}15` }]}
            >
              {healthCondition.condition}
            </Chip>
            <Text variant="labelSmall" style={styles.confidence}>
              {(healthCondition.confidence * 100).toFixed(0)}% confidence
            </Text>
          </View>
        </View>

        {/* Detailed Metrics */}
        <View style={styles.metricsContainer}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Health Dimensions
          </Text>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricRow}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons
                  name={metric.icon as any}
                  size={20}
                  color={getWellnessColor(metric.value)}
                />
                <Text variant="bodyMedium" style={styles.metricLabel}>
                  {metric.label}
                </Text>
                <Text
                  variant="labelLarge"
                  style={[styles.metricValue, { color: getWellnessColor(metric.value) }]}
                >
                  {metric.value.toFixed(0)}
                </Text>
              </View>
              <ProgressBar
                progress={metric.value / 100}
                color={getWellnessColor(metric.value)}
                style={styles.metricProgress}
              />
            </View>
          ))}
        </View>

        {/* Positive Indicators */}
        {positiveIndicators.length > 0 && (
          <View style={styles.indicatorsContainer}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              ✓ Positive Indicators
            </Text>
            {positiveIndicators.map((indicator, index) => (
              <View key={index} style={styles.indicatorItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#4CAF50"
                />
                <Text variant="bodySmall" style={styles.indicatorText}>
                  {indicator}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <View style={styles.indicatorsContainer}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.error }]}>
              ⚠ Risk Factors
            </Text>
            {riskFactors.map((risk, index) => (
              <View key={index} style={styles.indicatorItem}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.error}
                />
                <Text variant="bodySmall" style={[styles.indicatorText, { color: theme.colors.error }]}>
                  {risk}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendation */}
        {healthCondition.recommendation && (
          <View style={styles.recommendationContainer}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              Recommendation
            </Text>
            <View style={styles.recommendationBox}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={styles.recommendationText}>
                {healthCondition.recommendation}
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  scoreLabel: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  conditionContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipStyle: {
    borderRadius: 8,
  },
  conditionChip: {
    fontWeight: '600',
  },
  confidence: {
    opacity: 0.6,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    flex: 1,
    marginLeft: 8,
  },
  metricValue: {
    fontWeight: '600',
  },
  metricProgress: {
    height: 6,
    borderRadius: 3,
  },
  indicatorsContainer: {
    marginBottom: 16,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  indicatorText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  recommendationContainer: {
    marginTop: 8,
  },
  recommendationBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  recommendationText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
});
