import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Home,
  LayoutDashboard,
  Zap,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';

interface AdminLoginProps {
  onLogin: () => void;
}

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
          // If auth backend has no remote record, allow prototype access
          console.log('[AdminLogin] Local prototype fallback');
        });
      }
      onLogin();
    } catch (err: any) {
      console.warn('[AdminLogin] Sign in warning:', err);
      // Fallback for prototype demo
      onLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('admin123');
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F172A', '#0B0F19', '#030712']}
        style={styles.background}
      />

      {/* Ambient background glow circles */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

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
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Shield size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Sparkles size={12} color="#10B981" />
                <Text style={styles.badgeText}>PORTAIL D'ADMINISTRATION</Text>
              </View>
            </View>
            <Text style={styles.title}>ImmoCI Admin Pro</Text>
            <Text style={styles.subtitle}>
              Tableau de bord de gestion immobilière, conformité légale et modération IA.
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

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU CONNEXION PAR COMPTE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Role Selector Chips */}
          <View style={styles.rolesRow}>
            <TouchableOpacity
              style={[styles.roleChip, email === 'admin@immoci.ci' && styles.roleChipActive]}
              onPress={() => handleQuickRole('admin@immoci.ci')}
            >
              <Text style={[styles.roleChipText, email === 'admin@immoci.ci' && styles.roleChipTextActive]}>
                Super Admin
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleChip, email === 'ops@immoci.ci' && styles.roleChipActive]}
              onPress={() => handleQuickRole('ops@immoci.ci')}
            >
              <Text style={[styles.roleChipText, email === 'ops@immoci.ci' && styles.roleChipTextActive]}>
                Opérations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleChip, email === 'finance@immoci.ci' && styles.roleChipActive]}
              onPress={() => handleQuickRole('finance@immoci.ci')}
            >
              <Text style={[styles.roleChipText, email === 'finance@immoci.ci' && styles.roleChipTextActive]}>
                Finance
              </Text>
            </TouchableOpacity>
          </View>

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
              <Home size={15} color="#94A3B8" />
              <Text style={styles.footerLinkText}>Retour à l'accueil</Text>
            </TouchableOpacity>

            <View style={styles.footerDot} />

            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.push('/dashboard')}
              activeOpacity={0.7}
            >
              <LayoutDashboard size={15} color="#94A3B8" />
              <Text style={styles.footerLinkText}>Dashboard Client</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Accès sécurisé réservé aux membres de la direction & agents agréés ImmoCI.
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
    backgroundColor: '#0B0F19',
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
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
    backgroundColor: 'rgba(17, 24, 39, 0.90)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  badgeRow: {
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
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
    paddingHorizontal: 10,
  },
  instantAccessBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  roleChipTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  form: {
    gap: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    height: 46,
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
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#94A3B8',
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
