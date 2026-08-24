import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  X,
  Send,
  Building2,
  MapPin,
  Check,
  CheckCheck,
  Headphones,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Camera,
  Download,
  Maximize2,
} from 'lucide-react-native';
import { useChat } from '@/providers/ChatProvider';
import { useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import type { ChatAttachment } from '@/types/chat';

const formatPrice = (price: number, currency = 'FCFA') => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M ${currency}`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k ${currency}`;
  }
  return `${price.toLocaleString()} ${currency}`;
};

const QUICK_SUGGESTIONS = [
  '📅 Est-il possible de visiter ce bien cette semaine ?',
  '🏷️ Le prix est-il négociable ?',
  '📄 Les documents (ACD / Titre foncier) sont-ils vérifiés ?',
  '🔑 Quel est le montant de la caution demandée ?',
];

const CASE_STATUS_CONFIG: Record<
  string,
  { labelFr: string; labelEn: string; color: string; bg: string }
> = {
  Open: { labelFr: 'Dossier Ouvert', labelEn: 'Case Open', color: '#10B981', bg: '#ECFDF5' },
  'In Progress': { labelFr: 'En cours de traitement', labelEn: 'In Progress', color: '#3B82F6', bg: '#EFF6FF' },
  Hold: { labelFr: 'En attente', labelEn: 'On Hold', color: '#F59E0B', bg: '#FFFBEB' },
  Solved: { labelFr: 'Solutionné', labelEn: 'Solved', color: '#8B5CF6', bg: '#F5F3FF' },
  Resolved: { labelFr: 'Dossier Clôturé', labelEn: 'Resolved & Closed', color: '#64748B', bg: '#F1F5F9' },
  Reopen: { labelFr: 'Dossier Réouvert', labelEn: 'Case Reopened', color: '#F43F5E', bg: '#FFF1F2' },
};

export default function ChatModal() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { language } = useLanguage();
  const {
    activeConversation,
    isChatOpen,
    closeChat,
    messages,
    sendMessage,
    isSending,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentMessages = activeConversation
    ? messages[activeConversation.id] || []
    : [];

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [isChatOpen, currentMessages.length]);

  if (!isChatOpen || !activeConversation) return null;

  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAtts: ChatAttachment[] = result.assets.map((asset, i) => ({
          id: `att-img-${Date.now()}-${i}`,
          type: 'image',
          url: asset.uri,
          name: asset.fileName || `Photo_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        setPendingAttachments((prev) => [...prev, ...newAtts]);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    } catch (e) {
      console.warn('[Chat] Image pick error:', e);
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAtt: ChatAttachment = {
          id: `att-cam-${Date.now()}`,
          type: 'image',
          url: asset.uri,
          name: asset.fileName || `Photo_Camera_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType || 'image/jpeg',
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    } catch (e) {
      console.warn('[Chat] Camera error:', e);
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        const isImg = doc.mimeType?.startsWith('image/') || doc.name.match(/\.(jpg|jpeg|png|webp)$/i);
        const newAtt: ChatAttachment = {
          id: `att-doc-${Date.now()}`,
          type: isImg ? 'image' : 'document',
          url: doc.uri,
          name: doc.name || 'Document.pdf',
          size: doc.size,
          mimeType: doc.mimeType || 'application/pdf',
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    } catch (e) {
      console.warn('[Chat] Document pick error:', e);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    const hasAttachments = pendingAttachments.length > 0;
    if ((!inputMessage.trim() && !hasAttachments) || isSending) return;

    const textToSend = inputMessage;
    const attsToSend = [...pendingAttachments];

    setInputMessage('');
    setPendingAttachments([]);
    setShowAttachmentMenu(false);

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    await sendMessage(activeConversation.id, textToSend, attsToSend.length > 0 ? attsToSend : undefined);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickSuggestion = (text: string) => {
    setInputMessage(text);
  };

  const isSupportChat = activeConversation.propertyId === 'support';
  const property = activeConversation.property;
  const participant = activeConversation.agent;

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Modal
      visible={isChatOpen}
      transparent={isDesktop}
      animationType="slide"
      onRequestClose={closeChat}
    >
      <View
        style={[
          styles.overlay,
          isDesktop && styles.desktopOverlay,
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.container,
            isDesktop && styles.desktopContainer,
            !isDesktop && { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {isSupportChat ? (
                <View style={[styles.avatarBox, styles.supportAvatar]}>
                  <Headphones size={20} color="#FFFFFF" />
                </View>
              ) : participant.avatar ? (
                <Image source={{ uri: participant.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitial}>
                    {participant.name?.charAt(0) || 'A'}
                  </Text>
                </View>
              )}

              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {participant.name}
                  </Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>En ligne</Text>
                  </View>
                </View>
                <Text style={styles.participantRole}>
                  {isSupportChat
                    ? 'Assistance ImmoCI 24/7'
                    : `Agent Responsable · ${participant.phone || 'ImmoCI Certifié'}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={closeChat}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* ── CUSTOMER SUPPORT CASE STATUS BANNER ──────────────────────── */}
          {isSupportChat && (() => {
            const rawStatus = activeConversation.caseStatus || 'In Progress';
            const caseMeta = CASE_STATUS_CONFIG[rawStatus] || CASE_STATUS_CONFIG['Open'];
            return (
              <View style={[styles.supportCaseBanner, { backgroundColor: caseMeta.bg, borderColor: caseMeta.color + '30' }]}>
                <View style={styles.supportCaseLeft}>
                  <View style={[styles.caseDot, { backgroundColor: caseMeta.color }]} />
                  <Text style={[styles.caseBadgeText, { color: caseMeta.color }]}>
                    {language === 'fr' ? caseMeta.labelFr : caseMeta.labelEn}
                  </Text>
                </View>
                <Text style={styles.caseDeptText}>
                  {activeConversation.department || 'Customer Care'}
                  {activeConversation.assignedAgent?.name ? ` • ${activeConversation.assignedAgent.name}` : ''}
                </Text>
              </View>
            );
          })()}

          {/* ── PROPERTY CONTEXT CARD (IF LINKED TO PROPERTY) ───────────── */}
          {property && (
            <TouchableOpacity
              style={styles.propertyBanner}
              onPress={() => {
                closeChat();
                router.push(`/property/${property.id}`);
              }}
              activeOpacity={0.88}
            >
              {property.image ? (
                <Image source={{ uri: property.image }} style={styles.propThumb} />
              ) : (
                <View style={styles.propThumbPlaceholder}>
                  <Building2 size={16} color="#059669" />
                </View>
              )}

              <View style={styles.propInfo}>
                <Text style={styles.propTitle} numberOfLines={1}>
                  {property.title}
                </Text>
                <View style={styles.propSubRow}>
                  <Text style={styles.propPrice}>
                    {formatPrice(property.price, property.currency)}
                    {property.status === 'rent' && ' /mois'}
                  </Text>
                  {property.location && (
                    <View style={styles.propLocRow}>
                      <MapPin size={11} color="#64748B" />
                      <Text style={styles.propLocText} numberOfLines={1}>
                        {property.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <ExternalLink size={15} color="#059669" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          {/* ── MESSAGE THREAD LIST ─────────────────────────────────────── */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.threadScroll}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {/* Timestamp pill */}
            <View style={styles.datePillRow}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>
                  {language === 'fr' ? 'Aujourd’hui' : 'Today'}
                </Text>
              </View>
            </View>

            {currentMessages.map((msg) => {
              const isOutgoing = msg.senderRole === 'buyer';

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isOutgoing ? styles.msgRowOutgoing : styles.msgRowIncoming,
                  ]}
                >
                  {!isOutgoing && !isSupportChat && (
                    <View style={styles.msgAvatarPlaceholder}>
                      <Text style={styles.msgAvatarInitial}>
                        {msg.senderName?.charAt(0) || 'A'}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
                    ]}
                  >
                    {/* Attachments rendering */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <View style={{ gap: 6, marginBottom: msg.message ? 6 : 2 }}>
                        {msg.attachments.map((att) => {
                          if (att.type === 'image') {
                            return (
                              <TouchableOpacity
                                key={att.id}
                                activeOpacity={0.9}
                                onPress={() => setFullscreenImage(att.url)}
                                style={styles.attachmentImageContainer}
                              >
                                <Image
                                  source={{ uri: att.url }}
                                  style={styles.attachmentImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.expandBadge}>
                                  <Maximize2 size={11} color="#FFFFFF" />
                                </View>
                              </TouchableOpacity>
                            );
                          }

                          // Document attachment
                          return (
                            <TouchableOpacity
                              key={att.id}
                              activeOpacity={0.8}
                              onPress={() => {
                                if (att.url) {
                                  Linking.openURL(att.url).catch(() => {});
                                }
                              }}
                              style={[
                                styles.attachmentDocCard,
                                isOutgoing ? styles.attachmentDocOutgoing : styles.attachmentDocIncoming,
                              ]}
                            >
                              <View style={styles.docIconBox}>
                                <FileText size={18} color="#059669" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.docName,
                                    { color: isOutgoing ? '#FFFFFF' : '#0F172A' },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {att.name || 'Document'}
                                </Text>
                                <Text
                                  style={[
                                    styles.docSize,
                                    { color: isOutgoing ? 'rgba(255,255,255,0.8)' : '#64748B' },
                                  ]}
                                >
                                  {att.size ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : 'Fichier joint'}
                                </Text>
                              </View>
                              <Download size={15} color={isOutgoing ? '#FFFFFF' : '#059669'} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {!!msg.message && (
                      <Text
                        style={[
                          styles.bubbleText,
                          isOutgoing ? styles.bubbleTextOutgoing : styles.bubbleTextIncoming,
                        ]}
                      >
                        {msg.message}
                      </Text>
                    )}

                    <View style={styles.bubbleFooter}>
                      <Text
                        style={[
                          styles.bubbleTime,
                          isOutgoing ? styles.bubbleTimeOutgoing : styles.bubbleTimeIncoming,
                        ]}
                      >
                        {formatMessageTime(msg.timestamp)}
                      </Text>

                      {isOutgoing && (
                        <View style={styles.readStatusBox}>
                          {msg.isRead ? (
                            <CheckCheck size={13} color="#FFFFFF" strokeWidth={2.2} />
                          ) : (
                            <Check size={13} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {isSending && (
              <View style={[styles.msgRow, styles.msgRowOutgoing]}>
                <View style={[styles.bubble, styles.bubbleOutgoing, { paddingVertical: 10 }]}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── QUICK SUGGESTION CHIPS (IF ONLY 1-2 MESSAGES) ────────────── */}
          {property && currentMessages.length <= 2 && (
            <View style={styles.quickChipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsScroll}
              >
                {QUICK_SUGGESTIONS.map((sug, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickChip}
                    onPress={() => handleQuickSuggestion(sug)}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={11} color="#059669" />
                    <Text style={styles.quickChipText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── PENDING ATTACHMENTS TRAY ─────────────────────────────────── */}
          {pendingAttachments.length > 0 && (
            <View style={styles.pendingTray}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pendingAttachments.map((att) => (
                  <View key={att.id} style={styles.pendingItem}>
                    {att.type === 'image' ? (
                      <Image source={{ uri: att.url }} style={styles.pendingImage} />
                    ) : (
                      <View style={styles.pendingDoc}>
                        <FileText size={16} color="#059669" />
                        <Text style={styles.pendingDocName} numberOfLines={1}>
                          {att.name || 'Doc'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.pendingRemoveBtn}
                      onPress={() => handleRemoveAttachment(att.id)}
                      activeOpacity={0.8}
                    >
                      <X size={11} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── ATTACHMENT MENU POPOVER ──────────────────────────────────── */}
          {showAttachmentMenu && (
            <View style={styles.attachMenu}>
              <TouchableOpacity style={styles.attachOption} onPress={handleTakePhoto} activeOpacity={0.8}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Camera size={18} color="#059669" />
                </View>
                <Text style={styles.attachOptionText}>
                  {language === 'fr' ? 'Prendre une photo' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={handlePickImage} activeOpacity={0.8}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <ImageIcon size={18} color="#3B82F6" />
                </View>
                <Text style={styles.attachOptionText}>
                  {language === 'fr' ? 'Galerie Photos' : 'Photo Gallery'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={handlePickDocument} activeOpacity={0.8}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <FileText size={18} color="#D97706" />
                </View>
                <Text style={styles.attachOptionText}>
                  {language === 'fr' ? 'Document (PDF / ACD / Reçu)' : 'Document (PDF / Deed / Receipt)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── INPUT BAR ───────────────────────────────────────────────── */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={[styles.attachBtn, showAttachmentMenu && styles.attachBtnActive]}
              onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
              activeOpacity={0.8}
            >
              <Paperclip size={19} color={showAttachmentMenu ? '#059669' : '#64748B'} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder={
                language === 'fr'
                  ? 'Écrivez votre message...'
                  : 'Type your message...'
              }
              placeholderTextColor="#94A3B8"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputMessage.trim() && pendingAttachments.length === 0 || isSending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={(!inputMessage.trim() && pendingAttachments.length === 0) || isSending}
              activeOpacity={0.85}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" strokeWidth={2.3} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* ── FULLSCREEN IMAGE PREVIEW MODAL ───────────────────────────── */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}
            activeOpacity={0.8}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopContainer: {
    width: 480,
    height: 680,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportAvatar: {
    backgroundColor: '#3B82F6',
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  participantRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },

  // Customer Support Case Banner
  supportCaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  supportCaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  caseBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  caseDeptText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Property Banner Context
  propertyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
    cursor: 'pointer' as any,
  },
  propThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
  },
  propThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propInfo: {
    flex: 1,
  },
  propTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  propSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  propLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  propLocText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Message Thread
  threadScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  threadContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  datePillRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  datePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowIncoming: {
    justifyContent: 'flex-start',
  },
  msgRowOutgoing: {
    justifyContent: 'flex-end',
  },
  msgAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleIncoming: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleOutgoing: {
    backgroundColor: '#059669',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextIncoming: {
    color: '#0F172A',
  },
  bubbleTextOutgoing: {
    color: '#FFFFFF',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  bubbleTimeIncoming: {
    color: '#94A3B8',
  },
  bubbleTimeOutgoing: {
    color: 'rgba(255,255,255,0.75)',
  },
  readStatusBox: {
    marginLeft: 2,
  },

  // Attachment images & documents inside bubbles
  attachmentImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: 240,
    maxHeight: 200,
    backgroundColor: '#000000',
  },
  attachmentImage: {
    width: 240,
    height: 180,
    borderRadius: 12,
  },
  expandBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 6,
  },
  attachmentDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
    maxWidth: 240,
  },
  attachmentDocIncoming: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentDocOutgoing: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  docIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
  },
  docSize: {
    fontSize: 11,
    marginTop: 1,
  },

  // Quick Chips
  quickChipsWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  quickChipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    cursor: 'pointer' as any,
  },
  quickChipText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
  },

  // Pending Attachments Tray
  pendingTray: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pendingItem: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pendingImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  pendingDoc: {
    width: 90,
    height: 54,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingDocName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  pendingRemoveBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Attachment Menu Popover
  attachMenu: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  attachIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  attachBtnActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },

  // Fullscreen Image Overlay
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  fullscreenImg: {
    width: '94%',
    height: '80%',
  },
});
