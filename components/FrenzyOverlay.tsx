import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFrenzy } from '../context/FrenzyContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/theme';

function getPalette(theme: string | null) {
  const normalized = String(theme || '').toLowerCase();
  // We'll inject a romantic vibe by default unless specifically overridden
  if (normalized.includes('emerald') || normalized.includes('green')) {
    return { bg: '#0E2C1C', accent: '#10B981', text: '#ECFDF5' };
  }
  if (normalized.includes('violet') || normalized.includes('purple')) {
    return { bg: '#2B135D', accent: '#D8B4E2', text: '#F5F3FF' };
  }
  // Romantic default
  return { bg: '#4A154B', accent: '#FF758F', text: '#FFE5EC' };
}

export default function FrenzyOverlay() {
  const { active, theme, persona, message, speedMs, resetLabel, clearFrenzy } = useFrenzy();
  const [typed, setTyped] = useState('');

  const text = useMemo(() => {
    const lines = [persona ? `FRENZY: ${persona}` : 'FRENZY MODE ACTIVE', message || 'Stay sharp. Keep the momentum high.'];
    return lines.filter(Boolean).join('\n');
  }, [persona, message]);

  useEffect(() => {
    if (!active) {
      setTyped('');
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(text.length, i + 1);
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, Math.max(18, Math.min(80, speedMs || 36)));

    return () => clearInterval(interval);
  }, [active, speedMs, text]);

  if (!active) return null;

  const palette = getPalette(theme);

  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }]
  }));

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <SafeAreaView style={[styles.content, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <View style={styles.messageWrap}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.Text style={[styles.title, { color: palette.text }, animatedStyle]}>
              {typed || '...'}
            </Animated.Text>
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={clearFrenzy}>
          <View style={[styles.exitPill, { borderColor: palette.accent, backgroundColor: palette.accent + '20' }]}> 
            <Text style={[styles.exitText, { color: palette.text }]}>{resetLabel || 'Exit'}</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    justifyContent: 'space-between',
  },
  messageWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: SPACING.md,
  },
  title: {
    ...FONTS.h2,
    fontFamily: 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 38,
    textShadowColor: 'rgba(255, 117, 143, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  exitBtn: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  exitPill: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  exitText: {
    ...FONTS.bodyBold,
    fontSize: 14,
  },
});
