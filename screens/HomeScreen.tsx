import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';
import { ChatHistoryItem, getHistoryWithBackend, fetchDashboardStatsWithBackend, DashboardStats } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

const LOCAL_HISTORY_KEY = '@bcabuddy_local_chat_history';
const MINUTES_PER_EXCHANGE = 2;

const normalizeText = (value: string) => value.trim().toLowerCase();

const buildSubjectMatchers = () => {
  return SUBJECTS.map((subject) => ({
    subject,
    name: normalizeText(subject.name),
    topics: subject.topics.map((topic) => normalizeText(topic.name)),
  }));
};

export default function HomeScreen({ navigation }: Props) {
  const { sessionMode, profile } = useAuth();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const subjectMatchers = useMemo(() => buildSubjectMatchers(), []);

  const loadLocalHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? (parsed as ChatHistoryItem[]) : [];
    } catch {
      return [];
    }
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (sessionMode === 'authenticated') {
        const [rows, stats] = await Promise.all([
          getHistoryWithBackend(),
          fetchDashboardStatsWithBackend().catch(() => null)
        ]);
        setHistory(rows);
        setDashboardStats(stats);
      } else {
        const localRows = await loadLocalHistory();
        setHistory(localRows);
        setDashboardStats(null);
      }
    } catch {
      const localRows = await loadLocalHistory();
      setHistory(localRows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionMode]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const analytics = useMemo(() => {
    const rows = history.filter((row) => row.user_message || row.ai_response);
    const exchanges = rows.filter((row) => row.user_message).length;
    const totalMinutes = exchanges * MINUTES_PER_EXCHANGE;
    const totalHours = totalMinutes / 60;

    const subjectCounts = new Map<string, number>();
    const recentEntries: Array<{ date: Date; subject: string; message: string }> = [];

    const matchSubject = (text: string) => {
      const normalized = normalizeText(text);
      for (const matcher of subjectMatchers) {
        if (normalized.includes(matcher.name)) return matcher.subject.name;
      }
      for (const matcher of subjectMatchers) {
        for (const topic of matcher.topics) {
          if (topic && normalized.includes(topic)) return matcher.subject.name;
        }
      }
      return 'General';
    };

    const getDate = (value?: string) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    rows.forEach((row) => {
      const text = `${row.user_message || ''} ${row.ai_response || ''}`.trim();
      const subject = text ? matchSubject(text) : 'General';
      const stamp = getDate(row.timestamp) || new Date();
      recentEntries.push({ date: stamp, subject, message: row.user_message || row.ai_response || '' });
      subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
    });

    const topSubjects = Array.from(subjectCounts.entries())
      .filter(([name]) => name !== 'General')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));

    const sortedRecent = [...recentEntries].sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastSubject = sortedRecent.find((entry) => entry.subject !== 'General')?.subject || 'General';

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const activeDays = new Set(
      sortedRecent
        .filter((entry) => entry.date >= sevenDaysAgo)
        .map((entry) => entry.date.toDateString())
    ).size;

    if (dashboardStats && sessionMode === 'authenticated') {
      const act = dashboardStats.study_activity || {};
      const activeDays = Object.keys(act).length;
      const totalMinutes = Object.values(act).reduce((sum, mins) => sum + Number(mins), 0);
      const totalHours = totalMinutes / 60;
      const recent = (dashboardStats.recent_topics || []).slice(0, 5).map((topic, i) => ({
        date: new Date(),
        subject: topic,
        message: 'Recent review session'
      }));
      const lastSubject = dashboardStats.recent_topics?.[0] || 'General';
      const topSubjects = (dashboardStats.recent_topics || []).slice(0, 4).map((name) => ({ name, count: 5 }));

      return {
        exchanges,
        totalMinutes,
        totalHours,
        lastSubject,
        topSubjects,
        recent,
        activeDays,
        avgQuizScore: dashboardStats.avg_quiz_score || 0,
      };
    }

    return {
      exchanges,
      totalMinutes,
      totalHours,
      lastSubject,
      topSubjects,
      recent: sortedRecent.slice(0, 5),
      activeDays,
      avgQuizScore: 0,
    };
  }, [history, subjectMatchers, dashboardStats, sessionMode]);

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? 'Good Night'
      : hour < 12
        ? 'Good Morning'
        : hour < 17
          ? 'Good Afternoon'
          : hour < 21
            ? 'Good Evening'
            : 'Good Night';
  const userName = String(profile?.display_name || profile?.username || '').trim() || 'BCA Student';
  
  const backlogs = useMemo(() => SUBJECTS.filter((s) => s.isBacklog), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Prep Snapshot</Text>
          <Text style={styles.heroTitle}>{loading ? 'Updating...' : `${analytics.totalHours.toFixed(1)} hrs`}</Text>
          <Text style={styles.heroSub}>{analytics.exchanges} learning exchanges logged</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroChip}>
              <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
              <Text style={styles.heroChipText}>{analytics.totalMinutes} mins</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="book-outline" size={14} color={COLORS.secondary} />
              <Text style={styles.heroChipText}>Last: {analytics.lastSubject}</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="flame-outline" size={14} color={COLORS.warning} />
              <Text style={styles.heroChipText}>{analytics.activeDays} active days</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.exchanges}</Text>
            <Text style={styles.statLabel}>Exchanges</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.activeDays}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(analytics.avgQuizScore)}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </Animated.View>

        {backlogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>At-Risk Backlogs</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.sm }}>
              {backlogs.map(subject => (
                <TouchableOpacity 
                  key={subject.id} 
                  style={styles.backlogCard}
                  onPress={() => navigation.navigate('SubjectDetail', { subject })}
                >
                  <View style={[styles.backlogIconWrap, { backgroundColor: subject.color + '15', borderColor: subject.color + '30', borderWidth: 1 }]}>
                    <Ionicons name={subject.icon as any} size={24} color={subject.color} />
                  </View>
                  <Text style={styles.backlogSubjectName} numberOfLines={1}>{subject.name}</Text>
                  <Text style={styles.backlogSubjectSem}>Sem {subject.semester}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Subjects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoadmapTab')}>
              <Text style={styles.sectionAction}>Roadmap</Text>
            </TouchableOpacity>
          </View>
          {analytics.topSubjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No subject signals yet. Start a chat to build analytics.</Text>
            </View>
          ) : (
            analytics.topSubjects.map((item) => (
              <View key={item.name} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <View style={styles.subjectBarBg}>
                  <View style={[styles.subjectBarFill, { width: `${Math.min(100, item.count * 15)}%` }]} />
                </View>
              </View>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AIChat')}>
              <Text style={styles.sectionAction}>Open Chat</Text>
            </TouchableOpacity>
          </View>
          {analytics.recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No recent conversations yet.</Text>
            </View>
          ) : (
            analytics.recent.map((entry, index) => (
              <View key={`${entry.subject}-${index}`} style={styles.activityRow}>
                <View style={styles.activityIcon}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{entry.subject}</Text>
                  <Text style={styles.activitySub}>{entry.date.toLocaleDateString()} • {entry.message.slice(0, 48)}{entry.message.length > 48 ? '...' : ''}</Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaPrimary} onPress={() => navigation.navigate('AIChat')}>
            <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.white} />
            <Text style={styles.ctaPrimaryText}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate('ExamTab')}>
            <Ionicons name="school-outline" size={18} color={COLORS.primary} />
            <Text style={styles.ctaSecondaryText}>Preparation</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: { ...FONTS.body, color: COLORS.textSecondary },
  name: { ...FONTS.h2, marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  heroCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  heroLabel: { ...FONTS.small, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { ...FONTS.h1, marginTop: SPACING.sm },
  heroSub: { ...FONTS.caption, marginTop: 4 },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  heroChipText: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: { ...FONTS.bodyBold, fontSize: 16 },
  statLabel: { ...FONTS.small, marginTop: 2 },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { ...FONTS.h3 },
  sectionAction: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { ...FONTS.small, color: COLORS.textSecondary },
  subjectRow: { marginBottom: SPACING.sm },
  subjectName: { ...FONTS.bodyBold, fontSize: 14, marginBottom: SPACING.xs },
  subjectBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  subjectBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '12',
  },
  activityInfo: { flex: 1 },
  activityTitle: { ...FONTS.bodyBold, fontSize: 14 },
  activitySub: { ...FONTS.caption, marginTop: 2 },
  ctaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  ctaPrimaryText: { ...FONTS.bodyBold, color: COLORS.white },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  ctaSecondaryText: { ...FONTS.bodyBold, color: COLORS.primary },
  backlogCard: {
    width: 140,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', // subtle red border for risk
    ...SHADOWS.sm,
  },
  backlogIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  backlogSubjectName: { ...FONTS.bodyBold, fontSize: 13, textAlign: 'center', marginBottom: 2 },
  backlogSubjectSem: { ...FONTS.small, color: COLORS.textSecondary },
});
