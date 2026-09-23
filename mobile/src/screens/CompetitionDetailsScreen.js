import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { fetchCompetitionDetails, registerForCompetition, submitEntry } from '../api/competitions';

import Badge from '../components/Badge';
import RegisteredBadge from '../components/RegisteredBadge';
import SpotsProgressBar from '../components/SpotsProgressBar';
import JudgeCard from '../components/JudgeCard';
import CountdownBanner from '../components/CountdownBanner';
import DateCard from '../components/DateCard';
import PreviousWinners from '../components/PreviousWinners';
import InfoTabs from '../components/InfoTabs';
import RewardsList from '../components/RewardsList';
import PrimaryActionButton from '../components/PrimaryActionButton';

export default function CompetitionDetailsScreen({ competitionId, onGoBack }) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCompetitionDetails(competitionId);
      setCompetition(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competitionId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handlePrimaryAction = async () => {
    if (!competition) return;
    const { primaryAction } = competition.computed;

    try {
      setActionLoading(true);

      if (primaryAction === 'REGISTER_NOW') {
        await registerForCompetition(competitionId);
        Alert.alert('You\u2019re in!', 'Your spot has been reserved.');
        await load();
        return;
      }

      if (primaryAction === 'UPLOAD_SUBMISSION') {
        // In a full build this opens a file/video picker and uploads to object
        // storage first, then calls submitEntry with the resulting URL. Simulated
        // here with a placeholder URL to keep the demo self-contained.
        await submitEntry(competitionId, 'https://example.com/uploads/demo-submission.mp4');
        Alert.alert('Submitted!', 'Your entry has been received.');
        await load();
        return;
      }

      if (primaryAction === 'VIEW_RESULTS') {
        Alert.alert('Results', 'Results screen goes here.');
      }
    } catch (err) {
      // Server is the source of truth - if two requests race (e.g. last spot
      // taken by someone else a moment ago), surface exactly what it says and
      // refresh so the UI reflects reality immediately.
      Alert.alert('Couldn\u2019t complete that', err.message);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayIntro = () => {
    if (competition?.judge?.introVideoUrl) Linking.openURL(competition.judge.introVideoUrl);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.muted}>Loading competition...</Text>
      </SafeAreaView>
    );
  }

  if (error || !competition) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.muted}>{error || 'Competition not found'}</Text>
        <TouchableOpacity onPress={load} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { computed } = competition;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backRow}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
          <Text style={styles.backLabel}>Go back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{competition.title}</Text>
            <RegisteredBadge isRegistered={computed.isRegistered} />
          </View>

          <View style={styles.badgeRow}>
            {competition.tags.map((t) => (
              <Badge key={t} label={t} />
            ))}
            {competition.winnersGetCertificate && (
              <View style={styles.certRow}>
                <Text style={styles.certIcon}>🏆</Text>
                <Text style={styles.certLabel}>Winners get certificate</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Prize Pool</Text>
              <Text style={styles.statValue}>₹ {competition.prizePool}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Entry Fee</Text>
              <Text style={styles.statValue}>₹ {competition.entryFee}</Text>
            </View>
            <SpotsProgressBar totalSpots={competition.totalSpots} spotsLeft={computed.spotsLeft} />
          </View>
        </View>

        {/* Judge */}
        <View style={styles.sectionSpacing}>
          <JudgeCard judge={competition.judge} onPlayIntro={handlePlayIntro} />
        </View>

        {/* Countdown */}
        {computed.countdownTarget && (
          <View style={styles.sectionSpacing}>
            <CountdownBanner
              label={computed.flags.registrationOpen ? 'Registration closes in' : 'Submission closes in'}
              targetDate={computed.countdownTarget}
              onExpire={load}
            />
          </View>
        )}

        {/* Important dates */}
        <View style={[styles.card, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Important Dates</Text>
          <View style={styles.dateGrid}>
            <DateCard icon="📅" label="Register Before" dateStr={competition.dates.registrationClosesAt} />
            <DateCard icon="📨" label="Submission Starts" dateStr={competition.dates.submissionStartsAt} />
            <DateCard icon="⬆️" label="Submission Ends" dateStr={competition.dates.submissionEndsAt} />
            <DateCard icon="🏆" label="Result Date" dateStr={competition.dates.resultDate} />
          </View>
        </View>

        {/* Previous winners */}
        <View style={styles.sectionSpacing}>
          <PreviousWinners
            winners={competition.previousWinners}
            onPlay={(w) => w.videoUrl && Linking.openURL(w.videoUrl)}
          />
        </View>

        {/* Tabs */}
        <View style={[styles.card, styles.sectionSpacing]}>
          <InfoTabs
            about={competition.about}
            judgingParameters={competition.judgingParameters}
            rulesAndEligibility={competition.rulesAndEligibility}
          />
        </View>

        {/* Rewards */}
        <View style={[styles.card, styles.sectionSpacing]}>
          <RewardsList rewards={competition.rewards} currency="₹" />
          {!!competition.disclaimer && (
            <View style={styles.disclaimerRow}>
              <Text style={styles.disclaimerIcon}>ℹ️</Text>
              <Text style={styles.disclaimerText}>Disclaimer: {competition.disclaimer}</Text>
            </View>
          )}
        </View>

        {/* Referral */}
        {competition.referral?.enabled && (
          <View style={[styles.card, styles.sectionSpacing, styles.referralCard]}>
            <Text style={styles.referralTitle}>📣 Refer & Earn more discount</Text>
            <Text style={styles.referralLink}>{competition.referral.linkTemplate}</Text>
            <Text style={styles.referralReward}>{competition.referral.rewardText}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryActionButton action={computed.primaryAction} loading={actionLoading} onPress={handlePrimaryAction} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  muted: { color: colors.textMuted },
  retryButton: { marginTop: spacing.md, padding: spacing.sm },
  retryLabel: { color: colors.primary, fontWeight: '600' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  backArrow: { fontSize: 16, marginRight: spacing.sm, color: colors.text },
  backLabel: { fontSize: 15, fontWeight: '600', color: colors.text },

  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionSpacing: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },

  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md },
  certRow: { flexDirection: 'row', alignItems: 'center' },
  certIcon: { marginRight: spacing.xs, fontSize: 12 },
  certLabel: { fontSize: 12, color: colors.textMuted },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  statBlock: { marginRight: spacing.xl },
  statLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },

  disclaimerRow: {
    flexDirection: 'row',
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disclaimerIcon: { marginRight: spacing.sm },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.text },

  referralCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  referralTitle: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  referralLink: { color: colors.primaryDark, marginBottom: spacing.xs },
  referralReward: { fontSize: 12, color: colors.textMuted },

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
