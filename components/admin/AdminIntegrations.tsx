import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { CreditCard, Mail, MessageSquare, Database, HardDrive, Zap, Plus, Check, X, Code, Trash2, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useIntegrations, IntegrationDefinition, IntegrationType } from '@/providers/IntegrationProvider';

interface IntegrationCardProps {
  definition: IntegrationDefinition;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onManage: () => void;
}

function IntegrationCard({ definition, connected, onConnect, onDisconnect, onManage }: IntegrationCardProps) {
  const Icon = definition.icon;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: connected ? definition.color + '20' : '#F1F5F9' }]}>
           <Icon size={24} color={connected ? definition.color : '#64748B'} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>{definition.name}</Text>
          <View style={[styles.statusBadge, connected ? styles.statusConnected : styles.statusDisconnected]}>
            {connected ? <Check size={10} color={Colors.white} /> : <X size={10} color={Colors.white} />}
            <Text style={styles.statusText}>{connected ? 'Connected' : 'Not Connected'}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.cardDescription}>{definition.description}</Text>
      
      <View style={styles.cardActions}>
        {connected ? (
          <>
            <TouchableOpacity style={styles.manageButton} onPress={onManage}>
              <Text style={styles.manageButtonText}>Configure</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
            <Plus size={16} color={Colors.text} />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AdminIntegrations() {
  const [activeTab, setActiveTab] = useState<IntegrationType | 'developer'>('payment');
  const { 
    definitions, 
    isConnected, 
    connectIntegration, 
    disconnectIntegration,
    apiKeys,
    generateApiKey,
    revokeApiKey 
  } = useIntegrations();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // API Key State
  const [newKeyName, setNewKeyName] = useState('');

  const tabs: { id: IntegrationType | 'developer'; label: string; icon: any }[] = [
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'crm', label: 'CRM', icon: Database },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'developer', label: 'Developer API', icon: Code },
  ];

  const handleConnectClick = (def: IntegrationDefinition) => {
    setSelectedIntegration(def);
    setFormValues({});
    setShowModal(true);
  };

  const handleSubmitConnection = async () => {
    if (!selectedIntegration) return;

    // Basic validation
    const missingFields = selectedIntegration.fields
      .filter(f => f.required && !formValues[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      if (Platform.OS === 'web') {
        window.alert(`Please fill in: ${missingFields.join(', ')}`);
      } else {
        Alert.alert('Missing Fields', `Please fill in: ${missingFields.join(', ')}`);
      }
      return;
    }

    setIsConnecting(true);
    
    // Simulate API call
    setTimeout(() => {
      connectIntegration(selectedIntegration.id, formValues);
      setIsConnecting(false);
      setShowModal(false);
      setFormValues({});
      setSelectedIntegration(null);
    }, 1000);
  };

  const handleDisconnect = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to disconnect ${name}?`)) {
        disconnectIntegration(id);
      }
    } else {
      Alert.alert(
        'Disconnect Integration',
        `Are you sure you want to disconnect ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => disconnectIntegration(id) }
        ]
      );
    }
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    generateApiKey(newKeyName);
    setNewKeyName('');
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    // Could add toast here
  };

  const renderIntegrationContent = () => {
    if (activeTab === 'developer') {
      return (
        <View style={styles.developerContainer}>
          <View style={styles.apiHeader}>
            <View>
               <Text style={styles.sectionTitle}>API Access</Text>
               <Text style={styles.sectionSubtitle}>Manage API keys for external software integration.</Text>
            </View>
          </View>

          <View style={styles.createKeyCard}>
            <Text style={styles.cardLabel}>Create New API Key</Text>
            <View style={styles.createKeyRow}>
              <TextInput 
                style={styles.keyInput} 
                placeholder="Key Name (e.g. Mobile App, Website)"
                value={newKeyName}
                onChangeText={setNewKeyName}
              />
              <TouchableOpacity style={styles.generateButton} onPress={handleGenerateKey}>
                <Plus size={16} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate Key</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.keysList}>
            <Text style={styles.keysListTitle}>Active API Keys</Text>
            {apiKeys.length === 0 ? (
              <View style={styles.emptyKeys}>
                <Code size={48} color={Colors.textLight} />
                <Text style={styles.emptyKeysText}>No API keys generated yet.</Text>
              </View>
            ) : (
              apiKeys.map((key) => (
                <View key={key.key} style={styles.keyItem}>
                  <View style={styles.keyInfo}>
                    <Text style={styles.keyName}>{key.name}</Text>
                    <View style={styles.keyValueContainer}>
                      <Text style={styles.keyValue}>{key.key}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(key.key)}>
                        <Copy size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.keyDate}>Created: {new Date(key.created).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.revokeButton}
                    onPress={() => revokeApiKey(key.key)}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          
          <View style={styles.docsLink}>
            <Text style={styles.docsText}>
              Need help integrating? <Text style={styles.linkText}>Read the API Documentation</Text>
            </Text>
          </View>
        </View>
      );
    }

    const filteredDefinitions = definitions.filter(d => d.type === activeTab);

    if (filteredDefinitions.length === 0) {
      return (
         <View style={styles.placeholder}>
           <Text style={styles.placeholderText}>No integrations available for {activeTab} yet.</Text>
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
            onManage={() => handleConnectClick(def)} // Re-open modal to edit config
            onDisconnect={() => handleDisconnect(def.id, def.name)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Integrations</Text>
        <Text style={styles.subtitle}>Connect and manage third-party services to enhance your platform capabilities</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as IntegrationType | 'developer')}
            >
              <View style={styles.tabContent}>
                 <tab.icon size={16} color={activeTab === tab.id ? Colors.primary : Colors.textSecondary} />
                 <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                   {tab.label}
                 </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderIntegrationContent()}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                 {selectedIntegration && (
                   <selectedIntegration.icon size={24} color={selectedIntegration.color} />
                 )}
                 <Text style={styles.modalTitle}>
                   {isConnected(selectedIntegration?.id || '') ? 'Manage' : 'Connect'} {selectedIntegration?.name}
                 </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>{selectedIntegration?.description}</Text>
              
              {selectedIntegration?.fields.map((field) => (
                <View key={field.name} style={styles.formGroup}>
                  <Text style={styles.label}>
                    {field.label} {field.required && <Text style={{ color: Colors.error }}>*</Text>}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    secureTextEntry={field.type === 'password'}
                    value={formValues[field.name] || ''}
                    onChangeText={(text) => setFormValues({ ...formValues, [field.name]: text })}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmitConnection}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isConnected(selectedIntegration?.id || '') ? 'Update Configuration' : 'Connect Integration'}
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
    gap: Spacing.xl,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow.sm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  card: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    minHeight: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  statusConnected: {
    backgroundColor: Colors.success,
  },
  statusDisconnected: {
    backgroundColor: Colors.textLight,
  },
  statusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  manageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  disconnectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 3,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  
  // Developer Tab
  developerContainer: {
    gap: Spacing.xl,
  },
  apiHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  createKeyCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  createKeyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  keyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  keysList: {
    gap: Spacing.md,
  },
  keysListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  keyItem: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyInfo: {
    gap: 4,
    flex: 1,
  },
  keyName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  keyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  keyValue: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    color: Colors.text,
  },
  keyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  revokeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  emptyKeys: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
    gap: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyKeysText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  docsLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  docsText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  modalDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  formGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.text,
  },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});
