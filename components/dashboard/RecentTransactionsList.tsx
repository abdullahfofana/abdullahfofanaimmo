import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  User,
  Search,
  Download,
  ChevronRight,
} from 'lucide-react-native';
import type { DashboardTheme } from '@/constants/colors';

export type TransactionType = 'deposit' | 'sale' | 'lease' | 'commission' | 'escrow' | 'payout';
export type TransactionStatus = 'completed' | 'pending' | 'processing' | 'failed';
export type PaymentMethod = 'wave' | 'orange_money' | 'mtn_momo' | 'bank_wire' | 'card';

export interface DashboardTransaction {
  id: string;
  reference: string;
  title: string;
  propertyTitle: string;
  clientName: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  date: string;
  formattedDate: string;
  direction: 'inflow' | 'outflow';
}

export const INITIAL_TRANSACTIONS: DashboardTransaction[] = [
  {
    id: 'tx_01',
    reference: 'TX-98421',
    title: 'Acompte Séquestre Villa Cocody',
    propertyTitle: 'Villa Cocody Riviera Golf',
    clientName: 'M. Jean-Paul Kouassi',
    amount: 15000000,
    currency: 'FCFA',
    type: 'escrow',
    status: 'completed',
    paymentMethod: 'bank_wire',
    date: '2026-08-05T14:32:00',
    formattedDate: "Aujourd'hui, 14:32",
    direction: 'inflow',
  },
  {
    id: 'tx_02',
    reference: 'TX-98420',
    title: 'Loyer Q3 Appartement Plateau',
    propertyTitle: 'Appartement Plateau Standing',
    clientName: 'Cabinet Bamba & Associés',
    amount: 2800000,
    currency: 'FCFA',
    type: 'lease',
    status: 'completed',
    paymentMethod: 'wave',
    date: '2026-08-05T11:15:00',
    formattedDate: "Aujourd'hui, 11:15",
    direction: 'inflow',
  },
  {
    id: 'tx_03',
    reference: 'TX-98419',
    title: 'Commission Vente Duplex Marcory',
    propertyTitle: 'Duplex Marcory Zone 4',
    clientName: 'SCI Ivoire Prestige',
    amount: 4500000,
    currency: 'FCFA',
    type: 'commission',
    status: 'processing',
    paymentMethod: 'bank_wire',
    date: '2026-08-04T16:45:00',
    formattedDate: 'Hier, 16:45',
    direction: 'inflow',
  },
  {
    id: 'tx_04',
    reference: 'TX-98418',
    title: 'Réservation Studio Yopougon',
    propertyTitle: 'Studio Cosy Yopougon Niangon',
    clientName: 'Mme. Fatou Diallo',
    amount: 350000,
    currency: 'FCFA',
    type: 'deposit',
    status: 'completed',
    paymentMethod: 'orange_money',
    date: '2026-08-04T09:20:00',
    formattedDate: 'Hier, 09:20',
    direction: 'inflow',
  },
  {
    id: 'tx_05',
    reference: 'TX-98417',
    title: 'Reversement Bailleur Terrain Bingerville',
    propertyTitle: 'Terrain Résidentiel Bingerville',
    clientName: 'M. Roland Koffi',
    amount: 8200000,
    currency: 'FCFA',
    type: 'payout',
    status: 'pending',
    paymentMethod: 'bank_wire',
    date: '2026-08-03T18:00:00',
    formattedDate: '03 Août 2026',
    direction: 'outflow',
  },
  {
    id: 'tx_06',
    reference: 'TX-98416',
    title: 'Garantie Caution Villa Palmeraie',
    propertyTitle: 'Villa 5P Cocody Palmeraie',
    clientName: 'M. Eric Yao',
    amount: 1800000,
    currency: 'FCFA',
    type: 'escrow',
    status: 'completed',
    paymentMethod: 'mtn_momo',
    date: '2026-08-02T12:10:00',
    formattedDate: '02 Août 2026',
    direction: 'inflow',
  },
];

interface RecentTransactionsListProps {
  theme: DashboardTheme;
  transactions?: DashboardTransaction[];
  onViewAll?: () => void;
  maxItems?: number;
}

export default function RecentTransactionsList({
  theme,
  transactions = INITIAL_TRANSACTIONS,
  onViewAll,
  maxItems = 6,
}: RecentTransactionsListProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'completed' | 'pending' | 'escrow'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<DashboardTransaction | null>(null);

  const filteredList = useMemo(() => {
    return transactions.filter(tx => {
      const matchFilter =
        filterTab === 'all' ||
        (filterTab === 'completed' && tx.status === 'completed') ||
        (filterTab === 'pending' && (tx.status === 'pending' || tx.status === 'processing')) ||
        (filterTab === 'escrow' && tx.type === 'escrow');

      const matchSearch =
        searchQuery.trim() === '' ||
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [transactions, filterTab, searchQuery]);

  const totalVolume = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + (curr.direction === 'inflow' ? curr.amount : 0), 0);
  }, [transactions]);

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'wave':
        return { label: 'Wave', color: '#00D1FF', bg: 'rgba(0, 209, 255, 0.12)' };
      case 'orange_money':
        return { label: 'Orange Money', color: '#FF7900', bg: 'rgba(255, 121, 0, 0.12)' };
      case 'mtn_momo':
        return { label: 'MTN MoMo', color: '#FFCC00', bg: 'rgba(255, 204, 0, 0.15)' };
      case 'bank_wire':
        return { label: 'Virement', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
      case 'card':
        return { label: 'Carte', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      default:
        return { label: 'Paiement', color: theme.textMuted, bg: theme.surfaceAlt };
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'Complété', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', icon: CheckCircle2 };
      case 'pending':
        return { label: 'En attente', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: Clock };
      case 'processing':
        return { label: 'En cours', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: Clock };
      case 'failed':
        return { label: 'Échoué', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: AlertCircle };
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>Transactions Récentes</Text>
            <View style={[styles.volumeBadge, { backgroundColor: theme.purpleMuted }]}>
              <Text style={[styles.volumeText, { color: theme.purpleLight }]}>
                {(totalVolume / 1000000).toFixed(1)}M FCFA ce mois
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Flux financiers en temps réel, acomptes séquestres et reversements
          </Text>
        </View>

        {onViewAll && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: theme.purpleLight }]}>Voir tout</Text>
            <ChevronRight size={14} color={theme.purpleLight} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs & Search */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {[
            { key: 'all' as const, label: 'Toutes' },
            { key: 'completed' as const, label: 'Complétées' },
            { key: 'pending' as const, label: 'En attente' },
            { key: 'escrow' as const, label: 'Séquestre' },
          ].map(tab => {
            const active = filterTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? theme.purple : theme.surfaceAlt,
                    borderColor: active ? theme.purple : theme.borderLight,
                  },
                ]}
                onPress={() => setFilterTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: active ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: active ? '600' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}>
          <Search size={13} color={theme.textMuted} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher transaction..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Table / List Container */}
      <View style={styles.listContainer}>
        {filteredList.slice(0, maxItems).map((tx, index) => {
          const status = getStatusBadge(tx.status);
          const method = getMethodBadge(tx.paymentMethod);
          const isInflow = tx.direction === 'inflow';

          return (
            <TouchableOpacity
              key={tx.id}
              style={[
                styles.rowItem,
                {
                  borderBottomColor: theme.borderLight,
                  borderBottomWidth: index < filteredList.length - 1 ? 1 : 0,
                },
              ]}
              onPress={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
              activeOpacity={0.7}
            >
              {/* Icon Direction / Type */}
              <View
                style={[
                  styles.directionIconWrap,
                  {
                    backgroundColor: isInflow ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  },
                ]}
              >
                {isInflow ? (
                  <ArrowDownLeft size={16} color="#10B981" strokeWidth={2.5} />
                ) : (
                  <ArrowUpRight size={16} color="#EF4444" strokeWidth={2.5} />
                )}
              </View>

              {/* Main Info */}
              <View style={styles.mainInfo}>
                <View style={styles.titleLine}>
                  <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <View style={[styles.methodBadge, { backgroundColor: method.bg }]}>
                    <Text style={[styles.methodText, { color: method.color }]}>{method.label}</Text>
                  </View>
                </View>

                <View style={styles.subLine}>
                  <View style={styles.metaItem}>
                    <Building2 size={11} color={theme.textMuted} strokeWidth={1.8} />
                    <Text style={[styles.metaText, { color: theme.textMuted }]} numberOfLines={1}>
                      {tx.propertyTitle}
                    </Text>
                  </View>
                  <Text style={[styles.bullet, { color: theme.borderStrong }]}>•</Text>
                  <View style={styles.metaItem}>
                    <User size={11} color={theme.textMuted} strokeWidth={1.8} />
                    <Text style={[styles.metaText, { color: theme.textMuted }]} numberOfLines={1}>
                      {tx.clientName}
                    </Text>
                  </View>
                  <Text style={[styles.bullet, { color: theme.borderStrong }]}>•</Text>
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>{tx.formattedDate}</Text>
                </View>
              </View>

              {/* Status & Amount */}
              <View style={styles.amountCol}>
                <Text
                  style={[
                    styles.amountText,
                    {
                      color: isInflow ? '#10B981' : theme.text,
                    },
                  ]}
                >
                  {isInflow ? '+' : '-'}
                  {formatAmount(tx.amount)}
                </Text>

                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredList.length === 0 && (
          <View style={styles.emptyWrap}>
            <Clock size={28} color={theme.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Aucune transaction correspondant aux critères
            </Text>
          </View>
        )}
      </View>

      {/* Footer info & quick download */}
      <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
        <View style={styles.footerInfo}>
          <ShieldCheck size={14} color={theme.green} strokeWidth={2} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Paiements sécurisés via séquestre bancaire & agrégateurs certifiés
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <Download size={13} color={theme.textSecondary} strokeWidth={2} />
          <Text style={[styles.downloadText, { color: theme.textSecondary }]}>Relevé CSV</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  volumeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  volumeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 180,
    gap: 6,
  },
  searchInput: {
    fontSize: 12,
    padding: 0,
    flex: 1,
  },
  listContainer: {
    marginTop: 4,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  directionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 160,
  },
  metaText: {
    fontSize: 11,
  },
  bullet: {
    fontSize: 10,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
