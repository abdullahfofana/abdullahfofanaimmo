import React, { useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Heart,
  Building2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Plus,
  LayoutDashboard,
  Shield,
  Bell,
  Star,
  Edit3,
} from 'lucide-react-native';

import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/colors';

// ── Row menu item ─────────────────────────────────────────────────────────────
interface MenuItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  colors: typeof ThemeColors.light;
  danger?: boolean;
  isLast?: boolean;
}

function MenuItem({
  icon, iconBg, title, subtitle, onPress,
  showChevron = true, colors, danger, isLast,
}: MenuItemProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onIn = () =>
    Animated.spring(pressAnim, { toValue: 0.975, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        style={[
          mStyles.row,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
        ]}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <View style={mStyles.left}>
          <View style={[mStyles.iconBox, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[mStyles.title, { color: danger ? colors.error : colors.text }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[mStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            )}
          </View>
        </View>
        {showChevron && <ChevronRight size={15} color={colors.textMuted} strokeWidth={2} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const mStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

import { useResponsive } from '@/constants/breakpoints';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { t } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const stats = [
    { value: '3', label: 'Listings', icon: <Building2 size={15} color={colors.primary} strokeWidth={2} /> },
    { value: '12', label: 'Saved', icon: <Heart size={15} color="#EF4444" strokeWidth={2} fill="#EF4444" /> },
    { value: '4.9', label: 'Rating', icon: <Star size={15} color={colors.accent} strokeWidth={2} fill={colors.accent} /> },
  ];

  return (
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isDesktop ? 60 : 120,
          maxWidth: 680,
          width: '100%',
          alignSelf: 'center',
        }}
      >

        {/* ── HEADER BLOCK ──────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Background wash */}
          <View style={styles.headerBg} />

          {/* Avatar */}
          <View style={styles.avatarShell}>
            <View style={styles.avatar}>
              <User size={38} color={colors.primary} strokeWidth={1.5} />
            </View>
            <TouchableOpacity style={styles.avatarEdit} onPress={() => router.push('/edit-profile')}>
              <Edit3 size={12} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>Jean Kouassi</Text>
          <Text style={styles.emailText}>jean.kouassi@example.com</Text>

          {/* Verified badge */}
          <View style={styles.verifiedBadge}>
            <Shield size={10} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.verifiedText}>Verified Agent</Text>
          </View>
        </View>

        {/* ── STATS CARD ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>{s.icon}</View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < stats.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── ADD PROPERTY CTA ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.addCta}
          onPress={() => router.push('/add-property')}
          activeOpacity={0.9}
        >
          <View style={styles.addCtaIcon}>
            <Plus size={20} color={colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addCtaTitle}>{t('nav_add_property')}</Text>
            <Text style={styles.addCtaSub}>{t('add_property_cta')}</Text>
          </View>
          <ChevronRight size={18} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>

        {/* ── MY ACCOUNT ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile_my_account')}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Heart size={17} color="#EF4444" strokeWidth={2} />}
              iconBg="rgba(239,68,68,0.10)"
              title={t('profile_my_favorites')}
              subtitle="12 saved properties"
              onPress={() => router.push('/(tabs)/favorites')}
              colors={colors}
            />
            <MenuItem
              icon={<Building2 size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title={t('profile_my_listings')}
              subtitle="3 active listings"
              onPress={() => router.push('/my-listings')}
              colors={colors}
            />
            <MenuItem
              icon={<Bell size={17} color={colors.accent} strokeWidth={2} />}
              iconBg={colors.accentMuted}
              title="Notifications"
              subtitle="Search alerts & updates"
              onPress={() => {}}
              colors={colors}
            />
            <MenuItem
              icon={<LayoutDashboard size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title="Dashboard"
              subtitle="Analytics & performance"
              onPress={() => router.push('/dashboard')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* ── ADMIN ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Admin</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Shield size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title="Admin Dashboard"
              subtitle="Manage listings & users"
              onPress={() => router.push('/admin')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* ── SETTINGS ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile_settings')}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Settings size={17} color={colors.textSecondary} strokeWidth={2} />}
              iconBg={colors.backgroundSecondary}
              title={t('profile_settings')}
              onPress={() => router.push('/settings')}
              colors={colors}
            />
            <MenuItem
              icon={<HelpCircle size={17} color="#3B82F6" strokeWidth={2} />}
              iconBg="rgba(59,130,246,0.10)"
              title={t('profile_help')}
              onPress={() => router.push('/help')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* ── LOGOUT ─────────────────────────────────────────────── */}
        <View style={[styles.section, { marginBottom: Spacing.xl }]}>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<LogOut size={17} color="#EF4444" strokeWidth={2} />}
              iconBg="rgba(239,68,68,0.10)"
              title={t('profile_logout')}
              onPress={() => {}}
              showChevron={false}
              colors={colors}
              danger
              isLast
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl + 10,
    position: 'relative',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    // Bottom arch effect
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  // Avatar
  avatarShell: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  emailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Stats card ───────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: -20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(18,28,20,0.10)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 18 },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 20px rgba(18,28,20,0.09)' },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 3,
  },
  statIconRow: { marginBottom: 1 },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.borderLight,
    marginVertical: Spacing.md,
  },

  // ── Add property CTA ─────────────────────────────────────────────────────
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceGreen,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  addCtaSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 9,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
