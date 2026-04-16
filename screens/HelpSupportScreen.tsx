import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

const FAQS = [
  { q: 'How does the AI study planner work?', a: 'BCABuddy AI analyzes your current progress, upcoming exams, and study patterns to generate personalized daily study plans. It prioritizes topics based on difficulty, weightage, and your completion rate.' },
  { q: 'Is my data stored online?', a: 'No! All your study data is stored locally on your device using AsyncStorage. We prioritize your privacy. Cloud sync is optional and uses encryption.' },
  { q: 'How do I clear a backlog subject?', a: 'Go to the Backlog Planner tab to see your AI-generated recovery plan. It breaks down the subject into weekly goals with estimated daily study hours.' },
  { q: 'Can I customize my study roadmap?', a: 'Yes! Navigate to the Roadmap tab, select a semester, and tap on any subject to view and modify topic completion status. The AI adjusts recommendations accordingly.' },
  { q: 'How are study hours calculated?', a: 'Estimated hours are based on topic difficulty, average student completion times, and BCA curriculum guidelines. You can adjust these in subject details.' },
  { q: 'Does BCABuddy work offline?', a: 'Yes! All core features work offline. Your progress, roadmaps, and study plans are stored locally. AI chat requires an internet connection.' },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const submitFeedback = () => {
    if (feedback.trim().length < 10) {
      Alert.alert('Too Short', 'Please provide more details in your feedback.');
      return;
    }
    Alert.alert('Thank You!', 'Your feedback has been submitted. We appreciate your input!', [{ text: 'OK', onPress: () => setFeedback('') }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.quickActions}>
          {[
            { icon: 'chatbubble-ellipses', label: 'Chat with AI', color: COLORS.primary, onPress: () => navigation.navigate('AIChat') },
            { icon: 'mail', label: 'Email Us', color: COLORS.secondary, onPress: () => Alert.alert('Email', 'support@bcabuddy.app') },
            { icon: 'bug', label: 'Report Bug', color: COLORS.danger, onPress: () => Alert.alert('Bug Report', 'Please describe the bug in the feedback section below.') },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickAction} onPress={action.onPress} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* FAQs */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={styles.faqCard}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons name={expandedFaq === i ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
              </View>
              {expandedFaq === i && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Feedback */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Send Feedback</Text>
          <View style={styles.feedbackCard}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what you think, report issues, or suggest features..."
              placeholderTextColor={COLORS.textMuted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={styles.feedbackFooter}>
              <Text style={styles.charCount}>{feedback.length}/500</Text>
              <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
                <Text style={styles.submitBtnText}>Submit</Text>
                <Ionicons name="send" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.infoCard}>
          <Text style={styles.infoTitle}>BCABuddy v1.0.0</Text>
          <Text style={styles.infoDesc}>Built with React Native + Expo</Text>
          <Text style={styles.infoDesc}>Designed for Azure App Service deployment</Text>
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
  quickActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  quickAction: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center', ...SHADOWS.sm,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  quickLabel: { ...FONTS.bodyBold, fontSize: 12, textAlign: 'center' },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.md, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  faqCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { ...FONTS.bodyBold, fontSize: 14, flex: 1, marginRight: SPACING.sm },
  faqAnswer: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.md, lineHeight: 22, fontSize: 14 },
  feedbackCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
  feedbackInput: {
    ...FONTS.body, minHeight: 120, backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  feedbackFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  charCount: { ...FONTS.small },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  submitBtnText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.white },
  infoCard: { alignItems: 'center', paddingVertical: SPACING.xxl },
  infoTitle: { ...FONTS.bodyBold, color: COLORS.textSecondary },
  infoDesc: { ...FONTS.small, marginTop: 4 },
});
