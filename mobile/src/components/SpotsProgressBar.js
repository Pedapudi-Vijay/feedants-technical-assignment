import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

/**
 * Mirrors the "Only 19 spots left" / progress bar / "1 / 20 Booked" block.
 * Text and color react to how full the competition is so it stays meaningful
 * even at 0 spots left ("Fully booked") or 100% ("All spots booked").
 */
export default function SpotsProgressBar({ totalSpots, spotsLeft }) {
  const booked = totalSpots - spotsLeft;
  const ratio = totalSpots > 0 ? booked / totalSpots : 0;
  const isFull = spotsLeft <= 0;

  const headline = isFull ? 'Fully booked' : `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>👥</Text>
        <Text style={[styles.headline, isFull && styles.headlineFull]}>{headline}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(ratio * 100, 100)}%` }, isFull && styles.fillFull]} />
      </View>
      <Text style={styles.caption}>
        {booked} / {totalSpots} Booked
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 140 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  icon: { marginRight: spacing.xs, fontSize: 12 },
  headline: { fontSize: 13, fontWeight: '600', color: colors.text },
  headlineFull: { color: colors.danger },
  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  fillFull: { backgroundColor: colors.danger },
  caption: { fontSize: 12, color: colors.textMuted },
});
