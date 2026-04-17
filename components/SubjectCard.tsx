import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { Subject } from '../lib/data';

interface Props {
  subject: Subject;
  onPress: () => void;
  compact?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SubjectCard({ subject, onPress, compact }: Props) {
  const percentage = Math.round(subject.progress * 100);
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const onPressIn = () => {
    pressScale.value = withSpring(0.97, { damping: 12, stiffness: 240 });
  };

  const onPressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 220 });
  };
  
  if (compact) {
    return (
      <AnimatedTouchable
        style={[styles.compactCard, animatedStyle]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.compactIcon, { backgroundColor: subject.color + '15' }]}>
          <Ionicons name={subject.icon as any} size={20} color={subject.color} />
        </View>
        <Text style={styles.compactName} numberOfLines={1}>{subject.name}</Text>
        <View style={styles.compactBottomRow}>
          <Text style={[styles.compactProgress, { color: subject.color }]}>{percentage}%</Text>
          <Ionicons name="arrow-forward-circle" size={14} color={subject.color} />
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.9}
    >
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
            <Ionicons name="warning" size={10} color={COLORS.danger} />
            <Text style={styles.backlogText}>Backlog</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
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
          <Ionicons name="alarm-outline" size={14} color={COLORS.danger} />
          <Text style={styles.examText}>Exam: {new Date(subject.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        </View>
      )}
    </AnimatedTouchable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
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
  compactBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
