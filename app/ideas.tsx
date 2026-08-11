import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { projectSuggestions, ProjectSuggestion } from '@/constants/projectSuggestions';

export default function IdeasScreen() {
  const curatedSuggestions = useMemo<ProjectSuggestion[]>(() => projectSuggestions, []);

  console.log('[IdeasScreen] Suggestions ready:', curatedSuggestions.length);

  return (
    <View style={styles.container} testID="ideas-screen">
      <Stack.Screen options={{
        title: 'Product Ideas',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { fontFamily: 'System', fontWeight: '700' },
      }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard} testID="ideas-hero-card">
          <Text style={styles.heroEyebrow}>Strategic Roadmap</Text>
          <Text style={styles.heroTitle}>High-impact upgrades for the Rork marketplace</Text>
          <Text style={styles.heroCopy}>
            These bets strengthen trust, increase conversion, and give sellers premium workflows while staying light enough for Expo Go.
          </Text>
        </View>

        {curatedSuggestions.map((idea) => (
          <View key={idea.id} style={styles.ideaCard} testID={`idea-card-${idea.id}`}>
            <View style={styles.ideaHeader}>
              <Text style={styles.ideaTitle}>{idea.title}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, badgeImpactStyles[idea.impact]]}>
                  <Text style={styles.badgeText}>{idea.impact.toUpperCase()} IMPACT</Text>
                </View>
                <View style={styles.badgeMuted}>
                  <Text style={styles.badgeMutedText}>{idea.effort.toUpperCase()} effort</Text>
                </View>
              </View>
            </View>

            <Text style={styles.ideaSummary}>{idea.summary}</Text>
            <Text style={styles.ideaDetails}>{idea.details}</Text>

            <View style={styles.tagRow}>
              {idea.tags.map((tag) => (
                <View key={`${idea.id}-${tag}`} style={styles.tagChip} testID={`idea-tag-${idea.id}-${tag}`}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              testID={`idea-cta-${idea.id}`}
              onPress={() => {
                console.log('[IdeasScreen] CTA pressed:', idea.id);
              }}
            >
              <Text style={styles.ctaLabel}>Add to roadmap</Text>
              <Text style={styles.ctaSubLabel}>Perfect for the next sprint planning</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.footerNote} testID="ideas-footer-note">
          <Text style={styles.footerHeading}>Need a tailored concept?</Text>
          <Text style={styles.footerCopy}>
            Pair any of these ideas with the new “Contact Support” entry so your human ops team can guide sellers while you iterate.
          </Text>
          <Text style={styles.footerCopy}>
            Platform: {Platform.OS === 'web' ? 'Web preview' : 'Native runtime'} ready.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const badgeImpactStyles: Record<ProjectSuggestion['impact'], { backgroundColor: string }> = {
  high: { backgroundColor: '#FFD8D2' },
  medium: { backgroundColor: '#FFECC2' },
  experimental: { backgroundColor: '#E1F3F9' },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  heroEyebrow: {
    ...Typography.caption,
    color: '#FFFFFFB3',
    letterSpacing: 1.5,
  },
  heroTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroCopy: {
    ...Typography.body,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  ideaCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: Spacing.lg,
    shadowColor: '#00000020',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
    gap: Spacing.md,
  },
  ideaHeader: {
    gap: Spacing.sm,
  },
  ideaTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  badgeMuted: {
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  badgeMutedText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ideaSummary: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  ideaDetails: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  ctaButton: {
    marginTop: Spacing.sm,
    borderRadius: 18,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ctaLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  ctaSubLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footerNote: {
    padding: Spacing.xl,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    gap: Spacing.sm,
  },
  footerHeading: {
    ...Typography.h4,
    color: Colors.text,
  },
  footerCopy: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
