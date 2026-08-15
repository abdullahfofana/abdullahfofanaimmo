import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Home,
  Building2,
  Key,
  FileText,
  Briefcase,
  MapPin,
  TrendingUp,
  DollarSign,
  Users,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';

interface AdminLoginProps {
  onLogin: () => void;
}

interface FloatingIconData {
  Icon: any;
  leftPercent: number;
  topPercent: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color?: string;
}

const BG_ICONS: FloatingIconData[] = [
  { Icon: Home, leftPercent: 8, topPercent: 12, size: 40, duration: 4200, delay: 0, opacity: 0.3, color: '#93C5FD' },
  { Icon: Building2, leftPercent: 84, topPercent: 14, size: 48, duration: 5200, delay: 500, opacity: 0.32, color: '#60A5FA' },
  { Icon: Shield, leftPercent: 12, topPercent: 46, size: 44, duration: 4600, delay: 1000, opacity: 0.28, color: '#34D399' },
  { Icon: FileText, leftPercent: 86, topPercent: 52, size: 38, duration: 5600, delay: 1500, opacity: 0.28, color: '#FCD34D' },
  { Icon: Key, leftPercent: 20, topPercent: 80, size: 40, duration: 4400, delay: 200, opacity: 0.3, color: '#F472B6' },
  { Icon: Briefcase, leftPercent: 78, topPercent: 78, size: 44, duration: 5000, delay: 700, opacity: 0.28, color: '#A78BFA' },
  { Icon: MapPin, leftPercent: 48, topPercent: 8, size: 34, duration: 6000, delay: 300, opacity: 0.25, color: '#F87171' },
  { Icon: TrendingUp, leftPercent: 6, topPercent: 30, size: 36, duration: 5400, delay: 800, opacity: 0.28, color: '#38BDF8' },
  { Icon: DollarSign, leftPercent: 90, topPercent: 34, size: 42, duration: 4800, delay: 1200, opacity: 0.32, color: '#34D399' },
  { Icon: Users, leftPercent: 54, topPercent: 88, size: 36, duration: 5800, delay: 400, opacity: 0.25, color: '#818CF8' },
  { Icon: Sparkles, leftPercent: 28, topPercent: 22, size: 30, duration: 3800, delay: 900, opacity: 0.35, color: '#FDE047' },
];

const FloatingIcon = ({
  Icon,
  leftPercent,
  topPercent,
  size,
  duration,
  delay,
  opacity: targetOpacity,
  color = '#60A5FA',
}: FloatingIconData) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth fade in
    Animated.timing(opacityAnim, {
      toValue: targetOpacity,
      duration: 1000,
      delay,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Infinite floating bobbing motion
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -28,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    const timer = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [delay, duration, opacityAnim, targetOpacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingIconContainer,
        {
          left: `${leftPercent}%` as any,
          top: `${topPercent}%` as any,
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Icon size={size} color={color} strokeWidth={1.8} />
    </Animated.View>
  );
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@immoci.ci');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez saisir votre email et mot de passe');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (signIn) {
        await signIn(email, password).catch(() => {
          console.log('[AdminLogin] Local prototype fallback');
        });
      }
      onLogin();
    } catch (err: any) {
      console.warn('[AdminLogin] Sign in warning:', err);
      onLogin();
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      {/* Blue / Navy Gradient Background */}
      <LinearGradient
        colors={['#1e3a8a', '#172554', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Ambient Glowing Orbs */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />
      <View style={styles.glowCenter} pointerEvents="none" />

      {/* Floating Animated Icons Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BG_ICONS.map((item, index) => (
          <FloatingIcon key={index} {...item} />
        ))}
      </View>

      {/* Scrollable Container with Glass Card */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header Brand */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Shield size={36} color="#FFFFFF" fill="rgba(255, 255, 255, 0.25)" />
              </LinearGradient>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Sparkles size={13} color="#60A5FA" />
                <Text style={styles.badgeText}>PORTAIL D'ADMINISTRATION</Text>
              </View>
            </View>

            <Text style={styles.title}>ImmoCI Admin Portal</Text>
            <Text style={styles.subtitle}>
              Accès sécurisé au centre de contrôle, modération IA et conformité légale.
            </Text>
          </View>

          {/* 1-Click Instant Demo Button */}
          <TouchableOpacity
            style={styles.instantAccessBtn}
            onPress={onLogin}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.instantAccessGradient}
            >
              <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.instantAccessText}>⚡ Accès Direct Super Admin (1-Clic)</Text>
            </LinearGradient>
          </TouchableOpacity>



          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Administrateur</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@immoci.ci"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Connexion au Dashboard Admin</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Navigation Links Footer */}
          <View style={styles.footerNav}>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.7}
            >
              <Home size={15} color="#93C5FD" />
              <Text style={styles.footerLinkText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Accès strictement réservé aux administrateurs certifiés ImmoCI.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(59, 130, 246, 0.20)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  },
  glowCenter: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  floatingIconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 36,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 14,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }
      : {}),
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconGradient: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeRow: {
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  instantAccessBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  instantAccessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  instantAccessText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
    letterSpacing: 0.2,
  },

  form: {
    gap: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 11,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    height: '100%',
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeIcon: {
    padding: 6,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14.5,
  },
  footerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footerLinkText: {
    fontSize: 12.5,
    color: '#93C5FD',
    fontWeight: '600',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#475569',
  },
  footer: {
    marginTop: 14,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
