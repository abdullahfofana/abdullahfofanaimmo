/**
 * SubmissionSuccessPopup — Pro ProDialog-style popup
 *
 * Mobile (native): Bottom-sheet with confetti, floating icon, step list
 * Web:             Centered fade-animation dialog (ProDialog reference style)
 *
 * Both versions share animations, confetti, and step components.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  CheckCircle,
  Home as HomeIcon,
  Plus,
  Copy,
  Check,
  Send,
  Search,
  Globe,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// ── Confetti colors ───────────────────────────────────────────
const CONFETTI_COLORS = [
  '#4F8EF7', '#6C63FF', '#818CF8',
  '#10B981', '#34D399', '#6EE7B7',
  '#F59E0B', '#FBBF24',
  '#EC4899', '#F97316',
];

interface ConfettiPieceProps { index: number; show: boolean }

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index, show }) => {
  const animY = useRef(new Animated.Value(-20)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animRotate = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const color = useMemo(() => CONFETTI_COLORS[index % CONFETTI_COLORS.length], [index]);
  const startX = useMemo(() => (Math.random() - 0.5) * (SCREEN_WIDTH * 0.85), []);
  const driftX = useMemo(() => (Math.random() - 0.5) * 120, []);
  const size = useMemo(() => 5 + Math.random() * 7, []);
  const delay = useMemo(() => Math.random() * 700, []);
  const isCircle = useMemo(() => Math.random() > 0.5, []);
  const fallDistance = useMemo(() => SCREEN_HEIGHT * 0.7 + Math.random() * 100, []);

  useEffect(() => {
    if (show) {
      animY.setValue(-20);
      animX.setValue(0);
      animRotate.setValue(0);
      animOpacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animY, { toValue: fallDistance, duration: 2400 + Math.random() * 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
          Animated.timing(animX, { toValue: driftX, duration: 2400 + Math.random() * 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
          Animated.timing(animRotate, { toValue: 3 + Math.random() * 5, duration: 2400 + Math.random() * 900, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(animOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1600),
            Animated.timing(animOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    }
  }, [show]);

  const rotate = animRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -20,
        left: SCREEN_WIDTH / 2 + startX,
        width: size,
        height: isCircle ? size : size * 2.2,
        backgroundColor: color,
        borderRadius: isCircle ? size / 2 : 2,
        opacity: animOpacity,
        transform: [{ translateY: animY }, { translateX: animX }, { rotate }],
      }}
    />
  );
};

// ── Floating Animated Icon ─────────────────────────────────────
const FloatingIcon: React.FC<{ show: boolean; iconColor?: string }> = ({ show, iconColor = '#4F8EF7' }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (show) {
      scale.setValue(0);
      floatY.setValue(0);
      glowScale.setValue(0.6);
      glowOpacity.setValue(0);
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.4);

      Animated.spring(scale, { toValue: 1, friction: 4, tension: 55, delay: 250, useNativeDriver: true }).start();

      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
      ]).start();

      Animated.loop(Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 6, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.55, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.35, duration: 0, useNativeDriver: true }),
        ]),
      ])).start();
    }
  }, [show]);

  return (
    <View style={ds.iconContainer}>
      <Animated.View style={[ds.iconPulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
      <Animated.View style={[ds.iconGlow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <Animated.View style={[ds.iconBall, { transform: [{ scale }, { translateY: floatY }] }]}>
        <CheckCircle size={36} color="#fff" strokeWidth={2.2} />
      </Animated.View>
    </View>
  );
};

// ── Step Row ───────────────────────────────────────────────────
interface StepInfo {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  active: boolean;
}

const StepRow: React.FC<{ step: StepInfo; index: number; show: boolean; isLast: boolean }> = ({ step, index, show, isLast }) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(IS_WEB ? 0 : 30)).current;
  const slideY = useRef(new Animated.Value(IS_WEB ? 16 : 0)).current;

  useEffect(() => {
    if (show) {
      fadeIn.setValue(0);
      slideX.setValue(IS_WEB ? 0 : 30);
      slideY.setValue(IS_WEB ? 16 : 0);
      Animated.sequence([
        Animated.delay(650 + index * 180),
        Animated.parallel([
          Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(slideX, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      fadeIn.setValue(0);
      slideX.setValue(IS_WEB ? 0 : 30);
      slideY.setValue(IS_WEB ? 16 : 0);
    }
  }, [show]);

  return (
    <Animated.View
      style={[
        ds.stepRowOuter,
        !isLast && ds.stepRowBorder,
        { opacity: fadeIn, transform: [{ translateX: slideX }, { translateY: slideY }] },
      ]}
    >
      <View style={[ds.stepIconCircle, { backgroundColor: step.bgColor }]}>{step.icon}</View>
      <View style={ds.stepTextWrap}>
        <Text style={[ds.stepRowLabel, step.active && ds.stepRowLabelActive]}>{step.label}</Text>
        <Text style={ds.stepRowSublabel}>{step.sublabel}</Text>
      </View>
      {step.active ? (
        <View style={ds.stepActiveIndicator}>
          <Check size={12} color="#10B981" strokeWidth={3} />
        </View>
      ) : (
        <ChevronRight size={16} color="rgba(255,255,255,0.2)" strokeWidth={2} />
      )}
    </Animated.View>
  );
};

// ── Props ─────────────────────────────────────────────────────
interface SubmissionSuccessPopupProps {
  visible: boolean;
  propertyId: string;
  onGoHome: () => void;
  onAddAnother: () => void;
}

// ── Shared inner card content ─────────────────────────────────
const CardContent: React.FC<{
  visible: boolean;
  propertyId: string;
  onGoHome: () => void;
  onAddAnother: () => void;
  onClose?: () => void;
}> = ({ visible, propertyId, onGoHome, onAddAnother, onClose }) => {
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(24)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;
  const idFade = useRef(new Animated.Value(0)).current;
  const [idCopied, setIdCopied] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setIdCopied(false);
      titleFade.setValue(0);
      titleSlide.setValue(24);
      btnFade.setValue(0);
      btnSlide.setValue(20);
      idFade.setValue(0);

      Animated.sequence([
        Animated.delay(450),
        Animated.parallel([
          Animated.timing(titleFade, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(titleSlide, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();

      Animated.sequence([
        Animated.delay(600),
        Animated.timing(idFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(btnFade, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(btnSlide, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible]);

  const handleCopyId = () => {
    if (IS_WEB) {
      try { navigator.clipboard.writeText(propertyId); } catch {}
    }
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const displayId = propertyId
    ? propertyId.length > 20
      ? propertyId.slice(0, 8) + '···' + propertyId.slice(-6)
      : propertyId
    : '';

  const steps: StepInfo[] = [
    {
      icon: <Send size={18} color="#4F8EF7" strokeWidth={2.2} />,
      label: 'Submitted',
      sublabel: 'Your listing has been received',
      color: '#4F8EF7',
      bgColor: 'rgba(79, 142, 247, 0.15)',
      active: true,
    },
    {
      icon: <Search size={18} color="#F59E0B" strokeWidth={2.2} />,
      label: 'Under Review',
      sublabel: 'Our team is verifying your listing',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      active: false,
    },
    {
      icon: <Globe size={18} color="#10B981" strokeWidth={2.2} />,
      label: 'Published',
      sublabel: 'Live on ImmoCI for everyone',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      active: false,
    },
  ];

  return (
    <>
      {/* Close button (web only) */}
      {IS_WEB && onClose && (
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={ds.closeBtn}
        >
          <X size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Floating Icon */}
      <FloatingIcon show={visible} />

      {/* Title block */}
      <Animated.View style={{ alignItems: 'center', opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
        <Text style={ds.title}>Property Submitted!</Text>
        <Text style={ds.subtitle}>
          Your listing has been received and is now under review.
          Our team will verify and publish it within 24–48 hours.
        </Text>
      </Animated.View>

      {/* ID chip */}
      {!!propertyId && (
        <Animated.View style={[ds.idChip, { opacity: idFade }]}>
          <View style={ds.idIconWrap}>
            <Shield size={13} color="#818CF8" strokeWidth={2.2} />
          </View>
          <Text style={ds.idLabel}>ID</Text>
          <Text style={ds.idValue} numberOfLines={1}>{displayId}</Text>
          <TouchableOpacity onPress={handleCopyId} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {idCopied
              ? <Check size={14} color="#10B981" strokeWidth={2.5} />
              : <Copy size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
            }
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Steps — ProDialog style */}
      <View style={ds.stepsContainer}>
        {steps.map((step, index) => (
          <StepRow
            key={index}
            step={step}
            index={index}
            show={visible}
            isLast={index === steps.length - 1}
          />
        ))}
      </View>

      {/* Action buttons */}
      <Animated.View style={[ds.actionsWrap, { opacity: btnFade, transform: [{ translateY: btnSlide }] }]}>
        <TouchableOpacity onPress={onGoHome} activeOpacity={0.85} style={ds.primaryBtnWrap}>
          <LinearGradient
            colors={['#4F8EF7', '#6C63FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ds.primaryBtn}
          >
            <HomeIcon size={18} color="#fff" strokeWidth={2.5} />
            <Text style={ds.primaryBtnText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onAddAnother} activeOpacity={0.7} style={ds.secondaryBtn}>
          <Plus size={16} color="#818CF8" strokeWidth={2.5} />
          <Text style={ds.secondaryBtnText}>Add Another Property</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

// ── Web Dialog version ─────────────────────────────────────────
const WebDialog: React.FC<SubmissionSuccessPopupProps> = ({ visible, propertyId, onGoHome, onAddAnother }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const confettiCount = 36;

  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      cardScale.setValue(0.94);
      cardOpacity.setValue(0);

      Animated.timing(overlayOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 50, delay: 100, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 350, delay: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onGoHome} statusBarTranslucent>
      {/* Confetti layer */}
      <View style={ds.confettiLayer} pointerEvents="none">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <ConfettiPiece key={i} index={i} show={visible} />
        ))}
      </View>

      {/* Overlay */}
      <Animated.View style={[ds.overlay, { opacity: overlayOpacity }]}>
        {/* Centered card — ProDialog web fade style */}
        <Animated.View style={[ds.webCard, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <CardContent
            visible={visible}
            propertyId={propertyId}
            onGoHome={onGoHome}
            onAddAnother={onAddAnother}
            onClose={onGoHome}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Mobile Bottom Sheet version ────────────────────────────────
const MobileBottomSheet: React.FC<SubmissionSuccessPopupProps> = ({ visible, propertyId, onGoHome, onAddAnother }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const confettiCount = 36;

  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      sheetSlide.setValue(SCREEN_HEIGHT);

      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.spring(sheetSlide, { toValue: 0, friction: 8, tension: 60, delay: 80, useNativeDriver: true }).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetSlide, { toValue: SCREEN_HEIGHT, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onGoHome} statusBarTranslucent>
      {/* Confetti layer */}
      <View style={ds.confettiLayer} pointerEvents="none">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <ConfettiPiece key={i} index={i} show={visible} />
        ))}
      </View>

      {/* Tap-to-dismiss overlay */}
      <Animated.View style={[ds.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onGoHome} activeOpacity={1} />
      </Animated.View>

      {/* Bottom sheet card */}
      <Animated.View style={[ds.bottomSheet, { transform: [{ translateY: sheetSlide }] }]}>
        {/* Drag handle */}
        <View style={ds.sheetHandle} />
        <CardContent
          visible={visible}
          propertyId={propertyId}
          onGoHome={onGoHome}
          onAddAnother={onAddAnother}
        />
      </Animated.View>
    </Modal>
  );
};

// ── Main export — platform router ─────────────────────────────
const SubmissionSuccessPopup: React.FC<SubmissionSuccessPopupProps> = (props) => {
  if (IS_WEB) return <WebDialog {...props} />;
  return <MobileBottomSheet {...props} />;
};

export default SubmissionSuccessPopup;

// ── StyleSheet ────────────────────────────────────────────────
const ds = StyleSheet.create({
  // Confetti
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  } as any,

  // Overlay — deep dark semi-transparent
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // ── Web Card — ProDialog centered style ───────────────────────
  webCard: {
    backgroundColor: '#161B22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative' as any,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 24px 80px rgba(79,142,247,0.18), 0 8px 32px rgba(0,0,0,0.5)' }
      : {
          shadowColor: '#4F8EF7',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.18,
          shadowRadius: 48,
          elevation: 24,
        }
    ),
  },

  // Close button (web)
  closeBtn: {
    position: 'absolute' as any,
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // ── Mobile Bottom Sheet ────────────────────────────────────────
  bottomSheet: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161B22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    zIndex: 20,
    paddingBottom: 32,
    ...(Platform.OS === 'web'
      ? {}
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.5,
          shadowRadius: 32,
          elevation: 30,
        }
    ),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'center',
  },

  // ── Floating Icon ──────────────────────────────────────────────
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  iconPulseRing: {
    position: 'absolute' as any,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(79, 142, 247, 0.10)',
  },
  iconGlow: {
    position: 'absolute' as any,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(79, 142, 247, 0.13)',
  },
  iconBall: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F8EF7',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 28px rgba(79,142,247,0.55)' }
      : {
          shadowColor: '#4F8EF7',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.55,
          shadowRadius: 20,
          elevation: 10,
        }
    ),
  },

  // ── Title ──────────────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0F0F5',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  } as any,
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '400',
    paddingHorizontal: 28,
    marginBottom: 4,
  } as any,

  // ── ID Chip ────────────────────────────────────────────────────
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
    marginHorizontal: 24,
    gap: 8,
    alignSelf: 'stretch',
  },
  idIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as any,
  idValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  } as any,

  // ── Steps list ─────────────────────────────────────────────────
  stepsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
  },
  stepRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    gap: 12,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: { flex: 1 },
  stepRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  } as any,
  stepRowLabelActive: { color: '#F0F0F5' } as any,
  stepRowSublabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '400',
  } as any,
  stepActiveIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Action Buttons ─────────────────────────────────────────────
  actionsWrap: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 10,
  },
  primaryBtnWrap: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 20px rgba(79,142,247,0.35)' }
      : {
          shadowColor: '#4F8EF7',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        }
    ),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  } as any,
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    backgroundColor: 'rgba(129, 140, 248, 0.06)',
  },
  secondaryBtnText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  } as any,
});
