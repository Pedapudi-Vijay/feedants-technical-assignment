import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

const TABS = [
  { key: 'about', label: 'About Competition' },
  { key: 'judging', label: 'Judging Parameters' },
  { key: 'rules', label: 'Rules & Eligibility' },
];

export default function InfoTabs({ about, judgingParameters, rulesAndEligibility }) {
  const [active, setActive] = useState('about');
  const [expanded, setExpanded] = useState(false);

  const renderContent = () => {
    if (active === 'about') {
      const text = expanded ? about?.details || about?.summary : about?.summary;
      return (
        <>
          <Text style={styles.bodyText}>{text}</Text>
          {about?.details && about.details !== about.summary && (
            <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
              <Text style={styles.viewMore}>{expanded ? 'View less ⌃' : 'View more ⌄'}</Text>
            </TouchableOpacity>
          )}
        </>
      );
    }

    const list = active === 'judging' ? judgingParameters : rulesAndEligibility;
    if (!list || list.length === 0) {
      return <Text style={styles.bodyText}>No information provided yet.</Text>;
    }
    return list.map((item, idx) => (
      <View key={idx} style={styles.bulletRow}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bodyText}>{item}</Text>
      </View>
    ));
  };

  return (
    <View>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setActive(tab.key);
              setExpanded(false);
            }}
            style={styles.tabButton}
          >
            <Text style={[styles.tabLabel, active === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            {active === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { marginRight: spacing.xl, paddingBottom: spacing.sm },
  tabLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  tabUnderline: { height: 2, backgroundColor: colors.primary, marginTop: spacing.xs, borderRadius: 2 },
  content: { paddingTop: spacing.md },
  bodyText: { fontSize: 13, color: colors.textMuted, lineHeight: 20, flex: 1 },
  viewMore: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  bulletRow: { flexDirection: 'row', marginBottom: spacing.xs },
  bullet: { color: colors.primary, marginRight: spacing.xs },
});
