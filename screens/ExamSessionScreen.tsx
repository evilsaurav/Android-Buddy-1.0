import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  generateExamWithBackend,
  generateQuizWithBackend,
  explainMcqWithBackend,
  gradeSubjectiveWithBackend,
  logApcWithBackend,
  GeneratedQuestion,
  resolveBackendSubjectCode,
} from '../lib/api';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
  route: any;
}

const EXAM_ATTEMPTS_KEY = 'bcabuddy_exam_attempts';

export default function ExamSessionScreen({ navigation, route }: Props) {
  const { sessionMode } = useAuth();
  const { subjectName, semester, questionCount = 15, mode = 'exam', presetQuestions, demo } = route.params || {};
  const subject = SUBJECTS.find((s) => s.name === subjectName) || SUBJECTS[0];
  const backendSubjectCode = resolveBackendSubjectCode(String(subjectName || subject.name), semester);

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [scorePct, setScorePct] = useState(0);
  const [explainText, setExplainText] = useState('');
  const [subjectiveDraft, setSubjectiveDraft] = useState('');
  const [showReport, setShowReport] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  function getExamDurationSeconds(count: number) {
    if (count >= 30) return 90 * 60;
    if (count >= 20) return 60 * 60;
    return 45 * 60;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (Array.isArray(presetQuestions) && presetQuestions.length > 0) {
          setQuestions(presetQuestions.slice(0, questionCount));
          setTimeLeft(getExamDurationSeconds(Math.max(1, presetQuestions.length)));
          return;
        }

        if (sessionMode !== 'authenticated') {
          setQuestions([]);
          return;
        }

        let items: GeneratedQuestion[] = [];
        if (mode === 'quiz') {
          items = await generateQuizWithBackend(subjectName, semester, questionCount);
        } else {
          const subjectiveCount = Math.max(1, Math.round(questionCount / 3));
          const mcqCount = Math.max(1, questionCount - subjectiveCount);
          items = await generateExamWithBackend(subjectName, semester, mcqCount, subjectiveCount);
          if (!items || items.length < 1) {
            items = await generateQuizWithBackend(subjectName, semester, questionCount);
          }
        }

        if (!mountedRef.current) return;
        setQuestions(items.slice(0, questionCount));
        setTimeLeft(getExamDurationSeconds(Math.max(1, Math.min(questionCount, items.length || questionCount))));
      } catch (err) {
        setQuestions([]);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!timeLeft || submitted) return;
    const t = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
      setQuestionTimeLeft((q) => Math.max(0, q - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (questionTimeLeft <= 0) {
      setQuestionTimeLeft(60);
      setIndex((i) => Math.min((questions.length - 1) || 0, i + 1));
    }
  }, [questionTimeLeft, questions.length]);

  const selectOption = (opt: string) => {
    if (submitted) return;
    setAnswers((p) => ({ ...p, [index]: opt }));
  };

  const toggleMark = (i = index) => {
    setMarked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const submit = async () => {
    if (!questions.length || submitted) return;
    let correct = 0; let attempted = 0;
    questions.forEach((q, idx) => {
      const picked = String(answers[idx] || '').trim().toLowerCase();
      const expected = String(q.correct_answer || '').trim().toLowerCase();
      if (!picked) return;
      attempted += 1; if (picked === expected) correct += 1;
    });
    const pct = Math.round((correct / Math.max(1, questions.length)) * 100);
    setScorePct(pct);
    setSubmitted(true);

    // persist minimal attempt locally and log to backend (run id)
    const runId = `exam_${Date.now()}`;
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const raw = await AsyncStorage.getItem(EXAM_ATTEMPTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const next = [
        ...arr,
        { id: runId, score: correct, total: questions.length, attempted, percent: pct, subject: backendSubjectCode, semester, at: new Date().toISOString() },
      ];
      await AsyncStorage.setItem(EXAM_ATTEMPTS_KEY, JSON.stringify(next.slice(0, 200)));
    } catch {}

    // Log run summary to backend (best-effort)
    if (sessionMode === 'authenticated') {
      try {
        await logApcWithBackend(
          'exam_simulation',
          backendSubjectCode,
          `run:${runId} | Score:${correct}/${questions.length} (${pct}%) | attempted:${attempted}`,
          `Sem ${semester}`
        );
      } catch {}

      // Log wrong questions as individual items (fire-and-forget)
      try {
        const wrongs = questions
          .map((q, idx) => ({ q, idx }))
          .filter(({ q, idx }) => {
            const picked = String(answers[idx] || '').trim().toLowerCase();
            const expected = String(q.correct_answer || '').trim().toLowerCase();
            return picked && picked !== expected;
          });

        await Promise.allSettled(
          wrongs.map(({ q, idx }) =>
            logApcWithBackend(
              'exam_mistake',
              backendSubjectCode,
              JSON.stringify({ runId, index: idx + 1, question: q.question, user_answer: answers[idx] || 'Not Attempted', correct_answer: q.correct_answer || '' }),
              `Sem ${semester}`
            )
          )
        );
      } catch {}
    }
  };

  const escapeHtml = (str: string) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const exportPdf = async () => {
    const htmlParts: string[] = [];
    htmlParts.push(`<h1>Exam Result - ${escapeHtml(backendSubjectCode)}</h1>`);
    htmlParts.push(`<p>Semester: ${escapeHtml(String(semester))}</p>`);
    htmlParts.push(`<p>Score: ${scorePct}% (${questions.length} questions)</p>`);
    htmlParts.push('<hr/>');
    questions.forEach((q, idx) => {
      htmlParts.push(`<h3>Q${idx + 1}. ${escapeHtml(q.question)}</h3>`);
      htmlParts.push(`<p><strong>Your answer:</strong> ${escapeHtml(String(answers[idx] || 'Not Attempted'))}</p>`);
      htmlParts.push(`<p><strong>Correct answer:</strong> ${escapeHtml(String(q.correct_answer || ''))}</p>`);
      htmlParts.push('<hr/>');
    });

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:Arial,Helvetica,sans-serif;padding:18px;}h1{color:#1f2937;}h3{color:#111827;}p{color:#374151;}</style></head><body>${htmlParts.join('')}</body></html>`;

    try {
      const Print = await import('expo-print');
      const { uri } = await Print.printToFileAsync({ html });
      try {
        const Sharing = await import('expo-sharing');
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } catch {
        // fallback to system share
        await Share.share({ message: `Exam result saved to: ${uri}` });
      }
    } catch (err) {
      try {
        await Share.share({ message: `Exam result\nSubject: ${backendSubjectCode}\nSemester: ${semester}\nScore: ${scorePct}%` });
      } catch {}
    }
  };

  const shareResult = async () => {
    const payload = {
      subject: backendSubjectCode,
      semester,
      score: scorePct,
      total: questions.length,
      answers,
    };
    try {
      await Share.share({ message: JSON.stringify(payload, null, 2) });
    } catch {}
  };

  const askExplain = async (q: GeneratedQuestion, idx: number) => {
    if (sessionMode !== 'authenticated' && !presetQuestions) {
      setExplainText('Login required for AI remarks.');
      return;
    }

    try {
      setExplainText('Fetching explanation...');
      if (q.options && q.options.length) {
        const res = await explainMcqWithBackend({ question: q.question, options: q.options || [], correct_answer: q.correct_answer || q.options[0], subject: backendSubjectCode, semester });
        setExplainText(String(res?.explanation || res?.message || res?.answer || 'No explanation.'));
      } else {
        const res = await gradeSubjectiveWithBackend({ question: q.question, answer: answers[idx] || subjectiveDraft, subject: backendSubjectCode, semester: Number(semester || 0), max_marks: 10 });
        setExplainText(JSON.stringify(res || {}, null, 2));
      }
    } catch (err) {
      setExplainText('Unable to fetch explanation.');
    }
  };

  const current = questions[index];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{backendSubjectCode} • {mode === 'quiz' ? 'Quiz' : 'Exam'}</Text>
          <Text style={styles.sub}>{index + 1}/{questions.length} • Time {`${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          {!questions.length ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{loading ? 'Preparing questions...' : 'No questions available.'}</Text>
              {demo ? <Text style={styles.demoHint}>Demo mode is available only with local topics.</Text> : null}
            </View>
          ) : (
            <Animated.View entering={FadeInDown.duration(220)} style={styles.card}>
            <Text style={styles.qText}>{current?.question}</Text>
            {(current?.options || []).map((opt, i) => {
              const chosen = answers[index] === opt;
              return (
                <TouchableOpacity key={`opt-${i}`} style={[styles.opt, chosen && styles.optSelected]} onPress={() => selectOption(opt)}>
                  <Text style={[styles.optText, chosen && styles.optTextSelected]}>{String.fromCharCode(65 + i)}. {opt}</Text>
                </TouchableOpacity>
              );
            })}

            {(!current?.options || current?.options.length === 0) && (
              <TextInput
                value={subjectiveDraft}
                onChangeText={setSubjectiveDraft}
                placeholder="Write your answer..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                style={styles.subjectiveInput}
              />
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIndex((i) => Math.max(0, i - 1)); setQuestionTimeLeft(60); }}>
                <Text style={styles.actionText}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.markBtn]} onPress={() => toggleMark(index)}>
                <Text style={styles.actionText}>{marked.includes(index) ? 'Marked' : 'Mark'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.submitBtn]} onPress={submit}>
                <Text style={[styles.actionText, { color: '#fff' }]}>{submitted ? 'Submitted' : 'Submit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIndex((i) => Math.min(questions.length - 1, i + 1)); setQuestionTimeLeft(60); }}>
                <Text style={styles.actionText}>Next</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navigator}>
              {questions.map((_, i) => (
                <TouchableOpacity key={`nav-${i}`} style={[styles.navChip, i === index && styles.navChipActive, answers[i] && styles.navChipAnswered]} onPress={() => setIndex(i)}>
                  <Text style={styles.navText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {submitted && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Score: {scorePct}%</Text>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <TouchableOpacity style={styles.shareBtn} onPress={shareResult}>
                    <Ionicons name="share-outline" size={16} color="#fff" />
                    <Text style={styles.shareText}>Share Result</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.shareBtn, styles.pdfBtn]} onPress={exportPdf}>
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={styles.shareText}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.shareBtn, styles.reportBtn]} onPress={() => setShowReport((s) => !s)}>
                    <Ionicons name="document-text-outline" size={16} color="#fff" />
                    <Text style={styles.shareText}>{showReport ? 'Hide Report' : 'View Report'}</Text>
                  </TouchableOpacity>
                </View>

                {showReport ? (
                  <View style={styles.detailedReport}>
                    {questions.map((q, idx) => {
                      const user = String(answers[idx] || 'Not Attempted');
                      const correct = String(q.correct_answer || '');
                      const isCorrect = String(user).trim().toLowerCase() === String(correct).trim().toLowerCase();
                      return (
                        <View key={`report-${idx}`} style={styles.detailRow}>
                          <Text style={styles.detailQ}>{idx + 1}. {q.question}</Text>
                          <Text style={[styles.detailA, isCorrect ? styles.correctText : styles.incorrectText]}>Your: {user}</Text>
                          <Text style={styles.detailC}>Answer: {correct}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.explainRow}>
              <TouchableOpacity style={styles.explainBtn} onPress={() => askExplain(current, index)}>
                <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.explainText}>AI Remarks</Text>
              </TouchableOpacity>
              <Text style={styles.explainOutput}>{explainText}</Text>
            </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, borderRadius: 18, backgroundColor: COLORS.background },
  title: { ...FONTS.bodyBold },
  sub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 4 },
  body: { padding: SPACING.lg },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { ...FONTS.body, color: COLORS.textSecondary },
  demoHint: { ...FONTS.small, color: COLORS.textMuted, marginTop: SPACING.sm },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
  qText: { ...FONTS.bodyBold, fontSize: 16, marginBottom: SPACING.md },
  opt: { padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  optSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  optText: { ...FONTS.small, color: COLORS.textSecondary },
  optTextSelected: { color: COLORS.primary, fontWeight: '700' },
  subjectiveInput: { minHeight: 120, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md, color: COLORS.text },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, alignItems: 'center' },
  markBtn: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning + '35' },
  submitBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionText: { ...FONTS.bodyBold, color: COLORS.textSecondary },
  navigator: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  navChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  navChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  navChipAnswered: { borderColor: COLORS.success + '45', backgroundColor: COLORS.successLight },
  navText: { ...FONTS.small, color: COLORS.textSecondary },
  resultBox: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.success + '35' },
  resultTitle: { ...FONTS.bodyBold, color: COLORS.success },
  shareBtn: { marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  shareText: { color: '#fff', marginLeft: 6 },
  pdfBtn: { backgroundColor: COLORS.secondary || '#374151' },
  reportBtn: { backgroundColor: COLORS.primary + '90' },
  detailedReport: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  detailRow: { marginBottom: SPACING.sm },
  detailQ: { ...FONTS.small, color: COLORS.text, marginBottom: SPACING.xs },
  detailA: { ...FONTS.small, marginBottom: SPACING.xs },
  detailC: { ...FONTS.small, color: COLORS.textSecondary },
  correctText: { color: COLORS.success },
  incorrectText: { color: COLORS.danger },
  explainRow: { marginTop: SPACING.md },
  explainBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  explainText: { color: COLORS.primary, marginLeft: 6 },
  explainOutput: { marginTop: SPACING.sm, color: COLORS.textSecondary },
});
