import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { CreditCard, Mail, MessageSquare, Database, HardDrive, Zap, Plus, Check, X, Code, Trash2, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useIntegrations, IntegrationDefinition, IntegrationType } from '@/providers/IntegrationProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface IntegrationCardProps {
  definition: IntegrationDefinition;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onManage: () => void;
  stitch: any;
}

function IntegrationCard({ definition, connected, onConnect, onDisconnect, onManage, stitch }: IntegrationCardProps) {
  const Icon = definition.icon;

  return (
    <View style={[styles.card, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: connected ? definition.color + '22' : stitch.iconBg }]}>
          <Icon size={22} color={connected ? definition.color : stitch.textSecondary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, { color: stitch.textPrimary }]}>{definition.name}</Text>
          <View style={[styles.statusBadge, connected ? styles.statusConnected : { backgroundColor: stitch.statusInactiveBg }]}>
            {connected ? <Check size={10} color="#FFFFFF" /> : <X size={10} color={stitch.textMuted} />}
            <Text style={[styles.statusText, connected ? { color: '#FFFFFF' } : { color: stitch.textSecondary }]}>
              {connected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.cardDescription, { color: stitch.textSecondary }]}>{definition.description}</Text>

      <View style={styles.cardActions}>
        {connected ? (
          <>
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: stitch.buttonSecondaryBg, borderColor: stitch.cardBorder }]}
              onPress={onManage}
              activeOpacity={0.8}
            >
              <Text style={[styles.manageButtonText, { color: stitch.textPrimary }]}>Configure</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.disconnectButton, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
              onPress={onDisconnect}
              activeOpacity={0.8}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.connectButton, { borderColor: stitch.inputBorder, backgroundColor: stitch.buttonSecondaryBg }]}
            onPress={onConnect}
            activeOpacity={0.8}
          >
            <Plus size={16} color={stitch.primary} />
            <Text style={[styles.connectButtonText, { color: stitch.primary }]}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AdminIntegrations() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { language } = useLanguage();

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
    buttonSecondaryBg: isDark ? '#1E293B' : '#F1F5F9',
    iconBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    statusInactiveBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  };

  const [activeTab, setActiveTab] = useState<IntegrationType | 'developer'>('payment');
  const {
    definitions,
    isConnected,
    connectIntegration,
    disconnectIntegration,
    apiKeys,
    generateApiKey,
    revokeApiKey,
  } = useIntegrations();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // API Key State
  const [newKeyName, setNewKeyName] = useState('');

  const tabs: { id: IntegrationType | 'developer'; label: string; icon: any }[] = [
    { id: 'payment', label: language === 'fr' ? 'Paiements' : 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'crm', label: 'CRM', icon: Database },
    { id: 'storage', label: language === 'fr' ? 'Stockage' : 'Storage', icon: HardDrive },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'developer', label: language === 'fr' ? 'Clés API' : 'Developer API', icon: Code },
  ];

  const handleConnectClick = (def: IntegrationDefinition) => {
    setSelectedIntegration(def);
    setFormValues({});
    setShowModal(true);
  };

  const handleSubmitConnection = async () => {
    if (!selectedIntegration) return;

    const missingFields = selectedIntegration.fields
      .filter((f) => f.required && !formValues[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      if (Platform.OS === 'web') {
        window.alert(`Please fill in: ${missingFields.join(', ')}`);
      } else {
        Alert.alert('Missing Fields', `Please fill in: ${missingFields.join(', ')}`);
      }
      return;
    }

    setIsConnecting(true);

    setTimeout(() => {
      connectIntegration(selectedIntegration.id, formValues);
      setIsConnecting(false);
      setShowModal(false);
      setFormValues({});
      setSelectedIntegration(null);
    }, 800);
  };

  const handleDisconnect = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to disconnect ${name}?`)) {
        disconnectIntegration(id);
      }
    } else {
      Alert.alert('Disconnect Integration', `Are you sure you want to disconnect ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectIntegration(id) },
      ]);
    }
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    generateApiKey(newKeyName);
    setNewKeyName('');
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const renderIntegrationContent = () => {
    if (activeTab === 'developer') {
      return (
        <View style={styles.developerContainer}>
          <View style={[styles.createKeyCard, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: stitch.textPrimary }]}>
              {language === 'fr' ? 'Générer une Nouvelle Clé API' : 'Create New API Key'}
            </Text>
            <View style={styles.createKeyRow}>
              <TextInput
                style={[styles.keyInput, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
                placeholder={language === 'fr' ? 'Nom de la clé (ex: App Mobile, CRM)' : 'Key Name (e.g. Mobile App, Website)'}
                placeholderTextColor={stitch.textMuted}
                value={newKeyName}
                onChangeText={setNewKeyName}
              />
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: stitch.primary }]}
                onPress={handleGenerateKey}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>{language === 'fr' ? 'Générer' : 'Generate Key'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.keysList}>
            <Text style={[styles.keysListTitle, { color: stitch.textPrimary }]}>
              {language === 'fr' ? 'Clés API Actives' : 'Active API Keys'}
            </Text>
            {apiKeys.length === 0 ? (
              <View style={[styles.emptyKeys, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
                <Code size={40} color={stitch.textMuted} />
                <Text style={[styles.emptyKeysText, { color: stitch.textSecondary }]}>
                  {language === 'fr' ? 'Aucune clé API active.' : 'No API keys generated yet.'}
                </Text>
              </View>
            ) : (
              apiKeys.map((key) => (
                <View key={key.key} style={[styles.keyItem, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
                  <View style={styles.keyInfo}>
                    <Text style={[styles.keyName, { color: stitch.textPrimary }]}>{key.name}</Text>
                    <View style={styles.keyValueContainer}>
                      <Text style={[styles.keyValue, { color: stitch.textSecondary }]}>{key.key}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(key.key)} style={{ padding: 4 }}>
                        <Copy size={14} color={stitch.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.keyDate, { color: stitch.textMuted }]}>
                      Created: {new Date(key.created).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.revokeButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => revokeApiKey(key.key)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      );
    }

    const filteredDefinitions = definitions.filter((d) => d.type === activeTab);

    if (filteredDefinitions.length === 0) {
      return (
        <View style={[styles.placeholder, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
          <Text style={[styles.placeholderText, { color: stitch.textSecondary }]}>
            {language === 'fr' ? `Aucune intégration disponible pour ${activeTab}.` : `No integrations available for ${activeTab} yet.`}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {filteredDefinitions.map((def) => (
          <IntegrationCard
            key={def.id}
            definition={def}
            connected={isConnected(def.id)}
            onConnect={() => handleConnectClick(def)}
            onManage={() => handleConnectClick(def)}
            onDisconnect={() => handleDisconnect(def.id, def.name)}
            stitch={stitch}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: stitch.textPrimary }]}>
          {language === 'fr' ? 'Intégrations & Passerelles' : 'Platform Integrations'}
        </Text>
        <Text style={[styles.subtitle, { color: stitch.textSecondary }]}>
          {language === 'fr'
            ? 'Connectez vos passerelles de paiement (Orange Money, MTN, Wave, Stripe) et services tiers'
            : 'Connect and manage third-party services to enhance your platform capabilities'}
        </Text>
      </View>

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
                onPress={() => setActiveTab(tab.id as IntegrationType | 'developer')}
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

      {renderIntegrationContent()}

      {/* Configuration Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: stitch.cardBorder }]}>
              <View style={styles.modalTitleContainer}>
                {selectedIntegration && <selectedIntegration.icon size={22} color={selectedIntegration.color} />}
                <Text style={[styles.modalTitle, { color: stitch.textPrimary }]}>
                  {isConnected(selectedIntegration?.id || '') ? 'Manage' : 'Connect'} {selectedIntegration?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color={stitch.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, { color: stitch.textSecondary }]}>
                {selectedIntegration?.description}
              </Text>

              {selectedIntegration?.fields.map((field) => (
                <View key={field.name} style={styles.formGroup}>
                  <Text style={[styles.label, { color: stitch.textPrimary }]}>
                    {field.label} {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    placeholderTextColor={stitch.textMuted}
                    secureTextEntry={field.type === 'password'}
                    value={formValues[field.name] || ''}
                    onChangeText={(text) => setFormValues({ ...formValues, [field.name]: text })}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: stitch.cardBorder }]}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: stitch.inputBorder }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.cancelButtonText, { color: stitch.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: stitch.primary }]}
                onPress={handleSubmitConnection}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isConnected(selectedIntegration?.id || '') ? 'Save Configuration' : 'Connect Integration'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 280,
    maxWidth: 380,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusConnected: {
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 8,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 8,
  },
  manageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 14,
    borderWidth: 1,
  },
  placeholderText: {
    fontSize: 13,
  },
  developerContainer: {
    gap: 20,
  },
  createKeyCard: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  createKeyRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  keyInput: {
    flex: 1,
    minWidth: 240,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  keysList: {
    gap: 12,
  },
  keysListTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyKeys: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  emptyKeysText: {
    fontSize: 13,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  keyInfo: {
    gap: 4,
    flex: 1,
  },
  keyName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  keyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyValue: {
    fontFamily: 'monospace',
    fontSize: 12.5,
  },
  keyDate: {
    fontSize: 11.5,
  },
  revokeButton: {
    padding: 10,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
    gap: 14,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
