import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function GradientBg({ colors, style, children }: Props) {
  const floatA = useSharedValue(0);
  const floatB = useSharedValue(0);

  React.useEffect(() => {
    floatA.value = withRepeat(withTiming(1, { duration: 3200 }), -1, true);
    floatB.value = withRepeat(withTiming(1, { duration: 4200 }), -1, true);
  }, []);

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatA.value * 12 }],
    opacity: 0.14 + floatA.value * 0.08,
  }));

  const orbBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatB.value * -10 }],
    opacity: 0.12 + floatB.value * 0.1,
  }));

  return (
    <LinearGradient
      colors={colors || ['#4A6CF7', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      <Animated.View style={[styles.orbA, orbAStyle]} />
      <Animated.View style={[styles.orbB, orbBStyle]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  orbA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: -40,
    right: -20,
  },
  orbB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(103,232,249,0.28)',
    bottom: -30,
    left: -20,
  },
});
