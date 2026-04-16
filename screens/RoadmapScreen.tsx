import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS, SEMESTERS, Subject } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import {
  acceptStudyRoadmapWithBackend,
  fetchLatestStudyRoadmapWithBackend,
  fetchStudyRoadmapHistoryWithBackend,
  LatestStudyRoadmap,
  RoadmapHistoryItem,
} from '../lib/api';

interface Props {
  navigation: any;
}

export default function RoadmapScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [latestRoadmap, setLatestRoadmap] = useState<LatestStudyRoadmap | null>(null);
  const [roadmapHistory, setRoadmapHistory] = useState<RoadmapHistoryItem[]>([]);
  const [acceptingRoadmap, setAcceptingRoadmap] = useState(false);

  const filteredSubjects = SUBJECTS.filter((s) => s.semester === selectedSemester);
  const allSubjects = selectedSemester === 0 ? SUBJECTS : filteredSubjects;

  const overallProgress = allSubjects.length > 0
    ? allSubjects.reduce((sum, s) => sum + s.progress, 0) / allSubjects.length
    : 0;

  useEffect(() => {
    const loadLatestRoadmap = async () => {
      if (sessionMode !== 'authenticated') {
        setLatestRoadmap(null);
        setRoadmapHistory([]);
        return;
      }

      try {
        const [data, history] = await Promise.all([
          fetchLatestStudyRoadmapWithBackend(),
          fetchStudyRoadmapHistoryWithBackend(),
        ]);
        if (data?.has_roadmap) {
          setLatestRoadmap(data);
        } else {
          setLatestRoadmap(null);
        }
        setRoadmapHistory(history.slice(0, 4));
      } catch {
        setLatestRoadmap(null);
        setRoadmapHistory([]);
      }
    };

    loadLatestRoadmap();
  }, [sessionMode]);

  const acceptLatestRoadmap = async () => {
    if (!latestRoadmap) return;

    try {
      setAcceptingRoadmap(true);
      await acceptStudyRoadmapWithBackend(
        typeof latestRoadmap.roadmap_id === 'number' ? latestRoadmap.roadmap_id : undefined
      );
      const history = await fetchStudyRoadmapHistoryWithBackend();
      setRoadmapHistory(history.slice(0, 4));
      Alert.alert('Roadmap Accepted', 'This plan is now saved in your roadmap history.');
    } catch {
      Alert.alert('Unable to accept', 'Could not accept roadmap right now. Please try again.');
    } finally {
      setAcceptingRoadmap(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Study Roadmap</Text>
        <Text style={styles.subtitle}>Build your personalized learning path</Text>
      </View>

      {/* Semester Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        <TouchableOpacity
          style={[styles.semTab, selectedSemester === 0 && styles.semTabActive]}
          onPress={() => setSelectedSemester(0)}
        >
          <Text style={[styles.semTabText, selectedSemester === 0 && styles.semTabTextActive]}>All</Text>
        </TouchableOpacity>
        {SEMESTERS.map((sem) => (
          <TouchableOpacity
            key={sem}
            style={[styles.semTab, selectedSemester === sem && styles.semTabActive]}
            onPress={() => setSelectedSemester(sem)}
          >
            <Text style={[styles.semTabText, selectedSemester === sem && styles.semTabTextActive]}>Sem {sem}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Progress Overview */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Semester Progress</Text>
          <Text style={[styles.progressPercent, { color: COLORS.primary }]}>{Math.round(overallProgress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${overallProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressSubtext}>{allSubjects.length} subjects • {allSubjects.reduce((s, sub) => s + sub.totalTopics, 0)} total topics</Text>
      </Animated.View>

      {latestRoadmap ? (
        <Animated.View entering={FadeInDown.delay(130).duration(400)} style={styles.liveRoadmapCard}>
          <View style={styles.liveRoadmapHeader}>
            <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
            <Text style={styles.liveRoadmapLabel}>Live Backend Roadmap</Text>
          </View>
          <Text style={styles.liveRoadmapTitle}>{String(latestRoadmap.title || 'Latest Study Plan')}</Text>
          <Text style={styles.liveRoadmapMeta}>
            {String(latestRoadmap.subject || 'Subject')} • Sem {String(latestRoadmap.semester || '-')}
          </Text>
          <Text style={styles.liveRoadmapMeta}>
            {Math.round(Number(latestRoadmap.completion_pct || 0))}% complete • {Number(latestRoadmap.completed_days || 0)}/{Number(latestRoadmap.total_days || 0)} days
          </Text>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptLatestRoadmap}>
            <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.white} />
            <Text style={styles.acceptBtnText}>{acceptingRoadmap ? 'Accepting...' : 'Accept Roadmap'}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {roadmapHistory.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(145).duration(400)} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.historyTitle}>Recent Accepted Roadmaps</Text>
          </View>
          {roadmapHistory.map((item, idx) => (
            <View key={`${item.id || idx}-${item.title || 'roadmap'}`} style={styles.historyRow}>
              <Text style={styles.historyName}>{String(item.title || item.subject || 'Study Roadmap')}</Text>
              <Text style={styles.historyMeta}>Sem {String(item.semester || '-')}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {/* Subject Roadmap */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {allSubjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No Subjects</Text>
            <Text style={styles.emptySubtitle}>No subjects found for this semester</Text>
          </View>
        ) : (
          allSubjects.map((subject, index) => (
            <Animated.View key={subject.id} entering={FadeInDown.delay(150 + index * 100).duration(400)}>
              <TouchableOpacity
                style={styles.roadmapCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubjectDetail', { subject })}
              >
                <View style={styles.timeline}>
                  <View style={[styles.timelineDot, { backgroundColor: subject.color }]}>
                    <Ionicons name={subject.progress >= 1 ? 'checkmark' : 'ellipse'} size={12} color={COLORS.white} />
                  </View>
                  {index < allSubjects.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: subject.color + '30' }]} />
                  )}
                </View>
                <View style={styles.roadmapContent}>
                  <View style={styles.roadmapHeader}>
                    <View style={[styles.roadmapIcon, { backgroundColor: subject.color + '15' }]}>
                      <Ionicons name={subject.icon as any} size={22} color={subject.color} />
                    </View>
                    <View style={styles.roadmapInfo}>
                      <Text style={styles.roadmapName}>{subject.name}</Text>
                      <Text style={styles.roadmapSem}>Semester {subject.semester} • {subject.totalTopics} topics</Text>
                    </View>
                    {subject.isBacklog && (
                      <View style={styles.backlogTag}>
                        <Ionicons name="warning" size={12} color={COLORS.danger} />
                      </View>
                    )}
                  </View>
                  <View style={styles.roadmapProgress}>
                    <View style={styles.roadmapBarBg}>
                      <View style={[styles.roadmapBarFill, { width: `${subject.progress * 100}%`, backgroundColor: subject.color }]} />
                    </View>
                    <Text style={[styles.roadmapPercent, { color: subject.color }]}>{Math.round(subject.progress * 100)}%</Text>
                  </View>
                  <View style={styles.topicPreview}>
                    {subject.topics.filter(t => !t.completed).slice(0, 3).map((topic) => (
                      <View key={topic.id} style={styles.topicChip}>
                        <Text style={styles.topicChipText}>{topic.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title: { ...FONTS.h1 },
  subtitle: { ...FONTS.caption, marginTop: 4 },
  tabScroll: { maxHeight: 50, marginTop: SPACING.md },
  tabContent: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  semTab: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.white, ...SHADOWS.sm,
  },
  semTabActive: { backgroundColor: COLORS.primary },
  semTabText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.textSecondary },
  semTabTextActive: { color: COLORS.white },
  progressCard: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.lg,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  progressTitle: { ...FONTS.bodyBold },
  progressPercent: { ...FONTS.h3 },
  progressBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  progressSubtext: { ...FONTS.caption, marginTop: SPACING.sm },
  liveRoadmapCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: '#F5F3FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  liveRoadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  liveRoadmapLabel: { ...FONTS.small, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  liveRoadmapTitle: { ...FONTS.bodyBold, color: COLORS.text, marginBottom: 2 },
  liveRoadmapMeta: { ...FONTS.small, color: COLORS.textSecondary },
  acceptBtn: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  acceptBtnText: { ...FONTS.small, color: COLORS.white, fontWeight: '700' },
  historyCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  historyTitle: { ...FONTS.bodyBold, color: COLORS.primary },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  historyName: { ...FONTS.small, color: COLORS.text },
  historyMeta: { ...FONTS.small, color: COLORS.textSecondary },
  listContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  roadmapCard: { flexDirection: 'row', marginBottom: SPACING.md },
  timeline: { alignItems: 'center', marginRight: SPACING.lg, width: 28 },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  timelineLine: { width: 2, flex: 1, marginTop: -2 },
  roadmapContent: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOWS.sm,
  },
  roadmapHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  roadmapIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  roadmapInfo: { flex: 1, marginLeft: SPACING.md },
  roadmapName: { ...FONTS.bodyBold, fontSize: 15 },
  roadmapSem: { ...FONTS.caption, marginTop: 2 },
  backlogTag: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  roadmapProgress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  roadmapBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  roadmapBarFill: { height: '100%', borderRadius: RADIUS.full },
  roadmapPercent: { ...FONTS.bodyBold, fontSize: 12, width: 36, textAlign: 'right' },
  topicPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  topicChip: {
    backgroundColor: COLORS.background, paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  topicChipText: { ...FONTS.small, color: COLORS.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { ...FONTS.h3, marginTop: SPACING.lg, color: COLORS.textSecondary },
  emptySubtitle: { ...FONTS.caption, marginTop: SPACING.xs },
});
