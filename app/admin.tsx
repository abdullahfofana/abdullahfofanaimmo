import { router, Stack } from 'expo-router';
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Download,
  CheckCircle,
  XCircle,
  Plus,
  Shield,
  UserPlus,
  UserCheck,
  FileText as FileIcon,
  Sparkles,
  MessageCircle,
  ChevronLeft,
  Home,
  LayoutDashboard,
  Settings,
  Zap,
  CreditCard,
  Bell,
  MoreHorizontal,
  X,
  Globe,
  Moon,
  Sun,
  Activity,
  Layers,
  BarChart3,
  Check,
  AlertCircle,
  ArrowUpRight,
  Eye,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  Platform,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import type { PropertySubmission } from '@/types/property';
import { AnalyticsProvider, useAnalytics } from '@/providers/AnalyticsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useColors } from '@/hooks/useColors';

import AdminSettings from '@/components/admin/AdminSettings';
import AdminIntegrations from '@/components/admin/AdminIntegrations';
import AdminLogin from '@/components/admin/AdminLogin';
import UserManagement from '@/components/admin/UserManagement';
import RecentActivity from '@/components/admin/RecentActivity';
import QuickActions from '@/components/admin/QuickActions';
import AIAnalyticsPanel from '@/components/admin/AIAnalyticsPanel';
import AIModeration from '@/components/admin/AIModeration';
import AdminAIInsightsPanel from '@/components/admin/AdminAIInsightsPanel';
import MonthlyGrowthChart from '@/components/admin/MonthlyGrowthChart';
import PropertyDistributionChart from '@/components/admin/PropertyDistributionChart';
import RevenueAnalyticsChart from '@/components/admin/RevenueAnalyticsChart';
import PerformanceDistributionChart from '@/components/charts/PerformanceDistributionChart';

export type AdminSection =
  | 'dashboard'
  | 'analytics'
  | 'properties'
  | 'documents'
  | 'users'
  | 'staff'
  | 'reports'
  | 'integrations'
  | 'settings'
  | 'support';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Agent' | 'Admin';
  department: string;
  status: 'Active' | 'Inactive';
  hireDate: string;
  lastActive: string;
  avatar: string;
}

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@immoci.ci',
    role: 'Manager',
    department: 'Operations',
    status: 'Active',
    hireDate: '2023-01-15',
    lastActive: '2024-06-16',
    avatar: 'AJ',
  },
  {
    id: '2',
    name: 'Bob Wilson',
    email: 'bob@immoci.ci',
    role: 'Agent',
    department: 'Sales',
    status: 'Active',
    hireDate: '2023-03-20',
    lastActive: '2024-06-15',
    avatar: 'BW',
  },
  {
    id: '3',
    name: 'Charlie Davis',
    email: 'charlie@immoci.ci',
    role: 'Agent',
    department: 'Support',
    status: 'Inactive',
    hireDate: '2023-05-10',
    lastActive: '2024-05-30',
    avatar: 'CD',
  },
];

export default function AdminDashboardWrapper() {
  return (
    <AnalyticsProvider>
      <AdminDashboard />
    </AnalyticsProvider>
  );
}

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const {
    submissions,
    getPendingSubmissions,
    updateSubmissionStatus,
  } = usePropertySubmissions();

  const { t, language, setLanguage } = useLanguage();
  const { activeTheme, setTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  // Google Stitch Pro Theme Palette
  const stitchTheme = useMemo(() => ({
    bg: isDark ? '#0B0F19' : '#F6F8FC',
    sidebarBg: isDark ? '#0F172A' : '#0F172A',
    surface: isDark ? '#161F30' : '#FFFFFF',
    surfaceHover: isDark ? '#1E293B' : '#F8FAFC',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#059669', // Stitch Emerald
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    indigo: '#6366F1',
    indigoLight: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
    amber: '#F59E0B',
    amberLight: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
    blue: '#3B82F6',
    blueLight: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
    rose: '#EF4444',
    roseLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
    topBarBg: isDark ? '#111827' : '#FFFFFF',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
  }), [isDark]);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAIModeration, setShowAIModeration] = useState(false);
  const [moderationProperty, setModerationProperty] = useState<PropertySubmission | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Agent' as StaffMember['role'],
    department: '',
  });

  const [showStaffActionModal, setShowStaffActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [attachmentView, setAttachmentView] = useState<{
    type: 'document' | 'media';
    submission: PropertySubmission;
  } | null>(null);

  const { kpis, charts } = useAnalytics();
  const pendingSubmissions = getPendingSubmissions();

  const handleEditStaff = (staffMember: StaffMember) => {
    console.log('Edit staff', staffMember.id);
    setShowStaffActionModal(false);
  };

  const handleStaffAction = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setShowStaffActionModal(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this staff member?')) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
        setShowStaffActionModal(false);
      }
    } else {
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setShowStaffActionModal(false);
    }
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.department) {
      return;
    }

    const newMember: StaffMember = {
      id: crypto.randomUUID(),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      department: newStaff.department,
      status: 'Active',
      hireDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      avatar: newStaff.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2),
    };

    setStaff([...staff, newMember]);
    setShowAddStaffModal(false);
    setNewStaff({
      name: '',
      email: '',
      role: 'Agent',
      department: '',
    });
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  // Stitch Tonal Metric Cards
  const stats = [
    {
      id: 'properties',
      icon: <Building2 size={22} color={stitchTheme.primary} />,
      iconBg: stitchTheme.primaryLight,
      title: 'Total Properties',
      value: kpis.totalProperties.toLocaleString(),
      subtitle: 'Active listings',
      trend: `+${kpis.propertyGrowth}%`,
      trendPositive: kpis.propertyGrowth >= 0,
      accentColor: stitchTheme.primary,
    },
    {
      id: 'users',
      icon: <Users size={22} color={stitchTheme.indigo} />,
      iconBg: stitchTheme.indigoLight,
      title: 'Total Users',
      value: kpis.activeUsers.toLocaleString(),
      subtitle: 'Active accounts',
      trend: `+${kpis.userGrowth}%`,
      trendPositive: kpis.userGrowth >= 0,
      accentColor: stitchTheme.indigo,
    },
    {
      id: 'docs',
      icon: <FileText size={22} color={stitchTheme.amber} />,
      iconBg: stitchTheme.amberLight,
      title: 'Pending Docs',
      value: kpis.pendingVerifications.toString(),
      subtitle: 'Verification required',
      trend: kpis.pendingVerifications > 5 ? 'High' : 'Normal',
      trendPositive: kpis.pendingVerifications <= 5,
      accentColor: stitchTheme.amber,
    },
    {
      id: 'revenue',
      icon: <DollarSign size={22} color={stitchTheme.blue} />,
      iconBg: stitchTheme.blueLight,
      title: 'Revenue',
      value: kpis.totalRevenue.toLocaleString(),
      subtitle: 'Total Revenue (FCFA)',
      trend: `+${kpis.revenueGrowth}%`,
      trendPositive: kpis.revenueGrowth >= 0,
      accentColor: stitchTheme.blue,
    },
  ];

  const navItems: {
    id: AdminSection;
    icon: React.ReactNode;
    title: string;
    count?: number;
  }[] = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={19} color={activeSection === 'dashboard' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_dashboard'),
    },
    {
      id: 'analytics',
      icon: <TrendingUp size={19} color={activeSection === 'analytics' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_analytics'),
    },
    {
      id: 'properties',
      icon: <Building2 size={19} color={activeSection === 'properties' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_properties'),
    },
    {
      id: 'documents',
      icon: <FileText size={19} color={activeSection === 'documents' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_documents'),
      count: pendingSubmissions.length,
    },
    {
      id: 'users',
      icon: <Users size={19} color={activeSection === 'users' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_users'),
    },
    {
      id: 'staff',
      icon: <UserCheck size={19} color={activeSection === 'staff' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_staff'),
    },
    {
      id: 'support',
      icon: <MessageCircle size={19} color={activeSection === 'support' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_support'),
    },
    {
      id: 'reports',
      icon: <BarChart3 size={19} color={activeSection === 'reports' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_reports'),
    },
    {
      id: 'integrations',
      icon: <Zap size={19} color={activeSection === 'integrations' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_integrations'),
    },
    {
      id: 'settings',
      icon: <Settings size={19} color={activeSection === 'settings' ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_settings'),
    },
  ];

  // ── Render Views ───────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <View style={styles.animateView}>
      {/* 4 Top Tonal Metric KPI Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.id}
            style={[
              styles.statCard,
              {
                backgroundColor: stitchTheme.surface,
                borderColor: stitchTheme.cardBorder,
              },
            ]}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                {stat.icon}
              </View>
              <View
                style={[
                  styles.statTrendPill,
                  {
                    backgroundColor: stat.trendPositive
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.2)'
                        : '#DCFCE7'
                      : isDark
                      ? 'rgba(239, 68, 68, 0.2)'
                      : '#FEE2E2',
                  },
                ]}
              >
                {stat.trendPositive ? (
                  <ArrowUpRight size={13} color={stat.trendPositive ? '#10B981' : '#EF4444'} />
                ) : null}
                <Text
                  style={[
                    styles.statTrendText,
                    { color: stat.trendPositive ? (isDark ? '#34D399' : '#166534') : '#EF4444' },
                  ]}
                >
                  {stat.trend}
                </Text>
              </View>
            </View>

            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: stitchTheme.textPrimary }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statTitle, { color: stitchTheme.textSecondary }]}>
                {stat.title}
              </Text>
              <Text style={[styles.statSubtitle, { color: stitchTheme.textMuted }]}>
                {stat.subtitle}
              </Text>
            </View>

            <View style={[styles.statCardIndicator, { backgroundColor: stat.accentColor }]} />
          </View>
        ))}
      </View>

      {/* Charts Section */}
      <View style={styles.dashboardGrid}>
        <View style={styles.chartsRow}>
          <View style={[styles.chartWrapper, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <PerformanceDistributionChart
              title="Performance Distribution"
              subtitle="Q2 2026"
              themeMode={isDark ? 'dark' : 'light'}
              size={240}
            />
          </View>
          <View style={[styles.chartWrapper, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <PropertyDistributionChart
              data={charts.distribution}
              themeMode={isDark ? 'dark' : 'light'}
            />
          </View>
        </View>

        <RevenueAnalyticsChart data={charts.revenue} />
        <MonthlyGrowthChart data={charts.userGrowth} />
      </View>

      <AIAnalyticsPanel data={{ kpis, charts }} />
      <AdminAIInsightsPanel />
      <RecentActivity />
      <QuickActions onNavigate={setActiveSection} />
    </View>
  );

  const renderProperties = () => (
    <View style={styles.animateView}>
      <View style={styles.filterBar}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: stitchTheme.surface,
              borderColor: stitchTheme.cardBorder,
            },
          ]}
        >
          <Search size={18} color={stitchTheme.textSecondary} />
          <TextInput
            placeholder="Search properties..."
            style={[styles.searchInput, { color: stitchTheme.textPrimary }]}
            placeholderTextColor={stitchTheme.textSecondary}
          />
        </View>
        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: stitchTheme.surface,
                borderColor: stitchTheme.cardBorder,
              },
            ]}
          >
            <Filter size={18} color={stitchTheme.textPrimary} />
            <Text style={[styles.filterButtonText, { color: stitchTheme.textPrimary }]}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: stitchTheme.primary }]}
            onPress={() => router.push('/add-property')}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.tableContainer,
          {
            backgroundColor: stitchTheme.surface,
            borderColor: stitchTheme.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.tableHeader,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderBottomColor: stitchTheme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.tableHead, { flex: 2.5, color: stitchTheme.textSecondary }]}>Property</Text>
          <Text style={[styles.tableHead, { flex: 1.5, color: stitchTheme.textSecondary }]}>Location</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>Price</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>Type</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>Status</Text>
          <Text style={[styles.tableHead, { flex: 0.8, textAlign: 'center', color: stitchTheme.textSecondary }]}>Action</Text>
        </View>

        {submissions.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Building2 size={40} color={stitchTheme.textMuted} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: stitchTheme.textPrimary }}>
              No properties listed yet
            </Text>
            <Text style={{ color: stitchTheme.textSecondary, marginTop: 4 }}>
              Properties submitted by users or agents will appear here.
            </Text>
          </View>
        ) : (
          submissions.map((sub) => (
            <View
              key={sub.id}
              style={[
                styles.tableRow,
                { borderBottomColor: stitchTheme.cardBorder },
              ]}
            >
              <View style={[styles.tableCellView, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <Image
                  source={{ uri: sub.photos[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200' }}
                  style={styles.tableImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tableCellTitle, { color: stitchTheme.textPrimary }]} numberOfLines={1}>
                    {sub.title}
                  </Text>
                  <Text style={[styles.tableCellSubtitle, { color: stitchTheme.textMuted }]}>{sub.id.substring(0, 12)}...</Text>
                </View>
              </View>

              <Text style={[styles.tableCell, { flex: 1.5, color: stitchTheme.textPrimary }]}>
                {sub.location.district}, {sub.location.city}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: '700', color: stitchTheme.textPrimary }]}>
                {(sub.price / 1000000).toFixed(1)}M FCFA
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textTransform: 'capitalize', color: stitchTheme.textSecondary }]}>
                {sub.type}
              </Text>
              <View style={[styles.tableCellView, { flex: 1 }]}>
                <View
                  style={[
                    styles.statusBadge,
                    sub.submissionStatus === 'approved'
                      ? styles.statusApproved
                      : sub.submissionStatus === 'rejected'
                      ? styles.statusRejected
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      sub.submissionStatus === 'approved'
                        ? styles.statusTextApproved
                        : sub.submissionStatus === 'rejected'
                        ? styles.statusTextRejected
                        : styles.statusTextPendingTable,
                    ]}
                  >
                    {sub.submissionStatus}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 0.8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}
                  onPress={() => {
                    setModerationProperty(sub);
                    setShowAIModeration(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }]}
                  onPress={() => setAttachmentView({ type: 'media', submission: sub })}
                  activeOpacity={0.8}
                >
                  <Eye size={16} color={stitchTheme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.animateView}>
      <View style={styles.documentsGrid}>
        {pendingSubmissions.length === 0 ? (
          <View style={[styles.emptyStateFull, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={[styles.emptyStateIconCircle, { backgroundColor: stitchTheme.primaryLight }]}>
              <Shield size={48} color={stitchTheme.primary} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: stitchTheme.textPrimary }]}>All documents verified</Text>
            <Text style={[styles.emptyStateText, { color: stitchTheme.textSecondary }]}>
              Great job! There are currently no pending documents to review.
            </Text>
          </View>
        ) : (
          pendingSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              theme={stitchTheme}
              isDark={isDark}
              onApprove={() => updateSubmissionStatus(submission.id, 'approved')}
              onReject={() => updateSubmissionStatus(submission.id, 'rejected', 'Document invalid')}
              onViewDocs={() => setAttachmentView({ type: 'document', submission })}
              onViewMedia={() => setAttachmentView({ type: 'media', submission })}
            />
          ))
        )}
      </View>
    </View>
  );

  const renderReports = () => {
    const reports = [
      { id: '1', name: 'Monthly Revenue Report', date: 'Q2 2026', size: '2.4 MB', type: 'PDF' },
      { id: '2', name: 'User Growth & Retention Analysis', date: 'May 2026', size: '1.8 MB', type: 'PDF' },
      { id: '3', name: 'Property Listings & Conversion Summary', date: 'Q2 2026', size: '3.5 MB', type: 'CSV' },
      { id: '4', name: 'Agent Performance & SLA Review', date: 'June 2026', size: '1.2 MB', type: 'PDF' },
    ];

    return (
      <View style={styles.animateView}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: stitchTheme.textPrimary }]}>Available Reports</Text>
        </View>
        <View style={styles.cardsGrid}>
          {reports.map((report) => (
            <View
              key={report.id}
              style={[
                styles.reportCard,
                {
                  backgroundColor: stitchTheme.surface,
                  borderColor: stitchTheme.cardBorder,
                },
              ]}
            >
              <View style={[styles.reportIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }]}>
                <FileIcon size={24} color="#3B82F6" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={[styles.reportName, { color: stitchTheme.textPrimary }]}>{report.name}</Text>
                <Text style={[styles.reportMeta, { color: stitchTheme.textSecondary }]}>
                  {report.date} • {report.size} • {report.type}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Download size={18} color={stitchTheme.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStaff = () => (
    <View style={styles.animateView}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageHeaderTitle, { color: stitchTheme.textPrimary }]}>
            {language === 'fr' ? 'Gestion du Personnel' : 'Staff Management'}
          </Text>
          <Text style={[styles.pageHeaderSubtitle, { color: stitchTheme.textSecondary }]}>
            {language === 'fr' ? 'Gérez les membres de votre équipe et leurs rôles' : 'Manage team members and authorization roles'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: stitchTheme.primary }]}
          onPress={() => setShowAddStaffModal(true)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Add Staff Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: stitchTheme.surface,
              borderColor: stitchTheme.cardBorder,
            },
          ]}
        >
          <Search size={18} color={stitchTheme.textSecondary} />
          <TextInput
            placeholder="Search staff members..."
            style={[styles.searchInput, { color: stitchTheme.textPrimary }]}
            placeholderTextColor={stitchTheme.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: stitchTheme.surface,
              borderColor: stitchTheme.cardBorder,
            },
          ]}
        >
          <Filter size={18} color={stitchTheme.textPrimary} />
          <Text style={[styles.filterButtonText, { color: stitchTheme.textPrimary }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Staff KPI summary cards */}
      <View style={styles.staffStatsGrid}>
        <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
          <View style={styles.staffStatHeader}>
            <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>Total Staff</Text>
            <Users size={20} color={stitchTheme.textSecondary} />
          </View>
          <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>{staff.length}</Text>
        </View>

        <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
          <View style={styles.staffStatHeader}>
            <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>Active</Text>
            <Shield size={20} color="#10B981" />
          </View>
          <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
            {staff.filter((s) => s.status === 'Active').length}
          </Text>
        </View>

        <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
          <View style={styles.staffStatHeader}>
            <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>Managers</Text>
            <UserCheck size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
            {staff.filter((s) => s.role === 'Manager').length}
          </Text>
        </View>

        <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
          <View style={styles.staffStatHeader}>
            <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>Agents</Text>
            <UserPlus size={20} color="#8B5CF6" />
          </View>
          <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
            {staff.filter((s) => s.role === 'Agent').length}
          </Text>
        </View>
      </View>

      <View style={[styles.tableContainer, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
        <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderBottomColor: stitchTheme.cardBorder }]}>
          <Text style={[styles.tableHead, { flex: 2, color: stitchTheme.textSecondary }]}>Staff Member</Text>
          <Text style={[styles.tableHead, { flex: 2, color: stitchTheme.textSecondary }]}>Email</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>Role</Text>
          <Text style={[styles.tableHead, { flex: 1.5, color: stitchTheme.textSecondary }]}>Department</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>Status</Text>
          <Text style={[styles.tableHead, { flex: 1.5, color: stitchTheme.textSecondary }]}>Hire Date</Text>
          <Text style={[styles.tableHead, { flex: 1.5, color: stitchTheme.textSecondary }]}>Last Active</Text>
          <Text style={[styles.tableHead, { flex: 0.5, textAlign: 'center', color: stitchTheme.textSecondary }]}>Actions</Text>
        </View>

        {staff.map((member) => (
          <View
            key={member.id}
            style={[styles.tableRow, { borderBottomColor: stitchTheme.cardBorder }]}
          >
            <View style={[styles.tableCellView, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View
                style={[
                  styles.avatar,
                  {
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: isDark ? '#3B82F6' : '#DBEAFE',
                  },
                ]}
              >
                <Text style={[styles.avatarText, { fontSize: 12, color: isDark ? '#FFFFFF' : '#1E40AF' }]}>
                  {member.avatar}
                </Text>
              </View>
              <Text style={[styles.tableCellTitle, { color: stitchTheme.textPrimary }]}>{member.name}</Text>
            </View>

            <Text style={[styles.tableCell, { flex: 2, color: stitchTheme.textSecondary }]}>{member.email}</Text>

            <View style={[styles.tableCellView, { flex: 1 }]}>
              <View
                style={[
                  styles.roleBadge,
                  member.role === 'Manager' ? styles.roleManager : styles.roleAgent,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    member.role === 'Manager' ? styles.roleTextManager : styles.roleTextAgent,
                  ]}
                >
                  {member.role}
                </Text>
              </View>
            </View>

            <Text style={[styles.tableCell, { flex: 1.5, color: stitchTheme.textPrimary }]}>{member.department}</Text>

            <View style={[styles.tableCellView, { flex: 1 }]}>
              <View
                style={[
                  styles.statusBadge,
                  member.status === 'Active' ? styles.statusApproved : styles.statusRejected,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    member.status === 'Active' ? styles.statusTextApproved : styles.statusTextRejected,
                  ]}
                >
                  {member.status}
                </Text>
              </View>
            </View>

            <Text style={[styles.tableCell, { flex: 1.5, color: stitchTheme.textSecondary }]}>{member.hireDate}</Text>
            <Text style={[styles.tableCell, { flex: 1.5, color: stitchTheme.textSecondary }]}>{member.lastActive}</Text>

            <TouchableOpacity
              style={[styles.tableCellView, { flex: 0.5, alignItems: 'center' }]}
              onPress={() => handleStaffAction(member)}
            >
              <MoreHorizontal size={18} color={stitchTheme.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'analytics':
        return (
          <View style={styles.animateView}>
            <View style={styles.pageHeader}>
              <View>
                <Text style={[styles.pageHeaderTitle, { color: stitchTheme.textPrimary }]}>
                  {language === 'fr' ? 'Tableau de bord Analytique' : 'Analytics Dashboard'}
                </Text>
                <Text style={[styles.pageHeaderSubtitle, { color: stitchTheme.textSecondary }]}>
                  {language === 'fr' ? 'Surveillez et gérez toute la plateforme' : 'Real-time performance metrics and predictive signals'}
                </Text>
              </View>
              <View style={[styles.timePeriodSelector, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
                <Text style={[styles.timePeriodText, { color: stitchTheme.textPrimary }]}>Last 30 days</Text>
              </View>
            </View>

            <View style={styles.chartsGrid}>
              <View style={styles.chartsRow}>
                <View style={[styles.chartWrapper, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
                  <PerformanceDistributionChart
                    title="Performance Distribution"
                    subtitle="Q2 2026"
                    themeMode={isDark ? 'dark' : 'light'}
                    size={240}
                  />
                </View>
                <View style={[styles.chartWrapper, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
                  <PropertyDistributionChart
                    data={charts.distribution}
                    themeMode={isDark ? 'dark' : 'light'}
                  />
                </View>
              </View>
              <MonthlyGrowthChart data={charts.userGrowth} />
              <RevenueAnalyticsChart data={charts.revenue} />
            </View>
          </View>
        );
      case 'properties':
        return renderProperties();
      case 'documents':
        return renderDocuments();
      case 'users':
        return (
          <View style={styles.animateView}>
            <UserManagement />
          </View>
        );
      case 'staff':
        return renderStaff();
      case 'reports':
        return renderReports();
      case 'integrations':
        return (
          <View style={styles.animateView}>
            <AdminIntegrations />
          </View>
        );
      case 'settings':
        return (
          <View style={styles.animateView}>
            <AdminSettings />
          </View>
        );
      case 'support':
        return (
          <View
            style={[
              styles.animateView,
              styles.emptyStateFull,
              { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder },
            ]}
          >
            <View style={[styles.emptyStateIconCircle, { backgroundColor: stitchTheme.indigoLight }]}>
              <MessageCircle size={44} color={stitchTheme.indigo} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: stitchTheme.textPrimary }]}>Support Messages & Helpdesk</Text>
            <Text style={[styles.emptyStateText, { color: stitchTheme.textSecondary, maxWidth: 440 }]}>
              Real-time user inquiries and support chats from the mobile and web app will be synchronized here with instant AI triage.
            </Text>
          </View>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: stitchTheme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Staff Action Modal */}
      <Modal
        visible={showStaffActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStaffActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStaffActionModal(false)}
        >
          <View
            style={[
              styles.actionModalContent,
              {
                backgroundColor: stitchTheme.surface,
                borderColor: stitchTheme.cardBorder,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {selectedStaff && (
              <>
                <View style={[styles.actionHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
                  <Text style={[styles.actionTitle, { color: stitchTheme.textPrimary }]}>
                    Actions for {selectedStaff.name}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  onPress={() => selectedStaff && handleEditStaff(selectedStaff)}
                >
                  <Users size={16} color={stitchTheme.textPrimary} />
                  <Text style={[styles.actionText, { color: stitchTheme.textPrimary }]}>Edit Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  onPress={() => {
                    if (selectedStaff) {
                      setStaff((prev) =>
                        prev.map((s) =>
                          s.id === selectedStaff.id
                            ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' }
                            : s
                        )
                      );
                      setShowStaffActionModal(false);
                    }
                  }}
                >
                  {selectedStaff.status === 'Active' ? (
                    <>
                      <XCircle size={16} color={stitchTheme.amber} />
                      <Text style={[styles.actionText, { color: stitchTheme.amber }]}>Deactivate</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} color={stitchTheme.primary} />
                      <Text style={[styles.actionText, { color: stitchTheme.primary }]}>Activate</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
                  onPress={() => selectedStaff && handleDeleteStaff(selectedStaff.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={[styles.actionText, { color: '#EF4444', fontWeight: '600' }]}>Remove Staff</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        visible={showAddStaffModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: stitchTheme.textPrimary }]}>Add New Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAddStaffModal(false)} style={{ padding: 4 }}>
                <X size={22} color={stitchTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: stitchTheme.textPrimary, borderColor: stitchTheme.cardBorder }]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={stitchTheme.textMuted}
                  value={newStaff.name}
                  onChangeText={(text) => setNewStaff({ ...newStaff, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: stitchTheme.textPrimary, borderColor: stitchTheme.cardBorder }]}
                  placeholder="e.g. john@immoci.ci"
                  placeholderTextColor={stitchTheme.textMuted}
                  value={newStaff.email}
                  onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Role</Text>
                <View style={styles.roleSelector}>
                  {(['Manager', 'Agent', 'Admin'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        { borderColor: stitchTheme.cardBorder },
                        newStaff.role === role && {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                          borderColor: '#10B981',
                        },
                      ]}
                      onPress={() => setNewStaff({ ...newStaff, role })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          { color: stitchTheme.textSecondary },
                          newStaff.role === role && {
                            color: '#10B981',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Department</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: stitchTheme.textPrimary, borderColor: stitchTheme.cardBorder }]}
                  placeholder="e.g. Sales"
                  placeholderTextColor={stitchTheme.textMuted}
                  value={newStaff.department}
                  onChangeText={(text) => setNewStaff({ ...newStaff, department: text })}
                />
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: stitchTheme.cardBorder, backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: stitchTheme.cardBorder }]}
                onPress={() => setShowAddStaffModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: stitchTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: stitchTheme.primary }]}
                onPress={handleAddStaff}
              >
                <Text style={styles.saveButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document/Media Attachment Modal */}
      <Modal
        visible={!!attachmentView}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachmentView(null)}
      >
        <View style={styles.modalOverlay}>
          {attachmentView && (
            <AttachmentModal
              type={attachmentView.type}
              submission={attachmentView.submission}
              theme={stitchTheme}
              isDark={isDark}
              onClose={() => setAttachmentView(null)}
            />
          )}
        </View>
      </Modal>

      <View style={styles.layout}>
        {/* ── Stitch Navigation Sidebar ───────────────────────────────────── */}
        <View style={[styles.sidebar, { backgroundColor: stitchTheme.sidebarBg }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBadgeIcon}>
                <Building2 size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.logoText}>ImmoCI</Text>
                <Text style={styles.logoSubtext}>PRO ADMIN</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
            <View style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>{t('admin_main_menu')}</Text>
              {navItems.slice(0, 3).map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  active={activeSection === item.id}
                  onPress={() => setActiveSection(item.id)}
                  count={item.count}
                />
              ))}
            </View>

            <View style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>{t('admin_management')}</Text>
              {navItems.slice(3, 6).map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  active={activeSection === item.id}
                  onPress={() => setActiveSection(item.id)}
                  count={item.count}
                />
              ))}
            </View>

            <View style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>{t('admin_other')}</Text>
              {navItems.slice(6).map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  active={activeSection === item.id}
                  onPress={() => setActiveSection(item.id)}
                  count={item.count}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.8}
            >
              <ChevronLeft size={18} color="#94A3B8" />
              <Text style={styles.backButtonText}>{t('admin_back_to_app')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main Stitch Workspace ────────────────────────────────────────── */}
        <View style={[styles.mainContent, { backgroundColor: stitchTheme.bg }]}>
          {/* Stitch App Bar (Top Header) */}
          <View
            style={[
              styles.topHeader,
              {
                backgroundColor: stitchTheme.topBarBg,
                borderBottomColor: stitchTheme.divider,
              },
            ]}
          >
            <View style={styles.topHeaderLeft}>
              <Text style={[styles.pageTitle, { color: stitchTheme.textPrimary }]}>
                {t(`admin_nav_${activeSection}` as any)}
              </Text>
            </View>

            <View style={styles.topHeaderRight}>
              {/* Theme Toggle Pill */}
              <TouchableOpacity
                style={[
                  styles.themeTogglePill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
                activeOpacity={0.8}
              >
                {activeTheme === 'dark' ? (
                  <Moon size={16} color="#A78BFA" />
                ) : (
                  <Sun size={16} color="#F59E0B" />
                )}
                <Text
                  style={[
                    styles.themeToggleText,
                    { color: activeTheme === 'dark' ? '#A78BFA' : '#D97706' },
                  ]}
                >
                  {activeTheme === 'dark' ? 'DARK' : 'LIGHT'}
                </Text>
              </TouchableOpacity>

              {/* Language Switcher Pill */}
              <TouchableOpacity
                style={[
                  styles.themeTogglePill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                activeOpacity={0.8}
              >
                <Globe size={16} color={stitchTheme.textSecondary} />
                <Text style={[styles.themeToggleText, { color: stitchTheme.textSecondary }]}>
                  {language.toUpperCase()}
                </Text>
              </TouchableOpacity>

              {/* Search Capsule */}
              {isSearchActive ? (
                <View
                  style={[
                    styles.searchCapsuleActive,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <Search size={16} color={stitchTheme.textSecondary} />
                  <TextInput
                    placeholder={t('admin_search_placeholder')}
                    style={[styles.searchInputHeader, { color: stitchTheme.textPrimary }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    placeholderTextColor={stitchTheme.textMuted}
                  />
                  <TouchableOpacity onPress={() => setIsSearchActive(false)}>
                    <X size={16} color={stitchTheme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.topIconBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      borderColor: stitchTheme.cardBorder,
                    },
                  ]}
                  onPress={() => setIsSearchActive(true)}
                >
                  <Search size={18} color={stitchTheme.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Notifications */}
              <TouchableOpacity
                style={[
                  styles.topIconBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => {
                  if (pendingSubmissions.length > 0) setActiveSection('documents');
                }}
              >
                <Bell size={18} color={stitchTheme.textSecondary} />
                {pendingSubmissions.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{pendingSubmissions.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: stitchTheme.divider }]} />

              {/* User Profile Pill */}
              <View style={styles.userProfile}>
                <View style={styles.avatarPill}>
                  <Text style={styles.avatarPillText}>AD</Text>
                </View>
                <View style={{ display: 'flex' }}>
                  <Text style={[styles.userName, { color: stitchTheme.textPrimary }]}>Admin User</Text>
                  <Text style={[styles.userRole, { color: stitchTheme.textSecondary }]}>
                    {t('admin_super_admin')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Page Content Scroll */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>{renderContent()}</View>
          </ScrollView>
        </View>
      </View>

      {/* AI Moderation Drawer/Modal */}
      <AIModeration
        visible={showAIModeration}
        onClose={() => setShowAIModeration(false)}
        property={moderationProperty}
        onApprove={() => {
          if (moderationProperty) updateSubmissionStatus(moderationProperty.id, 'approved');
          setShowAIModeration(false);
        }}
        onReject={(reason) => {
          if (moderationProperty) updateSubmissionStatus(moderationProperty.id, 'rejected', reason);
          setShowAIModeration(false);
        }}
      />
    </View>
  );
}

// ── Sidebar Item Component ───────────────────────────────────────────────────
function SidebarItem({
  icon,
  title,
  active,
  onPress,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {active && <View style={styles.sidebarActiveBar} />}
      <View style={styles.sidebarItemLeft}>
        <View style={styles.sidebarItemIcon}>{icon}</View>
        <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>
          {title}
        </Text>
      </View>
      {count !== undefined && count > 0 && (
        <View style={styles.sidebarCount}>
          <Text style={styles.sidebarCountText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Submission Card (Documents Review) ───────────────────────────────────────
function SubmissionCard({
  submission,
  theme,
  isDark,
  onApprove,
  onReject,
  onViewDocs,
  onViewMedia,
}: {
  submission: PropertySubmission;
  theme: any;
  isDark: boolean;
  onApprove: () => void;
  onReject: () => void;
  onViewDocs?: () => void;
  onViewMedia?: () => void;
}) {
  return (
    <View
      style={[
        styles.submissionCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.submissionHeaderContent}>
          <Image
            source={{ uri: submission.photos[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200' }}
            style={styles.submissionThumb}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.submissionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {submission.title}
            </Text>
            <Text style={[styles.submissionMeta, { color: theme.textSecondary }]}>
              {submission.location.district}, {submission.location.city}
            </Text>
          </View>
          <View
            style={[
              styles.submissionPriceContainer,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' },
            ]}
          >
            <Text style={[styles.submissionPrice, { color: '#10B981' }]}>
              {(submission.price / 1000000).toFixed(1)}M FCFA
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.submissionDetails, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Type</Text>
            <Text style={[styles.detailValue, { color: theme.textPrimary, textTransform: 'capitalize' }]}>
              {submission.type}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Area</Text>
            <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{submission.area} m²</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Photos</Text>
            <TouchableOpacity onPress={onViewMedia}>
              <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700', textDecorationLine: 'underline' }]}>
                {submission.photos.length} photos {submission.video ? '+ 1 video' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.verificationSection, { borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.sectionHeaderLabel, { color: theme.textMuted }]}>Payment & Document Proof</Text>
          <View style={styles.paymentInfo}>
            <CreditCard size={15} color="#10B981" />
            <Text style={[styles.paymentText, { color: theme.textPrimary }]}>
              {submission.payment.method.toUpperCase()} • {submission.payment.transactionId}
            </Text>
          </View>
          <TouchableOpacity style={styles.docInfo} onPress={onViewDocs}>
            <FileText size={15} color="#3B82F6" />
            <Text style={[styles.docText, { color: '#3B82F6', textDecorationLine: 'underline' }]}>
              View Attached Title Deed / Deed Proof
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.cardRejectBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
          onPress={onReject}
          activeOpacity={0.8}
        >
          <XCircle size={17} color="#EF4444" />
          <Text style={styles.cardRejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardApproveBtn} onPress={onApprove} activeOpacity={0.8}>
          <CheckCircle size={17} color="#FFFFFF" />
          <Text style={styles.cardApproveText}>Approve Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Document/Media Attachment Modal Component ────────────────────────────────
function AttachmentModal({
  type,
  submission,
  theme,
  isDark,
  onClose,
}: {
  type: 'document' | 'media';
  submission: PropertySubmission;
  theme: any;
  isDark: boolean;
  onClose: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        width: '92%',
        maxWidth: 820,
        maxHeight: '90%',
        borderRadius: 24,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: theme.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: Spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>
            {type === 'document' ? 'Review Property Verification Document' : 'Property Media Gallery'}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
            {submission.title}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <X size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ padding: Spacing.xl }}>
        {type === 'document' ? (
          <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                height: 420,
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              {submission.document ? (
                <Image
                  source={{ uri: submission.document }}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <FileText size={48} color={theme.textMuted} />
                  <Text style={{ color: theme.textSecondary }}>No document preview available inline</Text>
                </View>
              )}
            </View>

            {submission.document ? (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#059669',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
                onPress={() => Linking.openURL(submission.document!)}
              >
                <Download size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Open / Download Document</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: Spacing.xl }}>
            {/* Photos Grid */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: theme.textPrimary }}>
                Photos ({submission.photos.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {submission.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(photo)}
                    style={{
                      width: '31%',
                      aspectRatio: 4 / 3,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Video Section */}
            {submission.video && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: theme.textPrimary }}>
                  Video Tour
                </Text>
                <View
                  style={{
                    width: '100%',
                    height: 240,
                    backgroundColor: '#000',
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: 'white', marginBottom: 14 }}>Video Preview Available Externally</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'white',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                    onPress={() => Linking.openURL(submission.video!)}
                  >
                    <ExternalLink size={16} color="#000" />
                    <Text style={{ fontWeight: '700', color: '#000' }}>Open Video Tour</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View
        style={{
          padding: Spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.cardBorder,
          backgroundColor: isDark ? '#111827' : '#F8FAFC',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          style={{
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
          }}
          onPress={onClose}
        >
          <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Google Stitch Pro Stylesheet ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Stitch Navigation Rail / Drawer ────────────────────────────────────────
  sidebar: {
    width: 256,
    borderRightWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sidebarHeader: {
    height: 76,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  logoSubtext: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#10B981',
    letterSpacing: 1.2,
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  menuGroup: {
    marginBottom: 20,
  },
  menuGroupTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#64748B',
    paddingHorizontal: 12,
    marginBottom: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 3,
    position: 'relative',
  },
  sidebarActiveBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarItemIcon: {
    width: 22,
    alignItems: 'center',
  },
  sidebarItemText: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  sidebarItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  sidebarCount: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sidebarCountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600' as const,
  },

  // ── Main Content Area ──────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
  },
  topHeader: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  themeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  searchCapsuleActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    width: 220,
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800' as const,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarPillText: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: 13,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700' as const,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 24,
    paddingBottom: 48,
  },

  // ── Stitch Tonal Metric Cards ──────────────────────────────────────────────
  animateView: {
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 230,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statCardIndicator: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.9,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statTrendText: {
    fontSize: 11.5,
    fontWeight: '700' as const,
  },
  statContent: {
    gap: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13.5,
    fontWeight: '600' as const,
  },
  statSubtitle: {
    fontSize: 12,
  },

  // ── Dashboard Grid & Charts ────────────────────────────────────────────────
  dashboardGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  chartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  chartWrapper: {
    flex: 1,
    minWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  // ── Filter Bar & Search ────────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    width: 320,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
  },
  filterButtonText: {
    fontSize: 13.5,
    fontWeight: '600' as const,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    height: 44,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },

  // ── Stitch Tables ──────────────────────────────────────────────────────────
  tableContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tableHead: {
    fontSize: 11.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13.5,
  },
  tableCellView: {},
  tableImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  tableCellTitle: {
    fontSize: 13.5,
    fontWeight: '700' as const,
  },
  tableCellSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusApproved: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11.5, fontWeight: '700' as const, textTransform: 'capitalize' as const },
  statusTextApproved: { color: '#166534' },
  statusTextPendingTable: { color: '#B45309' },
  statusTextRejected: { color: '#B91C1C' },

  // ── Staff & Reports ────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageHeaderTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  pageHeaderSubtitle: {
    fontSize: 13.5,
    marginTop: 4,
  },
  staffStatsGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  staffStatCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  staffStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffStatLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  staffStatValue: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700' as const,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleManager: {
    backgroundColor: '#DBEAFE',
  },
  roleAgent: {
    backgroundColor: '#ECFDF5',
  },
  roleText: {
    fontSize: 11.5,
    fontWeight: '700' as const,
  },
  roleTextManager: {
    color: '#1E40AF',
  },
  roleTextAgent: {
    color: '#047857',
  },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    width: '100%',
    gap: 16,
  },
  reportIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12.5,
  },
  downloadButton: {
    padding: 10,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },

  // ── Documents Section ──────────────────────────────────────────────────────
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emptyStateFull: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyStateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
  submissionCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  submissionHeader: {
    marginBottom: 14,
  },
  submissionHeaderContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  submissionThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  submissionTitle: {
    fontSize: 14.5,
    fontWeight: '700' as const,
  },
  submissionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  submissionPriceContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  submissionPrice: {
    fontSize: 12,
    fontWeight: '800' as const,
  },
  submissionDetails: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10.5,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  verificationSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  sectionHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cardRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cardRejectText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  cardApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardApproveText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },

  // ── Modals & Dialogs ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 12.5,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '600' as const,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },

  actionModalContent: {
    width: 260,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  actionHeader: {
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  timePeriodSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  timePeriodText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  chartsGrid: {
    gap: 20,
  },
});
