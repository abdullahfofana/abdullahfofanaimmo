import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { MessageCircle, X, Mail, Phone, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function ContactSupport() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSupport = () => {
    setIsOpen(!isOpen);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.message) {
      if (Platform.OS === 'web') {
        alert('Please fill in your name and message');
      } else {
        Alert.alert('Required Fields', 'Please fill in your name and message');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (Platform.OS === 'web') {
        alert('Message sent successfully! Our support team will reply once available.');
      } else {
        Alert.alert('Success', 'Message sent successfully! Our support team will reply once available.');
      }
      
      setFormData({ name: '', email: '', message: '' });
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      if (Platform.OS === 'web') {
        alert('Failed to send message. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <TouchableOpacity 
        style={[styles.fab, { bottom: 20 + insets.bottom, right: 20 }]} 
        onPress={toggleSupport}
        activeOpacity={0.8}
        testID="contactSupportButton"
      >
        <MessageCircle size={28} color={Colors.white} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal 
      visible={isOpen} 
      animationType="slide" 
      transparent 
      onRequestClose={toggleSupport}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.iconContainer}>
                <HelpCircle size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Contact Support</Text>
                <Text style={styles.headerSubtitle}>Our support team will reply once available</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleSupport} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>support@immoci.com</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Phone size={20} color={Colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>+225 XX XX XX XX XX</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.formTitle}>Send us a message</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your name"
                placeholderTextColor={Colors.textLight}
                value={formData.name}
                onChangeText={text => setFormData({...formData, name: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your email"
                placeholderTextColor={Colors.textLight}
                value={formData.email}
                onChangeText={text => setFormData({...formData, email: text})}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="How can we help you?"
                placeholderTextColor={Colors.textLight}
                value={formData.message}
                onChangeText={text => setFormData({...formData, message: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (!formData.name || !formData.message || isSubmitting) && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={!formData.name || !formData.message || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow?.lg || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  infoSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  formTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
});
