import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { useAuth } from '../context/AuthContext';
import {
  callApcEndpointWithBackend,
  fetchApcPerformanceReportWithBackend,
  fetchLatestApcPerformanceSummaryWithBackend,
  logApcWithBackend,
  solveAssignmentWithBackend,
  uploadApcOcrQuizWithBackend,
  uploadGenericFileWithBackend,
  uploadNotesOcrWithBackend,
} from '../lib/api';

interface Props {
  navigation: any;
}

const APC_PRESETS = [
  { label: 'Study Coach', action: 'study-coach', payload: { prompt: 'Create a 3-day revision plan for DBMS.' } },
  { label: 'Doubt Solver', action: 'doubt-solver', payload: { prompt: 'Explain deadlock prevention in simple points.' } },
  { label: 'Daily Plan', action: 'daily-plan', payload: { hours: 3, subject: 'MCS-023' } },
];

export default function ProductionToolsScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [apcAction, setApcAction] = useState('study-coach');
  const [apcPayload, setApcPayload] = useState('{"prompt":"Create a focused plan for operating systems."}');
  const [busyTool, setBusyTool] = useState<null | 'apc' | 'ocr' | 'assignment' | 'upload' | 'summary' | 'report'>(null);
  const [resultText, setResultText] = useState('');

  const ensureAuth = () => {
    if (sessionMode !== 'authenticated') {
      Alert.alert('Login Required', 'Please login to use production backend tools.');
      return false;
    }
    return true;
  };

  const runApc = async () => {
    if (!ensureAuth()) return;

    try {
      setBusyTool('apc');
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(apcPayload);
      } catch {
        Alert.alert('Invalid JSON', 'APC payload must be valid JSON.');
        return;
      }

      const data = await callApcEndpointWithBackend(apcAction, payload);
      setResultText(JSON.stringify(data, null, 2));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'APC request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const pickAndUpload = async (type: 'ocr' | 'assignment' | 'upload') => {
    if (!ensureAuth()) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow gallery access to upload files.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const uri = picked.assets[0].uri;
      setBusyTool(type);

      const data =
        type === 'ocr'
          ? await uploadApcOcrQuizWithBackend(uri, 'Generated from Android Buddy production tools')
          : type === 'assignment'
            ? await solveAssignmentWithBackend(uri)
            : await uploadGenericFileWithBackend(uri);

      setResultText(JSON.stringify(data, null, 2));
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Upload request failed'));
    } finally {
      setBusyTool(null);
    }
  };

  const loadSummary = async () => {
    if (!ensureAuth()) return;
    try {
      setBusyTool('summary');
      const data = await fetchLatestApcPerformanceSummaryWithBackend();
      setResultText(JSON.stringify(data, null, 2));
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
      setResultText(JSON.stringify(data, null, 2));
      const markdown = String(data?.report_markdown || '');
      if (markdown.trim()) {
        await logApcWithBackend('performance_report', 'general', markdown.slice(0, 2000));
      }
    } catch (error) {
      setResultText(String((error as Error)?.message || 'Report request failed'));
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
        <Text style={styles.headerTitle}>Phase-2 Production Pack</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>APC Endpoints</Text>
          <Text style={styles.sub}>Run any /apc/* endpoint by action name and JSON payload.</Text>

          <TextInput
            style={styles.input}
            value={apcAction}
            onChangeText={setApcAction}
            placeholder="action e.g. study-coach"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.payloadInput]}
            value={apcPayload}
            onChangeText={setApcPayload}
            placeholder='{"prompt":"..."}'
            placeholderTextColor={COLORS.textMuted}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
          />

          <View style={styles.presetRow}>
            {APC_PRESETS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.presetBtn}
                onPress={() => {
                  setApcAction(item.action);
                  setApcPayload(JSON.stringify(item.payload));
                }}
              >
                <Text style={styles.presetText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={runApc}>
            <Ionicons name="rocket-outline" size={16} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>{busyTool === 'apc' ? 'Running...' : 'Run APC'}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={loadSummary}>
              <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>{busyTool === 'summary' ? 'Loading...' : 'Load Summary'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={runReport}>
              <Ionicons name="bar-chart-outline" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>{busyTool === 'report' ? 'Generating...' : 'Run Report'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.card}>
          <Text style={styles.cardTitle}>Upload Workflows</Text>
          <Text style={styles.sub}>Wire OCR, assignment solving, and generic upload endpoints.</Text>

          <View style={styles.uploadGrid}>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickAndUpload('ocr')}>
              <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
              <Text style={styles.uploadText}>{busyTool === 'ocr' ? 'Uploading...' : 'APC OCR Quiz'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickAndUpload('assignment')}>
              <Ionicons name="school-outline" size={18} color={COLORS.primary} />
              <Text style={styles.uploadText}>{busyTool === 'assignment' ? 'Uploading...' : 'Solve Assignment'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickAndUpload('upload')}>
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
              <Text style={styles.uploadText}>{busyTool === 'upload' ? 'Uploading...' : 'Generic Upload'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={async () => {
              if (!ensureAuth()) return;
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permission.status !== 'granted') {
                Alert.alert('Permission required', 'Please allow gallery access to upload files.');
                return;
              }
              const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
              if (picked.canceled || !picked.assets?.length) return;
              try {
                setBusyTool('upload');
                const data = await uploadNotesOcrWithBackend(picked.assets[0].uri);
                setResultText(JSON.stringify(data, null, 2));
              } catch (error) {
                setResultText(String((error as Error)?.message || 'Notes OCR request failed'));
              } finally {
                setBusyTool(null);
              }
            }}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.uploadText}>Notes OCR Summary</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.card}>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  headerTitle: { ...FONTS.h3, fontSize: 17 },
  content: { paddingHorizontal: SPACING.xl },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: { ...FONTS.bodyBold, color: COLORS.primary },
  sub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 3, marginBottom: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  payloadInput: {
    minHeight: 110,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  presetBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '14',
  },
  presetText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
  },
  primaryBtnText: { ...FONTS.bodyBold, color: COLORS.white, fontSize: 13 },
  secondaryRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryBtn: {
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
  secondaryBtnText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  uploadGrid: {
    gap: SPACING.sm,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  uploadText: { ...FONTS.bodyBold, color: COLORS.primary, fontSize: 13 },
  resultBox: {
    maxHeight: 220,
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
