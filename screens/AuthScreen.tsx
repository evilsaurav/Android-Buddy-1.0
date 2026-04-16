import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { useAuth } from '../context/AuthContext';
import { ApiError, forgotPasswordWithBackend, resetPasswordWithBackend } from '../lib/api';

export default function AuthScreen() {
  const { continueAsGuest, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState('3');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await signup({
          username: username.trim(),
          password,
          semester: semester.trim() || '3',
          email: email.trim() || undefined,
        });
      }
    } catch (err) {
      const e = err as ApiError;
      const detail = String(e?.message || 'Authentication failed.').trim();
      setError(detail.length > 140 ? `${detail.slice(0, 140)}...` : detail);
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    try {
      setBusy(true);
      setError('');
      await continueAsGuest();
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      setError('Enter username first to request password reset.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      const data = await forgotPasswordWithBackend(username.trim());
      const token = String(data?.reset_token || '').trim();
      if (token) {
        setResetToken(token);
      }
      setError(data?.message ? String(data.message) : 'Reset link requested successfully.');
    } catch (err) {
      const e = err as ApiError;
      setError(String(e?.message || 'Unable to request password reset.'));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim()) {
      setError('Reset token and new password are required.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      await resetPasswordWithBackend(resetToken.trim(), newPassword, newPassword);
      setError('Password reset successful. You can login now.');
      setResetToken('');
      setNewPassword('');
      setMode('login');
    } catch (err) {
      const e = err as ApiError;
      setError(String(e?.message || 'Unable to reset password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <View style={styles.logoBubble}>
            <Ionicons name="sparkles" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.title}>BCABuddy 2.0 Connect</Text>
          <Text style={styles.subtitle}>Login for full features, or continue as guest.</Text>
        </View>

        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchBtn, mode === 'login' && styles.switchBtnActive]}
            onPress={() => setMode('login')}
            disabled={busy}
          >
            <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, mode === 'signup' && styles.switchBtnActive]}
            onPress={() => setMode('signup')}
            disabled={busy}
          >
            <Text style={[styles.switchText, mode === 'signup' && styles.switchTextActive]}>Signup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TextInput
            placeholder="Username"
            placeholderTextColor={COLORS.textMuted}
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
            editable={!busy}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            editable={!busy}
          />
          {mode === 'signup' && (
            <>
              <TextInput
                placeholder="Semester (e.g. 3)"
                placeholderTextColor={COLORS.textMuted}
                value={semester}
                onChangeText={setSemester}
                style={styles.input}
                keyboardType="number-pad"
                editable={!busy}
              />
              <TextInput
                placeholder="Email (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!busy}
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryText}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={handleGuest} disabled={busy}>
            <Text style={styles.ghostText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={handleForgotPassword} disabled={busy}>
            <Text style={styles.ghostText}>Forgot Password</Text>
          </TouchableOpacity>

          {resetToken ? (
            <View style={styles.resetCard}>
              <Text style={styles.resetLabel}>Reset Token</Text>
              <Text style={styles.resetToken}>{resetToken}</Text>
              <TextInput
                placeholder="New Password"
                placeholderTextColor={COLORS.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={styles.input}
                editable={!busy}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={busy}>
                <Text style={styles.primaryText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.caption,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    ...FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  switchTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...FONTS.body,
    marginBottom: SPACING.sm,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  primaryText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
  ghostBtn: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  ghostText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  error: {
    ...FONTS.small,
    color: COLORS.danger,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  resetCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  resetLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resetToken: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
});
