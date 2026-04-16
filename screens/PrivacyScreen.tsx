import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

const SECTIONS = [
  {
    title: 'Data Collection',
    icon: 'shield-checkmark',
    color: COLORS.success,
    items: [
      'We only collect data you explicitly provide (name, email, academic details).',
      'Study progress is stored locally on your device using AsyncStorage.',
      'No personal data is sent to external servers without your consent.',
      'Anonymous usage analytics may be collected to improve the app experience.',
    ],
  },
  {
    title: 'Data Storage',
    icon: 'lock-closed',
    color: COLORS.primary,
    items: [
      'All study data is stored locally on your device.',
      'Sensitive information is encrypted using Expo SecureStore.',
      'Cloud sync (when enabled) uses end-to-end encryption.',
      'You can export or delete your data at any time from Settings > Offline Data.',
    ],
  },
  {
    title: 'Third-Party Services',
    icon: 'globe',
    color: COLORS.secondary,
    items: [
      'We do not sell your data to any third party.',
      'AI features process data locally when possible.',
      'Analytics data is anonymized and cannot identify you personally.',
      'No advertising SDKs are integrated into BCABuddy.',
    ],
  },
  {
    title: 'Your Rights',
    icon: 'person-circle',
    color: COLORS.warning,
    items: [
      'Right to access: View all your stored data anytime.',
      'Right to delete: Remove all data with one tap.',
      'Right to export: Download your data in JSON format.',
      'Right to opt-out: Disable any data collection features.',
    ],
  },
  {
    title: 'Security Measures',
    icon: 'key',
    color: COLORS.accent,
    items: [
      'Local data encryption for sensitive information.',
      'Secure HTTPS connections for any network requests.',
      'Regular security audits and dependency updates.',
      'No plain-text storage of passwords or tokens.',
    ],
  },
];

export default function PrivacyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.heroBanner}>
          <Ionicons name="shield-checkmark" size={36} color={COLORS.success} />
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroDesc}>BCABuddy is built with privacy-first principles. Your data stays on your device.</Text>
        </Animated.View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        {/* Sections */}
        {SECTIONS.map((section, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(100 + i * 80).duration(400)} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '15' }]}>
                <Ionicons name={section.icon as any} size={22} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.items.map((item, j) => (
              <View key={j} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: section.color }]} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        ))}

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.contactCard}>
          <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Questions about privacy?</Text>
            <Text style={styles.contactEmail}>privacy@bcabuddy.app</Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { ...FONTS.h3 },
  content: { paddingHorizontal: SPACING.xl },
  heroBanner: {
    backgroundColor: COLORS.success + '10', borderRadius: RADIUS.xl, padding: SPACING.xxl,
    alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.success + '20',
  },
  heroTitle: { ...FONTS.h3, color: COLORS.success, marginTop: SPACING.md },
  heroDesc: { ...FONTS.caption, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  lastUpdated: { ...FONTS.small, textAlign: 'center', marginBottom: SPACING.xl },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  sectionIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...FONTS.bodyBold, fontSize: 16, marginLeft: SPACING.md },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: SPACING.md },
  bulletText: { ...FONTS.body, flex: 1, lineHeight: 20, color: COLORS.textSecondary, fontSize: 14 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '08',
    borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.primary + '15',
  },
  contactInfo: { flex: 1, marginLeft: SPACING.md },
  contactTitle: { ...FONTS.bodyBold, fontSize: 14 },
  contactEmail: { ...FONTS.caption, color: COLORS.primary, marginTop: 2 },
});
