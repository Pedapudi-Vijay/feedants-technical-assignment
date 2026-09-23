import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return { dateLine: `${day} ${month} ${year}`, timeLine: `${hours}:${minutes} ${ampm}` };
}

export default function DateCard({ icon, label, dateStr }) {
  const { dateLine, timeLine } = formatDate(dateStr);
  return (
    <View style={styles.cell}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.date}>{dateLine}</Text>
        <Text style={styles.time}>{timeLine}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flexDirection: 'row', width: '50%', paddingVertical: spacing.md, paddingRight: spacing.md },
  icon: { fontSize: 16, marginRight: spacing.sm, marginTop: 2 },
  label: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  date: { fontSize: 13, fontWeight: '700', color: colors.text },
  time: { fontSize: 13, fontWeight: '700', color: colors.text },
});
