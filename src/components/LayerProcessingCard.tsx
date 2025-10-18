/**
 * LayerProcessingCard Component
 * Shows detailed processing information from Clarity™, iFRS™, and Timesystems™ layers
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, useTheme, List, Divider, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { StreamDataResponse } from '../services/backendApi';

interface LayerProcessingCardProps {
  streamData: StreamDataResponse;
}

export const LayerProcessingCard: React.FC<LayerProcessingCardProps> = ({ streamData }) => {
  const theme = useTheme();
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  const { clarity_layer, ifrs_layer, timesystems_layer } = streamData;

  // Quality color helper
  const getQualityColor = (score: number): string => {
    if (score >= 0.9) return '#4CAF50';
    if (score >= 0.75) return '#8BC34A';
    if (score >= 0.5) return '#FFC107';
    return '#FF5722';
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="layers-triple" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.title}>
            Processing Layers
          </Text>
        </View>

        {/* Clarity™ Layer */}
        <List.Accordion
          title="Clarity™ Layer"
          description="Signal Quality & Noise Reduction"
          expanded={expandedLayer === 'clarity'}
          onPress={() => setExpandedLayer(expandedLayer === 'clarity' ? null : 'clarity')}
          left={(props) => <List.Icon {...props} icon="waveform" color="#4ECDC4" />}
          right={(props) => (
            <Chip
              compact
              style={[styles.chip, { backgroundColor: `${getQualityColor(clarity_layer.quality_score)}15` }]}
              textStyle={{ color: getQualityColor(clarity_layer.quality_score), fontSize: 12 }}
            >
              {clarity_layer.quality_assessment.toUpperCase()}
            </Chip>
          )}
        >
          <View style={styles.layerContent}>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Quality Score:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {(clarity_layer.quality_score * 100).toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={clarity_layer.quality_score}
              color={getQualityColor(clarity_layer.quality_score)}
              style={styles.progressBar}
            />

            <View style={[styles.metricRow, { marginTop: 12 }]}>
              <Text variant="bodySmall" style={styles.metricLabel}>Signal-to-Noise Ratio:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {clarity_layer.signal_to_noise_ratio.toFixed(1)} dB
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Noise Reduction:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {clarity_layer.noise_reduction_applied ? '✓ Applied' : '✗ Not needed'}
              </Text>
            </View>

            {clarity_layer.artifacts_detected.length > 0 && (
              <View style={styles.artifactsContainer}>
                <Text variant="labelSmall" style={styles.artifactsLabel}>
                  Artifacts Detected:
                </Text>
                {clarity_layer.artifacts_detected.map((artifact, index) => (
                  <Chip
                    key={index}
                    compact
                    icon="alert-circle-outline"
                    style={styles.artifactChip}
                    textStyle={styles.artifactText}
                  >
                    {artifact}
                  </Chip>
                ))}
              </View>
            )}

            <Text variant="labelSmall" style={styles.notes}>
              {clarity_layer.processing_notes}
            </Text>
          </View>
        </List.Accordion>

        <Divider />

        {/* iFRS™ Layer */}
        <List.Accordion
          title="iFRS™ Layer"
          description="Intelligent Frequency Response System"
          expanded={expandedLayer === 'ifrs'}
          onPress={() => setExpandedLayer(expandedLayer === 'ifrs' ? null : 'ifrs')}
          left={(props) => <List.Icon {...props} icon="sine-wave" color="#FF6B6B" />}
          right={(props) => (
            <Chip
              compact
              style={[styles.chip, { backgroundColor: `${theme.colors.primary}15` }]}
              textStyle={{ color: theme.colors.primary, fontSize: 12 }}
            >
              {ifrs_layer.rhythm_classification.replace('_', ' ').toUpperCase()}
            </Chip>
          )}
        >
          <View style={styles.layerContent}>
            {/* HRV Metrics */}
            <Text variant="labelMedium" style={styles.subsectionTitle}>
              Heart Rate Variability
            </Text>
            <View style={styles.hrvContainer}>
              <View style={styles.hrvMetric}>
                <Text variant="labelSmall" style={styles.hrvLabel}>HRV Score</Text>
                <Text variant="titleMedium" style={styles.hrvValue}>
                  {ifrs_layer.hrv_features.hrv_score.toFixed(0)}
                </Text>
                <Text variant="labelSmall" style={styles.hrvUnit}>/100</Text>
              </View>
              <View style={styles.hrvMetric}>
                <Text variant="labelSmall" style={styles.hrvLabel}>RMSSD</Text>
                <Text variant="titleMedium" style={styles.hrvValue}>
                  {ifrs_layer.hrv_features.rmssd.toFixed(1)}
                </Text>
                <Text variant="labelSmall" style={styles.hrvUnit}>ms</Text>
              </View>
              <View style={styles.hrvMetric}>
                <Text variant="labelSmall" style={styles.hrvLabel}>SDNN</Text>
                <Text variant="titleMedium" style={styles.hrvValue}>
                  {ifrs_layer.hrv_features.sdnn.toFixed(1)}
                </Text>
                <Text variant="labelSmall" style={styles.hrvUnit}>ms</Text>
              </View>
            </View>

            {/* Frequency Bands */}
            <Text variant="labelMedium" style={[styles.subsectionTitle, { marginTop: 12 }]}>
              Frequency Bands
            </Text>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>VLF:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.frequency_bands.vlf.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>LF:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.frequency_bands.lf.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>HF:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.frequency_bands.hf.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>LF/HF Ratio:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.frequency_bands.lf_hf_ratio.toFixed(2)}
              </Text>
            </View>

            {/* Other Metrics */}
            <View style={[styles.metricRow, { marginTop: 12 }]}>
              <Text variant="bodySmall" style={styles.metricLabel}>Dominant Frequency:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.dominant_frequency.toFixed(2)} Hz
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Respiratory Rate:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {ifrs_layer.respiratory_rate.toFixed(1)} breaths/min
              </Text>
            </View>

            <Text variant="labelSmall" style={styles.notes}>
              {ifrs_layer.processing_notes}
            </Text>
          </View>
        </List.Accordion>

        <Divider />

        {/* Timesystems™ Layer */}
        <List.Accordion
          title="Timesystems™ Layer"
          description="Temporal Analysis & Circadian Rhythm"
          expanded={expandedLayer === 'timesystems'}
          onPress={() => setExpandedLayer(expandedLayer === 'timesystems' ? null : 'timesystems')}
          left={(props) => <List.Icon {...props} icon="clock-outline" color="#96CEB4" />}
          right={(props) => (
            <Chip
              compact
              style={[styles.chip, { backgroundColor: `${theme.colors.tertiary}15` }]}
              textStyle={{ color: theme.colors.tertiary, fontSize: 12 }}
            >
              {timesystems_layer.pattern_type.toUpperCase()}
            </Chip>
          )}
        >
          <View style={styles.layerContent}>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Circadian Phase:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.circadian_phase.charAt(0).toUpperCase() +
                 timesystems_layer.circadian_phase.slice(1)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Pattern Type:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.pattern_type.charAt(0).toUpperCase() +
                 timesystems_layer.pattern_type.slice(1)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Temporal Consistency:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {(timesystems_layer.temporal_consistency * 100).toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={timesystems_layer.temporal_consistency}
              color={getQualityColor(timesystems_layer.temporal_consistency)}
              style={styles.progressBar}
            />

            <View style={[styles.metricRow, { marginTop: 12 }]}>
              <Text variant="bodySmall" style={styles.metricLabel}>Rhythm Score:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.rhythm_score.toFixed(0)}/100
              </Text>
            </View>

            {/* Circadian Alignment */}
            <Text variant="labelMedium" style={[styles.subsectionTitle, { marginTop: 12 }]}>
              Circadian Alignment
            </Text>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Expected HR:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.circadian_alignment.expected_heart_rate.toFixed(0)} BPM
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Actual HR:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.circadian_alignment.actual_heart_rate.toFixed(0)} BPM
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Alignment Score:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {(timesystems_layer.circadian_alignment.alignment_score * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodySmall" style={styles.metricLabel}>Phase Shift:</Text>
              <Text variant="bodySmall" style={styles.metricValue}>
                {timesystems_layer.circadian_alignment.phase_shift_minutes > 0 ? '+' : ''}
                {timesystems_layer.circadian_alignment.phase_shift_minutes.toFixed(1)} min
              </Text>
            </View>

            <Text variant="labelSmall" style={styles.notes}>
              {timesystems_layer.processing_notes}
            </Text>
          </View>
        </List.Accordion>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  chip: {
    marginRight: 8,
  },
  layerContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  metricLabel: {
    opacity: 0.7,
  },
  metricValue: {
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  subsectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  hrvContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  hrvMetric: {
    alignItems: 'center',
  },
  hrvLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  hrvValue: {
    fontWeight: 'bold',
  },
  hrvUnit: {
    opacity: 0.6,
  },
  artifactsContainer: {
    marginTop: 12,
  },
  artifactsLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  artifactChip: {
    marginRight: 4,
    marginTop: 4,
  },
  artifactText: {
    fontSize: 11,
  },
  notes: {
    marginTop: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
