import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Home } from 'lucide-react-native';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const to = setTimeout(async () => {
      if (Platform.OS === 'web') {
        try {
          router.replace('/(tabs)/home');
        } catch {
          router.push('/(tabs)/home');
        }
        return;
      }

      try {
        const [onboardingDone, devSession] = await Promise.all([
          AsyncStorage.getItem('@immoci_onboarding_completed'),
          AsyncStorage.getItem('@immoci_auth_dev_session'),
        ]);

        if (devSession || onboardingDone === 'true') {
          try {
            router.replace('/(tabs)/home');
          } catch {
            router.push('/(tabs)/home');
          }
        } else {
          try {
            router.replace('/onboarding');
          } catch {
            router.push('/onboarding');
          }
        }
      } catch {
        router.replace('/(tabs)/home');
      }
    }, 1700);

    return () => clearTimeout(to);
  }, [bgOpacity, glowScale, logoOpacity, logoScale]);

  const glowStyle = useMemo(
    () => ({
      transform: [
        {
          scale: glowScale.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }),
        },
      ],
      opacity: logoOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.35] }),
    }),
    [glowScale, logoOpacity],
  );

  return (
    <View style={styles.container} testID="splash-screen">
      <Animated.View style={[styles.bgWrapper, { opacity: bgOpacity }]}> 
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight, Colors.accent] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      <Animated.View style={[styles.glow, glowStyle]} />

      <Animated.View
        style={[
          styles.logo,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
        accessibilityRole="image"
      >
        <View style={styles.logoIcon}>
          <Home size={40} color={Colors.white} strokeWidth={2.5} />
        </View>
        <Text style={styles.logoText}>ImmoCI</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: logoOpacity }]} testID="splash-tagline">
        Explorez, Achetez &amp; Louez
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    width,
    height,
  },
  glow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: Colors.white,
    opacity: 0.2,
    filter: Platform.OS === 'web' ? ('blur(60px)' as any) : undefined,
  },
  logo: {
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoText: {
    ...Typography.h2,
    color: Colors.white,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  tagline: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    ...Typography.body,
    color: Colors.white,
    opacity: 0.85,
  },
});
