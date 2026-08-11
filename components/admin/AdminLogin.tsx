import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Easing,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Home,
  Building,
  Key,
  FileText,
  Briefcase,
  MapPin,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';

const { width, height } = Dimensions.get('window');

interface AdminLoginProps {
  onLogin: () => void;
}

const FloatingIcon = ({
  icon: Icon,
  size,
  color,
  style,
  duration,
  delay,
  startPos,
}: {
  icon: any;
  size: number;
  color: string;
  style?: any;
  duration: number;
  delay: number;
  startPos: { x: number; y: number };
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.2, // Low opacity for background
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -50,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startPos.x,
          top: startPos.y,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <Icon size={size} color={color} />
    </Animated.View>
  );
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
      onLogin();
    } catch (err: any) {
      console.error('[AdminLogin] Login failed:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const bgIcons = [
    { Icon: Home, x: 0.1, y: 0.15, size: 40, delay: 0, duration: 4000 },
    { Icon: Building, x: 0.8, y: 0.2, size: 50, delay: 500, duration: 5000 },
    { Icon: Shield, x: 0.15, y: 0.5, size: 45, delay: 1000, duration: 4500 },
    { Icon: FileText, x: 0.85, y: 0.6, size: 35, delay: 1500, duration: 5500 },
    { Icon: Key, x: 0.3, y: 0.8, size: 40, delay: 200, duration: 4200 },
    { Icon: Briefcase, x: 0.7, y: 0.85, size: 45, delay: 700, duration: 4800 },
    { Icon: MapPin, x: 0.5, y: 0.1, size: 30, delay: 300, duration: 6000 },
    { Icon: TrendingUp, x: 0.05, y: 0.35, size: 35, delay: 800, duration: 5200 },
    { Icon: DollarSign, x: 0.9, y: 0.4, size: 40, delay: 1200, duration: 4700 },
    { Icon: Users, x: 0.6, y: 0.3, size: 30, delay: 400, duration: 5800 },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#172554', '#0f172a']} // Blue gradient similar to image
        style={styles.background}
      />
      
      {/* Background Floating Icons */}
      <View style={StyleSheet.absoluteFill}>
        {bgIcons.map((item, index) => (
          <FloatingIcon
            key={index}
            icon={item.Icon}
            size={item.size}
            color="rgba(255, 255, 255, 0.5)"
            startPos={{ x: item.x * width, y: item.y * height }}
            duration={item.duration}
            delay={item.delay}
          />
        ))}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Shield size={40} color="#FFFFFF" fill="#3b82f6" />
              </View>
              <Text style={styles.title}>Admin Portal</Text>
              <Text style={styles.subtitle}>
                Secure administrator access to ImmoCI dashboard
              </Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@immoci.com"
                    placeholderTextColor={Colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin password"
                    placeholderTextColor={Colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.loginButtonText}>Accessing...</Text>
                ) : (
                  <Text style={styles.loginButtonText}>Access Admin Dashboard</Text>
                )}
              </TouchableOpacity>

              {/* DEV ONLY — skip button for testing. Always visible on web for prototype demos */}
              {(Platform.OS === 'web' || __DEV__) && (
                <TouchableOpacity style={styles.skipButton} onPress={onLogin}>
                  <Text style={styles.skipButtonText}>⚡ Skip (Dev Only)</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Administrator access only. Unauthorized access is prohibited.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Semi-transparent dark bg
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue highlight
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8', // slate-400
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0', // slate-200
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800 semi-transparent
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 8,
    height: 48,
  },
  inputIcon: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    height: '100%',
    fontSize: 15,
  },
  eyeIcon: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  loginButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  // DEV skip button
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  skipButtonText: {
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
});
