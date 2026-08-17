import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Globe, Lock, Bell, Mail, Palette, Terminal, Save, Key, Webhook, Copy, Eye, EyeOff, Check } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

type SettingsTab = 'general' | 'security' | 'notifications' | 'email' | 'appearance' | 'advanced';

export default function AdminSettings() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme !== 'light';
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApproveVerified, setAutoApproveVerified] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const stitch = {
    bg: isDark ? '#0B0F19' : '#F6F8FC',
    surface: isDark ? '#161F30' : '#FFFFFF',
    surfaceHover: isDark ? '#1E293B' : '#F8FAFC',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    inputBg: isDark ? '#1E293B' : '#F8FAFC',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    tabBg: isDark ? '#111827' : '#F1F5F9',
    tabActiveBg: isDark ? '#1E293B' : '#FFFFFF',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: language === 'fr' ? 'Général' : 'General', icon: Globe },
    { id: 'security', label: language === 'fr' ? 'Sécurité' : 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'appearance', label: language === 'fr' ? 'Apparence' : 'Appearance', icon: Palette },
    { id: 'advanced', label: language === 'fr' ? 'Avancé' : 'Advanced', icon: Terminal },
  ];

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const renderGeneralSettings = () => (
    <View style={[styles.card, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
      <View style={[styles.cardHeader, { borderBottomColor: stitch.cardBorder }]}>
        <View style={[styles.iconBadge, { backgroundColor: stitch.primaryLight }]}>
          <Globe size={18} color={stitch.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: stitch.textPrimary }]}>
          {language === 'fr' ? 'Paramètres Généraux de la Plateforme' : 'General Platform Settings'}
        </Text>
      </View>

      <View style={styles.formGrid}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: stitch.textPrimary }]}>
            {language === 'fr' ? 'Nom du Site / Marque' : 'Site Name'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
            defaultValue="ImmoCI"
            placeholder={language === 'fr' ? 'Nom de la plateforme' : 'Enter site name'}
            placeholderTextColor={stitch.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: stitch.textPrimary }]}>
            {language === 'fr' ? 'Email de Contact Officiel' : 'Contact Email'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
            defaultValue="contact@immoci.ci"
            placeholder="admin@immoci.ci"
            placeholderTextColor={stitch.textMuted}
          />
        </View>

        <View style={[styles.formGroup, styles.fullWidth]}>
          <Text style={[styles.label, { color: stitch.textPrimary }]}>
            {language === 'fr' ? 'Description de la Plateforme' : 'Site Description'}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
            defaultValue="Plateforme immobilière N°1 en Côte d'Ivoire. Vente, location et gestion certifiée avec titres fonciers sécurisés."
            placeholder={language === 'fr' ? 'Description courte' : 'Enter site description'}
            placeholderTextColor={stitch.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.formGroup, styles.fullWidth, styles.rowGroup, { borderTopColor: stitch.cardBorder }]}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.label, { color: stitch.textPrimary }]}>
              {language === 'fr' ? 'Mode Maintenance' : 'Maintenance Mode'}
            </Text>
            <Text style={[styles.helperText, { color: stitch.textSecondary }]}>
              {language === 'fr' ? 'Désactiver temporairement l’accès public aux clients' : 'Disable public access to the site'}
            </Text>
          </View>
          <Switch
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: stitch.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.formGroup, styles.fullWidth, styles.rowGroup, { borderTopColor: stitch.cardBorder }]}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.label, { color: stitch.textPrimary }]}>
              {language === 'fr' ? 'Validation Automatique IA (Annonces ACD)' : 'Auto-Approve Verified Listings'}
            </Text>
            <Text style={[styles.helperText, { color: stitch.textSecondary }]}>
              {language === 'fr' ? 'Publier immédiatement les annonces avec score IA > 95%' : 'Publish listings with high AI confidence score'}
            </Text>
          </View>
          <Switch
            value={autoApproveVerified}
            onValueChange={setAutoApproveVerified}
            trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: stitch.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );

  const renderAdvancedSettings = () => (
    <View style={[styles.card, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
      <View style={[styles.cardHeader, { borderBottomColor: stitch.cardBorder }]}>
        <View style={[styles.iconBadge, { backgroundColor: stitch.primaryLight }]}>
          <Terminal size={18} color={stitch.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: stitch.textPrimary }]}>
          {language === 'fr' ? 'Configuration API & Webhooks' : 'API & Webhook Configuration'}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Key size={16} color={stitch.primary} />
          <Text style={[styles.sectionTitle, { color: stitch.textPrimary }]}>API Key (Production)</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: stitch.textSecondary }]}>
          {language === 'fr' ? 'Clé d’accès sécurisée pour connecter vos applications tierces.' : 'Manage your secret API keys for external integrations.'}
        </Text>

        <View style={[styles.apiKeyContainer, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder }]}>
          <Text style={[styles.apiKeyValue, { color: stitch.textPrimary }]}>
            {showApiKey ? 'pk_live_immoci_98a4f82bc1947e9231' : 'pk_live_••••••••••••••••••••••••'}
          </Text>
          <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={styles.iconBtn}>
            {showApiKey ? <EyeOff size={16} color={stitch.textSecondary} /> : <Eye size={16} color={stitch.textSecondary} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Copy size={16} color={stitch.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: stitch.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <Webhook size={16} color="#6366F1" />
          <Text style={[styles.sectionTitle, { color: stitch.textPrimary }]}>Webhook Endpoint</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: stitch.textSecondary }]}>
          {language === 'fr' ? 'URL de notification pour recevoir les événements de paiement et de soumission.' : 'Receive real-time notifications for submissions and payments.'}
        </Text>

        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
            placeholder="https://api.immoci.ci/webhooks/listener"
            placeholderTextColor={stitch.textMuted}
            defaultValue="https://api.immoci.ci/v1/webhooks/catch"
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: stitch.textPrimary }]}>
          {language === 'fr' ? 'Paramètres du Système' : 'System Settings'}
        </Text>
        <Text style={[styles.subtitle, { color: stitch.textSecondary }]}>
          {language === 'fr' ? 'Configurez les préférences, politiques et intégrations de la plateforme' : 'Configure platform settings and preferences'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: stitch.tabBg, borderColor: stitch.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { backgroundColor: stitch.tabActiveBg, borderColor: stitch.cardBorder }],
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <tab.icon size={15} color={isActive ? stitch.primary : stitch.textSecondary} />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? stitch.textPrimary : stitch.textSecondary },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'general' ? renderGeneralSettings() :
         activeTab === 'advanced' ? renderAdvancedSettings() : (
          <View style={[styles.card, styles.placeholder, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
            <Palette size={32} color={stitch.textMuted} />
            <Text style={[styles.placeholderText, { color: stitch.textSecondary }]}>
              {language === 'fr' ? `Options pour "${activeTab}" actives par défaut.` : `Settings for ${activeTab} are active with default policies.`}
            </Text>
          </View>
        )}
      </View>

      {/* Footer Save Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: stitch.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {savedSuccess ? <Check size={18} color="#FFFFFF" /> : <Save size={18} color="#FFFFFF" />}
          <Text style={styles.saveButtonText}>
            {savedSuccess
              ? (language === 'fr' ? 'Modifications Enregistrées !' : 'Saved Successfully!')
              : (language === 'fr' ? 'Enregistrer les Modifications' : 'Save All Settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    minHeight: 300,
  },
  card: {
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  formGroup: {
    flex: 1,
    minWidth: 280,
    gap: 8,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 12.5,
    marginBottom: 8,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  apiKeyValue: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  iconBtn: {
    padding: 6,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  placeholderText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
