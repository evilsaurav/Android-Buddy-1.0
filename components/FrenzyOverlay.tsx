import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFrenzy } from '../context/FrenzyContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/theme';

function getPalette(theme: string | null) {
  const normalized = String(theme || '').toLowerCase();
  if (normalized.includes('violet') || normalized.includes('purple')) {
    return { bg: '#2B135D', accent: '#A855F7', text: '#F5F3FF' };
  }
  if (normalized.includes('crimson') || normalized.includes('red')) {
    return { bg: '#3B0F1D', accent: '#EF4444', text: '#FEF2F2' };
  }
  if (normalized.includes('emerald') || normalized.includes('green')) {
    return { bg: '#0E2C1C', accent: '#10B981', text: '#ECFDF5' };
  }
  return { bg: '#111827', accent: '#F59E0B', text: '#FEF3C7' };
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

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <SafeAreaView style={[styles.content, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <View style={styles.messageWrap}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: palette.text }]}>{typed || '...'}</Text>
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={clearFrenzy}>
          <View style={[styles.exitPill, { borderColor: palette.accent }]}> 
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
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  title: {
    ...FONTS.h2,
    textAlign: 'center',
    lineHeight: 34,
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
