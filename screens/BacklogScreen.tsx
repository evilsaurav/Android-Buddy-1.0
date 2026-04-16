import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';

interface Props {
  navigation: any;
}

export default function BacklogScreen({ navigation }: Props) {
  const backlogs = SUBJECTS.filter((s) => s.isBacklog);
  const atRisk = SUBJECTS.filter((s) => !s.isBacklog && s.progress < 0.3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>ðŸš¨ Backlog Planner</Text>
          <Text style={styles.subtitle}>Track and clear your pending subjects</Text>
        </View>

        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="alert-circle" size={28} color={COLORS.danger} />
            <Text style={styles.summaryValue}>{backlogs.length}</Text>
            <Text style={styles.summaryLabel}>Active Backlogs</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning" size={28} color={COLORS.warning} />
            <Text style={styles.summaryValue}>{atRisk.length}</Text>
            <Text style={styles.summaryLabel}>At Risk</Text>
          </View>
        </Animated.View>

        {/* AI Recovery Plan */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.aiPlanCard}>
            <View style={styles.aiPlanHeader}>
              <View style={styles.aiPlanIcon}>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.aiPlanTitle}>AI Recovery Plan</Text>
                <Text style={styles.aiPlanSubtitle}>Personalized backlog clearing strategy</Text>
              </View>
            </View>
            <View style={styles.aiPlanSteps}>
              {[
                { week: 'Week 1-2', task: 'Focus on Matrices & Eigenvalues', hours: '2 hrs/day' },
                { week: 'Week 3', task: 'Differential Equations & Laplace', hours: '3 hrs/day' },
                { week: 'Week 4', task: 'Probability, Stats & Revision', hours: '2 hrs/day' },
              ].map((step, i) => (
                <View key={i} style={styles.aiStep}>
                  <View style={[styles.aiStepDot, { backgroundColor: i === 0 ? COLORS.primary : COLORS.border }]} />
                  <View style={styles.aiStepContent}>
                    <Text style={styles.aiStepWeek}>{step.week}</Text>
                    <Text style={styles.aiStepTask}>{step.task}</Text>
                    <Text style={styles.aiStepHours}>{step.hours}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Backlog Subjects */}
        {backlogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>ðŸ“• Active Backlogs</Text>
            {backlogs.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.backlogCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubjectDetail', { subject })}
              >
                <View style={[styles.backlogStripe, { backgroundColor: subject.color }]} />
                <View style={styles.backlogContent}>
                  <View style={styles.backlogTop}>
                    <View style={[styles.backlogIcon, { backgroundColor: subject.color + '15' }]}>
                      <Ionicons name={subject.icon as any} size={22} color={subject.color} />
                    </View>
                    <View style={styles.backlogInfo}>
                      <Text style={styles.backlogName}>{subject.name}</Text>
                      <Text style={styles.backlogSem}>Semester {subject.semester}</Text>
                    </View>
                    <View style={styles.backlogBadge}>
                      <Text style={styles.backlogBadgeText}>{Math.round(subject.progress * 100)}%</Text>
                    </View>
                  </View>
                  <View style={styles.backlogBar}>
                    <View style={[styles.backlogBarFill, { width: `${subject.progress * 100}%`, backgroundColor: subject.color }]} />
                  </View>
                  <View style={styles.backlogMeta}>
                    <Text style={styles.backlogMetaText}>
                      {subject.totalTopics - subject.completedTopics} topics remaining
                    </Text>
                    <Text style={styles.backlogMetaText}>
                      ~{subject.topics.filter(t => !t.completed).reduce((s, t) => s + t.estimatedHours, 0)} hrs needed
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* At Risk */}
        {atRisk.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>âš ï¸ At Risk Subjects</Text>
            <Text style={[styles.subtitle, { marginBottom: SPACING.lg }]}>Below 30% progress â€” needs attention</Text>
            {atRisk.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.riskCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubjectDetail', { subject })}
              >
                <View style={[styles.riskIcon, { backgroundColor: subject.color + '15' }]}>
                  <Ionicons name={subject.icon as any} size={20} color={subject.color} />
                </View>
                <View style={styles.riskInfo}>
                  <Text style={styles.riskName}>{subject.name}</Text>
                  <View style={styles.riskBar}>
                    <View style={[styles.riskBarFill, { width: `${subject.progress * 100}%`, backgroundColor: COLORS.warning }]} />
                  </View>
                </View>
                <Text style={styles.riskPercent}>{Math.round(subject.progress * 100)}%</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.tipsCard}>
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Backlog Clearing Tips</Text>
              <Text style={styles.tipsText}>â€¢ Start with the subject closest to passing{"\n"}â€¢ Study in focused 45-min sessions{"\n"}â€¢ Solve previous year papers first{"\n"}â€¢ Use the AI planner for daily goals</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { ...FONTS.h1 },
  subtitle: { ...FONTS.caption, marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, gap: SPACING.md },
  summaryCard: {
    flex: 1, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center',
  },
  summaryValue: { ...FONTS.h1, marginTop: SPACING.sm },
  summaryLabel: { ...FONTS.caption, marginTop: 4, fontWeight: '500' },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  sectionTitle: { ...FONTS.h3, marginBottom: SPACING.md },
  aiPlanCard: {
    backgroundColor: '#1E1B4B', borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.lg,
  },
  aiPlanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  aiPlanIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  aiPlanTitle: { ...FONTS.bodyBold, color: COLORS.white, fontSize: 16 },
  aiPlanSubtitle: { ...FONTS.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  aiPlanSteps: { gap: SPACING.lg },
  aiStep: { flexDirection: 'row', alignItems: 'flex-start' },
  aiStepDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: SPACING.md },
  aiStepContent: { flex: 1 },
  aiStepWeek: { ...FONTS.small, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  aiStepTask: { ...FONTS.bodyBold, color: COLORS.white, marginTop: 2 },
  aiStepHours: { ...FONTS.caption, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  backlogCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    overflow: 'hidden', marginBottom: SPACING.md, ...SHADOWS.md,
  },
  backlogStripe: { width: 4 },
  backlogContent: { flex: 1, padding: SPACING.lg },
  backlogTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  backlogIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  backlogInfo: { flex: 1, marginLeft: SPACING.md },
  backlogName: { ...FONTS.bodyBold },
  backlogSem: { ...FONTS.caption, marginTop: 2 },
  backlogBadge: { backgroundColor: COLORS.dangerLight, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  backlogBadgeText: { ...FONTS.small, color: COLORS.danger, fontWeight: '700' },
  backlogBar: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  backlogBarFill: { height: '100%', borderRadius: RADIUS.full },
  backlogMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  backlogMetaText: { ...FONTS.small },
  riskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  riskIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  riskInfo: { flex: 1, marginLeft: SPACING.md },
  riskName: { ...FONTS.bodyBold, fontSize: 14, marginBottom: SPACING.xs },
  riskBar: { height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  riskBarFill: { height: '100%', borderRadius: RADIUS.full },
  riskPercent: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.warning, marginRight: SPACING.sm },
  tipsCard: {
    flexDirection: 'row', backgroundColor: COLORS.warningLight, borderRadius: RADIUS.xl,
    padding: SPACING.lg, gap: SPACING.md,
  },
  tipsContent: { flex: 1 },
  tipsTitle: { ...FONTS.bodyBold, marginBottom: SPACING.xs },
  tipsText: { ...FONTS.caption, lineHeight: 20 },
});