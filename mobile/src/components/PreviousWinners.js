import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function PreviousWinners({ winners, onPlay }) {
  if (!winners || winners.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Previous Winners</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {winners.map((w, idx) => (
          <TouchableOpacity
            key={`${w.name}-${idx}`}
            style={styles.item}
            onPress={() => onPlay && onPlay(w)}
            accessibilityLabel={`Play ${w.name}'s winning entry`}
          >
            <View style={styles.thumbWrapper}>
              {w.photoUrl ? (
                <Image source={{ uri: w.photoUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbInitial}>{w.name[0]}</Text>
                </View>
              )}
              {w.videoUrl ? (
                <View style={styles.playOverlay}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {w.name}
            </Text>
            <Text style={styles.position}>{w.position}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  row: { paddingRight: spacing.lg },
  item: { width: 90, marginRight: spacing.md },
  thumbWrapper: { width: 90, height: 90, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.xs },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: colors.primary, fontWeight: '700', fontSize: 24 },
  playOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 9, color: colors.primary },
  name: { fontSize: 12, fontWeight: '600', color: colors.text },
  position: { fontSize: 11, color: colors.textMuted },
});
