import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Plus, MapPin, Eye, Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useResponsive } from '@/constants/breakpoints';
import WebNavbar from '@/components/WebNavbar';

export default function MyListingsScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { submissions } = usePropertySubmissions();
  const { language } = useLanguage();
  const loc = (fr: string, en: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const { isDesktop } = useResponsive();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#059669',
          label: loc('Publiée', 'Approved', 'موافق عليه'),
          icon: <CheckCircle2 size={12} color="#059669" />,
        };
      case 'rejected':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#DC2626',
          label: loc('Refusée', 'Rejected', 'مرفوض'),
          icon: <AlertCircle size={12} color="#DC2626" />,
        };
      default:
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#D97706',
          label: loc('En vérification (24h)', 'Pending Review', 'قيد الفحص (24 ساعة)'),
          icon: <Clock size={12} color="#D97706" />,
        };
    }
  };

  return (
    <View style={styles.container}>
      {isDesktop && <WebNavbar />}
      <Stack.Screen
        options={{
          title: loc('Mes Annonces', 'My Listings', 'إعلاناتي'),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-property')}
              style={styles.addButton}
              activeOpacity={0.8}
            >
              <Plus size={22} color="#059669" strokeWidth={2.5} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#0F172A', fontWeight: '800' },
        }}
      />

      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Building2 size={36} color="#059669" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>
              {loc('Aucune annonce publiée', 'No properties listed yet', 'لم يتم نشر أي إعلان بعد')}
            </Text>
            <Text style={styles.emptyText}>
              {loc(
                'Publiez votre bien immobilier et touchez des milliers d’acheteurs et locataires à Abidjan.',
                'Publish your real estate property and reach thousands of buyers and renters in Ivory Coast.',
                'انشر عقارك واستقطب آلاف المشترين والمستأجرين في كوت ديفوار.'
              )}
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/add-property')}
              activeOpacity={0.88}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.ctaButtonText}>
                {loc('Ajouter une annonce', 'Add New Property', 'إضافة عقار جديد')}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.submissionStatus);
          const firstPhoto = item.photos?.[0] || (item as any).images?.[0];

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/property/${item.id}`)}
              activeOpacity={0.9}
            >
              <View style={styles.cardImageWrap}>
                {firstPhoto ? (
                  <Image source={{ uri: firstPhoto }} style={styles.cardThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Building2 size={24} color="#64748B" />
                  </View>
                )}
                <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  {badge.icon}
                  <Text style={[styles.statusPillText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardPrice}>
                  {(item.price || 0).toLocaleString()} FCFA
                  {item.status === 'rent' ? ' /mois' : ''}
                </Text>

                <View style={styles.locationRow}>
                  <MapPin size={12} color="#64748B" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.location?.district || item.location?.city || 'Abidjan'}
                  </Text>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.cardDate}>
                    {loc('Publié le ', 'Listed on ', 'تاريخ النشر ')}
                    {new Date(item.submittedAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.viewLink}>
                    <Eye size={13} color="#059669" />
                    <Text style={styles.viewLinkText}>
                      {loc('Voir', 'View', 'عرض')}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  list: {
    padding: Spacing.lg,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: Platform.OS === 'web' ? Spacing.sm : 0,
  },
  addButton: {
    padding: Spacing.xs,
    marginRight: Platform.OS === 'web' ? Spacing.sm : 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageWrap: {
    width: '100%',
    height: 150,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDate: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
}

