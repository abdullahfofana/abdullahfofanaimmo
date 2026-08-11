import { router, Stack } from 'expo-router';
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Download,
  CheckCircle,
  XCircle,
  Menu,
  Plus,
  Shield,
  UserPlus,
  UserCheck,
  FileText as FileIcon, // Renamed FileText to FileIcon to match the instruction's import style
  Sparkles,
  MessageCircle, // Added back MessageCircle as it was in the original and not in the provided snippet
  ChevronLeft, // Added back ChevronLeft
  Home, // Added back Home
  LayoutDashboard, // Added back LayoutDashboard
  Settings, // Added back Settings
  Zap, // Added back Zap
  CreditCard, // Added back CreditCard
  Bell, // Added back Bell
  MoreHorizontal, // Added back MoreHorizontal
  X, // Added back X
  Globe, // Added Globe for language
  Moon,
  Sun,
} from 'lucide-react-native';
import React, { useState, useRef } from 'react';
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
// import AgentChatDashboard from '@/components/admin/AgentChatDashboard';

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
    avatar: 'AJ'
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
    avatar: 'BW'
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
    avatar: 'CD'
  }
];


interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  trendPositive: boolean;
}

function StatCard({ icon, title, value, subtitle, trend, trendPositive }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          {icon}
        </View>
        <View style={styles.statTrendContainer}>
          <Text style={[styles.statTrend, trendPositive ? styles.statTrendPositive : styles.statTrendNegative]}>
            {trend}
          </Text>
        </View>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onPress: () => void;
  count?: number;
}

function SidebarItem({ icon, title, active, onPress, count }: SidebarItemProps) {
  return (
    <TouchableOpacity
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
      onPress={onPress}
    >
      <View style={styles.sidebarItemLeft}>
        <View style={styles.sidebarItemIcon}>
          {icon}
        </View>
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

export default function AdminDashboardWrapper() {
  return (
    <AnalyticsProvider>
      <AdminDashboard />
    </AnalyticsProvider>
  );
}

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Ensure we are always on desktop mode effectively for this view if it's web
  // But we want to handle responsive layout still.
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const {
    submissions,
    getPendingSubmissions,
    updateSubmissionStatus
  } = usePropertySubmissions();
  
  const { t, language, setLanguage } = useLanguage();
  const { activeTheme, setTheme } = useTheme();
  const ColorsLocal = useColors();
  const colors = ColorsLocal;
  const isDark = activeTheme === 'dark';
  
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

  const [attachmentView, setAttachmentView] = useState<{ type: 'document' | 'media', submission: PropertySubmission } | null>(null);

  const handleEditStaff = (staff: StaffMember) => {
    // For now just console log or basic alert as full edit wasn't requested but we need action
    console.log('Edit staff', staff.id);
    setShowStaffActionModal(false);
  };

  const handleStaffAction = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowStaffActionModal(true);
  };

  const { kpis, charts } = useAnalytics();

  const handleDeleteStaff = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this staff member?')) {
        setStaff(prev => prev.filter(s => s.id !== id));
        setShowStaffActionModal(false);
      }
    } else {
      // Fallback for mobile if ever used there
      setStaff(prev => prev.filter(s => s.id !== id));
      setShowStaffActionModal(false);
    }
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.department) {
      // You might want to add proper validation/toast here
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
      lastActive: '-',
      avatar: newStaff.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
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

  const pendingSubmissions = getPendingSubmissions();

  // const handleBack = () => {
  //   if (router.canGoBack()) {
  //     router.back();
  //   } else {
  //     router.replace('/');
  //   }
  // };

  // Web Only Restriction - REMOVED FOR MOBILE ADMIN ACCESS
  /* 
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Shield size={64} color={Colors.primary} />
        <Text style={styles.mobileTitle}>Desktop Only</Text>
        <Text style={styles.mobileSubtitle}>
          The Admin Dashboard is only available on the web version of the application.
        </Text>
        <TouchableOpacity style={styles.mobileButton} onPress={handleBack}>
          <Text style={styles.mobileButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  */

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const stats = [
    {
      icon: <Building2 size={24} color={Colors.primary} />,
      title: 'Total Properties',
      value: kpis.totalProperties.toLocaleString(),
      subtitle: 'Active listings',
      trend: `+${kpis.propertyGrowth}%`,
      trendPositive: kpis.propertyGrowth > 0,
    },
    {
      icon: <Users size={24} color={Colors.accent} />,
      title: 'Total Users',
      value: kpis.activeUsers.toLocaleString(),
      subtitle: 'Active users',
      trend: `+${kpis.userGrowth}%`,
      trendPositive: kpis.userGrowth > 0,
    },
    {
      icon: <FileText size={24} color={Colors.warning} />,
      title: 'Pending Docs',
      value: kpis.pendingVerifications.toString(),
      subtitle: 'Requires verification',
      trend: kpis.pendingVerifications > 5 ? 'High' : 'Normal',
      trendPositive: kpis.pendingVerifications < 10,
    },
    {
      icon: <DollarSign size={24} color={Colors.success} />,
      title: 'Revenue',
      value: kpis.totalRevenue.toLocaleString(),
      subtitle: 'Total Revenue (FCFA)',
      trend: `+${kpis.revenueGrowth}%`,
      trendPositive: kpis.revenueGrowth > 0,
    },
  ];

  const renderDashboard = () => (
    <View style={styles.animateView}>
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>

      <View style={styles.dashboardGrid}>
        <View style={[styles.chartsRow, { flexDirection: 'row', flexWrap: 'wrap', gap: 20 }]}>
          <View style={{ flex: 1, minWidth: 300, maxWidth: 800 }}>
            <PerformanceDistributionChart
              title="Performance Distribution"
              subtitle="Q2 2026"
              themeMode="dark"
              size={240}
            />
          </View>
          <View style={{ flex: 1, minWidth: 300, maxWidth: 800 }}>
            <PropertyDistributionChart data={charts.distribution} />
          </View>
        </View>
        <RevenueAnalyticsChart data={charts.revenue} />
        <MonthlyGrowthChart data={charts.userGrowth} />
      </View>
      <AIAnalyticsPanel data={{ kpis, charts }} />
      {/* Agent 6 — AI-powered platform insights */}
      <AdminAIInsightsPanel />
      <RecentActivity />
      <QuickActions onNavigate={setActiveSection} />
    </View>

  );

  const renderProperties = () => (
    <View style={styles.animateView}>
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            placeholder="Search properties..."
            style={styles.searchInput}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={18} color={Colors.text} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/add-property')}>
            <Text style={styles.primaryButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHead, { flex: 2.5 }]}>Property</Text>
          <Text style={[styles.tableHead, { flex: 1.5 }]}>Location</Text>
          <Text style={[styles.tableHead, { flex: 1 }]}>Price</Text>
          <Text style={[styles.tableHead, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHead, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHead, { flex: 0.5 }]}>Action</Text>
        </View>
        {submissions.map((sub) => (
          <View key={sub.id} style={styles.tableRow}>
            <View style={[styles.tableCellView, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Image source={{ uri: sub.photos[0] }} style={styles.tableImage} />
              <View>
                <Text style={styles.tableCellTitle} numberOfLines={1}>{sub.title}</Text>
                <Text style={styles.tableCellSubtitle}>{sub.id}</Text>
              </View>
            </View>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{sub.location.district}, {sub.location.city}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{(sub.price / 1000000).toFixed(1)}M</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{sub.type}</Text>
            <View style={[styles.tableCellView, { flex: 1 }]}>
              <View style={[
                styles.statusBadge,
                sub.submissionStatus === 'approved' ? styles.statusApproved :
                  sub.submissionStatus === 'rejected' ? styles.statusRejected : styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  sub.submissionStatus === 'approved' ? styles.statusTextApproved :
                    sub.submissionStatus === 'rejected' ? styles.statusTextRejected : styles.statusTextPendingTable
                ]}>{sub.submissionStatus}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.tableCellView, { marginRight: 8, padding: 4 }]}
                onPress={() => {
                  setModerationProperty(sub);
                  setShowAIModeration(true);
                }}
              >
                <Sparkles size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tableCellView, { flex: 0.5 }]}>
                <MoreVertical size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.animateView}>
      <View style={styles.documentsGrid}>
        {pendingSubmissions.length === 0 ? (
          <View style={styles.emptyStateFull}>
            <Shield size={64} color={Colors.success} />
            <Text style={styles.emptyStateTitle}>All documents verified</Text>
            <Text style={styles.emptyStateText}>Great job! There are no pending documents to review.</Text>
          </View>
        ) : (
          pendingSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
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
      { id: '1', name: 'Monthly Revenue Report', date: 'Oct 2023', size: '2.4 MB', type: 'PDF' },
      { id: '2', name: 'User Growth Analysis', date: 'Sep 2023', size: '1.8 MB', type: 'PDF' },
      { id: '3', name: 'Property Listings Summary', date: 'Q3 2023', size: '3.5 MB', type: 'CSV' },
      { id: '4', name: 'Agent Performance Review', date: 'Oct 2023', size: '1.2 MB', type: 'PDF' },
    ];

    return (
      <View style={styles.animateView}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
        </View>
        <View style={styles.cardsGrid}>
          {reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportIcon}>
                <FileIcon size={24} color={Colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>{report.name}</Text>
                <Text style={styles.reportMeta}>{report.date} • {report.size}</Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Download size={18} color={Colors.textSecondary} />
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
          <Text style={styles.pageHeaderTitle}>{language === 'fr' ? 'Gestion du Personnel' : 'Staff Management'}</Text>
          <Text style={styles.pageHeaderSubtitle}>{language === 'fr' ? 'Gérez les membres de votre équipe et leurs rôles' : 'Manage your team members and their roles'}</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowAddStaffModal(true)}
        >
          <Plus size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Add Staff Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            placeholder="Search staff members..."
            style={styles.searchInput}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={18} color={Colors.text} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.staffStatsGrid}>
        <View style={styles.staffStatCard}>
          <View style={styles.staffStatHeader}>
            <Text style={styles.staffStatLabel}>Total Staff</Text>
            <Users size={20} color={Colors.textSecondary} />
          </View>
          <Text style={styles.staffStatValue}>3</Text>
        </View>

        <View style={styles.staffStatCard}>
          <View style={styles.staffStatHeader}>
            <Text style={styles.staffStatLabel}>Active</Text>
            <Shield size={20} color={Colors.success} />
          </View>
          <Text style={styles.staffStatValue}>2</Text>
        </View>

        <View style={styles.staffStatCard}>
          <View style={styles.staffStatHeader}>
            <Text style={styles.staffStatLabel}>Managers</Text>
            <UserCheck size={20} color={Colors.info} />
          </View>
          <Text style={styles.staffStatValue}>1</Text>
        </View>

        <View style={styles.staffStatCard}>
          <View style={styles.staffStatHeader}>
            <Text style={styles.staffStatLabel}>Agents</Text>
            <UserPlus size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.staffStatValue}>1</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Staff Members ({staff.length})</Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, { flex: 2 }]}>Staff Member</Text>
            <Text style={[styles.tableHead, { flex: 2 }]}>Email</Text>
            <Text style={[styles.tableHead, { flex: 1 }]}>Role</Text>
            <Text style={[styles.tableHead, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.tableHead, { flex: 1 }]}>Status</Text>
            <Text style={[styles.tableHead, { flex: 1.5 }]}>Hire Date</Text>
            <Text style={[styles.tableHead, { flex: 1.5 }]}>Last Active</Text>
            <Text style={[styles.tableHead, { flex: 0.5, textAlign: 'center' }]}>Actions</Text>
          </View>

          {staff.map((staff) => (
            <View key={staff.id} style={styles.tableRow}>
              <View style={[styles.tableCellView, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={[styles.avatar, { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight + '40' }]}>
                  <Text style={[styles.avatarText, { fontSize: 12, color: Colors.primary }]}>{staff.avatar}</Text>
                </View>
                <Text style={styles.tableCellTitle}>{staff.name}</Text>
              </View>

              <Text style={[styles.tableCell, { flex: 2 }]}>{staff.email}</Text>

              <View style={[styles.tableCellView, { flex: 1 }]}>
                <View style={[
                  styles.roleBadge,
                  staff.role === 'Manager' ? styles.roleManager : styles.roleAgent
                ]}>
                  <Text style={[
                    styles.roleText,
                    staff.role === 'Manager' ? styles.roleTextManager : styles.roleTextAgent
                  ]}>{staff.role}</Text>
                </View>
              </View>

              <Text style={[styles.tableCell, { flex: 1.5 }]}>{staff.department}</Text>

              <View style={[styles.tableCellView, { flex: 1 }]}>
                <View style={[
                  styles.statusBadge,
                  staff.status === 'Active' ? styles.statusApproved : styles.statusRejected
                ]}>
                  <Text style={[
                    styles.statusText,
                    staff.status === 'Active' ? styles.statusTextApproved : styles.statusTextRejected
                  ]}>{staff.status}</Text>
                </View>
              </View>

              <Text style={[styles.tableCell, { flex: 1.5 }]}>{staff.hireDate}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{staff.lastActive}</Text>

              <TouchableOpacity
                style={[styles.tableCellView, { flex: 0.5, alignItems: 'center' }]}
                onPress={() => handleStaffAction(staff)}
              >
                <MoreHorizontal size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'analytics': return (
        <View style={styles.animateView}>
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageHeaderTitle}>{language === 'fr' ? 'Tableau de bord Analytique' : 'Analytics Dashboard'}</Text>
              <Text style={styles.pageHeaderSubtitle}>{language === 'fr' ? 'Surveillez et gérez toute la plateforme' : 'Monitor and manage the entire platform'}</Text>
            </View>
            <View style={styles.timePeriodSelector}>
              <Text style={styles.timePeriodText}>Last 30 days</Text>
            </View>
          </View>

          <View style={styles.chartsGrid}>
            <View style={[styles.chartsRow, { flexDirection: 'row', flexWrap: 'wrap', gap: 20 }]}>
              <View style={{ flex: 1, minWidth: 300, maxWidth: 800 }}>
                <PerformanceDistributionChart
                  title="Performance Distribution"
                  subtitle="Q2 2026"
                  themeMode="dark"
                  size={240}
                />
              </View>
              <View style={{ flex: 1, minWidth: 300, maxWidth: 800 }}>
                <PropertyDistributionChart />
              </View>
            </View>
            <MonthlyGrowthChart />
            <RevenueAnalyticsChart />
          </View>
        </View>
      );
      case 'properties': return renderProperties();
      case 'documents': return renderDocuments();
      case 'users': return <View style={styles.animateView}><UserManagement /></View>;
      case 'staff': return renderStaff();
      case 'reports': return renderReports();
      case 'integrations': return <View style={styles.animateView}><AdminIntegrations /></View>;
      case 'settings': return <View style={styles.animateView}><AdminSettings /></View>;
      case 'support': return (
        <View style={[styles.animateView, { alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
          <MessageCircle size={48} color={Colors.textSecondary} />
          <Text style={{ marginTop: 16, ...Typography.h4, color: Colors.text }}>Support Messages</Text>
          <Text style={{ marginTop: 8, ...Typography.body, color: Colors.textSecondary, textAlign: 'center' }}>
            Messages sent via &quot;Contact Support&quot; will appear here.
          </Text>
        </View>
      );
      default: return renderDashboard();
    }
  };


  const navItems: { id: AdminSection; icon: React.ReactNode; title: string; count?: number }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} color={activeSection === 'dashboard' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_dashboard') },
    { id: 'analytics', icon: <TrendingUp size={20} color={activeSection === 'analytics' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_analytics') },
    { id: 'properties', icon: <Building2 size={20} color={activeSection === 'properties' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_properties') },
    { id: 'documents', icon: <FileText size={20} color={activeSection === 'documents' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_documents'), count: pendingSubmissions.length },
    { id: 'users', icon: <Users size={20} color={activeSection === 'users' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_users') },
    { id: 'staff', icon: <Users size={20} color={activeSection === 'staff' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_staff') },
    { id: 'support', icon: <MessageCircle size={20} color={activeSection === 'support' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_support') },
    { id: 'reports', icon: <FileText size={20} color={activeSection === 'reports' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_reports') },
    { id: 'integrations', icon: <Zap size={20} color={activeSection === 'integrations' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_integrations') },
    { id: 'settings', icon: <Settings size={20} color={activeSection === 'settings' ? Colors.white : Colors.textSecondary} />, title: t('admin_nav_settings') },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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
          <View style={styles.actionModalContent} onStartShouldSetResponder={() => true}>
            {selectedStaff && (
              <>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>Actions for {selectedStaff.name}</Text>
                </View>
                <TouchableOpacity style={styles.actionItem} onPress={() => selectedStaff && handleEditStaff(selectedStaff)}>
                  <Users size={18} color={Colors.text} />
                  <Text style={styles.actionText}>Edit Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => {
                  // Toggle status
                  if (selectedStaff) {
                    setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
                    setShowStaffActionModal(false);
                  }
                }}>
                  {selectedStaff.status === 'Active' ? (
                    <>
                      <XCircle size={18} color={Colors.warning} />
                      <Text style={styles.actionText}>Deactivate</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} color={Colors.success} />
                      <Text style={styles.actionText}>Activate</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionItem, styles.actionDelete]} onPress={() => selectedStaff && handleDeleteStaff(selectedStaff.id)}>
                  <X size={18} color={Colors.error} />
                  <Text style={[styles.actionText, styles.actionDeleteText]}>Remove Staff</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddStaffModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAddStaffModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  value={newStaff.name}
                  onChangeText={(text) => setNewStaff({ ...newStaff, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john@immoci.ci"
                  value={newStaff.email}
                  onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleSelector}>
                  {(['Manager', 'Agent', 'Admin'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newStaff.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => setNewStaff({ ...newStaff, role })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          newStaff.role === role && styles.roleOptionTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sales"
                  value={newStaff.department}
                  onChangeText={(text) => setNewStaff({ ...newStaff, department: text })}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddStaffModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddStaff}
              >
                <Text style={styles.saveButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              onClose={() => setAttachmentView(null)}
            />
          )}
        </View>
      </Modal>

      <View style={styles.layout}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.logoContainer}>
              <Home size={24} color={Colors.white} fill={Colors.primary} />
              <Text style={styles.logoText}>ImmoCI Admin</Text>
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
              {navItems.slice(3, 5).map((item) => (
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
              {navItems.slice(5).map((item) => (
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/home')}>
              <ChevronLeft size={18} color={Colors.textSecondary} />
              <Text style={styles.backButtonText}>{t('admin_back_to_app')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
              <Text style={styles.pageTitle}>{t(`admin_nav_${activeSection}` as any)}</Text>
            </View>
            <View style={styles.topHeaderRight}>
              
              {/* Global Theme Toggle */}
              <TouchableOpacity 
                style={[styles.iconButton, { flexDirection: 'row', gap: 6, paddingHorizontal: 12 }]}
                onPress={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
              >
                {activeTheme === 'dark' ? (
                  <Moon size={18} color="#A78BFA" />
                ) : (
                  <Sun size={18} color="#F59E0B" />
                )}
                <Text style={{ fontWeight: '700', color: activeTheme === 'dark' ? '#A78BFA' : '#F59E0B' }}>
                  {activeTheme === 'dark' ? 'DARK' : 'LIGHT'}
                </Text>
              </TouchableOpacity>

              {/* Language Toggle */}
              <TouchableOpacity 
                style={[styles.iconButton, { flexDirection: 'row', gap: 6, paddingHorizontal: 12 }]}
                onPress={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              >
                <Globe size={18} color={Colors.textSecondary} />
                <Text style={{ fontWeight: '700', color: Colors.textSecondary }}>{language.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Search Bar */}
              {isSearchActive ? (
                <View style={[styles.searchContainer, { marginHorizontal: 8, height: 36, paddingHorizontal: 12, backgroundColor: Colors.background, width: 200 }]}>
                  <Search size={16} color={Colors.textSecondary} />
                  <TextInput
                    placeholder={t('admin_search_placeholder')}
                    style={[styles.searchInput, { paddingVertical: 0 }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <TouchableOpacity onPress={() => setIsSearchActive(false)}>
                    <X size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearchActive(true)}>
                  <Search size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Notifications */}
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => {
                  if (pendingSubmissions.length > 0) setActiveSection('documents');
                }}
              >
                <Bell size={20} color={Colors.textSecondary} />
                {pendingSubmissions.length > 0 && (
                  <View style={[styles.notificationBadge, { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{pendingSubmissions.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.divider} />
              <TouchableOpacity style={styles.userProfile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>AD</Text>
                </View>
                <View>
                  <Text style={styles.userName}>Admin User</Text>
                  <Text style={styles.userRole}>{t('admin_super_admin')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page Content */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              {renderContent()}
            </View>
          </ScrollView>
        </View>
      </View>

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
    </View >
  );
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
  onViewDocs,
  onViewMedia,
  compact = false
}: {
  submission: PropertySubmission;
  onApprove: () => void;
  onReject: () => void;
  onViewDocs?: () => void;
  onViewMedia?: () => void;
  compact?: boolean;
}) {

  return (
    <View style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        <View style={styles.submissionHeaderContent}>
          <Image source={{ uri: submission.photos[0] }} style={styles.submissionThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.submissionTitle} numberOfLines={1}>{submission.title}</Text>
            <Text style={styles.submissionMeta}>{submission.location.district}, {submission.location.city}</Text>
          </View>
          <View style={styles.submissionPriceContainer}>
            <Text style={styles.submissionPrice}>{(submission.price / 1000000).toFixed(1)}M</Text>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.submissionDetails}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{submission.type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Area</Text>
              <Text style={styles.detailValue}>{submission.area} m²</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Photos</Text>
              <TouchableOpacity onPress={onViewMedia}>
                <Text style={[styles.detailValue, { color: Colors.primary, textDecorationLine: 'underline' }]}>
                  {submission.photos.length} photos {submission.video ? '+ 1 video' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.verificationSection}>
            <Text style={styles.sectionHeaderLabel}>Payment & Docs</Text>
            <View style={styles.paymentInfo}>
              <CreditCard size={16} color={Colors.success} />
              <Text style={styles.paymentText}>{submission.payment.method.toUpperCase()} - {submission.payment.transactionId}</Text>
            </View>
            <TouchableOpacity style={styles.docInfo} onPress={onViewDocs}>
              <FileText size={16} color={Colors.primary} />
              <Text style={[styles.docText, { textDecorationLine: 'underline' }]}>View Attached Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardRejectBtn} onPress={onReject}>
          <XCircle size={18} color={Colors.error} />
          <Text style={styles.cardRejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardApproveBtn} onPress={onApprove}>
          <CheckCircle size={18} color={Colors.white} />
          <Text style={styles.cardApproveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar
  sidebar: {
    width: 260,
    backgroundColor: '#0F172A', // Slate 900
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  sidebarHeader: {
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoText: {
    ...Typography.h3,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: Spacing.lg,
  },
  menuGroup: {
    marginBottom: Spacing.xl,
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#94A3B8', // Slate 400
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  sidebarFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    marginBottom: 2,
  },
  sidebarItemActive: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarItemIcon: {
    width: 20,
    alignItems: 'center',
  },
  sidebarItemText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  sidebarItemTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  sidebarCount: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sidebarCountText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Slate 100
  },
  topHeader: {
    height: 70,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '700' as const,
    fontSize: 14,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },

  // Dashboard Cards
  animateView: {
    gap: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  dashboardGrid: {
    flexDirection: 'column', // Fix: Stack dashboard sections vertically
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrend: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statTrendPositive: {
    color: Colors.success,
  },
  statTrendNegative: {
    color: Colors.error,
  },
  statContent: {
    gap: 4,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Recent Section
  section: {
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Spacing.xl * 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  emptyStateText: {
    color: '#64748B',
    textAlign: 'center',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    height: 44,
    width: 300,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    height: 44,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },

  // Table
  tableContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHead: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    fontSize: 14,
    color: '#0F172A',
  },
  tableCellView: {
  },
  tableImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  tableCellTitle: {
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  tableCellSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusApproved: { backgroundColor: '#DCFCE7' }, // green-100
  statusPending: { backgroundColor: '#FEF3C7' }, // amber-100
  statusRejected: { backgroundColor: '#FEE2E2' }, // red-100
  statusText: { fontSize: 12, fontWeight: '600' as const },
  statusTextApproved: { color: '#166534' }, // green-700
  statusTextPendingTable: { color: '#B45309' }, // amber-700
  statusTextRejected: { color: '#B91C1C' }, // red-700

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  pageHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  staffStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  staffStatCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.lg,
  },
  staffStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  staffStatLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  staffStatValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleManager: {
    backgroundColor: '#DBEAFE', // blue-100
  },
  roleAgent: {
    backgroundColor: '#ECFDF5', // emerald-100
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  roleTextManager: {
    color: '#1E40AF', // blue-800
  },
  roleTextAgent: {
    color: '#047857', // emerald-700
  },

  // Mobile Not Supported
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginTop: Spacing.lg,
  },
  mobileSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: 300,
    lineHeight: 24,
  },
  mobileButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  mobileButtonText: {
    color: Colors.white,
    fontWeight: '600' as const,
  },

  // Action Modal
  actionModalContent: {
    width: 250,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    gap: 4,
  },
  actionHeader: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
  },
  actionDelete: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionDeleteText: {
    color: Colors.error,
  },

  // Submission Card
  submissionCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  submissionHeader: {
    marginBottom: Spacing.md,
  },
  submissionHeaderContent: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  submissionThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  submissionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  submissionMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  submissionPriceContainer: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  submissionPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#166534',
  },
  submissionDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500' as const,
  },
  verificationSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.md,
    gap: 8,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cardRejectText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#B91C1C',
  },
  cardApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  cardApproveText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },

  // Document Grid
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  emptyStateFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 4,
    gap: Spacing.lg,
  },

  // Placeholder
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.text,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionActive: {
    backgroundColor: Colors.primaryLight + '20',
    borderColor: Colors.primary,
  },
  roleOptionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  roleOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.text,
  },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },

  // Analytics Charts
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 240,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  chartBarContainer: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chartBar: {
    width: 32,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    opacity: 0.8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500' as const,
  },

  // Report Cards
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F9FF', // Sky 50
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  downloadButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },

  chartsGrid: {
    gap: 20,
  },
  chartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Fix: Allow charts to wrap on smaller screens
    gap: 20,
  },
  timePeriodSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timePeriodText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
  },
});

function AttachmentModal({
  type,
  submission,
  onClose
}: {
  type: 'document' | 'media';
  submission: PropertySubmission;
  onClose: () => void;
}) {
  const Colors = useColors();
  return (
    <View style={{
      backgroundColor: Colors.white,
      width: '90%',
      maxWidth: 800,
      maxHeight: '90%',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
          {type === 'document' ? 'Review Document' : 'Property Media'}
        </Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ padding: Spacing.lg }}>
        {type === 'document' ? (
          <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
            <View style={{
              width: '100%',
              height: 400,
              backgroundColor: '#F1F5F9',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Try to show as image first */}
              <Image
                source={{ uri: submission.document }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: Colors.primary,
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.md,
                  borderRadius: 8
                }}
                onPress={() => Linking.openURL(submission.document)}
              >
                <Download size={20} color={Colors.white} />
                <Text style={{ color: Colors.white, fontWeight: '600' }}>Download / Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ gap: Spacing.xl }}>
            {/* Video Section */}
            {submission.video && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: Spacing.md, color: '#0F172A' }}>Video Tour</Text>
                <View style={{
                  width: '100%',
                  height: 300,
                  backgroundColor: '#000',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: 'white', marginBottom: 16 }}>Video Preview Not Available Inline</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'white',
                      paddingHorizontal: Spacing.lg,
                      paddingVertical: 8,
                      borderRadius: 20
                    }}
                    onPress={() => Linking.openURL(submission.video!)}
                  >
                    <Text style={{ fontWeight: '600' }}>Open Video</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Photos Grid */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: Spacing.md, color: '#0F172A' }}>
                Photos ({submission.photos.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {submission.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(photo)}
                    style={{ width: '31%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden' }}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md
      }}>
        <TouchableOpacity
          style={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }}
          onPress={onClose}
        >
          <Text style={{ fontWeight: '600', color: Colors.textSecondary }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
