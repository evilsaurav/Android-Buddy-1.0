import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { fetchLeaderboardWithBackend, LeaderboardData, LeaderboardUser, getBackendBaseUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type TabType = 'xp' | 'scores' | 'streaks';

export default function ArenaScreen({ navigation }: any) {
  const { profile, sessionMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('xp');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [inBattle, setInBattle] = useState(false);
  const [battleState, setBattleState] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadLeaderboard();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const loadLeaderboard = async () => {
    if (sessionMode !== 'authenticated') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchLeaderboardWithBackend();
      setLeaderboard(data);
    } catch (err) {
      console.log('Leaderboard fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const startMatchmaking = async () => {
    if (sessionMode !== 'authenticated') {
      Alert.alert('Login Required', 'You must be logged in to play multiplayer.');
      return;
    }
    const token = await AsyncStorage.getItem('@bcabuddy_access_token');
    const baseUrl = getBackendBaseUrl().replace('http', 'ws');
    const wsUrl = `${baseUrl}/api/multiplayer/ws/battle?token=${token}`;
    
    setInBattle(true);
    setBattleState({ status: 'connecting' });
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setBattleState({ status: 'finding_match' });
      ws.current?.send(JSON.stringify({ type: 'join_queue' }));
    };
    
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'matched') {
        setBattleState({ status: 'matched', opponent: data.opponent, game_id: data.game_id });
      } else if (data.type === 'game_start') {
        setBattleState(prev => ({ ...prev, status: 'starting', message: data.message }));
      } else if (data.type === 'question') {
        setBattleState(prev => ({ 
          ...prev, 
          status: 'playing', 
          question: data.question, 
          options: data.options, 
          qIndex: data.question_index,
          answered: false
        }));
      } else if (data.type === 'score_update' || data.type === 'question_result') {
        setBattleState(prev => ({ ...prev, scores: data.scores }));
      } else if (data.type === 'game_over') {
        setBattleState(prev => ({ ...prev, status: 'game_over', winner: data.winner, finalScores: data.final_scores }));
      }
    };
    
    ws.current.onerror = () => {
      Alert.alert('Connection Error', 'Could not connect to battle server.');
      exitBattle();
    };
  };

  const submitAnswer = (ans: string) => {
    if (!ws.current || battleState.answered) return;
    setBattleState(prev => ({ ...prev, answered: true, selectedAnswer: ans }));
    ws.current.send(JSON.stringify({
      type: 'answer',
      game_id: battleState.game_id,
      question_index: battleState.qIndex,
      answer: ans
    }));
  };

  const exitBattle = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setInBattle(false);
    setBattleState(null);
  };

  const renderLeaderboardItem = (user: LeaderboardUser, index: number) => {
    const isMe = user.username === profile?.username;
    let badgeColor = COLORS.textMuted;
    if (index === 0) badgeColor = '#FBBF24';
    if (index === 1) badgeColor = '#9CA3AF';
    if (index === 2) badgeColor = '#B45309';

    return (
      <View key={`${user.username}-${index}`} style={[styles.lbRow, isMe && styles.lbRowMe]}>
        <View style={styles.lbRankWrap}>
          <Text style={[styles.lbRank, index < 3 && { color: badgeColor, fontWeight: '900', fontSize: 18 }]}>#{index + 1}</Text>
        </View>
        <View style={styles.lbAvatar}>
          <Ionicons name="person-circle" size={36} color={COLORS.primary} />
        </View>
        <View style={styles.lbInfo}>
          <Text style={[styles.lbName, isMe && { color: COLORS.primary }]}>{user.display_name}</Text>
          <Text style={styles.lbUsername}>@{user.username}</Text>
        </View>
        <View style={styles.lbStat}>
          <Text style={styles.lbStatValue}>
            {activeTab === 'xp' ? `${user.total_xp} XP` : activeTab === 'scores' ? `${user.highest_exam_score}%` : `${user.current_streak} 🔥`}
          </Text>
        </View>
      </View>
    );
  };

  if (inBattle) {
    return (
      <SafeAreaView style={styles.battleContainer}>
        <TouchableOpacity style={styles.battleExit} onPress={exitBattle}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        {battleState?.status === 'connecting' || battleState?.status === 'finding_match' ? (
          <View style={styles.battleCenter}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.battleText}>Finding Opponent...</Text>
          </View>
        ) : battleState?.status === 'matched' || battleState?.status === 'starting' ? (
          <View style={styles.battleCenter}>
            <Ionicons name="flash" size={64} color="#FBBF24" />
            <Text style={styles.battleTitle}>VS {battleState.opponent}</Text>
            <Text style={styles.battleText}>{battleState.message || 'Get Ready!'}</Text>
          </View>
        ) : battleState?.status === 'playing' ? (
          <View style={styles.battlePlay}>
            <View style={styles.battleScoreBoard}>
              <Text style={styles.battleScore}>{profile?.username}: {battleState.scores?.[profile?.username || ''] || 0}</Text>
              <Text style={styles.battleScore}>{battleState.opponent}: {battleState.scores?.[battleState.opponent] || 0}</Text>
            </View>
            <Text style={styles.battleQuestion}>{battleState.question}</Text>
            <View style={styles.battleOptions}>
              {battleState.options.map((opt: string) => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.battleOptBtn, battleState.selectedAnswer === opt && styles.battleOptSelected]}
                  onPress={() => submitAnswer(opt)}
                  disabled={battleState.answered}
                >
                  <Text style={[styles.battleOptText, battleState.selectedAnswer === opt && { color: COLORS.primary }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : battleState?.status === 'game_over' ? (
          <View style={styles.battleCenter}>
            <Ionicons name="trophy" size={64} color="#FBBF24" />
            <Text style={styles.battleTitle}>{battleState.winner === profile?.username ? 'You Win!' : 'You Lose!'}</Text>
            <TouchableOpacity style={styles.playAgainBtn} onPress={exitBattle}>
              <Text style={styles.playAgainText}>Back to Arena</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  let listToRender: LeaderboardUser[] = [];
  if (leaderboard) {
    if (activeTab === 'xp') listToRender = leaderboard.top_xp;
    if (activeTab === 'scores') listToRender = leaderboard.top_scores;
    if (activeTab === 'streaks') listToRender = leaderboard.top_streaks;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Arena</Text>
        <Text style={styles.subtitle}>Compete with other BCA students</Text>
      </View>

      <TouchableOpacity style={styles.heroCard} activeOpacity={0.8} onPress={startMatchmaking}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>1v1 Quick Battle</Text>
          <Text style={styles.heroSub}>Challenge a random student to a fast-paced coding quiz!</Text>
        </View>
        <View style={styles.heroIconWrap}>
          <Ionicons name="game-controller" size={32} color={COLORS.white} />
        </View>
      </TouchableOpacity>

      <View style={styles.tabsWrapper}>
        <TouchableOpacity style={[styles.tab, activeTab === 'xp' && styles.tabActive]} onPress={() => setActiveTab('xp')}>
          <Text style={[styles.tabText, activeTab === 'xp' && styles.tabTextActive]}>Top XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'scores' && styles.tabActive]} onPress={() => setActiveTab('scores')}>
          <Text style={[styles.tabText, activeTab === 'scores' && styles.tabTextActive]}>Top Scores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'streaks' && styles.tabActive]} onPress={() => setActiveTab('streaks')}>
          <Text style={[styles.tabText, activeTab === 'streaks' && styles.tabTextActive]}>Streaks</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {sessionMode !== 'authenticated' ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Log in to view the Global Leaderboards.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : listToRender.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No rankings available yet.</Text>
          </View>
        ) : (
          listToRender.map((u, i) => renderLeaderboardItem(u, i))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title: { ...FONTS.h1 },
  subtitle: { ...FONTS.caption, marginTop: 4 },
  heroCard: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.md,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.md,
  },
  heroContent: { flex: 1 },
  heroTitle: { ...FONTS.h3, color: COLORS.white },
  heroSub: { ...FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  tabsWrapper: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginTop: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 4, ...SHADOWS.sm },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  lbRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, ...SHADOWS.sm },
  lbRowMe: { borderWidth: 1, borderColor: COLORS.primary },
  lbRankWrap: { width: 40, alignItems: 'center' },
  lbRank: { ...FONTS.bodyBold, fontSize: 16, color: COLORS.textSecondary },
  lbAvatar: { marginRight: SPACING.sm },
  lbInfo: { flex: 1 },
  lbName: { ...FONTS.bodyBold, fontSize: 15, color: COLORS.text },
  lbUsername: { ...FONTS.small, color: COLORS.textMuted },
  lbStat: { alignItems: 'flex-end' },
  lbStatValue: { ...FONTS.bodyBold, fontSize: 14, color: COLORS.secondary },
  emptyBox: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { ...FONTS.body, color: COLORS.textMuted, textAlign: 'center' },
  battleContainer: { flex: 1, backgroundColor: '#1E1B4B' },
  battleCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  battleTitle: { ...FONTS.h1, color: COLORS.white, marginVertical: SPACING.md },
  battleText: { ...FONTS.body, color: COLORS.white, textAlign: 'center' },
  battleExit: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  battlePlay: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
  battleScoreBoard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xxl, backgroundColor: 'rgba(0,0,0,0.3)', padding: SPACING.md, borderRadius: RADIUS.lg },
  battleScore: { ...FONTS.h3, color: '#FBBF24' },
  battleQuestion: { ...FONTS.h2, color: COLORS.white, textAlign: 'center', marginBottom: SPACING.xxl },
  battleOptions: { gap: SPACING.md },
  battleOptBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  battleOptSelected: { backgroundColor: COLORS.white },
  battleOptText: { ...FONTS.bodyBold, color: COLORS.white, textAlign: 'center' },
  playAgainBtn: { marginTop: SPACING.xl, backgroundColor: '#FBBF24', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full },
  playAgainText: { ...FONTS.bodyBold, color: '#1E1B4B' },
});
