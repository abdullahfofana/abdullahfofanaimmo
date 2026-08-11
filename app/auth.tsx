import { router } from 'expo-router';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  Chrome, Facebook, AlertCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { UserRole } from '@/types/property';
import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('renter');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const isWeb = Platform.OS === 'web';

  const handleAuth = async () => {
    setLocalError('');
    if (!email || !password) { setLocalError('Veuillez remplir tous les champs'); return; }
    if (mode === 'signup' && (!name || !phone)) { setLocalError('Veuillez remplir tous les champs'); return; }
    setIsLoading(true);
    try {
      if (mode === 'login') { await signIn(email, password); }
      else { await signUp(email, password, name, phone, role); }
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setLocalError(err.message || 'Une erreur s\'est produite');
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'web') { setLocalError('Disponible uniquement sur le web'); return; }
    setLocalError(''); setIsLoading(true);
    try { await signInWithGoogle(); router.replace('/(tabs)/home'); }
    catch (err: any) { setLocalError(err.message || 'Erreur Google'); }
    finally { setIsLoading(false); }
  };

  const handleFacebookSignIn = async () => {
    if (Platform.OS !== 'web') { setLocalError('Disponible uniquement sur le web'); return; }
    setLocalError(''); setIsLoading(true);
    try { await signInWithFacebook(); router.replace('/(tabs)/home'); }
    catch (err: any) { setLocalError(err.message || 'Erreur Facebook'); }
    finally { setIsLoading(false); }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setLocalError(''); setEmail(''); setPassword(''); setName(''); setPhone('');
  };

  const formContent = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.formScroll,
        { paddingTop: isWeb ? 48 : insets.top + 32 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoSquare}>
          <Text style={styles.logoInitials}>IC</Text>
        </View>
        <Text style={styles.logoWordmark}>ImmoCI</Text>
      </View>

      {/* Title */}
      <Text style={styles.formTitle}>{mode === 'login' ? 'Bienvenue' : 'Créer un compte'}</Text>
      <Text style={styles.formSubtitle}>
        {mode === 'login' ? 'Connectez-vous pour continuer' : 'Rejoignez des milliers d\'acheteurs'}
      </Text>

      {/* Error */}
      {(localError || authError) && (
        <View style={styles.errorBox}>
          <AlertCircle size={15} color={Colors.error} strokeWidth={2} />
          <Text style={styles.errorText}>{localError || authError}</Text>
        </View>
      )}

      {/* Role toggle */}
      {mode === 'signup' && (
        <View style={styles.roleRow}>
          {(['renter', 'agent'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleTab, role === r && styles.roleTabActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleTabText, role === r && styles.roleTabTextActive]}>
                {r === 'renter' ? 'Acheteur' : 'Agent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Signup extra fields */}
      {mode === 'signup' && (
        <>
          <View style={styles.inputWrap}>
            <User size={18} color={Colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={(v) => { setName(v); setLocalError(''); }}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputWrap}>
            <Phone size={18} color={Colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor={Colors.textLight}
              value={phone}
              onChangeText={(v) => { setPhone(v); setLocalError(''); }}
              keyboardType="phone-pad"
            />
          </View>
        </>
      )}

      {/* Email */}
      <View style={styles.inputWrap}>
        <Mail size={18} color={Colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Adresse email"
          placeholderTextColor={Colors.textLight}
          value={email}
          onChangeText={(v) => { setEmail(v); setLocalError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputWrap}>
        <Lock size={18} color={Colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Mot de passe"
          placeholderTextColor={Colors.textLight}
          value={password}
          onChangeText={(v) => { setPassword(v); setLocalError(''); }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
          {showPassword
            ? <EyeOff size={18} color={Colors.textSecondary} strokeWidth={1.8} />
            : <Eye size={18} color={Colors.textSecondary} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>

      {mode === 'login' && (
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
        onPress={handleAuth}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Text>}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social */}
      <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} disabled={isLoading}>
        <Chrome size={18} color={Colors.text} strokeWidth={1.8} />
        <Text style={styles.socialBtnText}>Continuer avec Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookSignIn} disabled={isLoading}>
        <Facebook size={18} color={Colors.text} strokeWidth={1.8} />
        <Text style={styles.socialBtnText}>Continuer avec Facebook</Text>
      </TouchableOpacity>

      {/* Toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
        </Text>
        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.switchLink}>
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.skipRow}>
        <Text style={styles.skipText}>Passer (Mode Développeur)</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Web: 2-column
  if (isWeb) {
    return (
      <View style={styles.webShell}>
        <View style={styles.webLeft}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=90' }}
            style={StyleSheet.absoluteFill as any}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(8,16,10,0.12)', 'rgba(8,16,10,0.82)']}
            style={StyleSheet.absoluteFill as any}
          />
          <View style={styles.webLeftInner}>
            <View style={styles.webBrandRow}>
              <View style={styles.webBrandSquare}>
                <Text style={styles.webBrandInitials}>IC</Text>
              </View>
              <Text style={styles.webBrandName}>ImmoCI</Text>
            </View>
            <View style={styles.webLeftBottom}>
              <Text style={styles.webEyebrow}>N° 1 EN CÔTE D'IVOIRE</Text>
              <Text style={styles.webHero}>Trouvez votre{'\n'}bien idéal.</Text>
              <Text style={styles.webHeroSub}>
                Des milliers de propriétés à Abidjan et partout en Côte d'Ivoire.
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.webRight}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            {formContent}
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  // Mobile
  return (
    <KeyboardAvoidingView
      style={styles.mobileShell}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {formContent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mobileShell: { flex: 1, backgroundColor: Colors.background },
  formScroll: { paddingHorizontal: 24, paddingBottom: 48, flexGrow: 1 },

  // Web 2-col
  webShell: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  webLeft: { flex: 1, position: 'relative', overflow: 'hidden' },
  webLeftInner: { flex: 1, justifyContent: 'space-between', padding: 40 },
  webBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  webBrandSquare: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  webBrandInitials: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  webBrandName: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  webLeftBottom: { gap: 14 },
  webEyebrow: { fontSize: 10, fontWeight: '700', color: Colors.accentLight, letterSpacing: 1.8, textTransform: 'uppercase' },
  webHero: { fontSize: 46, fontWeight: '800', color: '#fff', lineHeight: 52, letterSpacing: -1.2 },
  webHeroSub: { fontSize: 15, color: 'rgba(255,255,255,0.70)', lineHeight: 23, maxWidth: 340 },
  webRight: {
    width: 440, backgroundColor: Colors.background,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoSquare: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitials: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  logoWordmark: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },

  formTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.7, marginBottom: 6 },
  formSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(185,28,28,0.07)',
    borderWidth: 1, borderColor: 'rgba(185,28,28,0.18)',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.error, flex: 1, lineHeight: 18 },

  // Role
  roleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  roleTabActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleTabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  roleTabTextActive: { color: Colors.primary, fontWeight: '700' },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, height: 54, marginBottom: 12,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  eyeBtn: { paddingLeft: 8 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // CTA
  primaryBtn: {
    backgroundColor: Colors.primary, height: 54,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 1.0, textTransform: 'uppercase' },

  // Social
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, height: 50,
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 12,
  },
  socialBtnText: { fontSize: 15, color: Colors.text, fontWeight: '500' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  switchText: { fontSize: 15, color: Colors.textSecondary },
  switchLink: { fontSize: 15, color: Colors.primary, fontWeight: '700' },

  // Skip
  skipRow: { alignItems: 'center', marginTop: 24, paddingBottom: 32 },
  skipText: { fontSize: 13, color: Colors.textLight, textDecorationLine: 'underline' },
});
