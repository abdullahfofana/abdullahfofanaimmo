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
  MessageSquare,
  Calendar,
  ExternalLink,
  Briefcase,
  Monitor,
  Headphones,
} from 'lucide-react-native';
import { Linking } from 'react-native';

import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useResponsive } from '@/constants/breakpoints';
import { useChat } from '@/providers/ChatProvider';

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
  const { conversations, openSupportChat } = useChat();

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const isMobile = Platform.OS !== 'web';
  const userName = user?.name || (language === 'fr' ? 'Client ImmoCI' : 'ImmoCI Client');
  const userEmail = user?.email || 'client@immoci.ci';
  const userRole = user?.role || 'renter';

  // Strict Customer-Only Mobile: business/admin roles exist exclusively on Desktop Web
  const isBusiness = !isMobile && (userRole === 'agent' || userRole === 'landlord');
  const isAdmin = !isMobile && (userRole === 'admin' || userRole === 'super_admin');
  const isCustomer = !isBusiness && !isAdmin;

  const stats = useMemo(() => {
    if (isBusiness) {
      return [
        {
          value: `${submissions?.length || 0}`,
          label: language === 'fr' ? 'Mes Biens' : 'Listings',
          icon: <Building2 size={16} color={colors.primary} strokeWidth={2} />,
          onPress: () => router.push('/my-listings'),
        },
        {
          value: `${conversations?.length || 0}`,
          label: language === 'fr' ? 'Demandes' : 'Inquiries',
          icon: <MessageSquare size={16} color="#3B82F6" strokeWidth={2} />,
          onPress: () => router.push('/dashboard'),
        },
        {
          value: '4.9 ★',
          label: language === 'fr' ? 'Note Pro' : 'Rating',
          icon: <Star size={16} color={colors.accent} strokeWidth={2} fill={colors.accent} />,
          onPress: () => setShowRatingModal(true),
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          value: 'Web',
          label: language === 'fr' ? 'Portail' : 'Portal',
          icon: <Monitor size={16} color="#D97706" strokeWidth={2} />,
          onPress: () => Linking.openURL('https://abdullahfofanaimmo.vercel.app/admin').catch(() => {}),
        },
        {
          value: '0',
          label: language === 'fr' ? 'Admin Mobile' : 'Mobile Admin',
          icon: <Shield size={16} color="#EF4444" strokeWidth={2} />,
          onPress: () => {},
        },
        {
          value: 'Admin',
          label: language === 'fr' ? 'Rôle Système' : 'System Role',
          icon: <Shield size={16} color={colors.primary} strokeWidth={2} />,
          onPress: () => {},
        },
      ];
    }

    // Default: Customer
    return [
      {
        value: `${favoriteIds?.length || 0}`,
        label: language === 'fr' ? 'Favoris' : 'Saved',
        icon: <Heart size={16} color="#EF4444" strokeWidth={2} fill="#EF4444" />,
        onPress: () => router.push('/(tabs)/favorites'),
      },
      {
        value: `${conversations?.length || 0}`,
        label: language === 'fr' ? 'Demandes' : 'Inquiries',
        icon: <MessageSquare size={16} color="#10B981" strokeWidth={2} />,
        onPress: () => setShowRequestsModal(true),
      },
      {
        value: '24/7',
        label: language === 'fr' ? 'Support' : 'Support',
        icon: <Headphones size={16} color="#059669" strokeWidth={2} />,
        onPress: () => {
          if (openSupportChat) openSupportChat();
        },
      },
    ];
  }, [isBusiness, isAdmin, submissions, conversations, favoriteIds, language, colors, openSupportChat]);

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

          {/* Role badge */}
          <View
            style={[
              styles.verifiedBadge,
              isBusiness && { backgroundColor: '#059669' },
              isAdmin && { backgroundColor: '#D97706' },
              isCustomer && { backgroundColor: '#0284C7' },
            ]}
          >
            {isBusiness ? (
              <Building2 size={12} color="#FFFFFF" strokeWidth={2.5} />
            ) : isAdmin ? (
              <Shield size={12} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <User size={12} color="#FFFFFF" strokeWidth={2.5} />
            )}
            <Text style={styles.verifiedText}>
              {isBusiness
                ? (language === 'fr' ? 'Compte Pro • Agent / Agence' : 'Business Account • Agent')
                : isAdmin
                ? (language === 'fr' ? 'Compte Administrateur (Web Exclusif)' : 'Admin Account (Web Only)')
                : (language === 'fr' ? 'Compte Client • Acheteur / Locataire' : 'Customer Account • Buyer / Renter')}
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

        {/* ── ADMIN ACCESS (WEB ONLY) ─────────────────────────────── */}
        {isAdmin && (
          <View style={styles.adminNoticeCard}>
            <View style={styles.adminNoticeIconRow}>
              <View style={styles.adminNoticeIconBox}>
                <Shield size={22} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminNoticeTitle}>
                  Espace Administration ImmoCI
                </Text>
                <Text style={styles.adminNoticeSubtitle}>
                  Accédez aux outils de modération des annonces, gestion des utilisateurs et rapports de performance.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.adminWebBtn}
              onPress={() => router.push('/admin')}
              activeOpacity={0.85}
            >
              <ExternalLink size={15} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.adminWebBtnText}>Ouvrir le Tableau de Bord Admin</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── BUSINESS OWNER / STAFF EXPERIENCE ──────────────────── */}
        {isBusiness && (
          <>
            {/* Add Property CTA */}
            <TouchableOpacity
              style={styles.addCta}
              onPress={() => router.push('/add-property')}
              activeOpacity={0.9}
            >
              <View style={styles.addCtaIcon}>
                <Plus size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addCtaTitle}>Publier un nouveau bien</Text>
                <Text style={styles.addCtaSub}>
                  Ajouter une villa, appartement ou terrain avec géolocalisation
                </Text>
              </View>
              <ChevronRight size={18} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GESTION BUSINESS & PRO</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon={<LayoutDashboard size={17} color={colors.primary} strokeWidth={2} />}
                  iconBg={colors.surfaceGreen}
                  title="Dashboard Business Pro"
                  subtitle="Statistiques, leads & performance marché"
                  onPress={() => router.push('/dashboard')}
                  colors={colors}
                />
                <MenuItem
                  icon={<Building2 size={17} color={colors.primary} strokeWidth={2} />}
                  iconBg={colors.surfaceGreen}
                  title="Mes Annonces & Mandats"
                  subtitle={`${submissions?.length || 0} biens sous gestion`}
                  onPress={() => router.push('/my-listings')}
                  colors={colors}
                />
                <MenuItem
                  icon={<MessageSquare size={17} color="#3B82F6" strokeWidth={2} />}
                  iconBg="rgba(59,130,246,0.10)"
                  title="Demandes & Messages Clients"
                  subtitle={`${conversations?.length || 0} discussions actives`}
                  onPress={() => setShowRequestsModal(true)}
                  colors={colors}
                />
                <MenuItem
                  icon={<Bell size={17} color={colors.accent} strokeWidth={2} />}
                  iconBg={colors.accentMuted}
                  title="Notifications Business"
                  subtitle="Alertes nouveaux prospects & mandats"
                  onPress={() => setShowNotificationsModal(true)}
                  colors={colors}
                  isLast
                />
              </View>
            </View>
          </>
        )}

        {/* ── CUSTOMER EXPERIENCE ─────────────────────────────────── */}
        {isCustomer && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MON ESPACE CLIENT</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon={<Heart size={17} color="#EF4444" strokeWidth={2} />}
                  iconBg="rgba(239,68,68,0.10)"
                  title="Mes Favoris"
                  subtitle={`${favoriteIds?.length || 0} biens enregistrés`}
                  onPress={() => router.push('/(tabs)/favorites')}
                  colors={colors}
                />
                <MenuItem
                  icon={<Calendar size={17} color="#3B82F6" strokeWidth={2} />}
                  iconBg="rgba(59,130,246,0.10)"
                  title="Mes Demandes & Visites"
                  subtitle="Suivi des visites planifiées & demandes"
                  onPress={() => setShowRequestsModal(true)}
                  colors={colors}
                />
                <MenuItem
                  icon={<MessageSquare size={17} color="#10B981" strokeWidth={2} />}
                  iconBg="rgba(16,185,129,0.10)"
                  title="Messages & Contacts Agences"
                  subtitle={`${conversations?.length || 0} échanges en cours`}
                  onPress={() => setShowRequestsModal(true)}
                  colors={colors}
                />
                <MenuItem
                  icon={<Bell size={17} color={colors.accent} strokeWidth={2} />}
                  iconBg={colors.accentMuted}
                  title="Alertes de Recherche"
                  subtitle="Notifications sur les baisses de prix"
                  onPress={() => setShowNotificationsModal(true)}
                  colors={colors}
                  isLast
                />
              </View>
            </View>

            {/* 1-Tap Customer Care Support Card */}
            <TouchableOpacity
              style={styles.customerCareCard}
              onPress={() => {
                if (openSupportChat) openSupportChat();
              }}
              activeOpacity={0.88}
            >
              <View style={styles.customerCareIconWrap}>
                <Headphones size={22} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.customerCareTitle}>Assistance & Conseiller ACD</Text>
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.customerCareSub}>
                  Discutez en direct avec Fatou Diallo • Conseil personnalisé & vérification juridique
                </Text>
              </View>
              <ChevronRight size={18} color="#059669" strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SÉCURITÉ CADASTRE & ACD</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon={<Shield size={17} color="#059669" strokeWidth={2} />}
                  iconBg="rgba(5,150,105,0.10)"
                  title="Guide ACD & Titre Foncier"
                  subtitle="Comprendre la vérification juridique en Côte d'Ivoire"
                  onPress={() => setShowRatingModal(true)}
                  colors={colors}
                />
                <MenuItem
                  icon={<Headphones size={17} color="#3B82F6" strokeWidth={2} />}
                  iconBg="rgba(59,130,246,0.10)"
                  title="Contacter le Service Client"
                  subtitle="Fatou Diallo • Support client 7j/7"
                  onPress={() => {
                    if (openSupportChat) openSupportChat();
                  }}
                  colors={colors}
                  isLast
                />
              </View>
            </View>
          </>
        )}

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

      {/* ── REQUESTS & INQUIRIES MODAL ────────────────────────────── */}
      <Modal
        visible={showRequestsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={20} color="#059669" />
                <Text style={styles.modalTitle}>
                  {isBusiness ? 'Demandes & Messages Clients' : 'Mes Demandes & Visites'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {conversations && conversations.length > 0 ? (
                conversations.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.requestItemCard}
                    onPress={() => {
                      setShowRequestsModal(false);
                      if (c.propertyId) router.push(`/property/${c.propertyId}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.requestIcon}>
                      <Calendar size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestTitle} numberOfLines={1}>
                        {c.property?.title || 'Demande de visite'}
                      </Text>
                      <Text style={styles.requestSubtitle} numberOfLines={1}>
                        {c.lastMessage || 'Demande d\'information reçue'}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                    {isBusiness
                      ? 'Aucune demande client en attente pour le moment.'
                      : 'Vous n’avez aucune visite planifiée pour le moment.'}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setShowRequestsModal(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>Fermer</Text>
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

  // ── Admin Web Notice Card ────────────────────────────────────────────────
  adminNoticeCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  adminNoticeIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  adminNoticeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminNoticeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 3,
  },
  adminNoticeSubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  adminWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminWebBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Customer Care Direct Support Card ────────────────────────────────────
  customerCareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(5, 150, 105, 0.22)',
  },
  customerCareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  customerCareTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  customerCareSub: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  customerUpgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(5, 150, 105, 0.22)',
  },
  customerUpgradeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  customerUpgradeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  customerUpgradeSub: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },

  // ── Requests & Inquiries Modal ───────────────────────────────────────────
  requestItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
});
