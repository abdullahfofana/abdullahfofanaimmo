import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, MessageCircle, Phone, Mail, BookOpen, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useChat } from '@/providers/ChatProvider';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I submit a property?',
    answer: 'Go to the "Add Property" tab, fill in the details including photos and location, and submit. Our team will verify it within 24 hours.',
  },
  {
    id: '2',
    question: 'Is there a fee for listing?',
    answer: 'Basic listings are free. Featured listings require a small fee which can be paid via Mobile Money.',
  },
  {
    id: '3',
    question: 'How do I contact an agent?',
    answer: 'On any property details page, you will find a "Contact Agent" button to call or WhatsApp them directly.',
  },
  {
    id: '4',
    question: 'Can I edit my listing?',
    answer: 'Yes, go to your profile, select "My Listings", and choose the property you wish to edit.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand} activeOpacity={0.7}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        {expanded ? (
          <ChevronUp size={20} color={Colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const [showFAQs, setShowFAQs] = useState(false);
  const { startSupportConversation } = useChat();

  const handleSupportChat = () => {
    startSupportConversation();
  };

  const handleCall = () => {
    Linking.openURL('tel:+22501020304');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@rork.app');
  };

  const handleBack = () => {
    if (showFAQs) {
      setShowFAQs(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: showFAQs ? 'FAQs' : 'Help & Support',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!showFAQs ? (
          <>
            <Text style={styles.headerText}>How can we help you?</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.optionCard} onPress={handleSupportChat}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <MessageCircle size={24} color={Colors.primary} />
                </View>
                <Text style={styles.optionTitle}>Chat with Support</Text>
                <Text style={styles.optionDescription}>Start a live chat with our team</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleCall}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <Phone size={24} color={Colors.success} />
                </View>
                <Text style={styles.optionTitle}>Call Us</Text>
                <Text style={styles.optionDescription}>+225 01 02 03 04</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleEmail}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                  <Mail size={24} color={Colors.warning} />
                </View>
                <Text style={styles.optionTitle}>Email Support</Text>
                <Text style={styles.optionDescription}>support@rork.app</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={() => setShowFAQs(true)}>
                <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
                  <BookOpen size={24} color={Colors.accent} />
                </View>
                <Text style={styles.optionTitle}>FAQs</Text>
                <Text style={styles.optionDescription}>Find answers to common questions</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.faqContainer}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqs.map((faq) => (
              <FAQAccordion key={faq.id} item={faq} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  headerText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: Colors.shadow.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  optionTitle: {
    ...Typography.h4,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  faqContainer: {
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  faqQuestion: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  faqAnswer: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
