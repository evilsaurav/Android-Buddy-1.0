import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { Subject } from '../lib/data';

interface Props {
  subject: Subject;
  onPress: () => void;
  compact?: boolean;
}

export default function SubjectCard({ subject, onPress, compact }: Props) {
  const percentage = Math.round(subject.progress * 100);
  
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.compactIcon, { backgroundColor: subject.color + '15' }]}>
          <Ionicons name={subject.icon as any} size={20} color={subject.color} />
        </View>
        <Text style={styles.compactName} numberOfLines={1}>{subject.name}</Text>
        <Text style={[styles.compactProgress, { color: subject.color }]}>{percentage}%</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBg, { backgroundColor: subject.color + '15' }]}>
          <Ionicons name={subject.icon as any} size={24} color={subject.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.semester}>Semester {subject.semester}</Text>
        </View>
        {subject.isBacklog && (
          <View style={styles.backlogBadge}>
            <Text style={styles.backlogText}>Backlog</Text>
          </View>
        )}
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: subject.color }]} />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{subject.completedTopics}/{subject.totalTopics} topics</Text>
          <Text style={[styles.progressPercent, { color: subject.color }]}>{percentage}%</Text>
        </View>
      </View>
      {subject.examDate && (
        <View style={styles.examRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.danger} />
          <Text style={styles.examText}>Exam: {new Date(subject.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  subjectName: {
    ...FONTS.bodyBold,
    fontSize: 16,
  },
  semester: {
    ...FONTS.caption,
    marginTop: 2,
  },
  backlogBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  backlogText: {
    ...FONTS.small,
    color: COLORS.danger,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    ...FONTS.caption,
  },
  progressPercent: {
    ...FONTS.bodyBold,
    fontSize: 13,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  examText: {
    ...FONTS.caption,
    color: COLORS.danger,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  compactCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: 130,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  compactName: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  compactProgress: {
    ...FONTS.bodyBold,
    fontSize: 13,
  },
});
