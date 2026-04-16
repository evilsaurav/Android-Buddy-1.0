import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import { getProfileAchievementsWithBackend } from '../lib/api';

interface Props {
  navigation: any;
}

type AchievementCard = { icon: string; label: string; color: string; unlocked: boolean };

const DEFAULT_ACHIEVEMENTS: AchievementCard[] = [
  { icon: 'flame', label: '5 Day Streak', color: '#EF4444', unlocked: true },
  { icon: 'trophy', label: 'First Subject', color: '#F59E0B', unlocked: true },
  { icon: 'rocket', label: '50% Overall', color: '#8B5CF6', unlocked: true },
  { icon: 'diamond', label: 'All Clear', color: '#06B6D4', unlocked: false },
  { icon: 'medal', label: 'Top Scorer', color: '#10B981', unlocked: false },
];

export default function ProfileScreen({ navigation }: Props) {
  const { sessionMode, profile, logout } = useAuth();
  const [profileName, setProfileName] = useState('BCA Student');
  const [profileEmail, setProfileEmail] = useState('student@university.edu');
  const [semester, setSemester] = useState('3rd');
  const [achievements, setAchievements] = useState<AchievementCard[]>(DEFAULT_ACHIEVEMENTS);

  useEffect(() => {
    loadProfile();
    loadAchievements();
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return unsubscribe;
  }, [navigation]);

  const loadAchievements = async () => {
    if (sessionMode !== 'authenticated') {
      setAchievements(DEFAULT_ACHIEVEMENTS);
      return;
    }

    try {
      const data = await getProfileAchievementsWithBackend();
      const raw = (data as { achievements?: unknown }).achievements;
      if (Array.isArray(raw) && raw.length > 0) {
        const parsed = raw
          .map((item, idx) => {
            const row = item as Record<string, unknown>;
            const label = String(row.title || row.name || row.label || '').trim();
            if (!label) return null;
            return {
              icon: String(row.icon || DEFAULT_ACHIEVEMENTS[idx % DEFAULT_ACHIEVEMENTS.length].icon),
              label,
              color: String(row.color || DEFAULT_ACHIEVEMENTS[idx % DEFAULT_ACHIEVEMENTS.length].color),
              unlocked: Boolean(row.unlocked),
            } as AchievementCard;
          })
          .filter(Boolean) as AchievementCard[];

        if (parsed.length > 0) {
          setAchievements(parsed);
          return;
        }
      }

      setAchievements(DEFAULT_ACHIEVEMENTS);
    } catch {
      setAchievements(DEFAULT_ACHIEVEMENTS);
    }
  };

  const loadProfile = async () => {
    if (sessionMode === 'authenticated' && profile) {
      const display = String(profile.display_name || profile.username || 'BCABuddy User');
      const mail = String(profile.email || 'Connected to BCABuddy backend');
      if (display) setProfileName(display);
      if (mail) setProfileEmail(mail);
      const semRaw = String(profile.semester || '').trim();
      if (semRaw) {
        setSemester(semRaw + getSuffix(semRaw));
      }
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('@bcabuddy_profile');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.name) setProfileName(data.name);
        if (data.email) setProfileEmail(data.email);
        if (data.semester) setSemester(data.semester + getSuffix(data.semester));
      }
    } catch {}
  };

  const getSuffix = (n: string) => {
    const num = parseInt(n);
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  const totalProgress = SUBJECTS.reduce((s, sub) => s + sub.progress, 0) / SUBJECTS.length;
  const totalTopics = SUBJECTS.reduce((s, sub) => s + sub.completedTopics, 0);
  const totalHours = SUBJECTS.reduce((s, sub) => s + sub.topics.filter(t => t.completed).reduce((h, t) => h + t.estimatedHours, 0), 0);
  const streak = 5;

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile', color: COLORS.primary },
        { icon: 'settings-outline', label: 'Preferences', screen: 'Preferences', color: COLORS.secondary },
        { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#EF4444' },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        { icon: 'download-outline', label: 'Offline Data', screen: 'OfflineData', color: COLORS.accent },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', screen: 'Privacy', color: COLORS.success },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'information-circle-outline', label: 'About BCABuddy', screen: 'About', color: '#1E1B4B' },
        { icon: 'construct-outline', label: 'Phase-2 Tools', screen: 'ProductionTools', color: '#14B8A6' },
        { icon: 'star-outline', label: 'Rate Us', screen: 'RateUs', color: '#F59E0B' },
        { icon: 'help-circle-outline', label: 'Help & Support', screen: 'HelpSupport', color: COLORS.primary },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {sessionMode === 'guest' ? (
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.guestBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>Guest Mode Active</Text>
              <Text style={styles.guestText}>Login to unlock cloud sync, chat history, quiz analytics, and roadmap backup.</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.guestBtn}>
              <Text style={styles.guestBtnText}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={COLORS.white} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl 7</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{profileName}</Text>
          <Text style={styles.profileEmail}>{profileEmail}</Text>
          <Text style={styles.profileMeta}>{semester} Semester</Text>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLbl}>Day Streak</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNum}>{totalTopics}</Text>
            <Text style={styles.statLbl}>Topics Done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalHours}h</Text>
            <Text style={styles.statLbl}>Study Time</Text>
          </View>
        </Animated.View>

        {/* Achievement Cards */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {achievements.map((ach, i) => (
              <View key={i} style={[styles.achCard, !ach.unlocked && styles.achLocked]}>
                <View style={[styles.achIcon, { backgroundColor: ach.unlocked ? ach.color + '20' : COLORS.border }]}>
                  <Ionicons name={ach.icon as any} size={24} color={ach.unlocked ? ach.color : COLORS.textMuted} />
                </View>
                <Text style={[styles.achLabel, !ach.unlocked && { color: COLORS.textMuted }]}>{ach.label}</Text>
                {!ach.unlocked && <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} style={styles.achLockIcon} />}
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Weekly Activity */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityBars}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const heights = [60, 80, 45, 90, 70, 30, 50];
                const isToday = i === (new Date().getDay() + 6) % 7;
                return (
                  <View key={day} style={styles.activityBarCol}>
                    <View style={styles.activityBarBg}>
                      <View style={[
                        styles.activityBarFill,
                        { height: `${heights[i]}%`, backgroundColor: isToday ? COLORS.primary : COLORS.primary + '40' },
                      ]} />
                    </View>
                    <Text style={[styles.activityDayLabel, isToday && { color: COLORS.primary, fontWeight: '700' }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.activitySummary}>
              <Text style={styles.activityTotal}>12.5 hrs this week</Text>
              <View style={styles.activityChangeRow}>
                <Ionicons name="trending-up" size={14} color={COLORS.success} />
                <Text style={styles.activityChange}>23% from last week</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings Menu - Grouped */}
        {menuSections.map((section, si) => (
          <Animated.View key={si} entering={FadeInDown.delay(400 + si * 80).duration(400)} style={styles.section}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuBorder]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIconBg, { backgroundColor: item.color + '12' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        <View style={styles.footer}>
          {sessionMode === 'authenticated' ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.footerText}>BCABuddy v1.0.0</Text>
          <Text style={styles.footerText}>Made with love by BCA Students</Text>
          <Text style={[styles.footerText, { color: COLORS.primary, marginTop: 4 }]}>Azure-Ready Deployment</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: {
    alignItems: 'center', paddingTop: SPACING.xxl, paddingBottom: SPACING.xl,
  },
  avatarContainer: { position: 'relative', marginBottom: SPACING.lg },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.primaryLight,
  },
  levelBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.white,
  },
  levelText: { ...FONTS.small, color: COLORS.white, fontWeight: '700' },
  profileName: { ...FONTS.h2, marginBottom: 4 },
  profileEmail: { ...FONTS.caption },
  profileMeta: { ...FONTS.small, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.primary + '25',
  },
  editProfileText: { ...FONTS.bodyBold, fontSize: 12, color: COLORS.primary },
  statsGrid: {
    flexDirection: 'row', marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, ...SHADOWS.md,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statNum: { ...FONTS.h2, color: COLORS.primary },
  statLbl: { ...FONTS.small, marginTop: 4 },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  sectionTitle: { ...FONTS.h3, marginBottom: SPACING.lg },
  achCard: {
    width: 100, alignItems: 'center', marginRight: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm,
  },
  achLocked: { opacity: 0.5 },
  achIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  achLabel: { ...FONTS.small, textAlign: 'center', fontWeight: '600', color: COLORS.text },
  achLockIcon: { marginTop: 4 },
  activityCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md,
  },
  activityBars: { flexDirection: 'row', justifyContent: 'space-between', height: 100, marginBottom: SPACING.md },
  activityBarCol: { flex: 1, alignItems: 'center' },
  activityBarBg: {
    flex: 1, width: 20, backgroundColor: COLORS.background, borderRadius: RADIUS.sm,
    overflow: 'hidden', justifyContent: 'flex-end', marginBottom: SPACING.xs,
  },
  activityBarFill: { width: '100%', borderRadius: RADIUS.sm },
  activityDayLabel: { ...FONTS.small, fontSize: 10 },
  activitySummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  activityTotal: { ...FONTS.bodyBold, fontSize: 13 },
  activityChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityChange: { ...FONTS.small, color: COLORS.success, fontWeight: '600' },
  menuSectionTitle: {
    ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.md,
    fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, ...SHADOWS.sm, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border + '60' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuIconBg: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...FONTS.body },
  guestBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  guestTitle: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  guestText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  guestBtn: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  guestBtnText: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  logoutText: {
    ...FONTS.small,
    color: COLORS.danger,
    fontWeight: '700',
  },
  footer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  footerText: { ...FONTS.small, marginBottom: 4 },
});
