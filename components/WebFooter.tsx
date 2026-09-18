import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { useLanguage } from '@/providers/LanguageProvider';
import { getMaxContentWidth, useResponsive } from '@/constants/breakpoints';

export default function WebFooter() {
  const { language } = useLanguage();
  const { isDesktop, width } = useResponsive();
  const maxContentWidth = getMaxContentWidth(width);

  if (!isDesktop) return null;

  const navigateTo = (pathname: string, params?: Record<string, any>) => {
    router.push({ pathname: pathname as any, params });
  };

  const text = {
    brandTagline: {
      fr: "Immobilier Côte d'Ivoire",
      en: "Ivory Coast Real Estate",
      ar: "عقارات ساحل العاج",
    },
    brandDesc: {
      fr: "La plateforme de référence pour l'achat, la vente et la location de biens immobiliers certifiés à Abidjan et dans toute la Côte d'Ivoire.",
      en: "The premier platform for buying, renting, and selling verified real estate in Abidjan and across Ivory Coast.",
      ar: "المنصة الرائدة والمعتمدة لبيع وشراء وتأجير العقارات الموثقة في أبيدجان وكافة أنحاء ساحل العاج.",
    },
    trustBadge: {
      fr: "Annonces 100% Vérifiées & Sécurisées",
      en: "100% Verified & Secure Listings",
      ar: "إعلانات موثقة وآمنة بنسبة 100%",
    },
    colRealEstate: {
      fr: "Immobilier",
      en: "Real Estate",
      ar: "عقارات",
    },
    forSale: {
      fr: "Biens à Vendre (Acheter)",
      en: "Properties for Sale (Buy)",
      ar: "عقارات للبيع (شراء)",
    },
    forRent: {
      fr: "Biens à Louer (Location)",
      en: "Properties for Rent (Rent)",
      ar: "عقارات للإيجار",
    },
    luxuryVillas: {
      fr: "Villas de Prestige",
      en: "Luxury Villas",
      ar: "فيلات فاخرة",
    },
    apartments: {
      fr: "Appartements Meublés & Non Meublés",
      en: "Furnished & Unfurnished Apartments",
      ar: "شقق مفروشة وغير مفروشة",
    },
    addListing: {
      fr: "+ Publier une Annonce",
      en: "+ List a Property",
      ar: "+ نشر إعلان عقاري",
    },
    colLocations: {
      fr: "Quartiers Prisés",
      en: "Top Locations",
      ar: "أشهر الأحياء والمناطق",
    },
    colSupport: {
      fr: "Support & Contact",
      en: "Support & Contact",
      ar: "الدعم والمساعدة",
    },
    helpCenter: {
      fr: "Centre d'Aide & FAQ",
      en: "Help Center & FAQ",
      ar: "مركز المساعدة والأسئلة الشائعة",
    },
    myFavorites: {
      fr: "Mes Favoris Sauvegardés",
      en: "My Saved Favorites",
      ar: "عقاراتي المفضلة",
    },
    adminPortal: {
      fr: "Espace Professionnel & Admin",
      en: "Agent & Admin Portal",
      ar: "بوابة الوكلاء والإدارة",
    },
    copyright: {
      fr: `© ${new Date().getFullYear()} ImmoCI. Tous droits réservés.`,
      en: `© ${new Date().getFullYear()} ImmoCI. All rights reserved.`,
      ar: `© ${new Date().getFullYear()} ImmoCI. جميع الحقوق محفوظة.`,
    },
    legalNotice: {
      fr: "Mentions Légales",
      en: "Legal Notice",
      ar: "الشروط القانونية",
    },
    privacyPolicy: {
      fr: "Confidentialité",
      en: "Privacy Policy",
      ar: "سياسة الخصوصية",
    },
    termsOfService: {
      fr: "Conditions d'Utilisation",
      en: "Terms of Service",
      ar: "شروط الاستخدام",
    },
  };

  const get = (key: keyof typeof text) => text[key][language] || text[key].fr;

  return (
    <View style={styles.footerWrapper}>
      {/* Top Divider with Emerald Accent */}
      <View style={styles.topAccentBar} />

      <View style={[styles.container, { maxWidth: maxContentWidth }]}>
        {/* ── 4-COLUMN FOOTER CONTENT ─────────────────────────────────── */}
        <View style={styles.gridContainer}>
          {/* Column 1: Brand & Bio */}
          <View style={styles.colBrand}>
            <TouchableOpacity
              style={styles.brandRow}
              onPress={() => navigateTo('/(tabs)/home')}
              activeOpacity={0.85}
            >
              <View style={styles.logoBadge}>
                <Building2 size={20} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <View>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitleImmo}>Immo</Text>
                  <Text style={styles.brandTitleCI}>CI</Text>
                </View>
                <Text style={styles.brandTagline}>{get('brandTagline')}</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.brandDesc}>{get('brandDesc')}</Text>

            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color="#059669" strokeWidth={2.2} />
              <Text style={styles.trustBadgeText}>{get('trustBadge')}</Text>
            </View>
          </View>

          {/* Column 2: Navigation (Acheter & Louer) */}
          <View style={styles.colSection}>
            <Text style={styles.colTitle}>{get('colRealEstate')}</Text>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'sale' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('forSale')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'rent' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('forRent')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'all', type: 'villa' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('luxuryVillas')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'all', type: 'apartment' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('apartments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/add-property')}
              activeOpacity={0.75}
            >
              <Text style={[styles.linkText, styles.highlightLink]}>{get('addListing')}</Text>
            </TouchableOpacity>
          </View>

          {/* Column 3: Quartiers Populaires */}
          <View style={styles.colSection}>
            <Text style={styles.colTitle}>{get('colLocations')}</Text>

            {[
              { label: 'Cocody (Ambassades, Danga)', slug: 'cocody' },
              { label: 'Riviera (3, 4, Golf, Beverly)', slug: 'riviera' },
              { label: 'Deux Plateaux & Vallon', slug: 'deux-plateaux' },
              { label: 'Marcory & Zone 4', slug: 'marcory' },
              { label: 'Plateau (Centre des Affaires)', slug: 'plateau' },
              { label: 'Bingerville & Grand-Bassam', slug: 'bingerville' },
            ].map((loc) => (
              <TouchableOpacity
                key={loc.slug}
                style={styles.linkItem}
                onPress={() => navigateTo(`/area/abidjan/${loc.slug}`)}
                activeOpacity={0.75}
              >
                <MapPin size={12} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.linkText}>{loc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Column 4: Support & Contact */}
          <View style={styles.colSection}>
            <Text style={styles.colTitle}>{get('colSupport')}</Text>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/help')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('helpCenter')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/favorites')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('myFavorites')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/admin')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>{get('adminPortal')}</Text>
            </TouchableOpacity>

            <View style={styles.contactBox}>
              <View style={styles.contactItem}>
                <Phone size={13} color="#059669" />
                <Text style={styles.contactText}>+225 07 00 00 00 00</Text>
              </View>
              <View style={styles.contactItem}>
                <Mail size={13} color="#059669" />
                <Text style={styles.contactText}>contact@immoci.ci</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── BOTTOM COPYRIGHT & LEGAL BAR ──────────────────────────── */}
        <View style={styles.bottomBar}>
          <Text style={styles.copyrightText}>{get('copyright')}</Text>

          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>{get('legalNotice')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>{get('privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>{get('termsOfService')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrapper: {
    width: '100%',
    backgroundColor: '#0F172A',
    marginTop: 40,
  },
  topAccentBar: {
    height: 3,
    backgroundColor: '#059669',
    width: '100%',
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 36,
    justifyContent: 'space-between',
  },
  colBrand: {
    flex: 1.4,
    minWidth: 260,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitleImmo: {
    fontSize: 21,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  brandTitleCI: {
    fontSize: 21,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  brandDesc: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#94A3B8',
    marginBottom: 20,
    maxWidth: 320,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
  },
  colSection: {
    flex: 1,
    minWidth: 170,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 18,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '400',
    transitionDuration: '150ms' as any,
  },
  highlightLink: {
    color: '#34D399',
    fontWeight: '700',
    marginTop: 4,
  },
  contactBox: {
    marginTop: 16,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bottomBar: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  copyrightText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalLink: {
    fontSize: 12.5,
    color: '#64748B',
  },
  legalDivider: {
    color: '#475569',
    fontSize: 12,
  },
});
