/**
 * AnimatedSubmitButton
 *
 * Dribbble-inspired submit button with 3-state animation:
 *   idle → loading (progress bar fills) → success (checkmark pop)
 *
 * Reference: https://dribbble.com/shots/1426764-Submit-Button
 *
 * Usage:
 *   <AnimatedSubmitButton
 *     label="Submit Listing"
 *     onPress={handleSubmit}
 *     isLoading={isSubmitting}
 *     isSuccess={submitted}
 *   />
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type BtnState = 'idle' | 'loading' | 'success';

interface AnimatedSubmitButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  /** Width of the button — defaults to '100%' */
  width?: number | string;
  /** Accent gradient colors. Default: forest green */
  colors?: [string, string];
  /** Progress label shown during loading */
  progressLabel?: string;
}

const AnimatedSubmitButton: React.FC<AnimatedSubmitButtonProps> = ({
  label,
  onPress,
  isLoading = false,
  isSuccess = false,
  disabled = false,
  width = '100%',
  colors: gradientColors = ['#2D6A4F', '#1B3A2D'],
  progressLabel,
}) => {
  // ─── State machine ─────────────────────────────────────────
  const [btnState, setBtnState] = useState<BtnState>('idle');

  useEffect(() => {
    if (isSuccess) setBtnState('success');
    else if (isLoading) setBtnState('loading');
    else setBtnState('idle');
  }, [isLoading, isSuccess]);

  // ─── Animation values ──────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(1)).current;        // 1 = full, 0 = pill
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const successBgAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ─── Shimmer loop ──────────────────────────────────────────
  useEffect(() => {
    if (btnState === 'loading') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 2, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(-1);
    }
  }, [btnState]);

  // ─── Progress bar fill ─────────────────────────────────────
  useEffect(() => {
    if (btnState === 'loading') {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else if (btnState === 'success') {
      // Complete the bar instantly then morph
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        runSuccessAnimation();
      });
    } else {
      progressAnim.setValue(0);
    }
  }, [btnState]);

  const runSuccessAnimation = () => {
    Animated.parallel([
      // Shrink to pill
      Animated.spring(widthAnim, { toValue: 0, friction: 6, tension: 70, useNativeDriver: false }),
      // Fade label out
      Animated.timing(labelOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      // Success bg
      Animated.timing(successBgAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
    ]).start(() => {
      // Pop checkmark in
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 55, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  };

  // Reset when going back to idle
  useEffect(() => {
    if (btnState === 'idle') {
      Animated.parallel([
        Animated.timing(widthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(successBgAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start(() => {
        checkScale.setValue(0);
        progressAnim.setValue(0);
      });
    }
  }, [btnState]);

  // ─── Derived animated styles ───────────────────────────────
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const containerWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, typeof width === 'number' ? width : 9999],
    extrapolate: 'clamp',
  });

  const successBgColor = successBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [gradientColors[0], '#10B981'],
  });

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-200, 200],
  });

  const isDisabled = disabled || btnState === 'loading' || btnState === 'success';

  return (
    <View style={[ds.wrapper, typeof width === 'string' ? { width: width as any } : { width }]}>
      {/* Glow layer (success state) */}
      {btnState === 'success' && (
        <Animated.View
          style={[
            ds.glowRing,
            { opacity: glowOpacity, borderColor: '#10B981' },
          ]}
          pointerEvents="none"
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.88}
        style={{ width: '100%' }}
      >
        <Animated.View
          style={[
            ds.btn,
            typeof width === 'string' ? {} : { width: containerWidth as any },
            typeof width !== 'string' && { alignSelf: 'center' },
            btnState === 'success' && { width: 56, alignSelf: 'center' },
            { backgroundColor: successBgColor as any },
            disabled && ds.btnDisabled,
          ]}
        >
          {/* Gradient background for idle/loading */}
          {btnState !== 'success' && (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Progress fill bar */}
          {btnState === 'loading' && (
            <Animated.View
              style={[ds.progressBar, { width: progressWidth }]}
            >
              {/* Shimmer on the bar */}
              <Animated.View
                style={[
                  ds.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </Animated.View>
          )}

          {/* Label */}
          {btnState !== 'success' && (
            <Animated.View style={{ opacity: labelOpacity, alignItems: 'center' }}>
              {btnState === 'loading' ? (
                <View style={ds.loadingRow}>
                  {/* Spinner dots */}
                  <LoadingDots color="#fff" />
                  {progressLabel ? (
                    <Text style={ds.progressLabel}>{progressLabel}</Text>
                  ) : (
                    <Text style={ds.labelText}>Submitting…</Text>
                  )}
                </View>
              ) : (
                <Text style={ds.labelText}>{label}</Text>
              )}
            </Animated.View>
          )}

          {/* Success checkmark */}
          {btnState === 'success' && (
            <Animated.View
              style={{
                transform: [{ scale: checkScale }],
                opacity: checkOpacity,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={24} color="#fff" strokeWidth={3} />
            </Animated.View>
          )}
        </Animated.View>

        {/* Success label under pill */}
        {btnState === 'success' && (
          <Animated.Text
            style={[ds.successLabel, { opacity: checkOpacity }]}
          >
            Submitted!
          </Animated.Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── Animated Loading Dots ────────────────────────────────────
const DOT_COUNT = 3;
function LoadingDots({ color = '#fff' }: { color?: string }) {
  const anims = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((DOT_COUNT - i) * 160),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: color,
            opacity: 0.85,
            transform: [{ translateY: anim }],
          }}
        />
      ))}
    </View>
  );
}

export default AnimatedSubmitButton;

// ── Styles ───────────────────────────────────────────────────
const ds = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative' as any,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative' as any,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 20px rgba(27,58,45,0.28)' }
      : {
          shadowColor: '#1B3A2D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
          elevation: 6,
        }),
  },
  btnDisabled: {
    opacity: 0.55,
  },
  progressBar: {
    position: 'absolute' as any,
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute' as any,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ skewX: '-20deg' }],
  },
  labelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  } as any,
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  } as any,
  glowRing: {
    position: 'absolute' as any,
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    borderWidth: 2,
    zIndex: -1,
  },
  successLabel: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  } as any,
});
