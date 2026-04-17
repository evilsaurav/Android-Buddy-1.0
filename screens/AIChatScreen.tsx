import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import {
  ApiError,
  chatWithBackend,
  checkBackendHealth,
  clearAllSessionsWithBackend,
  deleteSessionWithBackend,
  getHistoryWithBackend,
  getSessionsWithBackend,
  renameSessionWithBackend,
  ResponseMode,
  SessionSummary,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface Props {
  navigation: any;
}

const QUICK_PROMPTS = [
  '📚 Explain Data Structures',
  '📅 Study plan for this week',
  '🧠 Tips for exam prep',
  '📝 Summarize DBMS concepts',
];

const AI_RESPONSES: Record<string, string> = {
  default: "I am BCABuddy AI. I can help with study plans, concepts, exam prep, and revision strategy. What should we start with?",
  'data structures': "Data Structures roadmap:\n\n1. Arrays and Strings\n2. Linked Lists\n3. Stacks and Queues\n4. Trees and Graphs\n5. Dynamic Programming\n\nTip: Focus on time and space complexity for every topic.",
  'study plan': "Weekly plan example:\n\nMon: Data Structures (2h)\nTue: DBMS (2h)\nWed: Operating Systems (2.5h)\nThu: Networks (2h)\nFri: Mathematics backlog (2h)\nSat: Revision and mock test (3h)\nSun: Light review (1h)\n\nTotal: around 14-15 hours.",
  'exam': "Exam prep checklist:\n\n- Start revision 2 weeks early\n- Solve last 5 years papers\n- Keep one-page formula notes\n- Study in focused 45-minute blocks\n- Sleep properly before exam day\n- Revise high-weightage topics first",
  'dbms': "DBMS quick summary:\n\n- ER model and relationships\n- Relational model and keys\n- SQL joins, group by, subqueries\n- Normalization (1NF to BCNF)\n- Transactions and ACID\n- Concurrency control\n\nPractice SQL queries daily for speed.",
};

export default function AIChatScreen({ navigation }: Props) {
  const { sessionMode } = useAuth();
  const [effectiveResponseMode, setEffectiveResponseMode] = useState<ResponseMode>('thinking');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hey! I am BCABuddy AI, your study assistant. Ask me about BCA subjects, study plans, or exam prep.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>(undefined);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const animateAssistantMessage = async (fullText: string) => {
    const text = String(fullText || '');
    const msgId = `${Date.now()}-ai`;

    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      },
    ]);

    if (!text.length) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, text: 'No response available.', isTyping: false } : m))
      );
      return;
    }

    const step = Math.max(1, Math.min(4, Math.floor(text.length / 140)));
    let i = 0;

    while (i < text.length) {
      if (!isMountedRef.current) return;
      i = Math.min(text.length, i + step);
      const chunk = text.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, text: chunk, isTyping: i < text.length } : m))
      );
      await sleep(16);
    }
  };

  const loadChatPreferences = async () => {
    try {
      const raw = await AsyncStorage.getItem('@bcabuddy_preferences');
      if (!raw) {
        setEffectiveResponseMode('thinking');
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const frenzy = Boolean(parsed.frenzyModeOverride);
      const modeRaw = String(parsed.responseMode || 'thinking');
      const preferredMode: ResponseMode =
        modeRaw === 'fast' || modeRaw === 'thinking' || modeRaw === 'pro' ? modeRaw : 'thinking';

      setEffectiveResponseMode(frenzy ? 'pro' : preferredMode);
    } catch {
      setEffectiveResponseMode('thinking');
    }
  };

  const loadSessions = async () => {
    if (sessionMode !== 'authenticated') {
      setSessions([]);
      setActiveSessionId(undefined);
      return;
    }

    try {
      const all = await getSessionsWithBackend();
      setSessions(all);
      if (activeSessionId && !all.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(all[0]?.id);
      } else if (!activeSessionId && all.length > 0) {
        setActiveSessionId(all[0].id);
      }
    } catch {}
  };

  const loadHistory = async (sessionId: number) => {
    if (sessionMode !== 'authenticated') return;

    try {
      setIsLoadingHistory(true);
      const rows = await getHistoryWithBackend(sessionId);
      const transformed: Message[] = [];

      rows.forEach((row, idx) => {
        const baseTs = row.timestamp ? new Date(row.timestamp) : new Date();
        if (row.user_message) {
          transformed.push({
            id: `h-u-${row.id || idx}`,
            text: row.user_message,
            isUser: true,
            timestamp: baseTs,
          });
        }
        if (row.ai_response) {
          transformed.push({
            id: `h-a-${row.id || idx}`,
            text: row.ai_response,
            isUser: false,
            timestamp: baseTs,
          });
        }
      });

      if (transformed.length > 0) {
        setMessages(transformed);
      }
    } catch {
      // Keep current messages if history load fails.
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    const runHealthCheck = async () => {
      const status = await checkBackendHealth();
      setBackendOnline(status === 'online');
    };

    runHealthCheck();
  }, []);

  useEffect(() => {
    loadChatPreferences();
    const unsubscribe = navigation.addListener('focus', loadChatPreferences);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadSessions();
  }, [sessionMode]);

  useEffect(() => {
    if (activeSessionId) {
      loadHistory(activeSessionId);
    }
  }, [activeSessionId]);

  const startNewChat = () => {
    setActiveSessionId(undefined);
    setMessages([
      {
        id: Date.now().toString(),
        text: "Hey there! 👋 I'm BCABuddy AI, your personal study assistant. Ask me anything about your BCA subjects, study plans, or exam prep!",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const deleteSession = (sessionId: number) => {
    Alert.alert('Delete session?', 'This will permanently remove this chat session from backend history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSessionWithBackend(sessionId);
            if (activeSessionId === sessionId) {
              startNewChat();
            }
            await loadSessions();
          } catch {
            Alert.alert('Failed', 'Unable to delete this session right now.');
          }
        },
      },
    ]);
  };

  const clearSessions = () => {
    Alert.alert('Clear all sessions?', 'All saved AI chat sessions will be deleted from backend.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllSessionsWithBackend();
            startNewChat();
            setSessions([]);
          } catch {
            Alert.alert('Failed', 'Unable to clear sessions right now.');
          }
        },
      },
    ]);
  };

  const openRenameModal = (session: SessionSummary) => {
    setRenameSessionId(session.id);
    setRenameValue(session.title || `Session ${session.id}`);
    setRenameModalVisible(true);
  };

  const applyRename = async () => {
    if (!renameSessionId) return;
    const title = renameValue.trim();
    if (!title) {
      Alert.alert('Invalid title', 'Please enter a session title.');
      return;
    }

    try {
      await renameSessionWithBackend(renameSessionId, title);
      setRenameModalVisible(false);
      setRenameSessionId(null);
      setRenameValue('');
      await loadSessions();
    } catch {
      Alert.alert('Rename failed', 'Unable to rename this session right now.');
    }
  };

  const getOfflineFallbackResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    let response = AI_RESPONSES.default;
    if (lowerText.includes('data structure')) response = AI_RESPONSES['data structures'];
    else if (lowerText.includes('study plan') || lowerText.includes('week')) response = AI_RESPONSES['study plan'];
    else if (lowerText.includes('exam') || lowerText.includes('tip')) response = AI_RESPONSES['exam'];
    else if (lowerText.includes('dbms') || lowerText.includes('database') || lowerText.includes('summarize')) response = AI_RESPONSES['dbms'];
    return response;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const backendReply = await chatWithBackend(text.trim(), {
        sessionId: activeSessionId,
        responseMode: effectiveResponseMode,
      });
      await animateAssistantMessage(backendReply.text);
      if (backendReply.sessionId) {
        setActiveSessionId(backendReply.sessionId);
      }
      loadSessions();
      setBackendOnline(true);
    } catch (err) {
      const apiErr = err as ApiError;
      const fallbackText = getOfflineFallbackResponse(text);
      const advisory = apiErr?.code === 'NO_AUTH_TOKEN'
        ? '\n\n[Backend connected, but auth token missing. Login token required for /chat.]'
        : '\n\n[Using offline mode response due to backend error.]';

      await animateAssistantMessage(`${fallbackText}${advisory}`);
      setBackendOnline(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(50).duration(300)}
      style={[styles.msgRow, item.isUser ? styles.msgRowUser : styles.msgRowAI]}
    >
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
        </View>
      )}
      <View style={[styles.msgBubble, item.isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
        <Text style={[styles.msgText, item.isUser && { color: COLORS.white }]}>{item.text}</Text>
        {!item.isUser && item.isTyping ? <Text style={styles.typingCursor}>▋</Text> : null}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>BCABuddy AI</Text>
            <Text style={[styles.headerStatus, { color: backendOnline ? COLORS.success : COLORS.warning }]}>
              ● {backendOnline ? 'Azure Backend Online' : 'Offline Fallback Mode'}
            </Text>
            <Text style={styles.headerModeText}>Mode: {effectiveResponseMode.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {sessionMode === 'authenticated' ? (
        <View style={styles.sessionsWrap}>
          <View style={styles.sessionsHeader}>
            <Text style={styles.sessionsTitle}>Sessions</Text>
            <View style={styles.sessionsActions}>
              {sessions.length > 0 ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearSessions}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
                <Ionicons name="add" size={14} color={COLORS.primary} />
                <Text style={styles.newChatText}>New</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessionsScroll}>
            {sessions.map((s) => (
              <View
                key={s.id}
                style={[styles.sessionChip, activeSessionId === s.id && styles.sessionChipActive]}
              >
                <TouchableOpacity onPress={() => setActiveSessionId(s.id)} style={styles.sessionChipMain}>
                <Text
                  numberOfLines={1}
                  style={[styles.sessionChipText, activeSessionId === s.id && styles.sessionChipTextActive]}
                >
                  {s.title || `Session ${s.id}`}
                </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sessionEditBtn} onPress={() => openRenameModal(s)}>
                  <Ionicons name="pencil" size={11} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sessionDeleteBtn} onPress={() => deleteSession(s.id)}>
                  <Ionicons name="close" size={12} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Session</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Enter session title"
              placeholderTextColor={COLORS.textMuted}
              style={styles.renameInput}
              maxLength={60}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity style={styles.renameBtnCancel} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.renameBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renameBtnSave} onPress={applyRename}>
                <Text style={styles.renameBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isLoadingHistory ? (
            <Text style={styles.loadingHistoryText}>Loading session history...</Text>
          ) : messages.length === 1 ? (
            <View style={styles.promptsSection}>
              <Text style={styles.promptsTitle}>Try asking:</Text>
              <View style={styles.promptsGrid}>
                {QUICK_PROMPTS.map((prompt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.promptChip}
                    onPress={() => sendMessage(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask BCABuddy anything..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.sm },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  headerTitle: { ...FONTS.bodyBold },
  headerStatus: { ...FONTS.small, color: COLORS.success, fontSize: 10 },
  headerModeText: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' },
  moreBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sessionsWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  sessionsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sessionsTitle: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  sessionsScroll: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.xs },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  sessionChipActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '50',
  },
  sessionChipMain: {
    paddingVertical: 3,
    maxWidth: 150,
  },
  sessionChipText: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 11 },
  sessionChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  sessionDeleteBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionEditBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  newChatText: { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  clearBtnText: { ...FONTS.small, color: COLORS.danger, fontWeight: '700' },
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  renameCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  renameTitle: {
    ...FONTS.bodyBold,
    marginBottom: SPACING.md,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...FONTS.body,
    color: COLORS.text,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  renameBtnCancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  renameBtnCancelText: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '700' },
  renameBtnSave: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  renameBtnSaveText: { ...FONTS.small, color: COLORS.white, fontWeight: '700' },
  messagesList: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  msgRow: { marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  msgBubble: { maxWidth: '78%', borderRadius: RADIUS.xl, padding: SPACING.lg },
  msgBubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleAI: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, ...SHADOWS.sm },
  msgText: { ...FONTS.body, lineHeight: 22 },
  typingCursor: { ...FONTS.bodyBold, color: COLORS.primary, marginTop: 2 },
  promptsSection: { paddingTop: SPACING.xl },
  loadingHistoryText: { ...FONTS.small, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md },
  promptsTitle: { ...FONTS.caption, marginBottom: SPACING.md },
  promptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  promptChip: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  promptText: { ...FONTS.caption, fontWeight: '500', color: COLORS.text },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.md,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...FONTS.body, maxHeight: 100, marginRight: SPACING.sm,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});
