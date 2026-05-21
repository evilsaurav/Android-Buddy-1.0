import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';
import { GeneratedQuestion, resolveBackendSubjectCode } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

const COUNT_OPTIONS = [10, 15, 20, 30];

export default function ExamHubScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [mode, setMode] = useState<'exam' | 'quiz'>('exam');

  const semesterOptions = useMemo(
    () => Array.from(new Set(SUBJECTS.map((s) => s.semester))).sort((a, b) => a - b),
    []
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(semesterOptions[0] || 1);
  const subjectOptions = SUBJECTS.filter((s) => s.semester === selectedSemester);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(subjectOptions[0]?.name || SUBJECTS[0]?.name || '');
  const [questionCount, setQuestionCount] = useState(15);

  useEffect(() => {
    if (!subjectOptions.some((s) => s.name === selectedSubjectName)) {
      setSelectedSubjectName(subjectOptions[0]?.name || SUBJECTS[0]?.name || '');
    }
  }, [selectedSemester]);

  const selectedSubject = subjectOptions.find((s) => s.name === selectedSubjectName) || subjectOptions[0] || SUBJECTS[0];
  const backendSubjectCode = resolveBackendSubjectCode(selectedSubject?.name || '', selectedSubject?.semester);

  const getExamDurationSeconds = (count: number) => {
    if (count >= 30) return 90 * 60;
    if (count >= 20) return 60 * 60;
    return 45 * 60;
  };

  const shuffleArray = <T,>(items: T[]) => {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  const buildDemoQuestions = (count: number, includeSubjective: boolean) => {
    const topicPool = selectedSubject?.topics?.map((t) => t.name).filter(Boolean) || [];
    const fallbackPool = SUBJECTS.flatMap((s) => s.topics.map((t) => t.name));
    const uniquePool = Array.from(new Set([...topicPool, ...fallbackPool])).filter(Boolean);
    if (!uniquePool.length) return [] as GeneratedQuestion[];

    const subjectiveCount = includeSubjective ? Math.max(1, Math.round(count / 3)) : 0;
    const mcqCount = Math.max(1, count - subjectiveCount);
    const pickedTopics = shuffleArray(uniquePool).slice(0, mcqCount + subjectiveCount);

    const buildOptions = (correct: string) => {
      const distractors = shuffleArray(uniquePool.filter((t) => t !== correct)).slice(0, 3);
      return shuffleArray([correct, ...distractors]);
    };

    const mcqs: GeneratedQuestion[] = pickedTopics.slice(0, mcqCount).map((topic) => ({
      question: `Which topic best matches: ${topic}?`,
      options: buildOptions(topic),
      correct_answer: topic,
      type: 'mcq',
      subject: backendSubjectCode,
      semester: selectedSemester,
    }));

    if (!includeSubjective) return mcqs;

    const subjectiveItems: GeneratedQuestion[] = pickedTopics.slice(mcqCount, mcqCount + subjectiveCount).map((topic) => ({
      question: `Explain the core idea of ${topic}. Give one real-world example.`,
      type: 'subjective',
      subject: backendSubjectCode,
      semester: selectedSemester,
    }));

    return [...mcqs, ...subjectiveItems];
  };

  const startExamMode = () => {
    if (sessionMode !== 'authenticated') {
      const demoItems = buildDemoQuestions(questionCount, true);
      navigation.navigate('ExamScreen', {
        subjectName: selectedSubject.name,
        semester: selectedSemester,
        questionCount,
        mode: 'exam',
        presetQuestions: demoItems,
        demo: true,
      });
      return;
    }

    navigation.navigate('ExamScreen', {
      subjectName: selectedSubject.name,
      semester: selectedSemester,
      questionCount,
      mode: 'exam',
    });
  };

  const startQuizMode = () => {
    if (sessionMode !== 'authenticated') {
      const demoItems = buildDemoQuestions(questionCount, false);
      navigation.navigate('QuizScreen', {
        subjectName: selectedSubject.name,
        semester: selectedSemester,
        questionCount,
        mode: 'quiz',
        presetQuestions: demoItems,
        demo: true,
      });
      return;
    }

    navigation.navigate('QuizScreen', {
      subjectName: selectedSubject.name,
      semester: selectedSemester,
      questionCount,
      mode: 'quiz',
    });
  };

  const durationMinutes = Math.floor(getExamDurationSeconds(questionCount) / 60);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <Text style={styles.title}>Preparation</Text>
            <Text style={styles.subtitle}>Choose your flow and start practicing.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'exam' && styles.modeChipActive]}
              onPress={() => setMode('exam')}
            >
              <Ionicons name="document-text-outline" size={16} color={mode === 'exam' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.modeChipText, mode === 'exam' && styles.modeChipTextActive]}>Exam</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'quiz' && styles.modeChipActive]}
              onPress={() => setMode('quiz')}
            >
              <Ionicons name="flash-outline" size={16} color={mode === 'quiz' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.modeChipText, mode === 'quiz' && styles.modeChipTextActive]}>Quiz</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.card}>
            <Text style={styles.cardLabel}>Semester</Text>
            <View style={styles.selectorRow}>
              {semesterOptions.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[styles.selectorChip, selectedSemester === sem && styles.selectorChipActive]}
                  onPress={() => setSelectedSemester(sem)}
                >
                  <Text style={[styles.selectorChipText, selectedSemester === sem && styles.selectorChipTextActive]}>Sem {sem}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.cardLabel}>Subject</Text>
            <View style={styles.selectorRow}>
              {subjectOptions.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.selectorChip, selectedSubjectName === subject.name && styles.selectorChipActive]}
                  onPress={() => setSelectedSubjectName(subject.name)}
                >
                  <Text style={[styles.selectorChipText, selectedSubjectName === subject.name && styles.selectorChipTextActive]}>
                    {resolveBackendSubjectCode(subject.name, subject.semester)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.cardLabel}>Questions</Text>
            <View style={styles.selectorRow}>
              {COUNT_OPTIONS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.selectorChip, questionCount === count && styles.selectorChipActive]}
                  onPress={() => setQuestionCount(count)}
                >
                  <Text style={[styles.selectorChipText, questionCount === count && styles.selectorChipTextActive]}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{durationMinutes} mins auto-timer</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.infoText}>Subject: {selectedSubject?.name || 'N/A'} ({backendSubjectCode})</Text>
            </View>
            {mode === 'exam' ? (
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={16} color={COLORS.warning} />
                <Text style={styles.infoText}>Exam includes subjective questions</Text>
              </View>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(340).duration(400)} style={styles.ctaRow}>
            {mode === 'exam' ? (
              <TouchableOpacity style={styles.ctaPrimary} onPress={startExamMode}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
                <Text style={styles.ctaPrimaryText}>Start Exam</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.ctaPrimary} onPress={startQuizMode}>
                <Ionicons name="flash-outline" size={18} color={COLORS.white} />
                <Text style={styles.ctaPrimaryText}>Start Quiz</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate('AIChat')}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
              <Text style={styles.ctaSecondaryText}>Ask AI</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { ...FONTS.h1 },
  subtitle: { ...FONTS.caption, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.xl, marginTop: SPACING.lg },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeChipText: { ...FONTS.bodyBold, color: COLORS.textSecondary },
  modeChipTextActive: { color: COLORS.white },
  card: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardLabel: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '700' },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  selectorChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorChipActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '50' },
  selectorChipText: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '700' },
  selectorChipTextActive: { color: COLORS.primary },
  infoCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  infoText: { ...FONTS.body, color: COLORS.textSecondary },
  ctaRow: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  ctaPrimaryText: { ...FONTS.bodyBold, color: COLORS.white },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  ctaSecondaryText: { ...FONTS.bodyBold, color: COLORS.primary },
});
