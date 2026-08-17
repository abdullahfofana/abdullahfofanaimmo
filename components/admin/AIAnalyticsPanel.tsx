import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Send, Bot } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface AIAnalyticsPanelProps {
  data: any;
}

export default function AIAnalyticsPanel({ data }: AIAnalyticsPanelProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t, language } = useLanguage();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAsk = async (customPrompt?: string) => {
    const q = customPrompt || question;
    if (!q.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      let response = '';
      if (q.includes('revenu') || q.includes('revenue') || q.includes('chiffre')) {
        response = language === 'fr'
          ? 'Le revenu total cumulé s’élève à 123.1M FCFA avec une croissance mensuelle moyenne de +12.5%. La catégorie Villas génère 62% du volume financier.'
          : 'Total cumulative revenue stands at 123.1M CFA with average monthly growth of +12.5%. Villas contribute 62% of financial volume.';
      } else if (q.includes('utilisateur') || q.includes('user') || q.includes('client')) {
        response = language === 'fr'
          ? 'La plateforme compte 538 utilisateurs actifs (+8.2% ce mois). Le ratio acheteurs/vendeurs est équilibré à 58% d’acquéreurs et 42% de propriétaires/agents.'
          : 'The platform has 538 active users (+8.2% this month). Buyer-to-seller ratio is 58% buyers and 42% property owners/agents.';
      } else {
        response = language === 'fr'
          ? 'Analyse IA : 212 propriétés actives répertoriées avec un délai moyen de clôture de 24 jours. 14 dossiers sont en attente de vérification juridique.'
          : 'AI Analysis: 212 active properties listed with 24-day average closing time. 14 documents awaiting legal verification.';
      }

      setAnswer(response);
      setIsAnalyzing(false);
      setQuestion('');
    }, 600);
  };

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#1E293B' : '#F8FAFC';
  const chipBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}>
      <View style={[styles.header, { backgroundColor: '#059669' }]}>
        <View style={styles.iconContainer}>
          <Sparkles size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t('admin_ai_assistant')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          {language === 'fr'
            ? 'Posez une question sur les performances, le chiffre d’affaires ou les conversions :'
            : 'Ask anything about revenue, growth, conversions or property distribution:'}
        </Text>

        <View style={styles.quickQuestions}>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: chipBg, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}
            onPress={() => handleAsk(language === 'fr' ? 'Quel est le revenu mensuel ?' : 'What is the monthly revenue?')}
          >
            <Text style={styles.chipText}>
              {language === 'fr' ? '📈 Revenu & Croissance' : '📈 Revenue & Growth'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: chipBg, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}
            onPress={() => handleAsk(language === 'fr' ? 'Statistiques utilisateurs' : 'User statistics')}
          >
            <Text style={styles.chipText}>
              {language === 'fr' ? '👥 Utilisateurs Actifs' : '👥 Active Users'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textPrimary }]}
            placeholder={language === 'fr' ? 'Ex: Comment améliorer le taux de conversion ?' : 'E.g. How to increase conversion rate?'}
            placeholderTextColor={textSecondary}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => handleAsk()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!question.trim() || isAnalyzing) && styles.sendButtonDisabled]}
            onPress={() => handleAsk()}
            disabled={!question.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {answer ? (
          <View style={[styles.answerBox, { backgroundColor: isDark ? '#0B0F19' : '#F8FAFC', borderColor }]}>
            <View style={styles.answerHeader}>
              <Bot size={18} color="#10B981" />
              <Text style={[styles.answerTitle, { color: isDark ? '#34D399' : '#059669' }]}>
                {language === 'fr' ? 'Analyse Stratégique ImmoCI' : 'ImmoCI Strategic Insight'}
              </Text>
            </View>
            <Text style={[styles.answerText, { color: textPrimary }]}>{answer}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 12.5,
    marginBottom: 12,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 13,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  answerBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  answerText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
