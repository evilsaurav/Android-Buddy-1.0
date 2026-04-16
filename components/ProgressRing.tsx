import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../lib/theme';

interface Props {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export default function ProgressRing({ progress, size = 80, strokeWidth = 8, color = COLORS.primary, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.bgRing, { 
        width: size, height: size, borderRadius: size / 2, 
        borderWidth: strokeWidth, borderColor: color + '20' 
      }]} />
      <View style={[styles.progressArc, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: 'transparent',
        borderTopColor: color,
        borderRightColor: progress > 0.25 ? color : 'transparent',
        borderBottomColor: progress > 0.5 ? color : 'transparent',
        borderLeftColor: progress > 0.75 ? color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }]} />
      <View style={styles.center}>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  bgRing: { position: 'absolute' },
  progressArc: { position: 'absolute' },
  center: { alignItems: 'center' },
  percentage: { ...FONTS.bodyBold, fontSize: 16 },
  label: { ...FONTS.small, marginTop: 1 },
});
