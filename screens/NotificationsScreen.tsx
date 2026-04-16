import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

interface NotifSettings {
  studyReminders: boolean;
  examAlerts: boolean;
  backlogWarnings: boolean;
  weeklyReport: boolean;
  achievementAlerts: boolean;
  aiSuggestions: boolean;
  reminderTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const STORAGE_KEY = '@bcabuddy_notifications';

export default function NotificationsScreen({ navigation }: Props) {
  const [settings, setSettings] = useState<NotifSettings>({
    studyReminders: true,
    examAlerts: true,
    backlogWarnings: true,
    weeklyReport: true,
    achievementAlerts: true,
    aiSuggestions: true,
    reminderTime: '09:00 AM',
    quietHoursStart: '10:00 PM',
    quietHoursEnd: '07:00 AM',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  };

  const toggle = async (key: keyof NotifSettings) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof NotifSettings] };
    setSettings(newSettings as NotifSettings);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)); } catch {}
  };

  const TIMES = ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '06:00 PM', '08:00 PM'];

  const renderToggle = (icon: string, label: string, desc: string, key: keyof NotifSettings, color: string) => (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={() => toggle(key)}
        trackColor={{ false: COLORS.border, true: color + '50' }}
        thumbColor={settings[key] ? color : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.statusBanner}>
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Notifications Active</Text>
            <Text style={styles.statusDesc}>You'll receive reminders to keep you on track</Text>
          </View>
        </Animated.View>

        {/* Study Notifications */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Study Notifications</Text>
          <View style={styles.card}>
            {renderToggle('alarm-outline', 'Study Reminders', 'Daily study session reminders', 'studyReminders', COLORS.primary)}
            {renderToggle('sparkles-outline', 'AI Suggestions', 'Smart study recommendations', 'aiSuggestions', COLORS.secondary)}
            {renderToggle('trophy-outline', 'Achievements', 'Celebrate your milestones', 'achievementAlerts', '#F59E0B')}
          </View>
        </Animated.View>

        {/* Exam Notifications */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Exam & Deadlines</Text>
          <View style={styles.card}>
            {renderToggle('calendar-outline', 'Exam Alerts', 'Countdown alerts before exams', 'examAlerts', COLORS.danger)}
            {renderToggle('alert-circle-outline', 'Backlog Warnings', 'Alerts for at-risk subjects', 'backlogWarnings', '#EF4444')}
            {renderToggle('bar-chart-outline', 'Weekly Report', 'Study progress summary', 'weeklyReport', COLORS.success)}
          </View>
        </Animated.View>

        {/* Reminder Time */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Time</Text>
          <View style={styles.card}>
            <Text style={styles.timeLabel}>Daily reminder at:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, settings.reminderTime === time && styles.timeChipActive]}
                  onPress={async () => {
                    const ns = { ...settings, reminderTime: time };
                    setSettings(ns);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ns));
                  }}
                >
                  <Text style={[styles.timeText, settings.reminderTime === time && styles.timeTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Quiet Hours */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <View style={styles.quietCard}>
            <Ionicons name="moon-outline" size={22} color={COLORS.secondary} />
            <View style={styles.quietInfo}>
              <Text style={styles.quietTitle}>Do Not Disturb</Text>
              <Text style={styles.quietTime}>{settings.quietHoursStart} - {settings.quietHoursEnd}</Text>
              <Text style={styles.quietDesc}>No notifications during these hours</Text>
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
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primary + '20',
  },
  statusInfo: { flex: 1, marginLeft: SPACING.md },
  statusTitle: { ...FONTS.bodyBold, color: COLORS.primary },
  statusDesc: { ...FONTS.caption, marginTop: 2 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.md, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border + '50',
  },
  rowIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, marginLeft: SPACING.md },
  rowLabel: { ...FONTS.bodyBold, fontSize: 14 },
  rowDesc: { ...FONTS.small, marginTop: 2 },
  timeLabel: { ...FONTS.caption, fontWeight: '600', marginBottom: SPACING.md, paddingHorizontal: SPACING.sm },
  timeScroll: { paddingHorizontal: SPACING.xs },
  timeChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, marginRight: SPACING.sm, borderWidth: 1.5, borderColor: 'transparent',
  },
  timeChipActive: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary },
  timeText: { ...FONTS.bodyBold, fontSize: 12, color: COLORS.textSecondary },
  timeTextActive: { color: COLORS.primary },
  quietCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary + '10',
    borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.secondary + '20',
  },
  quietInfo: { flex: 1, marginLeft: SPACING.lg },
  quietTitle: { ...FONTS.bodyBold, color: COLORS.secondary },
  quietTime: { ...FONTS.h3, color: COLORS.secondary, marginTop: 4 },
  quietDesc: { ...FONTS.small, marginTop: 4 },
});
