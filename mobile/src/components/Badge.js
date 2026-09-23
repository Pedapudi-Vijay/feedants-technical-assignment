import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default function Badge({ label, variant = 'default' }) {
  const isSolid = variant === 'solid';
  return (
    <View style={[styles.badge, isSolid ? styles.solid : styles.outline]}>
      <Text style={[styles.text, isSolid ? styles.solidText : styles.outlineText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  solid: {
    backgroundColor: colors.primaryLight,
  },
  text: { fontSize: 12, fontWeight: '600' },
  outlineText: { color: colors.textMuted },
  solidText: { color: colors.primary },
});
