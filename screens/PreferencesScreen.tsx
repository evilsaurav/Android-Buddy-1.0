import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { useAuth } from '../context/AuthContext';
import { ResponseMode, updateProfileWithBackend } from '../lib/api';

interface Props {
  navigation: any;
}

interface Preferences {
  darkMode: boolean;
  dailyReminder: boolean;
  studyTimer: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoSync: boolean;
  showStreak: boolean;
  compactView: boolean;
  language: string;
  studyGoalHours: number;
  breakDuration: number;
  privacyMode: boolean;
  responseMode: ResponseMode;
  frenzyModeOverride: boolean;
  semesterPreference: string;
}

const STORAGE_KEY = '@bcabuddy_preferences';

export default function PreferencesScreen({ navigation }: Props) {
  const { sessionMode, profile, refreshProfile } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({
    darkMode: false,
    dailyReminder: true,
    studyTimer: true,
    soundEffects: true,
    hapticFeedback: true,
    autoSync: true,
    showStreak: true,
    compactView: false,
    language: 'English',
    studyGoalHours: 4,
    breakDuration: 10,
    privacyMode: false,
    responseMode: 'thinking',
    frenzyModeOverride: false,
    semesterPreference: 'Sem 3',
  });

  useEffect(() => {
    loadPrefs();
  }, [sessionMode]);

  const loadPrefs = async () => {
    let storedPrefs: Preferences | null = null;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        storedPrefs = JSON.parse(stored) as Preferences;
      }
    } catch {}

    if (storedPrefs) {
      setPrefs(storedPrefs);
    }

    if (sessionMode === 'authenticated' && profile) {
      setPrefs((prev) => ({
        ...prev,
        dailyReminder: typeof profile.enable_notifications === 'boolean' ? profile.enable_notifications : prev.dailyReminder,
        autoSync: typeof profile.auto_save_history === 'boolean' ? profile.auto_save_history : prev.autoSync,
        compactView: typeof profile.show_quick_suggestions === 'boolean' ? !profile.show_quick_suggestions : prev.compactView,
        privacyMode: typeof profile.privacy_mode === 'boolean' ? profile.privacy_mode : prev.privacyMode,
        responseMode:
          profile.default_response_mode === 'fast' || profile.default_response_mode === 'thinking'
            ? profile.default_response_mode
            : prev.responseMode,
        semesterPreference:
          typeof profile.exam_session === 'string' && profile.exam_session.trim()
            ? profile.exam_session.trim()
            : prev.semesterPreference,
      }));
      return;
    }
  };

  const savePrefs = async (nextPrefs: Preferences) => {
    const previousPrefs = prefs;
    setPrefs(nextPrefs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrefs));
    } catch {}

    if (sessionMode === 'authenticated') {
      try {
        const selectedMode: ResponseMode = nextPrefs.frenzyModeOverride ? 'pro' : nextPrefs.responseMode;
        await updateProfileWithBackend({
          enable_notifications: nextPrefs.dailyReminder,
          auto_save_history: nextPrefs.autoSync,
          show_quick_suggestions: !nextPrefs.compactView,
          privacy_mode: nextPrefs.privacyMode,
          default_response_mode: selectedMode,
          exam_session: nextPrefs.semesterPreference,
        });
        await refreshProfile();
      } catch {
        setPrefs(previousPrefs);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(previousPrefs));
        } catch {}
        Alert.alert('Sync failed', 'Preferences could not be synced with backend. Local changes were reverted.');
      }
    }
  };

  const togglePref = async (key: keyof Preferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key as keyof Preferences] };
    await savePrefs(newPrefs as Preferences);
  };

  const adjustValue = async (key: 'studyGoalHours' | 'breakDuration', delta: number) => {
    const current = prefs[key];
    const min = key === 'studyGoalHours' ? 1 : 5;
    const max = key === 'studyGoalHours' ? 12 : 30;
    const newVal = Math.max(min, Math.min(max, current + delta));
    const newPrefs = { ...prefs, [key]: newVal };
    await savePrefs(newPrefs);
  };

  const updateSemester = async (semesterLabel: string) => {
    await savePrefs({ ...prefs, semesterPreference: semesterLabel });
  };

  const updateResponseMode = async (mode: ResponseMode) => {
    await savePrefs({ ...prefs, responseMode: mode });
  };

  const renderToggle = (icon: string, label: string, desc: string, key: keyof Preferences, color: string = COLORS.primary) => (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={prefs[key] as boolean}
        onValueChange={() => togglePref(key)}
        trackColor={{ false: COLORS.border, true: color + '50' }}
        thumbColor={prefs[key] ? color : '#f4f3f4'}
      />
    </View>
  );

  const renderStepper = (icon: string, label: string, key: 'studyGoalHours' | 'breakDuration', unit: string, color: string) => (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>Currently: {prefs[key]} {unit}</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => adjustValue(key, -1)}>
          <Ionicons name="remove" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{prefs[key]}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => adjustValue(key, 1)}>
          <Ionicons name="add" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            {renderToggle('moon-outline', 'Dark Mode', 'Switch to dark theme', 'darkMode', COLORS.secondary)}
            {renderToggle('grid-outline', 'Compact View', 'Show more content per screen', 'compactView', COLORS.accent)}
            {renderToggle('flame-outline', 'Show Streak', 'Display study streak on home', 'showStreak', '#EF4444')}
          </View>
        </Animated.View>

        {/* Study Settings */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Study Settings</Text>
          <View style={styles.card}>
            {renderStepper('time-outline', 'Daily Study Goal', 'studyGoalHours', 'hours', COLORS.primary)}
            {renderStepper('cafe-outline', 'Break Duration', 'breakDuration', 'minutes', COLORS.success)}
            {renderToggle('timer-outline', 'Study Timer', 'Enable Pomodoro timer', 'studyTimer', COLORS.warning)}
            {renderToggle('volume-high-outline', 'Sound Effects', 'Play sounds on completion', 'soundEffects', '#8B5CF6')}
            {renderToggle('phone-portrait-outline', 'Haptic Feedback', 'Vibration on interactions', 'hapticFeedback', COLORS.accent)}
          </View>
        </Animated.View>

        {/* Data & Sync */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          <View style={styles.card}>
            {renderToggle('sync-outline', 'Auto Sync', 'Sync data across devices', 'autoSync', COLORS.success)}
            {renderToggle('notifications-outline', 'Daily Reminder', 'Get study reminders', 'dailyReminder', '#EF4444')}
            {renderToggle('shield-checkmark-outline', 'Privacy Mode', 'Hide detailed analytics from shared views', 'privacyMode', '#7C3AED')}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>AI Response Style</Text>
          <View style={styles.card}>
            {renderToggle(
              'flash-outline',
              'Frenzy Mode Override',
              'Force AI responses to Pro mode for maximum detail',
              'frenzyModeOverride',
              '#F97316'
            )}
            <View style={styles.langRow}>
              {(['fast', 'thinking', 'pro'] as ResponseMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.langChip,
                    prefs.responseMode === mode && styles.langChipActive,
                    prefs.frenzyModeOverride && mode !== 'pro' && styles.langChipDisabled,
                  ]}
                  onPress={() => updateResponseMode(mode)}
                  disabled={prefs.frenzyModeOverride && mode !== 'pro'}
                >
                  <Text style={[styles.langText, prefs.responseMode === mode && styles.langTextActive]}>
                    {mode[0].toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {prefs.frenzyModeOverride ? (
              <Text style={styles.helperText}>Frenzy override active: chat requests will use Pro mode.</Text>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(375).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Semester Preference</Text>
          <View style={styles.card}>
            <View style={styles.langRow}>
              {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map((semester) => (
                <TouchableOpacity
                  key={semester}
                  style={[styles.langChip, prefs.semesterPreference === semester && styles.langChipActive, styles.semChip]}
                  onPress={() => updateSemester(semester)}
                >
                  <Text style={[styles.langText, prefs.semesterPreference === semester && styles.langTextActive]}>{semester}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>Used as your default semester in profile/preferences sync.</Text>
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.card}>
            <View style={styles.langRow}>
              {['English', 'Hindi'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langChip, prefs.language === lang && styles.langChipActive]}
                  onPress={async () => {
                    const newPrefs = { ...prefs, language: lang };
                    await savePrefs(newPrefs);
                  }}
                >
                  <Text style={[styles.langText, prefs.language === lang && styles.langTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { ...FONTS.h3 },
  content: { paddingHorizontal: SPACING.xl },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.md, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border + '50',
  },
  toggleIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  toggleInfo: { flex: 1, marginLeft: SPACING.md },
  toggleLabel: { ...FONTS.bodyBold, fontSize: 14 },
  toggleDesc: { ...FONTS.small, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  stepValue: { ...FONTS.h3, minWidth: 24, textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.sm },
  langChip: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  langChipActive: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary },
  langChipDisabled: { opacity: 0.45 },
  langText: { ...FONTS.bodyBold, fontSize: 14, color: COLORS.textSecondary },
  langTextActive: { color: COLORS.primary },
  semChip: { flexBasis: '30%' },
  helperText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
});
