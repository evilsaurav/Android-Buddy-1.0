import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

export default function RateUsScreen({ navigation }: Props) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (stars: number) => {
    setRating(stars);
  };

  const submitRating = () => {
    if (rating === 0) {
      Alert.alert('Select Rating', 'Please tap the stars to rate us!');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Us</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.thankYouContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.thankYouContent}>
            <View style={styles.thankYouIcon}>
              <Ionicons name="heart" size={64} color={COLORS.danger} />
            </View>
            <Text style={styles.thankYouTitle}>Thank You!</Text>
            <Text style={styles.thankYouSubtitle}>Your {rating}-star rating means the world to us.</Text>
            <View style={styles.thankYouStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= rating ? 'star' : 'star-outline'} size={32} color="#F59E0B" />
              ))}
            </View>
            <Text style={styles.thankYouMessage}>
              {rating >= 4
                ? 'We\'re so glad you love BCABuddy! Your support keeps us motivated to build better features.'
                : 'We appreciate your honest feedback! We\'ll work hard to improve your experience.'}
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Back to Profile</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Rating Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.ratingCard}>
          <View style={styles.ratingIconBg}>
            <Ionicons name="school" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.ratingTitle}>Enjoying BCABuddy?</Text>
          <Text style={styles.ratingSubtitle}>Your feedback helps us improve the app for all BCA students</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRate(star)} style={styles.starBtn}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? '#F59E0B' : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.ratingLabel}>
                {rating === 1 ? 'Needs Improvement' : rating === 2 ? 'Could Be Better' : rating === 3 ? 'It\'s Okay' : rating === 4 ? 'Really Good!' : 'Absolutely Love It!'}
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]} onPress={submitRating}>
            <Text style={styles.submitBtnText}>Submit Rating</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Why Rate */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why rate BCABuddy?</Text>
          {[
            { icon: 'trending-up', text: 'Help us improve features you use most', color: COLORS.primary },
            { icon: 'people', text: 'Motivate our student-developer team', color: COLORS.secondary },
            { icon: 'star', text: 'Help other BCA students discover the app', color: '#F59E0B' },
            { icon: 'rocket', text: 'Shape the future of BCABuddy', color: COLORS.success },
          ].map((item, i) => (
            <View key={i} style={styles.whyRow}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={styles.whyText}>{item.text}</Text>
            </View>
          ))}
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
  ratingCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xxl, padding: SPACING.xxl,
    alignItems: 'center', ...SHADOWS.lg, marginTop: SPACING.xl,
  },
  ratingIconBg: {
    width: 90, height: 90, borderRadius: 28, backgroundColor: '#1E1B4B',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, ...SHADOWS.md,
  },
  ratingTitle: { ...FONTS.h2, textAlign: 'center' },
  ratingSubtitle: { ...FONTS.caption, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  starsRow: { flexDirection: 'row', marginTop: SPACING.xxl, marginBottom: SPACING.lg, gap: SPACING.sm },
  starBtn: { padding: SPACING.xs },
  ratingLabel: { ...FONTS.bodyBold, color: COLORS.primary, textAlign: 'center', marginBottom: SPACING.xl },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.huge,
    borderRadius: RADIUS.full, marginTop: SPACING.md,
  },
  submitBtnDisabled: { backgroundColor: COLORS.border },
  submitBtnText: { ...FONTS.bodyBold, color: COLORS.white, fontSize: 16 },
  whyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl,
    marginTop: SPACING.xl, ...SHADOWS.sm,
  },
  whyTitle: { ...FONTS.bodyBold, marginBottom: SPACING.lg },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  whyText: { ...FONTS.body, color: COLORS.textSecondary, flex: 1 },
  thankYouContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  thankYouContent: { alignItems: 'center' },
  thankYouIcon: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.danger + '10',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl,
  },
  thankYouTitle: { ...FONTS.h1, marginBottom: SPACING.sm },
  thankYouSubtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
  thankYouStars: { flexDirection: 'row', gap: SPACING.xs, marginVertical: SPACING.xl },
  thankYouMessage: { ...FONTS.body, textAlign: 'center', color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.xxl },
  doneBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.huge,
    borderRadius: RADIUS.full,
  },
  doneBtnText: { ...FONTS.bodyBold, color: COLORS.white },
});
