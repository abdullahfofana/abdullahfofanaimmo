import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Animated,
    Dimensions
} from 'react-native';
import { MessageCircle, X, Send, Sparkles, User, Bot, HelpCircle, Search, DollarSign } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

const { width, height } = Dimensions.get('window');

export default function AIChatbot() {
    const insets = useSafeAreaInsets();
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // tRPC mutation for chat
    const chatMutation = trpc.ai.chat.useMutation();

    const toggleChat = () => {
        if (isOpen) {
            // Close animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setIsOpen(false));
        } else {
            setIsOpen(true);
            // Open animation
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 5,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Add welcome message if empty
            if (messages.length === 0) {
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: language === 'fr'
                            ? "Bonjour ! Je suis l'assistant IA d'ImmoCI. Je peux vous aider à trouver des biens, estimer des prix ou répondre à vos questions. Comment puis-je vous aider ?"
                            : "Hello! I'm the ImmoCI AI assistant. I can help you find properties, estimate prices, or answer your questions. How can I help you?",
                        timestamp: Date.now()
                    }
                ]);
            }
        }
    };

    const sendMessage = async (content: string = inputMessage) => {
        if (!content.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            // Prepare context for AI (system prompt)
            const systemPrompt = language === 'fr'
                ? "Tu es un assistant immobilier virtuel pour ImmoCI en Côte d'Ivoire. Sois poli, concis et utile. Aide à la recherche, l'estimation et les infos générales."
                : "You are a virtual real estate assistant for ImmoCI in Ivory Coast. Be polite, concise, and helpful. Assist with search, estimation, and general info.";

            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMsg.content }
            ] as any[];

            const response = await chatMutation.mutateAsync({ messages: apiMessages });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.message?.content || (language === 'fr' ? "Désolé, je n'ai pas compris." : "Sorry, I didn't understand."),
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: language === 'fr' ? "Désolé, une erreur est survenue. Veuillez réessayer." : "Sorry, something went wrong. Please try again.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        }

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const QuickAction = ({ icon: Icon, label, query }: { icon: any, label: string, query: string }) => (
        <TouchableOpacity
            style={styles.quickAction}
            onPress={() => sendMessage(query)}
        >
            <Icon size={14} color={Colors.primary} />
            <Text style={styles.quickActionText}>{label}</Text>
        </TouchableOpacity>
    );

    if (!isOpen) {
        return (
            <TouchableOpacity
                style={[styles.fab, { bottom: 20 + insets.bottom, right: 20 }]}
                onPress={toggleChat}
                activeOpacity={0.8}
                testID="aiChatFab"
            >
                <Sparkles size={24} color={Colors.white} />
            </TouchableOpacity>
        );
    }

    return (
        <Modal visible={isOpen} transparent onRequestClose={toggleChat}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalOverlay}
            >
                <Animated.View style={[
                    styles.modalContent,
                    {
                        paddingBottom: insets.bottom,
                        transform: [{ translateY: slideAnim }],
                        opacity: fadeAnim
                    }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerInfo}>
                            <View style={styles.iconContainer}>
                                <Bot size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>ImmoCI AI</Text>
                                <Text style={styles.headerSubtitle}>
                                    {language === 'fr' ? 'Toujours là pour vous aider' : 'Always here to help'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={toggleChat} style={styles.closeButton}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                    >
                        {messages.map((msg) => (
                            <View
                                key={msg.id}
                                style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.botBubble
                                ]}
                            >
                                {msg.role === 'assistant' && (
                                    <View style={styles.botAvatar}>
                                        <Bot size={14} color={Colors.white} />
                                    </View>
                                )}
                                <View style={[
                                    styles.bubbleContent,
                                    msg.role === 'user' ? styles.userBubbleContent : styles.botBubbleContent
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        msg.role === 'user' ? styles.userMessageText : styles.botMessageText
                                    ]}>
                                        {msg.content}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {chatMutation.isPending && (
                            <View style={[styles.messageBubble, styles.botBubble]}>
                                <View style={styles.botAvatar}>
                                    <Bot size={14} color={Colors.white} />
                                </View>
                                <View style={[styles.bubbleContent, styles.botBubbleContent, { flexDirection: 'row', gap: 4, alignItems: 'center', height: 40 }]}>
                                    <ActivityIndicator size="small" color={Colors.textSecondary} />
                                    <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Typing...</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Quick Actions */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsContainer} contentContainerStyle={styles.quickActionsContent}>
                        <QuickAction
                            icon={Search}
                            label={language === 'fr' ? "Chercher une villa" : "Find a villa"}
                            query={language === 'fr' ? "Je cherche une villa à Cocody avec piscine" : "I'm looking for a villa in Cocody with a pool"}
                        />
                        <QuickAction
                            icon={DollarSign}
                            label={language === 'fr' ? "Estimation prix" : "Price estimate"}
                            query={language === 'fr' ? "Quel est le prix moyen d'un 3 pièces à Marcory ?" : "What's the average price for a 3-bedroom in Marcory?"}
                        />
                        <QuickAction
                            icon={HelpCircle}
                            label={language === 'fr' ? "Aide" : "Help"}
                            query={language === 'fr' ? "Comment déposer une annonce ?" : "How do I list a property?"}
                        />
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.input}
                            placeholder={language === 'fr' ? "Posez une question..." : "Ask a question..."}
                            placeholderTextColor={Colors.textLight}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            onSubmitEditing={() => sendMessage()}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!inputMessage.trim() || chatMutation.isPending) && styles.sendButtonDisabled
                            ]}
                            onPress={() => sendMessage()}
                            disabled={!inputMessage.trim() || chatMutation.isPending}
                        >
                            <Send size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
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
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%', // Takes up 80% of screen
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
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
    messagesContainer: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
    },
    messagesContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    messageBubble: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botBubble: {
        alignSelf: 'flex-start',
    },
    botAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    bubbleContent: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '100%',
    },
    userBubbleContent: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    botBubbleContent: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: Colors.white,
    },
    botMessageText: {
        color: Colors.text,
    },
    quickActionsContainer: {
        maxHeight: 50,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    quickActionsContent: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        gap: 8,
        alignItems: 'center',
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight + '20',
        borderWidth: 1,
        borderColor: Colors.primaryLight + '40',
    },
    quickActionText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '500',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        height: 44,
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 22,
        paddingHorizontal: Spacing.lg,
        fontSize: 15,
        color: Colors.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
        backgroundColor: Colors.textLight,
    },
});
