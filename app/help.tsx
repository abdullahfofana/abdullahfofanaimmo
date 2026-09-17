import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, MessageCircle, Phone, Mail, BookOpen, ChevronDown, ChevronUp, Headphones } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useChat } from '@/providers/ChatProvider';
import { useLanguage } from '@/providers/LanguageProvider';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface FAQItem {
  id: string;
  questionFr: string;
  questionEn: string;
  answerFr: string;
  answerEn: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    questionFr: 'Comment publier une annonce immobilière ?',
    questionEn: 'How do I submit a property?',
    answerFr: 'Rendez-vous sur l’onglet "Publier", remplissez le formulaire avec vos photos, l’adresse et le prix. Notre équipe valide l’annonce sous 24 heures.',
    answerEn: 'Go to the "Add" tab, fill in the details including photos and location, and submit. Our team will verify it within 24 hours.',
  },
  {
    id: '2',
    questionFr: 'La publication est-elle gratuite ?',
    questionEn: 'Is there a fee for listing?',
    answerFr: 'La publication de base est 100% gratuite. Des options de mise en vedette sont disponibles pour booster la visibilité.',
    answerEn: 'Basic listings are completely free. Featured listing boosts are available via Mobile Money.',
  },
  {
    id: '3',
    questionFr: 'Comment contacter un agent ou vendeur ?',
    questionEn: 'How do I contact an agent?',
    answerFr: 'Sur chaque fiche de propriété, vous disposez de boutons directs pour Appeler, envoyer un message WhatsApp ou discuter via le Chat en direct.',
    answerEn: 'On any property details page, you will find direct buttons to Call, WhatsApp, or Live Chat with the agent.',
  },
  {
    id: '4',
    questionFr: 'Les documents (ACD / Titre foncier) sont-ils vérifiés ?',
    questionEn: 'Are property deeds verified?',
    answerFr: 'Oui, notre équipe vérifie l’authenticité des actes de cession et documents cadastraux pour chaque annonce certifiée.',
    answerEn: 'Yes, our verification team validates deed authenticity and cadastral records for verified listings.',
  },
];

function FAQAccordion({ item, language }: { item: FAQItem; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const styles = createStyles(colors);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const question = language === 'fr' ? item.questionFr : item.questionEn;
  const answer = language === 'fr' ? item.answerFr : item.answerEn;

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand} activeOpacity={0.75}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {expanded ? (
          <ChevronUp size={20} color="#059669" />
        ) : (
          <ChevronDown size={20} color="#64748B" />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [showFAQs, setShowFAQs] = useState(false);
  const { startSupportConversation } = useChat();
  const { language } = useLanguage();

  const handleSupportChat = async () => {
    try {
      console.log('[Help] Starting live support chat...');
      await startSupportConversation();
    } catch (err) {
      console.warn('[Help] Support chat error:', err);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+2250748221900').catch((err) => {
      console.warn('[Help Phone Error]:', err);
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@immoci.ci').catch((err) => {
      console.warn('[Help Email Error]:', err);
    });
  };

  const handleBack = () => {
    if (showFAQs) {
      setShowFAQs(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: showFAQs ? (language === 'fr' ? 'Questions Fréquentes' : 'FAQs') : (language === 'fr' ? 'Aide & Support' : 'Help & Support'),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#0F172A', fontWeight: '800' },
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!showFAQs ? (
          <>
            <View style={styles.heroBox}>
              <View style={styles.heroIconBox}>
                <Headphones size={28} color="#059669" />
              </View>
              <Text style={styles.headerText}>
                {language === 'fr' ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?'}
              </Text>
              <Text style={styles.headerSub}>
                {language === 'fr'
                  ? 'Notre équipe d’assistance client ImmoCI est disponible 7j/7 pour vous accompagner.'
                  : 'Our ImmoCI support team is available 7 days a week to assist you.'}
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.optionCard} onPress={handleSupportChat} activeOpacity={0.88}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <MessageCircle size={24} color="#059669" />
                </View>
                <Text style={styles.optionTitle}>
                  {language === 'fr' ? 'Chat en direct' : 'Live Support Chat'}
                </Text>
                <Text style={styles.optionDescription}>
                  {language === 'fr' ? 'Discutez instantanément avec notre équipe' : 'Start a live chat with our team'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleCall} activeOpacity={0.88}>
                <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                  <Phone size={24} color="#2563EB" />
                </View>
                <Text style={styles.optionTitle}>
                  {language === 'fr' ? 'Appelez-nous' : 'Call Us'}
                </Text>
                <Text style={styles.optionDescription}>+225 07 48 22 19 00</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleEmail} activeOpacity={0.88}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFFBEB' }]}>
                  <Mail size={24} color="#D97706" />
                </View>
                <Text style={styles.optionTitle}>
                  {language === 'fr' ? 'Email Support' : 'Email Support'}
                </Text>
                <Text style={styles.optionDescription}>support@immoci.ci</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={() => setShowFAQs(true)} activeOpacity={0.88}>
                <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
                  <BookOpen size={24} color="#7C3AED" />
                </View>
                <Text style={styles.optionTitle}>
                  {language === 'fr' ? 'Foire aux Questions (FAQ)' : 'Frequently Asked Questions'}
                </Text>
                <Text style={styles.optionDescription}>
                  {language === 'fr' ? 'Trouvez les réponses aux questions courantes' : 'Find answers to common questions'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.faqContainer}>
            <Text style={styles.sectionTitle}>
              {language === 'fr' ? 'Questions Fréquentes' : 'Frequently Asked Questions'}
            </Text>
            {faqs.map((faq) => (
              <FAQAccordion key={faq.id} item={faq} language={language} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: 40,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    backButton: {
      padding: Spacing.xs,
      marginLeft: Platform.OS === 'web' ? Spacing.sm : 0,
    },
    heroBox: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
      marginTop: 8,
    },
    heroIconBox: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primaryLight + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.primaryLight + '40',
    },
    headerText: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    headerSub: {
      fontSize: 13.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 340,
    },
    optionsContainer: {
      gap: Spacing.md,
    },
    optionCard: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: 18,
      flexDirection: 'column',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 3,
    },
    optionDescription: {
      fontSize: 12.5,
      color: colors.textSecondary,
    },
    faqContainer: {
      gap: Spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    faqItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    faqBody: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    faqAnswer: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}

