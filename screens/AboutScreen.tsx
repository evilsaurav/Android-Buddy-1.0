import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

export default function AboutScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* App Logo */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>BCA<Text style={styles.appNameAccent}>Buddy</Text></Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Your AI-Powered Study Companion</Text>
        </Animated.View>

        {/* Story */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <Ionicons name="heart" size={20} color={COLORS.danger} />
            <Text style={styles.storyTitle}>Our Story</Text>
          </View>
          <Text style={styles.storyText}>
            BCABuddy was born from a simple idea: <Text style={styles.storyBold}>BCA students deserve better study tools.</Text>
            {"\n\n"}
            As BCA students ourselves, we experienced the struggle of managing multiple subjects, dealing with backlogs, and the stress of exam preparation without proper guidance.
            {"\n\n"}
            We built BCABuddy to be the companion we wished we had - an AI-powered app that understands the BCA curriculum, creates personalized study plans, and helps students learn smarter, not harder.
            {"\n\n"}
            Every feature in this app was designed by students, for students. From the smart roadmap builder to the backlog recovery planner, each tool addresses a real problem we faced.
          </Text>
        </Animated.View>

        {/* Mission */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.missionCard}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To make quality education accessible and stress-free for every BCA student across India through AI-driven personalized learning.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {[
            { icon: 'sparkles', title: 'AI Study Guidance', desc: 'Personalized recommendations based on your progress', color: COLORS.primary },
            { icon: 'map', title: 'Smart Roadmaps', desc: 'Semester-wise study plans with topic tracking', color: COLORS.secondary },
            { icon: 'alert-circle', title: 'Backlog Recovery', desc: 'AI-generated plans to clear pending subjects', color: COLORS.danger },
            { icon: 'calendar', title: 'Exam Preparation', desc: 'Calendar integration with daily study targets', color: COLORS.warning },
            { icon: 'chatbubble-ellipses', title: 'AI Chat Assistant', desc: 'Get instant help with concepts and doubts', color: COLORS.accent },
            { icon: 'stats-chart', title: 'Progress Analytics', desc: 'Track your growth with detailed insights', color: COLORS.success },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                <Ionicons name={feature.icon as any} size={22} color={feature.color} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Team */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Built By Students</Text>
          <View style={styles.teamCard}>
            <View style={styles.teamRow}>
              {[
                { name: 'Developer', role: 'Full Stack', icon: 'code-slash' },
                { name: 'Designer', role: 'UI/UX', icon: 'color-palette' },
                { name: 'Researcher', role: 'Content', icon: 'library' },
              ].map((member, i) => (
                <View key={i} style={styles.teamMember}>
                  <View style={styles.teamAvatar}>
                    <Ionicons name={member.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.teamNote}>
              Built with love during our BCA journey. Every feature addresses real challenges we faced as students.
            </Text>
          </View>
        </Animated.View>

        {/* Tech Stack */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tech Stack</Text>
          <View style={styles.techGrid}>
            {['React Native', 'TypeScript', 'Expo', 'AI/ML', 'Node.js', 'Firebase'].map((tech, i) => (
              <View key={i} style={styles.techChip}>
                <Text style={styles.techText}>{tech}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.contactCard}>
          <Ionicons name="mail" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <Text style={styles.contactText}>feedback@bcabuddy.app</Text>
          <View style={styles.socialRow}>
            {['logo-github', 'logo-twitter', 'logo-linkedin', 'logo-instagram'].map((icon, i) => (
              <TouchableOpacity key={i} style={styles.socialBtn}>
                <Ionicons name={icon as any} size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Text style={styles.copyright}>2025 BCABuddy. All rights reserved.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { ...FONTS.h3 },
  content: { paddingHorizontal: SPACING.xl },
  logoSection: { alignItems: 'center', paddingVertical: SPACING.xxl },
  logoCircle: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, ...SHADOWS.lg,
  },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  appNameAccent: { color: COLORS.secondary },
  version: { ...FONTS.caption, marginTop: 4 },
  tagline: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm },
  storyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md, marginBottom: SPACING.xl,
  },
  storyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  storyTitle: { ...FONTS.h3 },
  storyText: { ...FONTS.body, lineHeight: 24, color: COLORS.textSecondary },
  storyBold: { fontWeight: '700', color: COLORS.text },
  missionCard: {
    backgroundColor: '#1E1B4B', borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl,
  },
  missionTitle: { ...FONTS.h3, color: COLORS.white, marginBottom: SPACING.md },
  missionText: { ...FONTS.body, color: 'rgba(255,255,255,0.8)', lineHeight: 24 },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: { ...FONTS.h3, marginBottom: SPACING.lg },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  featureIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  featureInfo: { flex: 1, marginLeft: SPACING.md },
  featureTitle: { ...FONTS.bodyBold, fontSize: 14 },
  featureDesc: { ...FONTS.caption, marginTop: 2 },
  teamCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md },
  teamRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.lg },
  teamMember: { alignItems: 'center' },
  teamAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  teamName: { ...FONTS.bodyBold, fontSize: 13 },
  teamRole: { ...FONTS.small },
  teamNote: { ...FONTS.caption, textAlign: 'center', lineHeight: 20, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.lg },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  techChip: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primary + '30', ...SHADOWS.sm,
  },
  techText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.primary },
  contactCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xxl,
    alignItems: 'center', ...SHADOWS.md, marginBottom: SPACING.xl,
  },
  contactTitle: { ...FONTS.h3, marginTop: SPACING.md },
  contactText: { ...FONTS.caption, marginTop: SPACING.xs },
  socialRow: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xl },
  socialBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  copyright: { ...FONTS.small, textAlign: 'center', marginTop: SPACING.lg },
});
