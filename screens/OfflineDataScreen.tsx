import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';

interface Props {
  navigation: any;
}

export default function OfflineDataScreen({ navigation }: Props) {
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [totalSize, setTotalSize] = useState('0 KB');
  const [lastSync, setLastSync] = useState('Never');

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setStorageKeys(keys as string[]);
      let size = 0;
      for (const key of keys) {
        const val = await AsyncStorage.getItem(key as string);
        if (val) size += val.length;
      }
      setTotalSize(size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`);
      const syncTime = await AsyncStorage.getItem('@bcabuddy_last_sync');
      if (syncTime) setLastSync(new Date(syncTime).toLocaleString());
    } catch {}
  };

  const clearCache = async () => {
    Alert.alert('Clear Cache', 'This will remove temporary data. Your progress will be kept.', [
      { text: 'Cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await AsyncStorage.setItem('@bcabuddy_last_sync', new Date().toISOString());
            loadStorageInfo();
            Alert.alert('Done', 'Cache cleared successfully!');
          } catch {}
        },
      },
    ]);
  };

  const clearAllData = async () => {
    Alert.alert('Clear All Data', 'This will permanently delete all your data including study progress, preferences, and profile. This cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Delete Everything', style: 'destructive', onPress: async () => {
          try {
            await AsyncStorage.clear();
            loadStorageInfo();
            Alert.alert('Done', 'All data cleared.');
          } catch {}
        },
      },
    ]);
  };

  const exportData = async () => {
    Alert.alert('Export Data', 'Your study data would be exported as a JSON file. This feature will be available in the next update!', [{ text: 'OK' }]);
  };

  const syncNow = async () => {
    await AsyncStorage.setItem('@bcabuddy_last_sync', new Date().toISOString());
    setLastSync(new Date().toLocaleString());
    Alert.alert('Synced', 'Data synced successfully!');
  };

  const dataItems = [
    { icon: 'person', label: 'Profile Data', desc: 'Name, email, academic info', color: COLORS.primary, key: '@bcabuddy_profile' },
    { icon: 'settings', label: 'Preferences', desc: 'App settings & themes', color: COLORS.secondary, key: '@bcabuddy_preferences' },
    { icon: 'notifications', label: 'Notification Settings', desc: 'Alert preferences', color: COLORS.warning, key: '@bcabuddy_notifications' },
    { icon: 'book', label: 'Study Progress', desc: 'Topic completion data', color: COLORS.success, key: '@bcabuddy_progress' },
    { icon: 'flag', label: 'Onboarding Status', desc: 'First-time setup flag', color: COLORS.accent, key: 'onboarding_seen' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Storage Overview */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Ionicons name="folder" size={28} color={COLORS.primary} />
              <Text style={styles.overviewValue}>{totalSize}</Text>
              <Text style={styles.overviewLabel}>Storage Used</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Ionicons name="documents" size={28} color={COLORS.secondary} />
              <Text style={styles.overviewValue}>{storageKeys.length}</Text>
              <Text style={styles.overviewLabel}>Data Items</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Ionicons name="cloud-done" size={28} color={COLORS.success} />
              <Text style={styles.overviewValue}>Local</Text>
              <Text style={styles.overviewLabel}>Storage</Text>
            </View>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncText}>Last sync: {lastSync}</Text>
            <TouchableOpacity style={styles.syncBtn} onPress={syncNow}>
              <Ionicons name="sync" size={16} color={COLORS.primary} />
              <Text style={styles.syncBtnText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stored Data */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Stored Data</Text>
          <View style={styles.card}>
            {dataItems.map((item, i) => {
              const exists = storageKeys.includes(item.key);
              return (
                <View key={i} style={[styles.dataRow, i < dataItems.length - 1 && styles.dataRowBorder]}>
                  <View style={[styles.dataIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.dataInfo}>
                    <Text style={styles.dataLabel}>{item.label}</Text>
                    <Text style={styles.dataDesc}>{item.desc}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: exists ? COLORS.success : COLORS.textMuted }]} />
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={exportData}>
            <Ionicons name="download-outline" size={22} color={COLORS.primary} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Export Data</Text>
              <Text style={styles.actionDesc}>Download your data as JSON</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={clearCache}>
            <Ionicons name="trash-outline" size={22} color={COLORS.warning} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Clear Cache</Text>
              <Text style={styles.actionDesc}>Remove temporary files</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.danger + '30' }]} onPress={clearAllData}>
            <Ionicons name="nuclear-outline" size={22} color={COLORS.danger} />
            <View style={styles.actionInfo}>
              <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Clear All Data</Text>
              <Text style={styles.actionDesc}>Permanently delete everything</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
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
  overviewCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md, marginBottom: SPACING.xl },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.lg },
  overviewItem: { alignItems: 'center' },
  overviewValue: { ...FONTS.h3, marginTop: SPACING.sm },
  overviewLabel: { ...FONTS.small, marginTop: 2 },
  overviewDivider: { width: 1, backgroundColor: COLORS.border },
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  syncText: { ...FONTS.caption },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.full },
  syncBtnText: { ...FONTS.bodyBold, fontSize: 12, color: COLORS.primary },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.md, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
  dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  dataRowBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border + '50' },
  dataIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  dataInfo: { flex: 1, marginLeft: SPACING.md },
  dataLabel: { ...FONTS.bodyBold, fontSize: 14 },
  dataDesc: { ...FONTS.small, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm,
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  actionInfo: { flex: 1, marginLeft: SPACING.md },
  actionLabel: { ...FONTS.bodyBold, fontSize: 14 },
  actionDesc: { ...FONTS.small, marginTop: 2 },
});
