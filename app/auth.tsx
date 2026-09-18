import { router } from 'expo-router';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  Globe, ExternalLink, AlertCircle,
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

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { UserRole } from '@/types/property';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const loc = (fr: string, en: string, _ar?: string) => language === 'fr' ? fr : en;
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('renter');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, skipAuth, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const isWeb = Platform.OS === 'web';

  const handleSkipDev = async () => {
    setIsLoading(true);
    try {
      if (skipAuth) {
        await skipAuth({
          role: 'renter',
          name: 'Client ImmoCI',
          email: 'client@immoci.ci',
        });
      }
    } catch (e) {
      console.warn('[Auth] skipAuth warning:', e);
    } finally {
      setIsLoading(false);
      try {
        router.replace('/(tabs)/home');
      } catch {
        router.push('/(tabs)/home');
      }
    }
  };

  const handleAuth = async () => {
    setLocalError('');
    if (!email || !password) { setLocalError(loc('Veuillez remplir tous les champs', 'Please fill in all fields')); return; }
    if (mode === 'signup' && (!name || !phone)) { setLocalError(loc('Veuillez remplir tous les champs', 'Please fill in all fields')); return; }
    setIsLoading(true);
    try {
      if (mode === 'login') { await signIn(email, password); }
      else {
        const signupRole: UserRole = isWeb ? role : 'renter';
        await signUp(email, password, name, phone, signupRole);
      }
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setLocalError(err.message || loc('Une erreur s\'est produite', 'An error occurred'));
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'web') { setLocalError(loc('Disponible uniquement sur le web', 'Only available on web')); return; }
    setLocalError(''); setIsLoading(true);
    try { await signInWithGoogle(); router.replace('/(tabs)/home'); }
    catch (err: any) { setLocalError(err.message || 'Erreur Google'); }
    finally { setIsLoading(false); }
  };

  const handleFacebookSignIn = async () => {
    if (Platform.OS !== 'web') { setLocalError(loc('Disponible uniquement sur le web', 'Only available on web')); return; }
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
      <Text style={styles.formTitle}>{mode === 'login' ? loc('Bienvenue', 'Welcome back') : loc('Créer un compte', 'Create an Account')}</Text>
      <Text style={styles.formSubtitle}>
        {mode === 'login' ? loc('Connectez-vous pour continuer', 'Sign in to your account') : loc('Rejoignez des milliers d\'acheteurs', 'Join thousands of buyers & renters')}
      </Text>

      {/* Error */}
      {(localError || authError) && (
        <View style={styles.errorBox}>
          <AlertCircle size={15} color={colors.error} strokeWidth={2} />
          <Text style={styles.errorText}>{localError || authError}</Text>
        </View>
      )}

      {/* Role toggle (Web only) */}
      {mode === 'signup' && isWeb && (
        <View style={styles.roleRow}>
          {(['renter', 'agent'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleTab, role === r && styles.roleTabActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleTabText, role === r && styles.roleTabTextActive]}>
                {r === 'renter' ? loc('Acheteur', 'Buyer / Renter') : loc('Agent', 'Agent')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Signup extra fields */}
      {mode === 'signup' && (
        <>
          <View style={styles.inputWrap}>
            <User size={18} color={colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={loc("Nom complet", "Full Name")}
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={(v) => { setName(v); setLocalError(''); }}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputWrap}>
            <Phone size={18} color={colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={loc("Téléphone", "Phone Number")}
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={(v) => { setPhone(v); setLocalError(''); }}
              keyboardType="phone-pad"
            />
          </View>
        </>
      )}

      {/* Email */}
      <View style={styles.inputWrap}>
        <Mail size={18} color={colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={loc("Adresse email", "Email Address")}
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={(v) => { setEmail(v); setLocalError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputWrap}>
        <Lock size={18} color={colors.textSecondary} strokeWidth={1.8} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={loc("Mot de passe", "Password")}
          placeholderTextColor={colors.textLight}
          value={password}
          onChangeText={(v) => { setPassword(v); setLocalError(''); }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
          {showPassword
            ? <EyeOff size={18} color={colors.textSecondary} strokeWidth={1.8} />
            : <Eye size={18} color={colors.textSecondary} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>

      {mode === 'login' && (
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgotText}>{loc("Mot de passe oublié ?", "Forgot password?")}</Text>
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
              {mode === 'login' ? loc('Se connecter', 'Sign In') : loc('Créer mon compte', 'Create Account')}
            </Text>}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{loc("ou", "or")}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social */}
      <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} disabled={isLoading}>
        <Globe size={18} color={colors.text} strokeWidth={1.8} />
        <Text style={styles.socialBtnText}>{loc("Continuer avec Google", "Continue with Google")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookSignIn} disabled={isLoading}>
        <ExternalLink size={18} color={colors.text} strokeWidth={1.8} />
        <Text style={styles.socialBtnText}>{loc("Continuer avec Facebook", "Continue with Facebook")}</Text>
      </TouchableOpacity>

      {/* Toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {mode === 'login' ? loc('Pas encore de compte ? ', "Don't have an account? ") : loc('Déjà un compte ? ', 'Already have an account? ')}
        </Text>
        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.switchLink}>
            {mode === 'login' ? loc("S'inscrire", 'Sign Up') : loc('Se connecter', 'Sign In')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSkipDev}
        style={styles.skipRow}
        activeOpacity={0.75}
        disabled={isLoading}
        testID="skip-dev-mode-btn"
      >
        <Text style={styles.skipText}>
          loc('⚡ Passer (Mode Développeur)', '⚡ Skip (Developer Mode)')
        </Text>
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
              <Text style={styles.webEyebrow}>{loc("N° 1 EN CÔTE D'IVOIRE", "#1 IN CÔTE D'IVOIRE")}</Text>
              <Text style={styles.webHero}>Trouvez votre{'\n'}bien idéal.</Text>
              <Text style={styles.webHeroSub}>
                {loc(
                  "Des milliers de propriétés à Abidjan et partout en Côte d'Ivoire.",
                  "Thousands of verified properties in Abidjan and across Côte d'Ivoire.")}
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

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  mobileShell: { flex: 1, backgroundColor: colors.background },
  formScroll: { paddingHorizontal: 24, paddingBottom: 48, flexGrow: 1 },

  // Web 2-col
  webShell: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
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
  webEyebrow: { fontSize: 10, fontWeight: '700', color: colors.accentLight, letterSpacing: 1.8, textTransform: 'uppercase' },
  webHero: { fontSize: 46, fontWeight: '800', color: '#fff', lineHeight: 52, letterSpacing: -1.2 },
  webHeroSub: { fontSize: 15, color: 'rgba(255,255,255,0.70)', lineHeight: 23, maxWidth: 340 },
  webRight: {
    width: 440, backgroundColor: colors.background,
    borderLeftWidth: 1, borderLeftColor: colors.border,
  },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoSquare: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitials: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  logoWordmark: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

  formTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.7, marginBottom: 6 },
  formSubtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(185,28,28,0.07)',
    borderWidth: 1, borderColor: 'rgba(185,28,28,0.18)',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: colors.error, flex: 1, lineHeight: 18 },

  // Role
  roleRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  roleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  roleTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  roleTabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  roleTabTextActive: { color: colors.primary, fontWeight: '700' },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, height: 54, marginBottom: 12,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  eyeBtn: { paddingLeft: 8 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // CTA
  primaryBtn: {
    backgroundColor: colors.primary, height: 54,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1.0, textTransform: 'uppercase' },

  // Social
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, height: 50,
    backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  socialBtnText: { fontSize: 15, color: colors.text, fontWeight: '500' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  switchText: { fontSize: 15, color: colors.textSecondary },
  switchLink: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  // Skip
  skipRow: { alignItems: 'center', marginTop: 24, paddingBottom: 32 },
  skipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
});
}
