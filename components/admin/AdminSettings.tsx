import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Globe, Lock, Bell, Mail, Palette, Terminal, Save, Key, Webhook, Copy, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';

type SettingsTab = 'general' | 'security' | 'notifications' | 'email' | 'appearance' | 'advanced';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [showApiKey, setShowApiKey] = useState(false);
  
  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Terminal },
  ];

  const renderGeneralSettings = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Globe size={20} color={Colors.text} />
        <Text style={styles.cardTitle}>General Settings</Text>
      </View>

      <View style={styles.formGrid}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Site Name</Text>
          <TextInput 
            style={styles.input} 
            defaultValue="Immoci"
            placeholder="Enter site name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Email</Text>
          <TextInput 
            style={styles.input} 
            defaultValue="admin@immoci.com"
            placeholder="Enter contact email"
          />
        </View>

        <View style={[styles.formGroup, styles.fullWidth]}>
          <Text style={styles.label}>Site Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            defaultValue="Premium Real Estate Platform"
            placeholder="Enter site description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={[styles.formGroup, styles.fullWidth, styles.rowGroup]}>
          <View>
             <Text style={styles.label}>Maintenance Mode</Text>
             <Text style={styles.helperText}>Disable public access to the site</Text>
          </View>
          <Switch 
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </View>
    </View>
  );

  const renderAdvancedSettings = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Terminal size={20} color={Colors.text} />
        <Text style={styles.cardTitle}>Advanced Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Key size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>API Configuration</Text>
        </View>
        <Text style={styles.sectionDesc}>Manage your API keys for external integrations.</Text>
        
        <View style={styles.apiKeyContainer}>
          <View style={styles.apiKeyInfo}>
             <Text style={styles.apiKeyLabel}>Public API Key</Text>
             <View style={styles.apiKeyInputContainer}>
                <Text style={styles.apiKeyValue}>
                  {showApiKey ? 'pk_live_51MzQ24K9X8Y7Z3J5W1R2P4Q' : 'pk_live_••••••••••••••••••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={styles.iconBtn}>
                  {showApiKey ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Copy size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
             </View>
          </View>
          <TouchableOpacity style={styles.regenerateBtn}>
             <Text style={styles.regenerateBtnText}>Regenerate Key</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { marginTop: Spacing.xl, paddingTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <View style={styles.sectionHeader}>
          <Webhook size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Webhooks</Text>
        </View>
        <Text style={styles.sectionDesc}>Receive real-time updates for property submissions and user events.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Webhook Endpoint URL</Text>
          <TextInput 
             style={styles.input} 
             placeholder="https://your-server.com/webhooks/immoci" 
             defaultValue="https://api.external-crm.com/v1/hooks/catch"
          />
        </View>
        
        <View style={styles.eventsList}>
           <Text style={styles.label}>Trigger Events</Text>
           <View style={styles.checkboxRow}>
              <View style={styles.checkbox}><View style={styles.checkboxInner} /></View>
              <Text style={styles.checkboxLabel}>submission.created</Text>
           </View>
           <View style={styles.checkboxRow}>
              <View style={styles.checkbox}><View style={styles.checkboxInner} /></View>
              <Text style={styles.checkboxLabel}>submission.approved</Text>
           </View>
           <View style={styles.checkboxRow}>
              <View style={[styles.checkbox, { borderColor: Colors.border }]} />
              <Text style={styles.checkboxLabel}>user.registered</Text>
           </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Settings</Text>
        <Text style={styles.subtitle}>Configure platform settings and preferences</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTab === 'general' ? renderGeneralSettings() : 
         activeTab === 'advanced' ? renderAdvancedSettings() : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Settings for {activeTab} are coming soon.</Text>
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
         <TouchableOpacity style={styles.saveButton}>
            <Save size={18} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save All Settings</Text>
         </TouchableOpacity>
      </View>
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow.sm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  content: {
    minHeight: 400,
  },
  card: {
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xl,
  },
  formGroup: {
    flex: 1,
    minWidth: 300,
    gap: 8,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  apiKeyContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  apiKeyInfo: {
    gap: 4,
  },
  apiKeyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  apiKeyValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.text,
  },
  iconBtn: {
    padding: 4,
  },
  regenerateBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  regenerateBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  eventsList: {
    gap: 8,
    marginTop: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'monospace',
  },
});
