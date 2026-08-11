import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Sparkles, Send, Bot, BarChart3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { trpc } from '@/lib/trpc';

interface AIAnalyticsPanelProps {
    data: any; // The entire dashboard data object
}

export default function AIAnalyticsPanel({ data }: AIAnalyticsPanelProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const analyzeMutation = trpc.ai.analyzeKPIs.useMutation();

    const handleAsk = async () => {
        if (!question.trim()) return;

        try {
            const result = await analyzeMutation.mutateAsync({
                data: data,
                question: question
            });
            setAnswer(result.answer || "I couldn't analyze the data at this moment.");
        } catch (error) {
            console.error("AI Analysis failed", error);
            setAnswer("Sorry, I encountered an error analyzing the data.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Sparkles size={20} color={Colors.white} />
                </View>
                <Text style={styles.title}>AI Insight Assistant</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Ask questions about your dashboard data, e.g., &quot;Which month had the best growth?&quot; or &quot;Summarize my revenue trends.&quot;
                </Text>

                {/* Q&A Area */}
                <View style={styles.chatArea}>
                    {answer ? (
                        <View style={styles.answerContainer}>
                            <View style={styles.botHeader}>
                                <Bot size={16} color={Colors.primary} />
                                <Text style={styles.botLabel}>AI Analysis</Text>
                            </View>
                            <Text style={styles.answerText}>{answer}</Text>
                            <TouchableOpacity onPress={() => { setAnswer(null); setQuestion(''); }} style={styles.resetButton}>
                                <Text style={styles.resetText}>Ask another question</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask about your data..."
                                placeholderTextColor={Colors.textLight}
                                value={question}
                                onChangeText={setQuestion}
                                onSubmitEditing={handleAsk}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!question.trim() || analyzeMutation.isPending) && styles.sendButtonDisabled]}
                                onPress={handleAsk}
                                disabled={!question.trim() || analyzeMutation.isPending}
                            >
                                {analyzeMutation.isPending ? <ActivityIndicator color={Colors.white} size="small" /> : <Send size={18} color={Colors.white} />}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Suggestions */}
                {!answer && (
                    <View style={styles.suggestions}>
                        <TouchableOpacity onPress={() => setQuestion("Summarize my key performance indicators")} style={styles.chip}>
                            <Text style={styles.chipText}>Summarize KPIs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setQuestion("What is the trend in user growth?")} style={styles.chip}>
                            <Text style={styles.chipText}>User Growth Trend</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setQuestion("Which property type is most popular?")} style={styles.chip}>
                            <Text style={styles.chipText}>Popular Property Type</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.primary,
        gap: Spacing.md,
    },
    iconContainer: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    title: {
        ...Typography.h4,
        color: Colors.white,
        fontSize: 16,
    },
    content: {
        padding: Spacing.lg,
    },
    description: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    chatArea: {
        marginBottom: Spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        fontSize: 15,
        color: Colors.text,
        backgroundColor: Colors.backgroundSecondary,
    },
    sendButton: {
        width: 48,
        height: 48,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
        backgroundColor: Colors.textLight,
    },
    answerContainer: {
        backgroundColor: Colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    botHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    botLabel: {
        ...Typography.caption,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    answerText: {
        ...Typography.body,
        color: Colors.text,
        lineHeight: 22,
    },
    resetButton: {
        marginTop: Spacing.md,
        alignSelf: 'flex-start',
    },
    resetText: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        textDecorationLine: 'underline',
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight + '20',
        borderWidth: 1,
        borderColor: Colors.primaryLight + '40',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.primary,
    },
});
