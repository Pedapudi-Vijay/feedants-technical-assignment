import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function RegisteredBadge({ isRegistered }) {
  if (!isRegistered) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.label}>Registered</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  check: { color: colors.primary, fontWeight: '700', marginRight: spacing.xs },
  label: { color: colors.primary, fontWeight: '600', fontSize: 12 },
});
