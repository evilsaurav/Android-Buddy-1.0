import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const bgGlow = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 600 });
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    bgGlow.value = withDelay(200, withTiming(1, { duration: 1000 }));

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: bgGlow.value * 0.3,
    transform: [{ scale: 0.8 + bgGlow.value * 0.4 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.glow2, glowStyle]} />
      
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={48} color={COLORS.white} />
        </View>
      </Animated.View>

      <Animated.View style={titleStyle}>
        <Text style={styles.title}>BCA<Text style={styles.titleAccent}>Buddy</Text></Text>
      </Animated.View>

      <Animated.View style={subtitleStyle}>
        <Text style={styles.subtitle}>Your AI Study Companion</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <Text style={styles.madeWith}>Designed with ❤️ by Insomniac for Frenzy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4A6CF7',
    top: height * 0.2,
  },
  glow2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#8B5CF6',
    top: height * 0.25,
    left: width * 0.3,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#A78BFA',
  },
  subtitle: {
    ...FONTS.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontSize: 16,
  },
  bottom: {
    position: 'absolute',
    bottom: 60,
  },
  madeWith: {
    ...FONTS.caption,
    color: 'rgba(255,255,255,0.4)',
  },
});
