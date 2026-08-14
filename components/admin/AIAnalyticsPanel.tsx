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
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';
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
  const analyzeMutation = trpc.ai.analyzeKPIs.useMutation();

  const handleAsk = async (customPrompt?: string) => {
    const q = customPrompt || question;
    if (!q.trim()) return;

    try {
      const result = await analyzeMutation.mutateAsync({
        data: data,
        question: q,
      });
      setAnswer(result.answer || (language === 'fr' ? "Impossible d'analyser les données pour le moment." : "I couldn't analyze the data at this moment."));
    } catch (error) {
      console.error('AI Analysis failed', error);
      setAnswer(language === 'fr' ? "Désolé, une erreur est survenue lors de l'analyse des données." : "Sorry, I encountered an error analyzing the data.");
    }
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
        <Text style={[styles.description, { color: textSecondary }]}>
          {t('admin_ai_assistant_desc')}
        </Text>

        {/* Q&A Area */}
        <View style={styles.chatArea}>
          {answer ? (
            <View
              style={[
                styles.answerContainer,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: '#10B981',
                },
              ]}
            >
              <View style={styles.botHeader}>
                <Bot size={18} color="#10B981" />
                <Text style={styles.botLabel}>{t('admin_ai_analysis_title')}</Text>
              </View>
              <Text style={[styles.answerText, { color: textPrimary }]}>{answer}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAnswer(null);
                  setQuestion('');
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>{t('admin_ai_ask_another')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    color: textPrimary,
                    borderColor,
                  },
                ]}
                placeholder={t('admin_ai_placeholder')}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={question}
                onChangeText={setQuestion}
                onSubmitEditing={() => handleAsk()}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!question.trim() || analyzeMutation.isPending) && styles.sendButtonDisabled,
                ]}
                onPress={() => handleAsk()}
                disabled={!question.trim() || analyzeMutation.isPending}
                activeOpacity={0.85}
              >
                {analyzeMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Send size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Suggestions */}
        {!answer && (
          <View style={styles.suggestions}>
            <TouchableOpacity
              onPress={() => {
                const q = language === 'fr' ? 'Résumer mes indicateurs de performance clés' : 'Summarize my key performance indicators';
                setQuestion(q);
                handleAsk(q);
              }}
              style={[styles.chip, { backgroundColor: chipBg }]}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{t('admin_ai_chip_kpis')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const q = language === 'fr' ? 'Quelle est la tendance de croissance des utilisateurs ?' : 'What is the trend in user growth?';
                setQuestion(q);
                handleAsk(q);
              }}
              style={[styles.chip, { backgroundColor: chipBg }]}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{t('admin_ai_chip_growth')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const q = language === 'fr' ? 'Quel type de propriété est le plus populaire ?' : 'Which property type is most popular?';
                setQuestion(q);
                handleAsk(q);
              }}
              style={[styles.chip, { backgroundColor: chipBg }]}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{t('admin_ai_chip_type')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 13.5,
    marginBottom: 16,
    lineHeight: 20,
  },
  chatArea: {
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#059669',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  answerContainer: {
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  botLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#10B981',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  resetButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  resetText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700' as const,
    textDecorationLine: 'underline' as const,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    color: '#10B981',
  },
});
