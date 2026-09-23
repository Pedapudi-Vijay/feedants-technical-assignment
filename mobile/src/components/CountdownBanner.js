import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Mirrors "Registration closes in 01d : 06h : 28m : 32s / Hurry up!".
 * Label and target date adapt to whichever window is currently active
 * (registration vs submission), driven entirely by the backend's computed
 * countdownTarget - the component itself has no lifecycle logic.
 */
export default function CountdownBanner({ label, targetDate, onExpire }) {
  const { formatted, expired } = useCountdown(targetDate);

  React.useEffect(() => {
    if (expired && onExpire) onExpire();
  }, [expired]);

  if (!targetDate || expired) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.timer}>{formatted}</Text>
      <View style={styles.right}>
        <Text style={styles.hurry}>Hurry up!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  icon: { marginRight: spacing.xs },
  label: { fontSize: 12, color: colors.text, fontWeight: '600', flexShrink: 1 },
  timer: { fontSize: 13, fontWeight: '700', color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center' },
  hurry: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
