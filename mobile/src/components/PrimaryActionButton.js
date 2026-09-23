import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

/**
 * Renders the bottom CTA driven entirely by `computed.primaryAction`, which the
 * backend derives from dates + capacity + the user's registration/submission
 * state (see computeStatus.js). The mobile app never decides this itself -
 * it just maps each known action to a label/behavior/disabled state, so the
 * button always matches the true server-side state (e.g. it can't show
 * "Register Now" after the deadline just because the client's clock is off).
 */
const ACTION_CONFIG = {
  REGISTER_NOW: { label: 'Register Now', disabled: false },
  REGISTERED: { label: 'Registered', disabled: true, subLabel: 'Submission opens soon' },
  UPLOAD_SUBMISSION: { label: 'Upload Submission', disabled: false, subLabel: 'Registered' },
  SUBMISSION_RECEIVED: { label: 'Submission Received', disabled: true },
  SPOTS_FULL: { label: 'All Spots Booked', disabled: true },
  REGISTRATION_CLOSED: { label: 'Registration Closed', disabled: true },
  VIEW_RESULTS: { label: 'View Results', disabled: false },
  VIEW_ONLY: { label: 'Registration Not Open Yet', disabled: true },
};

export default function PrimaryActionButton({ action, loading, onPress }) {
  const config = ACTION_CONFIG[action] || ACTION_CONFIG.VIEW_ONLY;

  return (
    <TouchableOpacity
      style={[styles.button, config.disabled && styles.buttonDisabled]}
      disabled={config.disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <>
          <Text style={styles.label}>{config.label}</Text>
          {config.subLabel ? <Text style={styles.subLabel}>{config.subLabel}</Text> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#9CA8A6' },
  label: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  subLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
});
