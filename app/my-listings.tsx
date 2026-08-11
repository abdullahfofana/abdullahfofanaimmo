import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import WebNavbar from '@/components/WebNavbar';

export default function MyListingsScreen() {
  const { submissions } = usePropertySubmissions();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <WebNavbar />}
      <Stack.Screen
        options={{
          title: 'My Listings',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/add-property')} style={styles.addButton}>
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text },
        }}
      />
      
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven&apos;t submitted any properties yet.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/add-property')}>
              <Text style={styles.ctaButtonText}>Add New Property</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, { 
                backgroundColor: item.submissionStatus === 'approved' ? Colors.success : 
                               item.submissionStatus === 'rejected' ? Colors.error : Colors.warning 
              }]}>
                <Text style={styles.statusText}>{item.submissionStatus.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardPrice}>{item.price.toLocaleString()} FCFA</Text>
            <Text style={styles.cardDate}>Submitted on {new Date(item.submittedAt).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  addButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  cardPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  cardDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
