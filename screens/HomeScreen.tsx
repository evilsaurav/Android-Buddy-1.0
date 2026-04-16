import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS, AI_SUGGESTIONS, STUDY_TIPS } from '../lib/data';
import SubjectCard from '../components/SubjectCard';
import AIBubble from '../components/AIBubble';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, fetchDashboardStatsWithBackend } from '../lib/api';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
      setRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (sessionMode !== 'authenticated') {
        setDashboardStats(null);
        return;
      }
      try {
        const data = await fetchDashboardStatsWithBackend();
        setDashboardStats(data);
      } catch {
        setDashboardStats(null);
      }
    };

    loadDashboardStats();
  }, [sessionMode]);

  const totalProgress = SUBJECTS.reduce((sum, s) => sum + s.progress, 0) / SUBJECTS.length;
  const backlogCount = SUBJECTS.filter((s) => s.isBacklog).length;
  const upcomingExams = SUBJECTS.filter((s) => s.examDate).length;
  const totalSessions = Number(dashboardStats?.total_sessions || 0);
  const avgQuizScore = Number(dashboardStats?.avg_quiz_score || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning! 🌞</Text>
            <Text style={styles.name}>BCA Student</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </Animated.View>

        {/* AI Tip Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIconBg}>
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.tipLabel}>Today's Study Tip</Text>
          </View>
          <Text style={styles.tipText}>{STUDY_TIPS[tipIndex]}</Text>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{Math.round(totalProgress * 100)}%</Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="book" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{sessionMode === 'authenticated' ? totalSessions : SUBJECTS.length}</Text>
            <Text style={styles.statLabel}>{sessionMode === 'authenticated' ? 'Sessions' : 'Subjects'}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.danger + '15' }]}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.statValue}>{backlogCount}</Text>
            <Text style={styles.statLabel}>Backlogs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{sessionMode === 'authenticated' ? `${Math.round(avgQuizScore)}%` : upcomingExams}</Text>
            <Text style={styles.statLabel}>{sessionMode === 'authenticated' ? 'Quiz Avg' : 'Exams'}</Text>
          </View>
        </Animated.View>

        {/* AI Suggestions */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI Insights</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {AI_SUGGESTIONS.slice(0, 2).map((suggestion) => (
            <AIBubble key={suggestion.id} message={suggestion.text} type={suggestion.type as any} />
          ))}
        </Animated.View>

        {/* Quick Access */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Access</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {SUBJECTS.slice(0, 4).map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                compact
                onPress={() => navigation.navigate('SubjectDetail', { subject })}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Continue Studying */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Continue Studying</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoadmapTab')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {SUBJECTS.slice(0, 3).map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onPress={() => navigation.navigate('SubjectDetail', { subject })}
            />
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - AI Chat */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AIChat')}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  name: {
    ...FONTS.h2,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  tipCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: '#1E1B4B',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipLabel: {
    ...FONTS.small,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipText: {
    ...FONTS.body,
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...FONTS.h3,
    fontSize: 18,
  },
  statLabel: {
    ...FONTS.small,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.md,
  },
  seeAll: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  quickScroll: {
    marginLeft: -SPACING.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: COLORS.secondary,
  },
});
