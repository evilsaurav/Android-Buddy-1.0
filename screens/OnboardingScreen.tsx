import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, ViewToken } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: '1',
    icon: 'sparkles',
    title: 'AI-Powered\nStudy Guidance',
    subtitle: 'Get personalized study plans, smart suggestions, and AI-driven insights tailored to your BCA curriculum.',
    color: '#4A6CF7',
    bgColor: '#EEF2FF',
  },
  {
    id: '2',
    icon: 'heart',
    title: 'Frenzy Mode\nPersona Boost',
    subtitle: 'Turn on a focused persona angle that pushes you with high-energy reminders, sharper goals, and zero-excuse momentum.',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  {
    id: '3',
    icon: 'map',
    title: 'Your Personal\nStudy Roadmap',
    subtitle: 'Build semester-wise roadmaps, track backlogs, and never miss a topic with our smart planner.',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: '4',
    icon: 'rocket',
    title: 'Ready to Ace\nYour BCA?',
    subtitle: 'Join thousands of BCA students studying smarter, not harder - now with your Frenzy persona edge on demand.',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 520 }),
        withTiming(1, { duration: 520 })
      ),
      -1,
      false
    );
  }, []);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
        <View style={[styles.iconInner, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={64} color={item.color} />
        </View>
      </View>
      <Text style={[styles.slideTitle, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? currentSlide.color : COLORS.border,
                  width: i === currentIndex ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: currentSlide.color }]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <Text style={styles.brandLine}>Designed with </Text>
          <Animated.Text style={[styles.heartEmoji, heartAnimatedStyle]}>❤️</Animated.Text>
          <Text style={styles.brandLine}> by Insomniac for Frenzy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    ...FONTS.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 24,
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.xl,
    width: '100%',
    gap: 8,
  },
  nextText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
    fontSize: 17,
  },
  brandLine: {
    ...FONTS.small,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    flexWrap: 'wrap',
  },
  heartEmoji: {
    fontSize: 13,
    marginTop: SPACING.md,
  },
});
