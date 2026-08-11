import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Shield, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { trpc } from '@/lib/trpc';

interface AIModerationProps {
    visible: boolean;
    onClose: () => void;
    property: any; // Property submission object
    onApprove: () => void;
    onReject: (reason: string) => void;
}

export default function AIModeration({ visible, onClose, property, onApprove, onReject }: AIModerationProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const moderateMutation = trpc.ai.moderate.useMutation();

    useEffect(() => {
        if (visible && property) {
            analyzeProperty();
        }
    }, [visible, property]);

    const analyzeProperty = async () => {
        try {
            const result = await moderateMutation.mutateAsync({ property });
            setAnalysis(result);
        } catch (error) {
            console.error("Moderation Analysis failed", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return Colors.success;
            case 'rejected': return Colors.error;
            case 'flagged': return Colors.warning;
            default: return Colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={32} color={Colors.success} />;
            case 'rejected': return <XCircle size={32} color={Colors.error} />;
            case 'flagged': return <AlertTriangle size={32} color={Colors.warning} />;
            default: return null;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Shield size={24} color={Colors.primary} />
                            <Text style={styles.title}>AI Moderation Review</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body}>
                        {moderateMutation.isPending ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>Analyzing property details...</Text>
                                <Text style={styles.loadingSubtext}>Checking for spam, pricing anomalies, and quality issues</Text>
                            </View>
                        ) : analysis ? (
                            <View>
                                {/* Result Header */}
                                <View style={[styles.resultCard, { borderColor: getStatusColor(analysis.status) }]}>
                                    <View style={styles.statusRow}>
                                        {getStatusIcon(analysis.status)}
                                        <View>
                                            <Text style={styles.statusLabel}>Risk Assessment</Text>
                                            <Text style={[styles.statusValue, { color: getStatusColor(analysis.status) }]}>
                                                {analysis.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.confidenceBadge}>
                                            <Text style={styles.confidenceText}>{(analysis.confidence * 100).toFixed(0)}% Confidence</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reasonText}>{analysis.reason}</Text>
                                </View>

                                {/* Flags List */}
                                {analysis.flags && analysis.flags.length > 0 && (
                                    <View style={styles.flagsContainer}>
                                        <Text style={styles.sectionTitle}>Identified Issues</Text>
                                        {analysis.flags.map((flag: string, index: number) => (
                                            <View key={index} style={styles.flagItem}>
                                                <AlertTriangle size={16} color={Colors.warning} />
                                                <Text style={styles.flagText}>{flag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Property Summary */}
                                <View style={styles.propertySummary}>
                                    <Text style={styles.sectionTitle}>Property Details</Text>
                                    <Text style={styles.summaryText}><Text style={{ fontWeight: '700' }}>Title:</Text> {property.title}</Text>
                                    <Text style={styles.summaryText}><Text style={{ fontWeight: '700' }}>Price:</Text> {(property.price).toLocaleString()} FCFA</Text>
                                    <Text style={styles.summaryText}><Text style={{ fontWeight: '700' }}>Location:</Text> {property.location?.city}</Text>
                                </View>

                            </View>
                        ) : (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Analysis unavailable. Please try again.</Text>
                                <TouchableOpacity onPress={analyzeProperty} style={styles.retryButton}>
                                    <Text style={styles.retryText}>Retry Analysis</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => onReject(analysis?.reason || 'Rejected by manual review')}
                        >
                            <Text style={[styles.actionButtonText, { color: Colors.error }]}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={onApprove}
                        >
                            <Text style={styles.actionButtonText}>Approve Listing</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        ...Typography.h4,
        marginLeft: 10,
    },
    body: {
        padding: Spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        ...Typography.body,
        marginTop: Spacing.md,
        fontWeight: '600',
    },
    loadingSubtext: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    resultCard: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 12,
        padding: Spacing.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    statusLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    statusValue: {
        ...Typography.h4,
        fontWeight: '700',
    },
    confidenceBadge: {
        marginLeft: 'auto',
        backgroundColor: Colors.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    confidenceText: {
        ...Typography.caption,
        fontWeight: '600',
    },
    reasonText: {
        ...Typography.body,
        color: Colors.text,
        lineHeight: 22,
    },
    flagsContainer: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h4,
        marginBottom: Spacing.md,
        color: Colors.text,
    },
    flagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.warning + '10', // Light warning bg
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    flagText: {
        ...Typography.bodySmall,
        color: Colors.text,
        flex: 1,
    },
    propertySummary: {
        backgroundColor: Colors.backgroundSecondary,
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.lg,
    },
    summaryText: {
        ...Typography.bodySmall,
        color: Colors.text,
        marginBottom: 4,
    },
    errorContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorText: {
        ...Typography.body,
        color: Colors.error,
        marginBottom: Spacing.md,
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    retryText: {
        color: Colors.white,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.md,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    rejectButton: {
        borderColor: Colors.error,
        backgroundColor: Colors.white,
    },
    approveButton: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    actionButtonText: {
        fontWeight: '600',
        color: Colors.white,
    },
});
