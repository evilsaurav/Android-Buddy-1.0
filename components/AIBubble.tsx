import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  message: string;
  type: 'progress' | 'alert' | 'motivation' | 'exam';
}

const TYPE_CONFIG = {
  progress: { icon: 'trending-up' as const, bg: '#EEF2FF', border: '#4A6CF7', iconColor: '#4A6CF7' },
  alert: { icon: 'warning' as const, bg: '#FEF3C7', border: '#F59E0B', iconColor: '#F59E0B' },
  motivation: { icon: 'flame' as const, bg: '#D1FAE5', border: '#10B981', iconColor: '#10B981' },
  exam: { icon: 'time' as const, bg: '#FEE2E2', border: '#EF4444', iconColor: '#EF4444' },
};

export default function AIBubble({ message, type }: Props) {
  const config = TYPE_CONFIG[type];
  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
      <View style={styles.header}>
        <View style={[styles.aiAvatar, { backgroundColor: config.border + '20' }]}>
          <Ionicons name="sparkles" size={14} color={config.iconColor} />
        </View>
        <Text style={styles.aiLabel}>BCA Buddy AI</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    ...FONTS.body,
    lineHeight: 20,
  },
});
