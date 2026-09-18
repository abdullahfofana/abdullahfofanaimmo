import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, User, Mail, Phone, ShieldCheck, Check } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '@/types/property';

export default function EditProfileScreen() {
  const { user, skipAuth } = useAuth();
  const { language, t } = useLanguage();
  const loc = (fr: string, en: string, _ar?: string) => language === 'fr' ? fr : en;
  const colors = useColors();

  const [name, setName] = useState(user?.name || 'Jean Kouassi');
  const [email, setEmail] = useState(user?.email || 'jean.kouassi@example.com');
  const [phone, setPhone] = useState(user?.phone || '+225 07 48 22 19 00');
  const [role, setRole] = useState<UserRole>(user?.role || 'agent');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.role) setRole(user.role);
    }
  }, [user]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      const msg = loc('Veuillez saisir votre nom', 'Please enter your name');
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        id: user?.id || 'dev-user-001',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        avatar: user?.avatar,
      };

      if (skipAuth) {
        await skipAuth(updatedUser);
      } else {
        await AsyncStorage.setItem('@immoci_auth_dev_session', JSON.stringify(updatedUser));
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        handleBack();
      }, 700);
    } catch (e: any) {
      console.warn('[EditProfile] Save error:', e);
      const msg = loc('Erreur lors de la sauvegarde', 'Failed to save changes');
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: loc('Modifier le Profil', 'Edit Profile'),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceGreen, borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.avatarSub, { color: colors.textSecondary }]}>
            {role === 'agent' ? 'Agent Immobilier' : 'Particulier'}
          </Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {loc('Type de profil', 'Profile Type')}
          </Text>
          <View style={[styles.roleRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {(['renter', 'agent'] as UserRole[]).map((r) => {
              const isSelected = role === r;
              const rLabel = r === 'agent'
                ? loc('🏢 Agent / Vendeur', '🏢 Agent / Seller')
                : loc('🏠 Acheteur / Locataire', '🏠 Buyer / Renter');
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleTab, isSelected && [styles.roleTabActive, { backgroundColor: colors.surface }]]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleTabText, isSelected ? { color: '#059669', fontWeight: '800' } : { color: colors.textSecondary }]}>
                    {rLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {loc('Nom et prénom', 'Full Name')}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <User size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: Jean Kouassi"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {loc('Adresse email', 'Email Address')}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Mail size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: jean.kouassi@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {loc('Numéro de téléphone (WhatsApp)', 'Phone Number (WhatsApp)')}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Phone size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: +225 07 48 22 19 00"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: savedSuccess ? '#10B981' : '#059669' }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.88}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : savedSuccess ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>
                {loc('Enregistré !', 'Saved!')}
              </Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {loc('Enregistrer les modifications', 'Save Changes')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: Platform.OS === 'web' ? Spacing.sm : 0,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  avatarSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmall,
    marginBottom: 6,
    fontWeight: '700',
    fontSize: 13,
  },
  roleRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  roleTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
