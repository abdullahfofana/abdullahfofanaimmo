import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const { t, language } = useLanguage();
  const { isDesktop, width } = useResponsive();
  const maxContentWidth = getMaxContentWidth(width);

  if (!isDesktop) return null;

  const navigateTo = (pathname: string, params?: Record<string, any>) => {
    router.push({ pathname: pathname as any, params });
  };

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
                <Text style={styles.brandTagline}>Immobilier Côte d&apos;Ivoire</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.brandDesc}>
              {language === 'fr'
                ? "La plateforme de référence pour l'achat, la vente et la location de biens immobiliers certifiés à Abidjan et dans toute la Côte d'Ivoire."
                : 'The premier platform for buying, renting, and selling verified real estate in Abidjan and across Ivory Coast.'}
            </Text>

            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color="#059669" strokeWidth={2.2} />
              <Text style={styles.trustBadgeText}>
                {language === 'fr' ? 'Annonces 100% Vérifiées & Sécurisées' : '100% Verified & Secure Listings'}
              </Text>
            </View>
          </View>

          {/* Column 2: Navigation (Acheter & Louer) */}
          <View style={styles.colSection}>
            <Text style={styles.colTitle}>
              {language === 'fr' ? 'Immobilier' : 'Real Estate'}
            </Text>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'sale' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Biens à Vendre (Acheter)' : 'Properties for Sale (Buy)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'rent' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Biens à Louer (Location)' : 'Properties for Rent (Rent)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'all', type: 'villa' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Villas de Prestige' : 'Luxury Villas'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/search', { status: 'all', type: 'apartment' })}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Appartements Meublés & Non Meublés' : 'Apartments'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/add-property')}
              activeOpacity={0.75}
            >
              <Text style={[styles.linkText, styles.highlightLink]}>
                {language === 'fr' ? '+ Publier une Annonce' : '+ List a Property'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Column 3: Quartiers Populaires */}
          <View style={styles.colSection}>
            <Text style={styles.colTitle}>
              {language === 'fr' ? 'Quartiers Prisés' : 'Top Locations'}
            </Text>

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
            <Text style={styles.colTitle}>
              {language === 'fr' ? 'Support & Contact' : 'Support & Contact'}
            </Text>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/help')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? "Centre d'Aide & FAQ" : 'Help Center & FAQ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/(tabs)/favorites')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Mes Favoris Sauvegardés' : 'My Saved Favorites'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigateTo('/dashboard')}
              activeOpacity={0.75}
            >
              <Text style={styles.linkText}>
                {language === 'fr' ? 'Espace Professionnel & Admin' : 'Agent & Admin Portal'}
              </Text>
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
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} ImmoCI. Tous droits réservés.
          </Text>

          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? 'Mentions Légales' : 'Legal Notice'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? 'Confidentialité' : 'Privacy Policy'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity onPress={() => navigateTo('/help')} activeOpacity={0.75}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? 'Conditions d’Utilisation' : 'Terms of Service'}
              </Text>
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
    paddingTop: 48,
    paddingBottom: 28,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 32,
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Col 1: Brand
  colBrand: {
    flex: 1.2,
    minWidth: 260,
    gap: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer' as any,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleImmo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandTitleCI: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    marginTop: -2,
    letterSpacing: 0.2,
  },
  brandDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '400',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trustBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34D399',
  },

  // Sections
  colSection: {
    flex: 1,
    minWidth: 190,
    gap: 10,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    cursor: 'pointer' as any,
  },
  linkText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      },
    }),
  },
  highlightLink: {
    color: '#34D399',
    fontWeight: '700',
  },

  // Contact Box
  contactBox: {
    marginTop: 8,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 24,
  },
  copyrightText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalLink: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      },
    }),
  },
  legalDivider: {
    fontSize: 10,
    color: '#475569',
  },
});
