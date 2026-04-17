import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { Subject, Topic } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  GeneratedQuestion,
  explainMcqWithBackend,
  explainQuestionWithBackend,
  generateExamWithBackend,
  generateQuizWithBackend,
  resolveBackendSubjectCode,
} from '../lib/api';

interface Props {
  route: any;
  navigation: any;
}

export default function SubjectDetailScreen({ route, navigation }: Props) {
  const { subject } = route.params as { subject: Subject };
  const { sessionMode } = useAuth();
  const [topics, setTopics] = useState(subject.topics);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [loadingTool, setLoadingTool] = useState<'quiz' | 'exam' | null>(null);
  const [generatedItems, setGeneratedItems] = useState<GeneratedQuestion[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [toolError, setToolError] = useState('');
  const [explainingIndex, setExplainingIndex] = useState<number | null>(null);
  const [explanationText, setExplanationText] = useState('');

  const filteredTopics = topics.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const toggleTopic = (id: string) => {
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completed = topics.filter((t) => t.completed).length;
  const progress = completed / topics.length;
  const remainingHours = topics.filter(t => !t.completed).reduce((s, t) => s + t.estimatedHours, 0);

  const getDifficultyColor = (d: string) => {
    if (d === 'easy') return COLORS.success;
    if (d === 'medium') return COLORS.warning;
    return COLORS.danger;
  };

  const backendSubjectCode = resolveBackendSubjectCode(subject.name, subject.semester);

  const createQuiz = async () => {
    if (sessionMode !== 'authenticated') {
      setGeneratedTitle('Login required for live quiz generation');
      setGeneratedItems([]);
      setToolError('');
      return;
    }

    try {
      setLoadingTool('quiz');
      setToolError('');
      setExplanationText('');
      const items = await generateQuizWithBackend(subject.name, subject.semester, 8);
      setGeneratedTitle(`Subject Quiz • ${backendSubjectCode}`);
      setGeneratedItems(items);
      if (!items.length) {
        setToolError('Quiz endpoint returned no questions. Try again in a moment.');
      }
    } catch (err) {
      const e = err as ApiError;
      setGeneratedTitle('Unable to generate subject quiz');
      setGeneratedItems([]);
      setToolError(String(e?.message || 'Subject quiz generation failed.'));
    } finally {
      setLoadingTool(null);
    }
  };

  const createExam = async () => {
    if (sessionMode !== 'authenticated') {
      setGeneratedTitle('Login required for live exam generation');
      setGeneratedItems([]);
      setToolError('');
      return;
    }

    try {
      setLoadingTool('exam');
      setToolError('');
      setExplanationText('');
      const items = await generateExamWithBackend(subject.name, subject.semester, 6, 2);
      setGeneratedTitle(`Subject Exam • ${backendSubjectCode}`);
      setGeneratedItems(items);
      if (!items.length) {
        setToolError('Exam endpoint returned empty payload. Retry after a few seconds.');
      }
    } catch (err) {
      const e = err as ApiError;
      setGeneratedTitle('Unable to generate subject exam');
      setGeneratedItems([]);
      setToolError(String(e?.message || 'Subject exam generation failed.'));
    } finally {
      setLoadingTool(null);
    }
  };

  const explainGeneratedQuestion = async (item: GeneratedQuestion, idx: number) => {
    if (sessionMode !== 'authenticated') {
      setToolError('Login required to explain generated questions.');
      return;
    }

    try {
      setToolError('');
      setExplainingIndex(idx);
      let response: Record<string, unknown>;
      if (Array.isArray(item.options) && item.options.length > 0) {
        response = await explainMcqWithBackend({
          question: item.question,
          options: item.options,
          correct_answer: item.correct_answer || item.options[0],
          subject: backendSubjectCode,
          semester: subject.semester,
        });
      } else {
        response = await explainQuestionWithBackend({
          action: 'subjective_review',
          question_text: item.question,
          correct_answer: item.correct_answer || 'No model answer available.',
          user_answer: '',
        });
      }

      setExplanationText(
        String(response.explanation || response.answer || response.message || 'No explanation returned.').trim()
      );
    } catch (err) {
      const e = err as ApiError;
      setToolError(String(e?.message || 'Unable to fetch explanation.'));
    } finally {
      setExplainingIndex(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{subject.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Subject Hero */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.heroCard, { borderLeftColor: subject.color }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: subject.color + '15' }]}>
              <Ionicons name={subject.icon as any} size={32} color={subject.color} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>{subject.name}</Text>
              <Text style={styles.heroSem}>Semester {subject.semester}</Text>
              {subject.isBacklog && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>⚠️ Backlog Subject</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: subject.color }]}>{Math.round(progress * 100)}%</Text>
              <Text style={styles.heroStatLabel}>Complete</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{completed}/{topics.length}</Text>
              <Text style={styles.heroStatLabel}>Topics</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{remainingHours}h</Text>
              <Text style={styles.heroStatLabel}>Remaining</Text>
            </View>
          </View>

          <View style={styles.heroBar}>
            <View style={[styles.heroBarFill, { width: `${progress * 100}%`, backgroundColor: subject.color }]} />
          </View>
        </Animated.View>

        {/* AI Insight */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.aiInsight}>
          <View style={styles.aiInsightHeader}>
            <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
            <Text style={styles.aiInsightLabel}>AI Recommendation</Text>
          </View>
          <Text style={styles.aiInsightText}>
            {progress < 0.5
              ? `Focus on completing the easier topics first to build momentum. Start with ${topics.find(t => !t.completed && t.difficulty === 'easy')?.name || 'basic concepts'}.`
              : progress < 0.8
              ? `Great progress! Tackle the harder topics now. ${topics.find(t => !t.completed && t.difficulty === 'hard')?.name || 'Advanced topics'} should be your priority.`
              : `Almost there! Just ${topics.length - completed} topics left. You can finish this in ${remainingHours} focused hours.`
            }
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(230).duration(400)} style={styles.aiActionsCard}>
          <Text style={styles.aiActionsTitle}>AI Test Builder</Text>
          <Text style={styles.aiActionsSub}>Mapped subject: {subject.name} {'->'} {backendSubjectCode}</Text>
          <View style={styles.aiActionsRow}>
            <TouchableOpacity style={styles.aiActionBtn} onPress={createQuiz}>
              <Ionicons name="help-circle-outline" size={14} color={COLORS.primary} />
              <Text style={styles.aiActionText}>{loadingTool === 'quiz' ? 'Generating...' : 'Generate Quiz'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiActionBtn} onPress={createExam}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
              <Text style={styles.aiActionText}>{loadingTool === 'exam' ? 'Generating...' : 'Generate Exam'}</Text>
            </TouchableOpacity>
          </View>

          {generatedTitle ? (
            <View style={styles.generatedWrap}>
              <Text style={styles.generatedTitle}>{generatedTitle}</Text>
              {toolError ? <Text style={styles.generatedError}>{toolError}</Text> : null}
              {generatedItems.length === 0 ? (
                <Text style={styles.generatedEmpty}>No generated items.</Text>
              ) : (
                generatedItems.slice(0, 4).map((item, idx) => (
                  <View key={`${idx}-${item.question}`} style={styles.generatedItem}>
                    <Text style={styles.generatedQuestion}>{idx + 1}. {item.question}</Text>
                    <TouchableOpacity style={styles.explainBtn} onPress={() => explainGeneratedQuestion(item, idx)}>
                      <Ionicons name="help-circle-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.explainBtnText}>{explainingIndex === idx ? 'Explaining...' : 'Explain'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {explanationText ? <Text style={styles.explanationText}>{explanationText}</Text> : null}
            </View>
          ) : null}
        </Animated.View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'done'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && { backgroundColor: subject.color }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && { color: COLORS.white }]}>
                {f === 'all' ? `All (${topics.length})` : f === 'pending' ? `Pending (${topics.length - completed})` : `Done (${completed})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topics List */}
        <View style={styles.topicsList}>
          {filteredTopics.map((topic, index) => (
            <Animated.View key={topic.id} entering={FadeInDown.delay(250 + index * 50).duration(300)}>
              <TouchableOpacity
                style={[styles.topicCard, topic.completed && styles.topicDone]}
                onPress={() => toggleTopic(topic.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  topic.completed
                    ? { backgroundColor: subject.color, borderColor: subject.color }
                    : { borderColor: COLORS.border },
                ]}>
                  {topic.completed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                </View>
                <View style={styles.topicInfo}>
                  <Text style={[styles.topicName, topic.completed && styles.topicNameDone]}>{topic.name}</Text>
                  <View style={styles.topicMeta}>
                    <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(topic.difficulty) + '15' }]}>
                      <Text style={[styles.diffText, { color: getDifficultyColor(topic.difficulty) }]}>{topic.difficulty}</Text>
                    </View>
                    <Text style={styles.topicHours}>{topic.estimatedHours}h</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

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
  headerTitle: { ...FONTS.h3, flex: 1, textAlign: 'center' },
  heroCard: {
    marginHorizontal: SPACING.xl, backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderLeftWidth: 4, ...SHADOWS.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  heroIcon: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1, marginLeft: SPACING.lg },
  heroTitle: { ...FONTS.h2, fontSize: 20 },
  heroSem: { ...FONTS.caption, marginTop: 2 },
  heroBadge: { backgroundColor: COLORS.dangerLight, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 4 },
  heroBadgeText: { ...FONTS.small, color: COLORS.danger },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.lg },
  heroStat: { alignItems: 'center' },
  heroStatValue: { ...FONTS.h3 },
  heroStatLabel: { ...FONTS.small, marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: COLORS.border },
  heroBar: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: RADIUS.full },
  aiInsight: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.lg,
    backgroundColor: '#F5F3FF', borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderLeftWidth: 3, borderLeftColor: COLORS.secondary,
  },
  aiActionsCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  aiActionsTitle: { ...FONTS.bodyBold, color: COLORS.primary },
  aiActionsSub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  aiActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  aiActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
  },
  aiActionText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  generatedWrap: { marginTop: SPACING.md },
  generatedTitle: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  generatedError: { ...FONTS.small, color: COLORS.danger, marginBottom: SPACING.xs },
  generatedEmpty: { ...FONTS.small, color: COLORS.textMuted },
  generatedItem: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  generatedQuestion: { ...FONTS.body, fontSize: 12 },
  explainBtn: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary + '35',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  explainBtnText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  explanationText: { ...FONTS.small, color: COLORS.text, marginTop: SPACING.sm, lineHeight: 18 },
  aiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  aiInsightLabel: { ...FONTS.small, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiInsightText: { ...FONTS.body, lineHeight: 20, color: COLORS.textSecondary },
  filterRow: {
    flexDirection: 'row', marginHorizontal: SPACING.xl, marginTop: SPACING.xl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.full, padding: 4, ...SHADOWS.sm,
  },
  filterTab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, alignItems: 'center' },
  filterText: { ...FONTS.bodyBold, fontSize: 12, color: COLORS.textSecondary },
  topicsList: { paddingHorizontal: SPACING.xl, marginTop: SPACING.lg },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  topicDone: { opacity: 0.7 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  topicInfo: { flex: 1 },
  topicName: { ...FONTS.bodyBold, fontSize: 14 },
  topicNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  topicMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  diffBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  diffText: { ...FONTS.small, fontWeight: '600', textTransform: 'capitalize' },
  topicHours: { ...FONTS.small },
});
