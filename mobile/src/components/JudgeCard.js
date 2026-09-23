import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function JudgeCard({ judge, onPlayIntro }) {
  if (!judge) return null;

  return (
    <View style={styles.card}>
      {judge.photoUrl ? (
        <Image source={{ uri: judge.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{judge.name?.[0] ?? '?'}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.role}>Judge</Text>
        <Text style={styles.name}>{judge.name}</Text>
        {!!judge.title && <Text style={styles.subtitle}>{judge.title}</Text>}
        {!!judge.experienceLabel && <Text style={styles.subtitle}>{judge.experienceLabel}</Text>}
      </View>

      {judge.introVideoUrl ? (
        <TouchableOpacity style={styles.playButton} onPress={onPlayIntro} accessibilityLabel="Play judge intro video">
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playLabel}>Intro Video</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: spacing.md },
  avatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.primary, fontWeight: '700', fontSize: 18 },
  info: { flex: 1 },
  role: { fontSize: 12, color: colors.textMuted },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
  playButton: { alignItems: 'center', paddingLeft: spacing.sm },
  playIcon: {
    color: colors.primary,
    fontSize: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  playLabel: { fontSize: 11, color: colors.primary, marginTop: spacing.xs },
});
