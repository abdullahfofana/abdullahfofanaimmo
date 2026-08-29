import React, { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Image,
  Alert,
  Modal,
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
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react-native';

import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useResponsive } from '@/constants/breakpoints';

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
        activeOpacity={0.8}
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { language, t } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { user, signOut } = useAuth();
  const { favoriteIds } = useFavorites();
  const { submissions } = usePropertySubmissions();

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const userName = user?.name || (language === 'fr' ? 'Jean Kouassi' : 'Jean Kouassi');
  const userEmail = user?.email || 'jean.kouassi@example.com';
  const userRole = user?.role || 'agent';

  const stats = [
    {
      value: `${submissions?.length || 0}`,
      label: language === 'fr' ? 'Annonces' : 'Listings',
      icon: <Building2 size={16} color={colors.primary} strokeWidth={2} />,
      onPress: () => router.push('/my-listings'),
    },
    {
      value: `${favoriteIds?.length || 0}`,
      label: language === 'fr' ? 'Favoris' : 'Saved',
      icon: <Heart size={16} color="#EF4444" strokeWidth={2} fill="#EF4444" />,
      onPress: () => router.push('/(tabs)/favorites'),
    },
    {
      value: '4.9 ★',
      label: language === 'fr' ? 'Confiance' : 'Rating',
      icon: <Star size={16} color={colors.accent} strokeWidth={2} fill={colors.accent} />,
      onPress: () => setShowRatingModal(true),
    },
  ];

  const handleLogout = () => {
    const title = language === 'fr' ? 'Déconnexion' : 'Log Out';
    const message = language === 'fr'
      ? 'Êtes-vous sûr de vouloir vous déconnecter de votre compte ImmoCI ?'
      : 'Are you sure you want to log out from ImmoCI?';
    const confirmText = language === 'fr' ? 'Se déconnecter' : 'Log Out';
    const cancelText = language === 'fr' ? 'Annuler' : 'Cancel';

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${message}`)) {
        signOut().then(() => router.replace('/auth'));
      }
    } else {
      Alert.alert(title, message, [
        { text: cancelText, style: 'cancel' },
        {
          text: confirmText,
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isDesktop ? 60 : 130,
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
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.88}
              onPress={() => router.push('/edit-profile')}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarEdit}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <Edit3 size={13} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.emailText}>{userEmail}</Text>

          {/* Verified badge */}
          <View style={styles.verifiedBadge}>
            <Shield size={12} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.verifiedText}>
              {userRole === 'agent'
                ? (language === 'fr' ? 'Agent Certifié ImmoCI' : 'Verified Agent')
                : (language === 'fr' ? 'Compte Acheteur Vérifié' : 'Verified Buyer')}
            </Text>
          </View>
        </View>

        {/* ── STATS CARD ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={s.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.statIconRow}>{s.icon}</View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </TouchableOpacity>
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
            <Text style={styles.addCtaTitle}>{t('nav_add_property') || 'Publier une annonce'}</Text>
            <Text style={styles.addCtaSub}>
              {language === 'fr'
                ? 'Vendez ou louez votre bien en quelques clics'
                : 'Sell or rent your property in a few taps'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>

        {/* ── MY ACCOUNT ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile_my_account') || 'Mon Compte'}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Heart size={17} color="#EF4444" strokeWidth={2} />}
              iconBg="rgba(239,68,68,0.10)"
              title={t('profile_my_favorites') || 'Mes Favoris'}
              subtitle={`${favoriteIds?.length || 0} ${language === 'fr' ? 'biens enregistrés' : 'saved properties'}`}
              onPress={() => router.push('/(tabs)/favorites')}
              colors={colors}
            />
            <MenuItem
              icon={<Building2 size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title={t('profile_my_listings') || 'Mes Annonces'}
              subtitle={`${submissions?.length || 0} ${language === 'fr' ? 'annonces publiées' : 'active listings'}`}
              onPress={() => router.push('/my-listings')}
              colors={colors}
            />
            <MenuItem
              icon={<Bell size={17} color={colors.accent} strokeWidth={2} />}
              iconBg={colors.accentMuted}
              title={language === 'fr' ? 'Notifications & Alertes' : 'Notifications & Alerts'}
              subtitle={language === 'fr' ? 'Alertes de recherche & mises à jour' : 'Search alerts & updates'}
              onPress={() => setShowNotificationsModal(true)}
              colors={colors}
            />
            <MenuItem
              icon={<LayoutDashboard size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title="Dashboard Pro"
              subtitle={language === 'fr' ? 'Statistiques & performance marché' : 'Analytics & market insights'}
              onPress={() => router.push('/dashboard')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* ── ADMIN ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADMINISTRATION</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Shield size={17} color={colors.primary} strokeWidth={2} />}
              iconBg={colors.surfaceGreen}
              title="Admin & Modération"
              subtitle={language === 'fr' ? 'Gérer les annonces & utilisateurs' : 'Manage listings & users'}
              onPress={() => router.push('/admin')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* ── SETTINGS ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile_settings') || 'Paramètres'}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Settings size={17} color={colors.textSecondary} strokeWidth={2} />}
              iconBg={colors.backgroundSecondary}
              title={t('profile_settings') || 'Paramètres généraux'}
              onPress={() => router.push('/settings')}
              colors={colors}
            />
            <MenuItem
              icon={<HelpCircle size={17} color="#3B82F6" strokeWidth={2} />}
              iconBg="rgba(59,130,246,0.10)"
              title={t('profile_help') || 'Aide & Support'}
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
              title={t('profile_logout') || 'Se déconnecter'}
              onPress={handleLogout}
              showChevron={false}
              colors={colors}
              danger
              isLast
            />
          </View>
        </View>
      </ScrollView>

      {/* ── NOTIFICATIONS MODAL ───────────────────────────────────── */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell size={20} color="#059669" />
                <Text style={styles.modalTitle}>
                  {language === 'fr' ? 'Alertes & Notifications' : 'Alerts & Notifications'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              {language === 'fr'
                ? '🔔 Vos alertes de recherche pour Abidjan et Cocody sont actives. Vous recevrez instantanément une notification dès qu’un bien correspondant à vos critères est publié.'
                : '🔔 Your search alerts for Abidjan & Cocody are active. You will receive instant notifications when matching properties are listed.'}
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setShowNotificationsModal(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {language === 'fr' ? 'D’accord' : 'Got it'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── RATING MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Star size={20} color="#D97706" fill="#D97706" />
                <Text style={styles.modalTitle}>
                  {language === 'fr' ? 'Score de Confiance : 4.9/5' : 'Trust Score: 4.9/5'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              {language === 'fr'
                ? '⭐ Ce score est basé sur la vérification des titres fonciers (ACD), la réactivité aux messages et les avis des acheteurs vérifiés sur la plateforme ImmoCI.'
                : '⭐ This score is calculated from deed verifications (ACD), message responsiveness, and feedback from verified buyers on ImmoCI.'}
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setShowRatingModal(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {language === 'fr' ? 'Fermer' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },

  // ── Modal Styles ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
