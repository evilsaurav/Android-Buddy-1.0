import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { useAuth } from '../context/AuthContext';
import { updateExamDateWithBackend, updateProfileWithBackend, uploadProfilePictureWithBackend } from '../lib/api';

interface Props {
  navigation: any;
}

interface ProfileData {
  name: string;
  email: string;
  university: string;
  semester: string;
  examDate: string;
  avatarUri: string;
  section: string;
  phone: string;
  rollNumber: string;
}

const STORAGE_KEY = '@bcabuddy_profile';

export default function EditProfileScreen({ navigation }: Props) {
  const { sessionMode, profile: authProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: 'BCA Student',
    email: 'student@university.edu',
    university: 'State University',
    semester: '3',
    examDate: '',
    avatarUri: '',
    section: 'A',
    phone: '',
    rollNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (sessionMode === 'authenticated' && authProfile) {
      setProfile((prev) => ({
        ...prev,
        name: String(authProfile.display_name || authProfile.username || prev.name),
        email: String(authProfile.email || prev.email),
        semester: String(authProfile.semester || prev.semester),
        phone: String(authProfile.mobile_number || prev.phone),
        examDate: String(authProfile.exam_date || prev.examDate),
        avatarUri: String(authProfile.profile_picture_url || prev.avatarUri),
      }));
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {}
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      if (sessionMode === 'authenticated') {
        await updateProfileWithBackend({
          display_name: profile.name,
          mobile_number: profile.phone,
          email: profile.email,
        });

        if (profile.examDate.trim()) {
          await updateExamDateWithBackend(profile.examDate.trim());
        }

        await refreshProfile();
      }

      setHasChanges(false);
      setTimeout(() => {
        setSaving(false);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }, 600);
    } catch {
      setSaving(false);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const pickAndUploadAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow gallery access to choose a profile photo.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (picked.canceled || !picked.assets?.length) return;
      const localUri = picked.assets[0].uri;

      setProfile((prev) => ({ ...prev, avatarUri: localUri }));
      setHasChanges(true);

      if (sessionMode === 'authenticated') {
        setUploadingAvatar(true);
        try {
          const uploadedUrl = await uploadProfilePictureWithBackend(localUri);
          if (uploadedUrl) {
            setProfile((prev) => ({ ...prev, avatarUri: uploadedUrl }));
          }
          await refreshProfile();
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch {
      setUploadingAvatar(false);
      Alert.alert('Upload failed', 'Unable to update profile photo right now.');
    }
  };

  const renderField = (label: string, field: keyof ProfileData, icon: string, keyboard: any = 'default', placeholder: string = '') => (
    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={profile[field]}
          onChangeText={(v) => updateField(field, v)}
          placeholder={placeholder || label}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboard}
          returnKeyType="next"
          autoCapitalize={field === 'email' ? 'none' : 'words'}
        />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={saveProfile}
          disabled={!hasChanges || saving}
          style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
        >
          <Text style={[styles.saveBtnText, (!hasChanges || saving) && styles.saveBtnTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.avatarSection}>
            <View style={styles.avatar}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={44} color={COLORS.white} />
              )}
            </View>
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickAndUploadAvatar}>
              <Ionicons name="camera" size={16} color={COLORS.primary} />
              <Text style={styles.changePhotoText}>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</Text>
              {uploadingAvatar ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
            </TouchableOpacity>
          </Animated.View>

          {/* Fields */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Personal Information</Text>
            {renderField('Full Name', 'name', 'person-outline', 'default', 'Enter your full name')}
            {renderField('Email Address', 'email', 'mail-outline', 'email-address', 'your@email.com')}
            {renderField('Phone Number', 'phone', 'call-outline', 'phone-pad', '+91 XXXXX XXXXX')}
            {renderField('Roll Number', 'rollNumber', 'card-outline', 'default', 'e.g. BCA/2023/001')}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Academic Details</Text>
            {renderField('University', 'university', 'school-outline', 'default', 'University name')}
            {renderField('Current Semester', 'semester', 'layers-outline', 'numeric', '1-6')}
            {renderField('Exam Date (YYYY-MM-DD)', 'examDate', 'calendar-outline', 'default', '2026-05-20')}
            {renderField('Section', 'section', 'people-outline', 'default', 'e.g. A, B, C')}
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => Alert.alert('Reset Data', 'This will clear all your study progress. Are you sure?', [{ text: 'Cancel' }, { text: 'Reset', style: 'destructive' }])}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              <Text style={styles.dangerBtnText}>Reset All Study Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => Alert.alert('Delete Account', 'This action is irreversible. Are you sure?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }])}>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { ...FONTS.h3 },
  saveBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  saveBtnDisabled: { backgroundColor: COLORS.border },
  saveBtnText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.white },
  saveBtnTextDisabled: { color: COLORS.textMuted },
  content: { paddingHorizontal: SPACING.xl },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xxl },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.primaryLight, overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.xs },
  changePhotoText: { ...FONTS.bodyBold, fontSize: 13, color: COLORS.primary },
  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl,
    marginBottom: SPACING.lg, ...SHADOWS.sm,
  },
  formSectionTitle: { ...FONTS.bodyBold, color: COLORS.primary, marginBottom: SPACING.lg, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldGroup: { marginBottom: SPACING.lg },
  fieldLabel: { ...FONTS.caption, fontWeight: '600', marginBottom: SPACING.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { marginLeft: SPACING.lg },
  input: {
    flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    ...FONTS.body, color: COLORS.text,
  },
  dangerCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.danger + '30',
  },
  dangerTitle: { ...FONTS.bodyBold, color: COLORS.danger, marginBottom: SPACING.lg },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dangerBtnText: { ...FONTS.body, color: COLORS.danger },
});
