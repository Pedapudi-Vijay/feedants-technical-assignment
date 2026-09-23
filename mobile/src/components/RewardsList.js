import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

const MEDAL_ICON = { 1: '🏆', 2: '🥈', 3: '🥉' };

export default function RewardsList({ rewards, currency = '₹' }) {
  if (!rewards || rewards.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.subtitle}>(All Positions)</Text>
      </View>
      {rewards
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((r) => (
          <View key={r.position} style={styles.row}>
            <Text style={styles.icon}>{MEDAL_ICON[r.position] || '⭐'}</Text>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.amount}>
              {currency} {r.amount}
            </Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, marginRight: spacing.xs },
  subtitle: { fontSize: 12, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: { fontSize: 16, marginRight: spacing.md },
  label: { flex: 1, fontSize: 13, color: colors.text },
  amount: { fontSize: 13, fontWeight: '700', color: colors.text },
});
