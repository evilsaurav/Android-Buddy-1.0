import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../lib/theme';
import { useAuth } from '../context/AuthContext';
import {
  changePasswordWithBackend,
  updateExamDateWithBackend,
  updateProfileWithBackend,
  uploadProfilePictureWithBackend,
} from '../lib/api';

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

const withAvatarCacheBuster = (uri: string): string => {
  const value = String(uri || '').trim();
  if (!/^https?:\/\//i.test(value)) return value;
  const separator = value.includes('?') ? '&' : '?';
  return `${value}${separator}av=${Date.now()}`;
};

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
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (sessionMode === 'authenticated' && authProfile) {
      const examSessionRaw = String(authProfile.exam_session || '').trim();
      const sessionSemMatch = examSessionRaw.match(/sem\s*(\d+)/i);
      const remoteAvatar = String(authProfile.profile_picture_url || authProfile.profile_pic_url || '').trim();
      setProfile((prev) => ({
        ...prev,
        name: String(authProfile.display_name || authProfile.username || prev.name),
        email: String(authProfile.email || prev.email),
        semester: sessionSemMatch?.[1] || String(authProfile.semester || prev.semester),
        phone: String(authProfile.mobile_number || prev.phone),
        examDate: String(authProfile.exam_date || prev.examDate),
        avatarUri: remoteAvatar ? withAvatarCacheBuster(remoteAvatar) : prev.avatarUri,
      }));
      setAvatarLoadFailed(false);
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
          exam_session: `Sem ${String(profile.semester || '').trim() || '3'}`,
        });

        if (profile.examDate.trim()) {
          await updateExamDateWithBackend(
            profile.examDate.trim(),
            `Sem ${String(profile.semester || '').trim() || '3'}`
          );
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
      setAvatarLoadFailed(false);
      setHasChanges(true);

      if (sessionMode === 'authenticated') {
        setUploadingAvatar(true);
        try {
          const uploadedUrl = await uploadProfilePictureWithBackend(localUri);
          if (uploadedUrl) {
            setProfile((prev) => ({ ...prev, avatarUri: withAvatarCacheBuster(uploadedUrl) }));
            setAvatarLoadFailed(false);
          }
          await refreshProfile();
          Alert.alert('Success', 'Profile photo updated successfully.');
        } catch (error) {
          const message = error instanceof Error ? error.message.trim() : '';
          Alert.alert('Upload failed', message || 'Unable to update profile photo right now.');
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

  const updatePasswordField = (field: 'current' | 'next' | 'confirm', value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const changePassword = async () => {
    if (sessionMode !== 'authenticated') {
      Alert.alert('Login Required', 'Please login to change your password.');
      return;
    }

    if (!passwords.current.trim() || !passwords.next.trim() || !passwords.confirm.trim()) {
      Alert.alert('Incomplete', 'Please fill all password fields.');
      return;
    }

    if (passwords.next !== passwords.confirm) {
      Alert.alert('Mismatch', 'New password and confirm password do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      await changePasswordWithBackend(passwords.current, passwords.next, passwords.confirm);
      setPasswords({ current: '', next: '', confirm: '' });
      Alert.alert('Password Updated', 'Your account password has been changed successfully.');
    } catch {
      Alert.alert('Update Failed', 'Unable to change password right now. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

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
              {profile.avatarUri && !avatarLoadFailed ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatarImage}
                  onError={() => setAvatarLoadFailed(true)}
                />
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

          {sessionMode === 'authenticated' ? (
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Security</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Current Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={passwords.current}
                    onChangeText={(value) => updatePasswordField('current', value)}
                    placeholder="Current password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="key-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={passwords.next}
                    onChangeText={(value) => updatePasswordField('next', value)}
                    placeholder="New password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={passwords.confirm}
                    onChangeText={(value) => updatePasswordField('confirm', value)}
                    placeholder="Confirm password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.securityBtn} onPress={changePassword}>
                <Ionicons name="shield-outline" size={16} color={COLORS.white} />
                <Text style={styles.securityBtnText}>{changingPassword ? 'Updating...' : 'Change Password'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
  securityBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  securityBtnText: { ...FONTS.bodyBold, color: COLORS.white, fontSize: 13 },
});
