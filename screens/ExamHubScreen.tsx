import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS, CALENDAR_EVENTS } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import {
  explainMcqWithBackend,
  explainQuestionWithBackend,
  GeneratedQuestion,
  generateExamWithBackend,
  generateQuizWithBackend,
  gradeSubjectiveWithBackend,
  resolveBackendSubjectCode,
} from '../lib/api';

interface Props {
  navigation: any;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ExamHubScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingTool, setLoadingTool] = useState<'quiz' | 'exam' | null>(null);
  const [generatedItems, setGeneratedItems] = useState<GeneratedQuestion[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [grading, setGrading] = useState(false);
  const [explainingIndex, setExplainingIndex] = useState<number | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [subjectiveQuestion, setSubjectiveQuestion] = useState('Explain process scheduling and write two real-world examples.');
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('Process scheduling is used by OS to decide which process runs first based on policies like FCFS, SJF, and Round Robin. It helps CPU utilization and fairness. Examples include multitasking in mobile apps and server request handling.');
  const [gradingResult, setGradingResult] = useState('');
  const [examModeVisible, setExamModeVisible] = useState(false);
  const [examQuestions, setExamQuestions] = useState<GeneratedQuestion[]>([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examTimeLeft, setExamTimeLeft] = useState(30 * 60);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examSummary, setExamSummary] = useState('');
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Generate calendar days for current month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const examSubjects = SUBJECTS.filter((s) => s.examDate);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return CALENDAR_EVENTS.filter((e) => e.date === dateStr);
  };

  const selectedEvents = selectedDate
    ? CALENDAR_EVENTS.filter((e) => e.date === selectedDate)
    : [];

  const primarySubject = examSubjects[0] || SUBJECTS[0];
  const backendSubjectCode = resolveBackendSubjectCode(primarySubject?.name || '', primarySubject?.semester);

  useEffect(() => {
    if (!examModeVisible || examSubmitted) return;
    if (examTimeLeft <= 0) {
      submitExamMode();
      return;
    }

    const timer = setInterval(() => {
      setExamTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examModeVisible, examSubmitted, examTimeLeft]);

  const createQuiz = async () => {
    if (sessionMode !== 'authenticated') {
      setGeneratedTitle('Login required for live quiz generation');
      setGeneratedItems([]);
      return;
    }

    try {
      setLoadingTool('quiz');
      const items = await generateQuizWithBackend(primarySubject.name, primarySubject.semester, 10);
      setGeneratedTitle(`Generated Quiz • ${backendSubjectCode}`);
      setGeneratedItems(items);
    } catch {
      setGeneratedTitle('Unable to generate quiz right now');
      setGeneratedItems([]);
    } finally {
      setLoadingTool(null);
    }
  };

  const createMixedExam = async () => {
    if (sessionMode !== 'authenticated') {
      setGeneratedTitle('Login required for live exam generation');
      setGeneratedItems([]);
      return;
    }

    try {
      setLoadingTool('exam');
      const items = await generateExamWithBackend(primarySubject.name, primarySubject.semester, 8, 2);
      setGeneratedTitle(`Generated Mixed Exam • ${backendSubjectCode}`);
      setGeneratedItems(items);
    } catch {
      setGeneratedTitle('Unable to generate exam right now');
      setGeneratedItems([]);
    } finally {
      setLoadingTool(null);
    }
  };

  const startExamMode = async () => {
    if (sessionMode !== 'authenticated') {
      setGeneratedTitle('Login required for exam mode');
      return;
    }

    try {
      setLoadingTool('exam');
      setExamSubmitted(false);
      setExamScore(0);
      setExamSummary('');
      setExamAnswers({});
      setExamIndex(0);

      let items = await generateExamWithBackend(primarySubject.name, primarySubject.semester, 20, 0);
      let mcqOnly = items.filter((q) => Array.isArray(q.options) && q.options.length >= 2);

      if (mcqOnly.length < 10) {
        items = await generateQuizWithBackend(primarySubject.name, primarySubject.semester, 20);
        mcqOnly = items.filter((q) => Array.isArray(q.options) && q.options.length >= 2);
      }

      if (!mcqOnly.length) {
        setGeneratedTitle('Could not start exam mode right now. Try again.');
        return;
      }

      setExamQuestions(mcqOnly.slice(0, 20));
      setExamTimeLeft(30 * 60);
      setExamModeVisible(true);
    } catch {
      setGeneratedTitle('Unable to load exam mode right now');
    } finally {
      setLoadingTool(null);
    }
  };

  const selectExamOption = (option: string) => {
    if (examSubmitted) return;
    setExamAnswers((prev) => ({ ...prev, [examIndex]: option }));
  };

  const formatClock = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const mm = String(Math.floor(safe / 60)).padStart(2, '0');
    const ss = String(safe % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const submitExamMode = () => {
    if (!examQuestions.length) return;

    let correct = 0;
    let attempted = 0;
    examQuestions.forEach((q, idx) => {
      const picked = String(examAnswers[idx] || '').trim().toLowerCase();
      const expected = String(q.correct_answer || '').trim().toLowerCase();
      if (!picked) return;
      attempted += 1;
      if (picked === expected) correct += 1;
    });

    const scorePct = Math.round((correct / examQuestions.length) * 100);
    setExamScore(scorePct);
    setExamSubmitted(true);
    setExamSummary(`Attempted ${attempted}/${examQuestions.length} • Correct ${correct}/${examQuestions.length}`);
  };

  const closeExamMode = () => {
    setExamModeVisible(false);
    setExamQuestions([]);
    setExamAnswers({});
    setExamIndex(0);
    setExamSubmitted(false);
    setExamSummary('');
  };

  const runSubjectiveGrading = async () => {
    if (sessionMode !== 'authenticated') {
      setGradingResult('Login required for subjective grading.');
      return;
    }

    if (!subjectiveQuestion.trim() || !subjectiveAnswer.trim()) {
      setGradingResult('Please enter both question and answer before grading.');
      return;
    }

    try {
      setGrading(true);
      const result = await gradeSubjectiveWithBackend({
        question: subjectiveQuestion.trim(),
        answer: subjectiveAnswer.trim(),
        subject: backendSubjectCode,
        semester: primarySubject?.semester || 1,
        max_marks: 10,
      });
      setGradingResult(JSON.stringify(result, null, 2));
    } catch {
      setGradingResult('Unable to grade answer right now. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  const explainGeneratedQuestion = async (item: GeneratedQuestion, idx: number) => {
    if (sessionMode !== 'authenticated') {
      setExplanationText('Login required to explain generated questions.');
      return;
    }

    try {
      setExplainingIndex(idx);
      let response: Record<string, unknown>;
      if (Array.isArray(item.options) && item.options.length > 0) {
        response = await explainMcqWithBackend({
          question: item.question,
          options: item.options,
          correct_answer: item.correct_answer || item.options[0],
          subject: backendSubjectCode,
          semester: primarySubject?.semester,
        });
      } else {
        response = await explainQuestionWithBackend({
          action: 'subjective_review',
          question_text: item.question,
          correct_answer: item.correct_answer || 'No model answer available.',
          user_answer: '',
        });
      }

      const text =
        String(response.explanation || response.answer || response.message || '').trim() ||
        'No explanation returned.';
      setExplanationText(text);
    } catch {
      setExplanationText('Unable to fetch explanation right now.');
    } finally {
      setExplainingIndex(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Exam Hub</Text>
          <Text style={styles.subtitle}>Prepare smarter, score higher</Text>
        </View>

        {/* Calendar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.calendarCard}>
          <View style={styles.calMonthRow}>
            <Text style={styles.calMonth}>{MONTHS[currentMonth]} {currentYear}</Text>
            <View style={styles.calNav}>
              <TouchableOpacity style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.calDaysHeader}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.calDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {calendarDays.map((day, i) => {
              if (day === null) return <View key={`empty-${i}`} style={styles.calCell} />;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = getEventsForDay(day);
              const isToday = day === today.getDate();
              const isSelected = dateStr === selectedDate;
              const hasExam = events.some((e) => e.type === 'exam');

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    isToday && styles.calToday,
                    isSelected && styles.calSelected,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.calDayNum,
                    isToday && styles.calTodayText,
                    isSelected && styles.calSelectedText,
                  ]}>{day}</Text>
                  {events.length > 0 && (
                    <View style={styles.calDots}>
                      {events.slice(0, 2).map((e, ei) => (
                        <View key={ei} style={[styles.calDot, { backgroundColor: e.color }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Selected Date Events */}
        {selectedEvents.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Events on {selectedDate}</Text>
            {selectedEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventDot, { backgroundColor: event.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Upcoming Exams */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming Exams</Text>
          {examSubjects.map((subject, index) => {
            const examDate = new Date(subject.examDate!);
            const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
            const remainingTopics = subject.totalTopics - subject.completedTopics;
            const hoursNeeded = subject.topics.filter(t => !t.completed).reduce((s, t) => s + t.estimatedHours, 0);
            const dailyHours = daysLeft > 0 ? (hoursNeeded / daysLeft).toFixed(1) : 'N/A';

            return (
              <Animated.View key={subject.id} entering={FadeInDown.delay(250 + index * 80).duration(400)}>
                <TouchableOpacity
                  style={styles.examCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SubjectDetail', { subject })}
                >
                  <View style={styles.examTop}>
                    <View style={[styles.examIcon, { backgroundColor: subject.color + '15' }]}>
                      <Ionicons name={subject.icon as any} size={24} color={subject.color} />
                    </View>
                    <View style={styles.examInfo}>
                      <Text style={styles.examName}>{subject.name}</Text>
                      <Text style={styles.examDate}>
                        {examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[
                      styles.daysLeftBadge,
                      { backgroundColor: daysLeft < 10 ? COLORS.dangerLight : daysLeft < 20 ? COLORS.warningLight : COLORS.successLight },
                    ]}>
                      <Text style={[
                        styles.daysLeftText,
                        { color: daysLeft < 10 ? COLORS.danger : daysLeft < 20 ? COLORS.warning : COLORS.success },
                      ]}>{daysLeft}d</Text>
                    </View>
                  </View>

                  <View style={styles.examProgress}>
                    <View style={styles.examBarBg}>
                      <View style={[styles.examBarFill, { width: `${subject.progress * 100}%`, backgroundColor: subject.color }]} />
                    </View>
                  </View>

                  <View style={styles.examStats}>
                    <View style={styles.examStat}>
                      <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.examStatText}>{remainingTopics} topics left</Text>
                    </View>
                    <View style={styles.examStat}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.examStatText}>{hoursNeeded} hrs total</Text>
                    </View>
                    <View style={styles.examStat}>
                      <Ionicons name="flash-outline" size={14} color={COLORS.primary} />
                      <Text style={[styles.examStatText, { color: COLORS.primary, fontWeight: '600' }]}>{dailyHours} hrs/day</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Quick Prep Tools */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Prep Tools</Text>
          <Text style={styles.toolSubtext}>Live generation subject: {primarySubject?.name || 'N/A'} {'->'} {backendSubjectCode}</Text>
          <View style={styles.toolsGrid}>
            {[
              { icon: 'document-text', label: 'Generate Quiz', color: '#4A6CF7', desc: loadingTool === 'quiz' ? 'Generating...' : '10 MCQs', action: createQuiz },
              { icon: 'help-circle', label: 'Generate Exam', color: '#06B6D4', desc: loadingTool === 'exam' ? 'Generating...' : '8 MCQ + 2 subjective', action: createMixedExam },
              { icon: 'timer-outline', label: 'Exam Mode', color: '#16A34A', desc: loadingTool === 'exam' ? 'Preparing...' : '30 min timed test', action: startExamMode },
              { icon: 'bookmark', label: 'Formulas', color: '#F59E0B', desc: 'Quick reference' },
            ].map((tool, i) => (
              <TouchableOpacity key={i} style={styles.toolCard} activeOpacity={0.7} onPress={() => tool.action?.()}>
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '15' }]}>
                  <Ionicons name={tool.icon as any} size={26} color={tool.color} />
                </View>
                <Text style={styles.toolLabel}>{tool.label}</Text>
                <Text style={styles.toolDesc}>{tool.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {generatedTitle ? (
          <Animated.View entering={FadeInDown.delay(460).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Generated Output</Text>
            <View style={styles.generatedCard}>
              <Text style={styles.generatedTitle}>{generatedTitle}</Text>
              {generatedItems.length === 0 ? (
                <Text style={styles.generatedEmpty}>No items available yet.</Text>
              ) : (
                generatedItems.slice(0, 6).map((item, idx) => (
                  <View key={`${idx}-${item.question}`} style={styles.generatedItem}>
                    <Text style={styles.generatedQ}>{idx + 1}. {item.question}</Text>
                    {item.options && item.options.length > 0 ? (
                      <Text style={styles.generatedMeta}>Options: {item.options.join(' | ')}</Text>
                    ) : null}
                    <TouchableOpacity style={styles.explainBtn} onPress={() => explainGeneratedQuestion(item, idx)}>
                      <Ionicons name="help-circle-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.explainBtnText}>{explainingIndex === idx ? 'Explaining...' : 'Explain'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {explanationText ? <Text style={styles.explanationText}>{explanationText}</Text> : null}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Subjective Grader</Text>
          <View style={styles.generatedCard}>
            <Text style={styles.graderSub}>Submit one descriptive answer to check quality with backend grading.</Text>
            <TextInput
              style={styles.graderInput}
              value={subjectiveQuestion}
              onChangeText={setSubjectiveQuestion}
              placeholder="Subjective question"
              placeholderTextColor={COLORS.textMuted}
              multiline
            />
            <TextInput
              style={[styles.graderInput, styles.answerInput]}
              value={subjectiveAnswer}
              onChangeText={setSubjectiveAnswer}
              placeholder="Your answer"
              placeholderTextColor={COLORS.textMuted}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.gradeBtn} onPress={runSubjectiveGrading}>
              <Ionicons name="sparkles-outline" size={16} color={COLORS.white} />
              <Text style={styles.gradeBtnText}>{grading ? 'Grading...' : 'Grade Subjective Answer'}</Text>
            </TouchableOpacity>

            {gradingResult ? (
              <View style={styles.gradeResultBox}>
                <Text style={styles.gradeResultText}>{gradingResult}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={examModeVisible} animationType="slide" onRequestClose={closeExamMode}>
        <SafeAreaView style={styles.examModeContainer} edges={['top', 'bottom']}>
          <View style={styles.examModeHeader}>
            <TouchableOpacity onPress={closeExamMode} style={styles.examHeaderBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.examModeTitle}>Exam Mode • {backendSubjectCode}</Text>
              <Text style={styles.examModeSub}>Question {Math.min(examIndex + 1, Math.max(examQuestions.length, 1))}/{Math.max(examQuestions.length, 1)}</Text>
            </View>
            <View style={[styles.timerBadge, examTimeLeft < 300 && styles.timerBadgeWarn]}>
              <Ionicons name="time-outline" size={14} color={examTimeLeft < 300 ? COLORS.danger : COLORS.primary} />
              <Text style={[styles.timerText, examTimeLeft < 300 && { color: COLORS.danger }]}>{formatClock(examTimeLeft)}</Text>
            </View>
          </View>

          {examQuestions.length > 0 ? (
            <View style={styles.examModeBody}>
              <ScrollView style={styles.examQuestionCard} contentContainerStyle={{ paddingBottom: SPACING.md }}>
                <Text style={styles.examQuestionText}>{examQuestions[examIndex]?.question || 'No question available'}</Text>
                {(examQuestions[examIndex]?.options || []).map((opt, idx) => {
                  const chosen = examAnswers[examIndex] === opt;
                  return (
                    <TouchableOpacity
                      key={`${examIndex}-opt-${idx}`}
                      style={[styles.examOption, chosen && styles.examOptionSelected]}
                      onPress={() => selectExamOption(opt)}
                      disabled={examSubmitted}
                    >
                      <Text style={[styles.examOptionText, chosen && styles.examOptionTextSelected]}>{String.fromCharCode(65 + idx)}. {opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {examSubmitted ? (
                <View style={styles.examResultBox}>
                  <Text style={styles.examResultTitle}>Result: {examScore}%</Text>
                  <Text style={styles.examResultText}>{examSummary}</Text>
                </View>
              ) : null}

              <View style={styles.examActionsRow}>
                <TouchableOpacity
                  style={styles.examActionBtn}
                  onPress={() => setExamIndex((prev) => Math.max(0, prev - 1))}
                  disabled={examIndex === 0 || examSubmitted}
                >
                  <Text style={styles.examActionText}>Prev</Text>
                </TouchableOpacity>
                {examSubmitted ? (
                  <TouchableOpacity style={[styles.examActionBtn, styles.examSubmitBtn]} onPress={closeExamMode}>
                    <Text style={[styles.examActionText, styles.examSubmitText]}>Finish</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.examActionBtn, styles.examSubmitBtn]} onPress={submitExamMode}>
                    <Text style={[styles.examActionText, styles.examSubmitText]}>Submit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.examActionBtn}
                  onPress={() => setExamIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                  disabled={examIndex >= examQuestions.length - 1 || examSubmitted}
                >
                  <Text style={styles.examActionText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.examEmptyBox}>
              <Text style={styles.examEmptyText}>Preparing exam questions...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { ...FONTS.h1 },
  subtitle: { ...FONTS.caption, marginTop: 4 },
  calendarCard: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.xl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md,
  },
  calMonthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  calMonth: { ...FONTS.h3 },
  calNav: { flexDirection: 'row', gap: SPACING.xs },
  calNavBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  calDaysHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
  calDayLabel: { flex: 1, textAlign: 'center', ...FONTS.small, color: COLORS.textMuted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  calToday: { backgroundColor: COLORS.primary + '15' },
  calSelected: { backgroundColor: COLORS.primary },
  calDayNum: { ...FONTS.body, fontSize: 14 },
  calTodayText: { color: COLORS.primary, fontWeight: '700' },
  calSelectedText: { color: COLORS.white, fontWeight: '700' },
  calDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  sectionTitle: { ...FONTS.h3, marginBottom: SPACING.lg },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.md },
  eventInfo: { flex: 1 },
  eventTitle: { ...FONTS.bodyBold, fontSize: 14 },
  eventType: { ...FONTS.caption, marginTop: 2 },
  examCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.md,
  },
  examTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  examIcon: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  examInfo: { flex: 1, marginLeft: SPACING.md },
  examName: { ...FONTS.bodyBold, fontSize: 16 },
  examDate: { ...FONTS.caption, marginTop: 2 },
  daysLeftBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  daysLeftText: { ...FONTS.bodyBold, fontSize: 13 },
  examProgress: { marginBottom: SPACING.md },
  examBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  examBarFill: { height: '100%', borderRadius: RADIUS.full },
  examStats: { flexDirection: 'row', justifyContent: 'space-between' },
  examStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  examStatText: { ...FONTS.small },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  toolSubtext: { ...FONTS.small, color: COLORS.textSecondary, marginTop: -SPACING.sm, marginBottom: SPACING.md },
  toolCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOWS.sm,
  },
  toolIcon: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  toolLabel: { ...FONTS.bodyBold, fontSize: 14 },
  toolDesc: { ...FONTS.caption, marginTop: 2 },
  generatedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  generatedTitle: { ...FONTS.bodyBold, marginBottom: SPACING.md },
  generatedEmpty: { ...FONTS.small, color: COLORS.textMuted },
  generatedItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  generatedQ: { ...FONTS.body, fontSize: 13 },
  generatedMeta: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 3 },
  explainBtn: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '35',
  },
  explainBtnText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  explanationText: { ...FONTS.small, color: COLORS.text, marginTop: SPACING.sm, lineHeight: 18 },
  graderSub: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.md },
  graderInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  answerInput: { minHeight: 100 },
  gradeBtn: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  gradeBtnText: { ...FONTS.small, color: COLORS.white, fontWeight: '700' },
  gradeResultBox: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  gradeResultText: { ...FONTS.small, color: COLORS.text, fontFamily: 'monospace' },
  examModeContainer: { flex: 1, backgroundColor: COLORS.background },
  examModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  examHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  examModeTitle: { ...FONTS.bodyBold, color: COLORS.text },
  examModeSub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  timerBadgeWarn: {
    borderColor: COLORS.danger + '35',
    backgroundColor: COLORS.dangerLight,
  },
  timerText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  examModeBody: { flex: 1, padding: SPACING.lg },
  examQuestionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  examQuestionText: { ...FONTS.bodyBold, color: COLORS.text, lineHeight: 22, marginBottom: SPACING.md },
  examOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  examOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  examOptionText: { ...FONTS.body, color: COLORS.textSecondary },
  examOptionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  examActionsRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  examActionBtn: {
    flex: 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  examSubmitBtn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  examActionText: { ...FONTS.bodyBold, color: COLORS.textSecondary, fontSize: 13 },
  examSubmitText: { color: COLORS.white },
  examResultBox: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + '35',
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  examResultTitle: { ...FONTS.bodyBold, color: COLORS.success },
  examResultText: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  examEmptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  examEmptyText: { ...FONTS.body, color: COLORS.textSecondary },
});
