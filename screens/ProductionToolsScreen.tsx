import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { SUBJECTS } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import {
  ApcHistoryItem,
  chatWithBackend,
  fetchApcHistoryWithBackend,
  fetchApcPerformanceReportWithBackend,
  fetchLatestApcPerformanceSummaryWithBackend,
  logApcWithBackend,
  resolveBackendSubjectCode,
  uploadApcOcrQuizWithBackend,
  uploadNotesOcrWithBackend,
} from '../lib/api';

interface Props {
  navigation: any;
}

const ADVANCED_TOOLS = [
  {
    label: 'Study Roadmap',
    key: 'Study Roadmap',
    prompt: 'Generate a realistic 15-day study roadmap with daily topics and revision checkpoints.',
  },
  {
    label: 'Cheat Mode',
    key: 'Cheat Mode',
    prompt: 'Create flashcard-style rapid revision notes with likely exam questions and memory hooks.',
  },
  {
    label: 'Code Architect',
    key: 'AI Code Architect',
    prompt: 'Explain one important program pattern with working code, complexity, and test cases.',
  },
  {
    label: 'Viva Mentor',
    key: 'AI Viva Mentor',
    prompt: 'Run a short mock viva and ask me 5 exam-style oral questions.',
  },
  {
    label: 'Exam Predictor',
    key: 'Exam Predictor',
    prompt: 'Predict high-probability exam topics and questions with priority order.',
  },
];

function stringifyResult(data: unknown): string {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data || '');
  }
}

export default function ProductionToolsScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const semesterOptions = Array.from(new Set(SUBJECTS.map((s) => s.semester))).sort((a, b) => a - b);
  const [selectedSemester, setSelectedSemester] = useState<number>(semesterOptions[0] || 1);
  const semesterSubjects = SUBJECTS.filter((subject) => subject.semester === selectedSemester);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(semesterSubjects[0]?.name || SUBJECTS[0]?.name || '');
  const selectedSubject = semesterSubjects.find((subject) => subject.name === selectedSubjectName) || semesterSubjects[0] || SUBJECTS[0];
  const backendSubject = resolveBackendSubjectCode(selectedSubject?.name || selectedSubjectName, selectedSemester);

  const [activeTool, setActiveTool] = useState(ADVANCED_TOOLS[0].key);
  const [toolPrompt, setToolPrompt] = useState(ADVANCED_TOOLS[0].prompt);
  const [busyTool, setBusyTool] = useState<null | 'chat' | 'ocr' | 'apcOcr' | 'summary' | 'report' | 'history' | 'log'>(null);
  const [resultText, setResultText] = useState('');
  const [apcHistory, setApcHistory] = useState<ApcHistoryItem[]>([]);

  const ensureAuth = () => {
    if (sessionMode !== 'authenticated') {
      Alert.alert('Login Required', 'Please login to use live backend tools.');
      return false;
    }
    return true;
  };

  const runAdvancedTool = async () => {
    if (!ensureAuth()) return;
    if (!toolPrompt.trim()) {
      Alert.alert('Prompt required', 'Enter what you want this tool to do.');
      return;
    }

    try {
      setBusyTool('chat');
      const reply = await chatWithBackend(toolPrompt.trim(), {
        activeTool,
        selectedSubject: backendSubject,
        selectedSemester: `Sem ${selectedSemester}`,
        responseMode: 'pro',
        mode: 'auto',
      });
      setResultText(reply.text);
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Tool request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission required', 'Please allow gallery access to upload files.');
      return null;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (picked.canceled || !picked.assets?.length) return null;
    return picked.assets[0].uri;
  };

  const runNotesOcr = async () => {
    if (!ensureAuth()) return;
    const uri = await pickImage();
    if (!uri) return;

    try {
      setBusyTool('ocr');
      const data = await uploadNotesOcrWithBackend(uri);
      setResultText(stringifyResult(data));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Notes OCR request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const runApcOcrQuiz = async () => {
    if (!ensureAuth()) return;
    const uri = await pickImage();
    if (!uri) return;

    try {
      setBusyTool('apcOcr');
      const data = await uploadApcOcrQuizWithBackend(uri, `Android APC quiz for ${backendSubject}`);
      setResultText(stringifyResult(data));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'APC OCR quiz failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const loadSummary = async () => {
    if (!ensureAuth()) return;
    try {
      setBusyTool('summary');
      const data = await fetchLatestApcPerformanceSummaryWithBackend();
      setResultText(stringifyResult(data));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Summary request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const runReport = async () => {
    if (!ensureAuth()) return;
    try {
      setBusyTool('report');
      const data = await fetchApcPerformanceReportWithBackend();
      setResultText(stringifyResult(data));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Report request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const loadHistory = async () => {
    if (!ensureAuth()) return;
    try {
      setBusyTool('history');
      const rows = await fetchApcHistoryWithBackend();
      setApcHistory(rows);
      setResultText(rows.length ? stringifyResult(rows.slice(0, 5)) : 'No APC history found yet.');
    } catch (error) {
      setResultText(String((error as Error)?.message || 'History request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const saveResultToApc = async () => {
    if (!ensureAuth()) return;
    if (!resultText.trim()) {
      Alert.alert('No result', 'Run a tool first, then save its result to APC history.');
      return;
    }

    try {
      setBusyTool('log');
      await logApcWithBackend(activeTool, backendSubject, resultText.slice(0, 2000), `Sem ${selectedSemester}`);
      const rows = await fetchApcHistoryWithBackend();
      setApcHistory(rows);
      Alert.alert('Saved', 'Latest result saved to APC history.');
    } catch (error) {
      Alert.alert('Save failed', String((error as Error)?.message || 'Could not save APC log.'));
    } finally {
      setBusyTool(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backend Tools</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>Advanced AI Tools</Text>
          <Text style={styles.sub}>Uses /chat with active_tool, subject, semester, and pro response mode.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {ADVANCED_TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.key}
                style={[styles.chip, activeTool === tool.key && styles.chipActive]}
                onPress={() => {
                  setActiveTool(tool.key);
                  setToolPrompt(tool.prompt);
                }}
              >
                <Text style={[styles.chipText, activeTool === tool.key && styles.chipTextActive]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Semester</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {semesterOptions.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[styles.smallChip, selectedSemester === sem && styles.smallChipActive]}
                  onPress={() => {
                    setSelectedSemester(sem);
                    const first = SUBJECTS.find((subject) => subject.semester === sem);
                    if (first) setSelectedSubjectName(first.name);
                  }}
                >
                  <Text style={[styles.smallChipText, selectedSemester === sem && styles.smallChipTextActive]}>Sem {sem}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {semesterSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.smallChip, selectedSubjectName === subject.name && styles.smallChipActive]}
                  onPress={() => setSelectedSubjectName(subject.name)}
                >
                  <Text style={[styles.smallChipText, selectedSubjectName === subject.name && styles.smallChipTextActive]}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={[styles.input, styles.payloadInput]}
            value={toolPrompt}
            onChangeText={setToolPrompt}
            placeholder="Ask this tool what to generate..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={runAdvancedTool}>
              <Ionicons name="rocket-outline" size={16} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{busyTool === 'chat' ? 'Running...' : 'Run Tool'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={saveResultToApc}>
              <Ionicons name="save-outline" size={16} color={COLORS.primary} />
              <Text style={styles.outlineBtnText}>{busyTool === 'log' ? 'Saving...' : 'Save Log'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>APC Analytics</Text>
          <Text style={styles.sub}>Exact backend routes: /apc/performance-report, /apc/performance-summary/latest, /apc/history.</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.toolBtn} onPress={runReport}>
              <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
              <Text style={styles.toolText}>{busyTool === 'report' ? 'Generating...' : 'Run Report'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={loadSummary}>
              <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.toolText}>{busyTool === 'summary' ? 'Loading...' : 'Latest Summary'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={loadHistory}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.toolText}>{busyTool === 'history' ? 'Loading...' : 'APC History'}</Text>
            </TouchableOpacity>
          </View>
          {apcHistory.length > 0 ? (
            <View style={styles.historyBox}>
              {apcHistory.slice(0, 3).map((item, idx) => (
                <View key={`${item.id || idx}-${item.tool_name || item.tool || 'apc'}`} style={styles.historyRow}>
                  <Text style={styles.historyTitle}>{item.tool_name || item.tool || 'APC Tool'}</Text>
                  <Text style={styles.historyMeta}>{item.subject || 'General'}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>OCR Workflows</Text>
          <Text style={styles.sub}>Exact backend routes: /upload-notes-ocr and /apc/ocr-quiz.</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.toolBtn} onPress={runNotesOcr}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.toolText}>{busyTool === 'ocr' ? 'Uploading...' : 'Notes OCR'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={runApcOcrQuiz}>
              <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
              <Text style={styles.toolText}>{busyTool === 'apcOcr' ? 'Uploading...' : 'APC OCR Quiz'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>Backend Response</Text>
          <Text style={styles.sub}>Latest response preview for quick verification.</Text>
          <ScrollView style={styles.resultBox} nestedScrollEnabled>
            <Text style={styles.resultText}>{resultText || 'No response yet. Run a tool action first.'}</Text>
          </ScrollView>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: { ...FONTS.h3, fontSize: 18 },
  content: { paddingHorizontal: SPACING.xl },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: { ...FONTS.bodyBold, color: COLORS.primary },
  sub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 3, marginBottom: SPACING.md },
  chipRow: { gap: SPACING.sm, paddingRight: SPACING.md },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '700' },
  chipTextActive: { color: COLORS.white },
  selectorBlock: { marginTop: SPACING.md },
  selectorLabel: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  smallChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '10',
  },
  smallChipActive: { backgroundColor: COLORS.primary },
  smallChipText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  smallChipTextActive: { color: COLORS.white },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...FONTS.body,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  payloadInput: { minHeight: 100 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
  },
  primaryBtnText: { ...FONTS.bodyBold, color: COLORS.white, fontSize: 13 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '35',
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
  },
  outlineBtnText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  grid: { gap: SPACING.sm },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  toolText: { ...FONTS.bodyBold, color: COLORS.primary, fontSize: 13 },
  historyBox: { marginTop: SPACING.md, gap: SPACING.xs },
  historyRow: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  historyTitle: { ...FONTS.bodyBold, color: COLORS.text, fontSize: 13 },
  historyMeta: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  resultBox: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  resultText: {
    ...FONTS.small,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
});
