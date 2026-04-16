import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function GradientBg({ colors, style, children }: Props) {
  return (
    <LinearGradient
      colors={colors || ['#4A6CF7', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
