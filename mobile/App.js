import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { getToken } from './src/api/client';
import { login } from './src/api/auth';
import CompetitionDetailsScreen from './src/screens/CompetitionDetailsScreen';
import { DEMO_COMPETITION_ID } from './src/api/config';
import { colors, spacing, radius } from './src/theme/colors';

/**
 * Minimal root component: a login gate (auth is not the focus of this
 * assignment) followed by the Competition Details screen. Swap in real
 * navigation (React Navigation) and an Explore/Home screen when extending
 * this beyond the assignment's scope.
 */
export default function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState('demo@feedants.com');
  const [password, setPassword] = useState('password123');
  const [authError, setAuthError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setIsAuthed(Boolean(token));
      setCheckingSession(false);
    })();
  }, []);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setAuthError(null);
      await login(email, password);
      setIsAuthed(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) return null;

  if (!isAuthed) {
    return (
      <SafeAreaView style={styles.loginScreen}>
        <Text style={styles.loginTitle}>Feedants</Text>
        <Text style={styles.loginSubtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        {authError && <Text style={styles.errorText}>{authError}</Text>}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.loginButtonLabel}>{submitting ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Demo account: seed the backend first (`npm run seed`), then use the printed
          demo@feedants.com / password123.</Text>
      </SafeAreaView>
    );
  }

  return <CompetitionDetailsScreen competitionId={DEMO_COMPETITION_ID} onGoBack={() => {}} />;
}

const styles = StyleSheet.create({
  loginScreen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  loginTitle: { fontSize: 28, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.xs },
  loginSubtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, marginBottom: spacing.md },
  loginButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonLabel: { color: colors.surface, fontWeight: '700' },
  hint: { fontSize: 11, color: colors.textFaint, marginTop: spacing.xl, textAlign: 'center' },
});
