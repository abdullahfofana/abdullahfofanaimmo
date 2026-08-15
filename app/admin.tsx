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
  Scale,
  Headphones,
  Briefcase,
  Sliders,
  Send,
  Bot,
  RefreshCw,
  LogOut,
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
import { useAuth } from '@/providers/AuthProvider';

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

export type DepartmentType =
  | 'Operations & Logistics'
  | 'Legal & Compliance'
  | 'Sales & Commercial'
  | 'Customer Support'
  | 'Finance & Billing'
  | 'Platform Administration';

export type AdminRoleType =
  | 'Super Admin'
  | 'Operations Manager'
  | 'Legal Officer'
  | 'Sales Agent'
  | 'Support Specialist'
  | 'Finance Officer';

interface RoleDefinition {
  id: AdminRoleType;
  titleKey: string;
  department: DepartmentType;
  icon: any;
  color: string;
  allowedSections: AdminSection[];
  descriptionKey: string;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'Super Admin',
    titleKey: 'role_super_admin',
    department: 'Platform Administration',
    icon: Shield,
    color: '#059669',
    allowedSections: ['dashboard', 'analytics', 'properties', 'documents', 'users', 'staff', 'support', 'reports', 'integrations', 'settings'],
    descriptionKey: 'admin_unrestricted_access',
  },
  {
    id: 'Operations Manager',
    titleKey: 'role_operations_mgr',
    department: 'Operations & Logistics',
    icon: LayoutDashboard,
    color: '#3B82F6',
    allowedSections: ['dashboard', 'analytics', 'properties', 'documents', 'users', 'reports'],
    descriptionKey: 'admin_stat_active_listings',
  },
  {
    id: 'Legal Officer',
    titleKey: 'role_legal_officer',
    department: 'Legal & Compliance',
    icon: Scale,
    color: '#F59E0B',
    allowedSections: ['documents', 'properties', 'reports', 'support'],
    descriptionKey: 'admin_stat_verification_req',
  },
  {
    id: 'Sales Agent',
    titleKey: 'role_sales_agent',
    department: 'Sales & Commercial',
    icon: Briefcase,
    color: '#8B5CF6',
    allowedSections: ['properties', 'users', 'dashboard', 'reports'],
    descriptionKey: 'admin_manage_properties',
  },
  {
    id: 'Support Specialist',
    titleKey: 'role_support_specialist',
    department: 'Customer Support',
    icon: Headphones,
    color: '#EC4899',
    allowedSections: ['support', 'users', 'dashboard'],
    descriptionKey: 'admin_support_desk_sub',
  },
  {
    id: 'Finance Officer',
    titleKey: 'role_finance_officer',
    department: 'Finance & Billing',
    icon: DollarSign,
    color: '#10B981',
    allowedSections: ['analytics', 'reports', 'dashboard', 'integrations'],
    descriptionKey: 'admin_stat_revenue',
  },
];

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Agent' | 'Admin' | 'Officer' | 'Specialist';
  department: DepartmentType;
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
    department: 'Operations & Logistics',
    status: 'Active',
    hireDate: '2023-01-15',
    lastActive: 'Just now',
    avatar: 'AJ',
  },
  {
    id: '2',
    name: 'Koffi Kouamé',
    email: 'koffi.k@immoci.ci',
    role: 'Officer',
    department: 'Legal & Compliance',
    status: 'Active',
    hireDate: '2023-02-10',
    lastActive: '5 min ago',
    avatar: 'KK',
  },
  {
    id: '3',
    name: 'Fatou Diallo',
    email: 'fatou.d@immoci.ci',
    role: 'Agent',
    department: 'Sales & Commercial',
    status: 'Active',
    hireDate: '2023-03-20',
    lastActive: '12 min ago',
    avatar: 'FD',
  },
  {
    id: '4',
    name: 'Jean-Luc Bamba',
    email: 'jeanluc.b@immoci.ci',
    role: 'Specialist',
    department: 'Customer Support',
    status: 'Active',
    hireDate: '2023-05-10',
    lastActive: '1 hour ago',
    avatar: 'JB',
  },
  {
    id: '5',
    name: 'Awa Koné',
    email: 'awa.k@immoci.ci',
    role: 'Officer',
    department: 'Finance & Billing',
    status: 'Active',
    hireDate: '2023-06-01',
    lastActive: '2 hours ago',
    avatar: 'AK',
  },
  {
    id: '6',
    name: 'Ibrahim Traoré',
    email: 'ibrahim.t@immoci.ci',
    role: 'Admin',
    department: 'Platform Administration',
    status: 'Active',
    hireDate: '2022-11-15',
    lastActive: 'Online',
    avatar: 'IT',
  },
];

interface SupportTicket {
  id: string;
  user: string;
  email: string;
  subject: string;
  department: DepartmentType;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  timestamp: string;
  messages: { sender: 'user' | 'admin' | 'ai'; text: string; time: string }[];
}

const mockTickets: SupportTicket[] = [
  {
    id: 'TK-1082',
    user: 'Amadou Touré',
    email: 'amadou.toure@gmail.com',
    subject: 'Issue with ACD cadastral deed upload for Cocody Villa',
    department: 'Legal & Compliance',
    status: 'Open',
    priority: 'High',
    timestamp: '10 min ago',
    messages: [
      { sender: 'user', text: 'Hello, I uploaded the ACD deed twice for my property in Cocody Danga, but the verification status still says Pending. Could you please confirm if the document is legible?', time: '10 min ago' },
    ],
  },
  {
    id: 'TK-1079',
    user: 'Marie Kouakou',
    email: 'marie.k@hotmail.com',
    subject: 'Orange Money payment confirmation for listing boost',
    department: 'Finance & Billing',
    status: 'In Progress',
    priority: 'Medium',
    timestamp: '45 min ago',
    messages: [
      { sender: 'user', text: 'Transaction OM-992014 was debited from my account for 25,000 FCFA but the listing badge is not showing Featured yet.', time: '45 min ago' },
      { sender: 'admin', text: 'Bonjour Marie, we are verifying the transaction reference with the Orange Money gateway. Thank you for your patience.', time: '20 min ago' },
    ],
  },
  {
    id: 'TK-1064',
    user: 'David Brown',
    email: 'david.b@example.com',
    subject: 'Request to schedule physical property inspection in Plateau',
    department: 'Sales & Commercial',
    status: 'Resolved',
    priority: 'Low',
    timestamp: '2 hours ago',
    messages: [
      { sender: 'user', text: 'Can an agency representative meet me on-site tomorrow at 2 PM?', time: '2 hours ago' },
      { sender: 'admin', text: 'Confirmed! Agent Fatou Diallo will meet you at the property at 2:00 PM.', time: '1 hour ago' },
    ],
  },
];

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error('[AdminDashboard] Render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>⚠️ Admin Dashboard Error</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{this.state.error}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, error: '' })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboardWrapper() {
  return (
    <View style={{
      flex: 1,
      width: '100%',
      minHeight: '100%',
      ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
    }}>
      <AdminErrorBoundary>
        <AnalyticsProvider>
          <AdminDashboard />
        </AnalyticsProvider>
      </AdminErrorBoundary>
    </View>
  );
}


function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return user?.role === 'admin' || user?.role === 'agent' || false;
  });
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [activeRole, setActiveRole] = useState<AdminRoleType>('Super Admin');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

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

  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [selectedStaffDepartment, setSelectedStaffDepartment] = useState<string>('All');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAIModeration, setShowAIModeration] = useState(false);
  const [moderationProperty, setModerationProperty] = useState<PropertySubmission | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Agent' as StaffMember['role'],
    department: 'Operations & Logistics' as DepartmentType,
  });

  const [showStaffActionModal, setShowStaffActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [attachmentView, setAttachmentView] = useState<{
    type: 'document' | 'media';
    submission: PropertySubmission;
  } | null>(null);

  // Helpdesk State
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TK-1082');
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentRoleDef = useMemo(() => {
    return ROLES.find((r) => r.id === activeRole) || ROLES[0];
  }, [activeRole]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { kpis, charts } = useAnalytics();
  const pendingSubmissions = getPendingSubmissions();

  const handleStaffAction = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setShowStaffActionModal(true);
  };

  const handleDeleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setShowStaffActionModal(false);
    showToast(language === 'fr' ? 'Membre du personnel supprimé' : 'Staff member removed');
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.department) {
      return;
    }

    const newMember: StaffMember = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
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
      department: 'Operations & Logistics',
    });
    showToast(language === 'fr' ? 'Nouveau membre ajouté avec succès' : 'New staff member added');
  };

  const handleRoleChange = (role: AdminRoleType) => {
    setActiveRole(role);
    setShowRoleSwitcher(false);
    const def = ROLES.find((r) => r.id === role);
    if (def && !def.allowedSections.includes(activeSection)) {
      setActiveSection(def.allowedSections[0]);
    }
    showToast(`${language === 'fr' ? 'Mode changé :' : 'Access switched:'} ${role}`);
  };

  const handleSendTicketReply = () => {
    if (!replyText.trim() || !selectedTicketId) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicketId) {
          return {
            ...t,
            messages: [
              ...t.messages,
              {
                sender: 'admin',
                text: replyText,
                time: 'Just now',
              },
            ],
          };
        }
        return t;
      })
    );
    setReplyText('');
    showToast(language === 'fr' ? 'Réponse envoyée au client' : 'Reply sent to customer');
  };

  const handleAIGenerateReply = () => {
    const activeTicket = tickets.find((t) => t.id === selectedTicketId);
    if (!activeTicket) return;

    const draft =
      language === 'fr'
        ? `Bonjour ${activeTicket.user}, notre service ${activeTicket.department} a bien pris en charge votre demande concernant "${activeTicket.subject}". Votre dossier est en cours de validation prioritaire.`
        : `Hello ${activeTicket.user}, our ${activeTicket.department} team has reviewed your request regarding "${activeTicket.subject}". We have prioritized your case for immediate resolution.`;

    setReplyText(draft);
  };

  const handleLogout = async () => {
    try {
      if (signOut) await signOut();
    } catch {}
    setIsLoggedIn(false);
    showToast(language === 'fr' ? 'Déconnexion réussie' : 'Logged out successfully');
  };

  if (!isLoggedIn) {
    return (
      <View style={{
        flex: 1,
        width: '100%',
        minHeight: '100%',
        ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
      }}>
        <AdminLogin onLogin={() => setIsLoggedIn(true)} />
      </View>
    );
  }

  // Stitch Tonal Metric Cards
  const stats = [
    {
      id: 'properties',
      icon: <Building2 size={22} color={stitchTheme.primary} />,
      iconBg: stitchTheme.primaryLight,
      title: t('admin_stat_total_properties'),
      value: kpis.totalProperties.toLocaleString(),
      subtitle: t('admin_stat_active_listings'),
      trend: `+${kpis.propertyGrowth}%`,
      trendPositive: kpis.propertyGrowth >= 0,
      accentColor: stitchTheme.primary,
    },
    {
      id: 'users',
      icon: <Users size={22} color={stitchTheme.indigo} />,
      iconBg: stitchTheme.indigoLight,
      title: t('admin_stat_total_users'),
      value: kpis.activeUsers.toLocaleString(),
      subtitle: t('admin_stat_active_accounts'),
      trend: `+${kpis.userGrowth}%`,
      trendPositive: kpis.userGrowth >= 0,
      accentColor: stitchTheme.indigo,
    },
    {
      id: 'docs',
      icon: <FileText size={22} color={stitchTheme.amber} />,
      iconBg: stitchTheme.amberLight,
      title: t('admin_stat_pending_docs'),
      value: kpis.pendingVerifications.toString(),
      subtitle: t('admin_stat_verification_req'),
      trend: kpis.pendingVerifications > 5 ? 'High' : 'Normal',
      trendPositive: kpis.pendingVerifications <= 5,
      accentColor: stitchTheme.amber,
    },
    {
      id: 'revenue',
      icon: <DollarSign size={22} color={stitchTheme.blue} />,
      iconBg: stitchTheme.blueLight,
      title: t('admin_stat_revenue'),
      value: kpis.totalRevenue.toLocaleString(),
      subtitle: t('admin_stat_revenue_sub'),
      trend: `+${kpis.revenueGrowth}%`,
      trendPositive: kpis.revenueGrowth >= 0,
      accentColor: stitchTheme.blue,
    },
  ];

  const allNavItems: {
    id: AdminSection;
    icon: (active: boolean) => React.ReactNode;
    title: string;
    count?: number;
    category: 'MAIN MENU' | 'MANAGEMENT' | 'OTHER';
  }[] = [
    {
      id: 'dashboard',
      icon: (a) => <LayoutDashboard size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_dashboard'),
      category: 'MAIN MENU',
    },
    {
      id: 'analytics',
      icon: (a) => <TrendingUp size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_analytics'),
      category: 'MAIN MENU',
    },
    {
      id: 'properties',
      icon: (a) => <Building2 size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_properties'),
      category: 'MANAGEMENT',
    },
    {
      id: 'documents',
      icon: (a) => <FileText size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_documents'),
      count: pendingSubmissions.length,
      category: 'MANAGEMENT',
    },
    {
      id: 'users',
      icon: (a) => <Users size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_users'),
      category: 'MANAGEMENT',
    },
    {
      id: 'staff',
      icon: (a) => <UserCheck size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_staff'),
      category: 'MANAGEMENT',
    },
    {
      id: 'support',
      icon: (a) => <MessageCircle size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_support'),
      count: tickets.filter((t) => t.status === 'Open').length,
      category: 'OTHER',
    },
    {
      id: 'reports',
      icon: (a) => <BarChart3 size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_reports'),
      category: 'OTHER',
    },
    {
      id: 'integrations',
      icon: (a) => <Zap size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_integrations'),
      category: 'OTHER',
    },
    {
      id: 'settings',
      icon: (a) => <Settings size={19} color={a ? '#10B981' : '#94A3B8'} />,
      title: t('admin_nav_settings'),
      category: 'OTHER',
    },
  ];

  // RBAC Filtering for Navigation Items
  const filteredNavItems = useMemo(() => {
    return allNavItems.filter((item) => currentRoleDef.allowedSections.includes(item.id));
  }, [allNavItems, currentRoleDef]);

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
          <View style={{ flex: 1, minWidth: 320 }}>
            <PerformanceDistributionChart
              themeMode={isDark ? 'dark' : 'light'}
              size={240}
            />
          </View>
          <View style={{ flex: 1, minWidth: 320 }}>
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
            placeholder={t('admin_search_properties')}
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
            <Text style={[styles.filterButtonText, { color: stitchTheme.textPrimary }]}>{t('admin_filters')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: stitchTheme.primary }]}
            onPress={() => router.push('/add-property')}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('admin_add_property')}</Text>
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
          <Text style={[styles.tableHead, { flex: 2.5, color: stitchTheme.textSecondary }]}>{t('admin_th_property')}</Text>
          <Text style={[styles.tableHead, { flex: 1.5, color: stitchTheme.textSecondary }]}>{t('admin_th_location')}</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>{t('admin_th_price')}</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>{t('admin_th_type')}</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>{t('admin_th_status')}</Text>
          <Text style={[styles.tableHead, { flex: 0.8, textAlign: 'center', color: stitchTheme.textSecondary }]}>{t('admin_th_action')}</Text>
        </View>

        {submissions.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Building2 size={40} color={stitchTheme.textMuted} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: stitchTheme.textPrimary }}>
              {t('admin_no_properties')}
            </Text>
            <Text style={{ color: stitchTheme.textSecondary, marginTop: 4 }}>
              {t('admin_no_properties_sub')}
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
            <Text style={[styles.emptyStateTitle, { color: stitchTheme.textPrimary }]}>{t('admin_all_docs_verified')}</Text>
            <Text style={[styles.emptyStateText, { color: stitchTheme.textSecondary }]}>
              {t('admin_all_docs_verified_sub')}
            </Text>
          </View>
        ) : (
          pendingSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              theme={stitchTheme}
              isDark={isDark}
              onApprove={() => {
                updateSubmissionStatus(submission.id, 'approved');
                showToast(language === 'fr' ? 'Document approuvé avec succès' : 'Document verified and approved');
              }}
              onReject={() => {
                updateSubmissionStatus(submission.id, 'rejected', 'Document invalid');
                showToast(language === 'fr' ? 'Document rejeté' : 'Document rejected');
              }}
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
      { id: '1', name: 'Monthly Revenue & Transaction Volume Report', date: 'Q2 2026', size: '2.4 MB', type: 'PDF', dept: 'Finance & Billing' },
      { id: '2', name: 'Cadastral Deed Verification & Compliance Log', date: 'June 2026', size: '3.5 MB', type: 'CSV', dept: 'Legal & Compliance' },
      { id: '3', name: 'User Growth & Retention Cohort Analysis', date: 'May 2026', size: '1.8 MB', type: 'PDF', dept: 'Platform Administration' },
      { id: '4', name: 'Agent Performance & SLA Resolution Review', date: 'June 2026', size: '1.2 MB', type: 'PDF', dept: 'Operations & Logistics' },
      { id: '5', name: 'Orange Money & Wave Gateway Settlement Log', date: 'June 2026', size: '4.1 MB', type: 'CSV', dept: 'Finance & Billing' },
    ];

    return (
      <View style={styles.animateView}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: stitchTheme.textPrimary }]}>{t('admin_available_reports')}</Text>
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
                  {report.dept} • {report.date} • {report.size}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                onPress={() => handleDownloadReport(report.name)}
                activeOpacity={0.8}
              >
                <Download size={18} color="#10B981" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStaff = () => {
    const departmentsList: (string | DepartmentType)[] = [
      'All',
      'Operations & Logistics',
      'Legal & Compliance',
      'Sales & Commercial',
      'Customer Support',
      'Finance & Billing',
      'Platform Administration',
    ];

    const filteredStaff = staff.filter((s) => {
      if (selectedStaffDepartment === 'All') return true;
      return s.department === selectedStaffDepartment;
    });

    return (
      <View style={styles.animateView}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.pageHeaderTitle, { color: stitchTheme.textPrimary }]}>
              {t('admin_staff_management')}
            </Text>
            <Text style={[styles.pageHeaderSubtitle, { color: stitchTheme.textSecondary }]}>
              {t('admin_staff_management_sub')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: stitchTheme.primary }]}
            onPress={() => setShowAddStaffModal(true)}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('admin_add_staff_member')}</Text>
          </TouchableOpacity>
        </View>

        {/* Department Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptPillsScroll}>
          <View style={styles.deptPillsContainer}>
            {departmentsList.map((dept) => {
              const isSelected = selectedStaffDepartment === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.deptPill,
                    {
                      backgroundColor: isSelected ? '#059669' : isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isSelected ? '#059669' : stitchTheme.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedStaffDepartment(dept)}
                >
                  <Text
                    style={[
                      styles.deptPillText,
                      { color: isSelected ? '#FFFFFF' : stitchTheme.textSecondary },
                    ]}
                  >
                    {dept === 'All' ? (language === 'fr' ? 'Tous les départements' : 'All Departments') : dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Staff KPI summary cards */}
        <View style={styles.staffStatsGrid}>
          <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={styles.staffStatHeader}>
              <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>{t('admin_total_staff')}</Text>
              <Users size={18} color={stitchTheme.textSecondary} />
            </View>
            <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>{staff.length}</Text>
          </View>

          <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={styles.staffStatHeader}>
              <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>{t('admin_active')}</Text>
              <Shield size={18} color="#10B981" />
            </View>
            <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
              {staff.filter((s) => s.status === 'Active').length}
            </Text>
          </View>

          <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={styles.staffStatHeader}>
              <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>{language === 'fr' ? 'Juridique' : 'Legal'}</Text>
              <Scale size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
              {staff.filter((s) => s.department === 'Legal & Compliance').length}
            </Text>
          </View>

          <View style={[styles.staffStatCard, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={styles.staffStatHeader}>
              <Text style={[styles.staffStatLabel, { color: stitchTheme.textSecondary }]}>{language === 'fr' ? 'Commercial' : 'Sales'}</Text>
              <Briefcase size={18} color="#8B5CF6" />
            </View>
            <Text style={[styles.staffStatValue, { color: stitchTheme.textPrimary }]}>
              {staff.filter((s) => s.department === 'Sales & Commercial').length}
            </Text>
          </View>
        </View>

        <View style={[styles.tableContainer, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
          <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderBottomColor: stitchTheme.cardBorder }]}>
            <Text style={[styles.tableHead, { flex: 2, color: stitchTheme.textSecondary }]}>{t('admin_th_staff_member')}</Text>
            <Text style={[styles.tableHead, { flex: 2, color: stitchTheme.textSecondary }]}>{t('admin_th_email')}</Text>
            <Text style={[styles.tableHead, { flex: 1.2, color: stitchTheme.textSecondary }]}>{t('admin_th_role')}</Text>
            <Text style={[styles.tableHead, { flex: 2, color: stitchTheme.textSecondary }]}>{t('admin_th_department')}</Text>
            <Text style={[styles.tableHead, { flex: 1, color: stitchTheme.textSecondary }]}>{t('admin_th_status')}</Text>
            <Text style={[styles.tableHead, { flex: 0.5, textAlign: 'center', color: stitchTheme.textSecondary }]}>{t('admin_th_actions')}</Text>
          </View>

          {filteredStaff.map((member) => (
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

              <View style={[styles.tableCellView, { flex: 1.2 }]}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' },
                  ]}
                >
                  <Text style={[styles.roleText, { color: '#6366F1' }]}>
                    {member.role}
                  </Text>
                </View>
              </View>

              <Text style={[styles.tableCell, { flex: 2, color: stitchTheme.textPrimary }]}>{member.department}</Text>

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
  };

  // ── Support & Tickets Helpdesk ──────────────────────────────────────────────
  const renderSupport = () => {
    const filteredTickets = tickets.filter((t) => {
      if (ticketFilter === 'All') return true;
      return t.status === ticketFilter;
    });

    const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

    return (
      <View style={styles.animateView}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.pageHeaderTitle, { color: stitchTheme.textPrimary }]}>
              {t('admin_tickets_title')}
            </Text>
            <Text style={[styles.pageHeaderSubtitle, { color: stitchTheme.textSecondary }]}>
              {t('admin_support_desk_sub')}
            </Text>
          </View>
        </View>

        {/* Ticket Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {(['All', 'Open', 'In Progress', 'Resolved'] as const).map((filter) => {
            const isSelected = ticketFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.deptPill,
                  {
                    backgroundColor: isSelected ? '#059669' : isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isSelected ? '#059669' : stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => setTicketFilter(filter)}
              >
                <Text style={[styles.deptPillText, { color: isSelected ? '#FFFFFF' : stitchTheme.textSecondary }]}>
                  {filter === 'All' ? (language === 'fr' ? 'Tous' : 'All') : filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Two column layout: ticket list & conversation view */}
        <View style={styles.supportLayout}>
          {/* Left Column: Tickets Queue */}
          <View style={[styles.ticketListCol, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.ticketCard,
                    {
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : 'transparent',
                      borderBottomColor: stitchTheme.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedTicketId(t.id)}
                >
                  <View style={styles.ticketCardHeader}>
                    <Text style={[styles.ticketUser, { color: stitchTheme.textPrimary }]}>{t.user}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        t.status === 'Open'
                          ? styles.statusPending
                          : t.status === 'In Progress'
                          ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                          : styles.statusApproved,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          t.status === 'Open'
                            ? styles.statusTextPendingTable
                            : t.status === 'In Progress'
                            ? { color: '#3B82F6' }
                            : styles.statusTextApproved,
                        ]}
                      >
                        {t.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.ticketSubject, { color: stitchTheme.textPrimary }]} numberOfLines={1}>
                    {t.subject}
                  </Text>
                  <View style={styles.ticketMeta}>
                    <Text style={[styles.ticketDept, { color: '#059669' }]}>{t.department}</Text>
                    <Text style={[styles.ticketTime, { color: stitchTheme.textSecondary }]}>{t.timestamp}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right Column: Conversation Thread */}
          {activeTicket ? (
            <View style={[styles.ticketThreadCol, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
              {/* Thread Header */}
              <View style={[styles.threadHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
                <View>
                  <Text style={[styles.threadSubject, { color: stitchTheme.textPrimary }]}>{activeTicket.subject}</Text>
                  <Text style={[styles.threadUser, { color: stitchTheme.textSecondary }]}>
                    {activeTicket.user} ({activeTicket.email}) • {activeTicket.department}
                  </Text>
                </View>
                {/* Status Toggle */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: activeTicket.status === 'Resolved' ? '#64748B' : '#059669',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    },
                  ]}
                  onPress={() => {
                    const nextStatus = activeTicket.status === 'Resolved' ? 'Open' : 'Resolved';
                    setTickets((prev) =>
                      prev.map((t) => (t.id === activeTicket.id ? { ...t, status: nextStatus } : t))
                    );
                    showToast(
                      nextStatus === 'Resolved'
                        ? language === 'fr'
                          ? 'Ticket marqué comme résolu'
                          : 'Ticket resolved'
                        : language === 'fr'
                        ? 'Ticket réouvert'
                        : 'Ticket reopened'
                    );
                  }}
                >
                  <CheckCircle size={15} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {activeTicket.status === 'Resolved'
                      ? language === 'fr'
                        ? 'Réouvrir'
                        : 'Reopen'
                      : language === 'fr'
                      ? 'Marquer Résolu'
                      : 'Resolve'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Messages Area */}
              <ScrollView style={styles.messagesScroll}>
                {activeTicket.messages.map((msg, i) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <View
                      key={i}
                      style={[
                        styles.chatBubbleContainer,
                        { alignSelf: isAdmin ? 'flex-end' : 'flex-start' },
                      ]}
                    >
                      <View
                        style={[
                          styles.chatBubble,
                          {
                            backgroundColor: isAdmin
                              ? '#059669'
                              : isDark
                              ? '#1E293B'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Text style={[styles.chatBubbleText, { color: isAdmin ? '#FFFFFF' : stitchTheme.textPrimary }]}>
                          {msg.text}
                        </Text>
                      </View>
                      <Text style={[styles.chatBubbleTime, { color: stitchTheme.textSecondary, alignSelf: isAdmin ? 'flex-end' : 'flex-start' }]}>
                        {msg.time}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Composer */}
              <View style={[styles.threadComposer, { borderTopColor: stitchTheme.cardBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TouchableOpacity
                    style={styles.aiDraftBtn}
                    onPress={handleAIGenerateReply}
                  >
                    <Sparkles size={14} color="#10B981" />
                    <Text style={styles.aiDraftText}>{t('admin_ai_suggest_reply')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.composerInputRow}>
                  <TextInput
                    style={[
                      styles.composerInput,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        color: stitchTheme.textPrimary,
                        borderColor: stitchTheme.cardBorder,
                      },
                    ]}
                    placeholder={t('admin_reply_placeholder')}
                    placeholderTextColor={stitchTheme.textSecondary}
                    value={replyText}
                    onChangeText={setReplyText}
                    onSubmitEditing={handleSendTicketReply}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, !replyText.trim() && { opacity: 0.5 }]}
                    onPress={handleSendTicketReply}
                    disabled={!replyText.trim()}
                  >
                    <Send size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

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
                  {t('admin_analytics_overview')}
                </Text>
                <Text style={[styles.pageHeaderSubtitle, { color: stitchTheme.textSecondary }]}>
                  {t('admin_analytics_overview_sub')}
                </Text>
              </View>
            </View>

            <View style={styles.dashboardGrid}>
              <View style={styles.chartsRow}>
                <View style={{ flex: 1, minWidth: 320 }}>
                  <PerformanceDistributionChart
                    themeMode={isDark ? 'dark' : 'light'}
                    size={240}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 320 }}>
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
        return renderSupport();
      default:
        return renderDashboard();
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: stitchTheme.bg },
      Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' } : {},
    ]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Toast Alert */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Role / Department Switcher Modal */}
      <Modal
        visible={showRoleSwitcher}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleSwitcher(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleSwitcher(false)}
        >
          <View
            style={[
              styles.roleModalContent,
              {
                backgroundColor: stitchTheme.surface,
                borderColor: stitchTheme.cardBorder,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
              <View>
                <Text style={[styles.modalTitle, { color: stitchTheme.textPrimary }]}>
                  {t('admin_switch_role_title')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: stitchTheme.textSecondary }]}>
                  {t('admin_switch_role_sub')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRoleSwitcher(false)}>
                <X size={20} color={stitchTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10, paddingVertical: 14 }}>
                {ROLES.map((roleDef) => {
                  const isSelected = activeRole === roleDef.id;
                  const RoleIcon = roleDef.icon;
                  return (
                    <TouchableOpacity
                      key={roleDef.id}
                      style={[
                        styles.roleOptionCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : '#ECFDF5'
                            : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                          borderColor: isSelected ? '#10B981' : stitchTheme.cardBorder,
                        },
                      ]}
                      onPress={() => handleRoleChange(roleDef.id)}
                    >
                      <View style={[styles.roleIconCircle, { backgroundColor: roleDef.color + '20' }]}>
                        <RoleIcon size={20} color={roleDef.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.roleOptionTitle, { color: stitchTheme.textPrimary }]}>
                            {roleDef.id}
                          </Text>
                          {isSelected && (
                            <View style={styles.activePillBadge}>
                              <Text style={styles.activePillText}>Active</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.roleOptionDept, { color: stitchTheme.textSecondary }]}>
                          {roleDef.department}
                        </Text>
                        <Text style={[styles.roleOptionSections, { color: stitchTheme.textMuted }]}>
                          Unlocks {roleDef.allowedSections.length} sections: {roleDef.allowedSections.join(', ')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
                    Actions for {selectedStaff.name} ({selectedStaff.department})
                  </Text>
                </View>

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
                      showToast(
                        selectedStaff.status === 'Active'
                          ? language === 'fr'
                            ? 'Membre désactivé'
                            : 'Staff deactivated'
                          : language === 'fr'
                          ? 'Membre activé'
                          : 'Staff activated'
                      );
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

      {/* Add Staff Modal with Department Assignment */}
      <Modal
        visible={showAddStaffModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: stitchTheme.textPrimary }]}>{t('admin_add_staff_member')}</Text>
              <TouchableOpacity onPress={() => setShowAddStaffModal(false)} style={{ padding: 4 }}>
                <X size={22} color={stitchTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: stitchTheme.textPrimary, borderColor: stitchTheme.cardBorder }]}
                  placeholder="e.g. Jean Kouassi"
                  placeholderTextColor={stitchTheme.textMuted}
                  value={newStaff.name}
                  onChangeText={(text) => setNewStaff({ ...newStaff, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: stitchTheme.textPrimary, borderColor: stitchTheme.cardBorder }]}
                  placeholder="e.g. jean@immoci.ci"
                  placeholderTextColor={stitchTheme.textMuted}
                  value={newStaff.email}
                  onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Department</Text>
                <View style={styles.roleSelector}>
                  {(
                    [
                      'Operations & Logistics',
                      'Legal & Compliance',
                      'Sales & Commercial',
                      'Customer Support',
                      'Finance & Billing',
                      'Platform Administration',
                    ] as const
                  ).map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.roleOption,
                        { borderColor: stitchTheme.cardBorder },
                        newStaff.department === dept && {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                          borderColor: '#10B981',
                        },
                      ]}
                      onPress={() => setNewStaff({ ...newStaff, department: dept })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          { color: stitchTheme.textSecondary },
                          newStaff.department === dept && {
                            color: '#10B981',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitchTheme.textPrimary }]}>Role</Text>
                <View style={styles.roleSelector}>
                  {(['Manager', 'Agent', 'Officer', 'Specialist', 'Admin'] as const).map((role) => (
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

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: stitchTheme.primary, marginTop: 12 }]}
                onPress={handleAddStaff}
              >
                <Text style={styles.primaryButtonText}>{t('admin_add_staff_member')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Moderation Modal */}
      {moderationProperty && (
        <AIModeration
          visible={showAIModeration}
          property={moderationProperty}
          onClose={() => {
            setShowAIModeration(false);
            setModerationProperty(null);
          }}
          onApprove={() => {
            updateSubmissionStatus(moderationProperty.id, 'approved');
            setShowAIModeration(false);
            setModerationProperty(null);
            showToast(language === 'fr' ? 'Annonce validée par IA' : 'Listing approved via AI');
          }}
          onReject={(reason) => {
            updateSubmissionStatus(moderationProperty.id, 'rejected', reason);
            setShowAIModeration(false);
            setModerationProperty(null);
            showToast(language === 'fr' ? 'Annonce rejetée par IA' : 'Listing rejected via AI');
          }}
        />
      )}

      {/* Attachment Preview Modal */}
      {attachmentView && (
        <Modal
          visible={!!attachmentView}
          transparent
          animationType="fade"
          onRequestClose={() => setAttachmentView(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAttachmentView(null)}
          >
            <View
              style={[
                styles.attachmentModalContent,
                { backgroundColor: stitchTheme.surface, borderColor: stitchTheme.cardBorder },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.modalHeader, { borderBottomColor: stitchTheme.cardBorder }]}>
                <Text style={[styles.modalTitle, { color: stitchTheme.textPrimary }]}>
                  {attachmentView.type === 'document' ? 'Document Verification' : 'Photo Gallery'}
                </Text>
                <TouchableOpacity onPress={() => setAttachmentView(null)}>
                  <X size={20} color={stitchTheme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {attachmentView.type === 'document' ? (
                  <View style={styles.docPreviewCard}>
                    <Shield size={48} color="#10B981" style={{ alignSelf: 'center', marginVertical: 12 }} />
                    <Text style={[styles.docPreviewTitle, { color: stitchTheme.textPrimary }]}>
                      Certificat Foncier / Titre Foncier (ACD)
                    </Text>
                    <Text style={[styles.docPreviewText, { color: stitchTheme.textSecondary }]}>
                      Verified cadastral deed record for {attachmentView.submission.title}.
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: '#10B981', alignSelf: 'center', marginTop: 16 }]}
                      onPress={() => {
                        showToast(language === 'fr' ? 'Document ACD conforme' : 'Cadastral deed verified');
                        setAttachmentView(null);
                      }}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Confirm Compliance</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 14 }}>
                    {attachmentView.submission.photos.map((url, index) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Main Layout: Sidebar + Content ─────────────────────────────────── */}
      <View style={styles.layoutWrapper}>
        {/* Stitch Navigation Rail */}
        <View style={[
          styles.sidebar,
          { backgroundColor: stitchTheme.sidebarBg },
          Platform.OS === 'web' ? { height: '100%' as any } : {},
        ]}>
          {/* Sidebar Header Brand */}
          <View style={styles.sidebarHeader}>
            <View style={styles.logoBadge}>
              <Sparkles size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.logoTitle}>ImmoCI</Text>
              <Text style={styles.logoSubtitle}>ADMIN PRO</Text>
            </View>
          </View>

          {/* Nav Items Scroll */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.navScrollView}>
            <View style={styles.navGroup}>
              {filteredNavItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.navItem,
                      isActive && styles.navItemActive,
                    ]}
                    onPress={() => setActiveSection(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.navItemContent}>
                      {item.icon(isActive)}
                      <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                        {item.title}
                      </Text>
                    </View>
                    {item.count ? (
                      <View style={styles.navBadge}>
                        <Text style={styles.navBadgeText}>{item.count}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/home')}
              activeOpacity={0.8}
            >
              <Home size={18} color="#94A3B8" />
              <Text style={styles.backButtonText}>{t('admin_back_to_app')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backButton, { marginTop: 4 }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={16} color="#EF4444" />
              <Text style={[styles.backButtonText, { color: '#EF4444' }]}>
                {language === 'fr' ? 'Déconnexion' : 'Log out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Main Scrollable View */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          {/* Stitch App Bar */}
          <View
            style={[
              styles.appBar,
              {
                backgroundColor: stitchTheme.topBarBg,
                borderBottomColor: stitchTheme.cardBorder,
              },
            ]}
          >
            <View style={styles.appBarLeft}>
              <Text style={[styles.pageTitle, { color: stitchTheme.textPrimary }]}>
                {filteredNavItems.find((n) => n.id === activeSection)?.title || 'Dashboard'}
              </Text>
            </View>

            <View style={styles.appBarRight}>
              {/* Interactive Role & Department Switcher Capsule */}
              <TouchableOpacity
                style={[
                  styles.roleSwitcherPill,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                    borderColor: '#10B981',
                  },
                ]}
                onPress={() => setShowRoleSwitcher(true)}
                activeOpacity={0.8}
              >
                <Shield size={15} color="#10B981" />
                <Text style={styles.roleSwitcherPillText}>{activeRole}</Text>
                <Sliders size={13} color="#10B981" />
              </TouchableOpacity>

              {/* Theme Toggle Pill */}
              <TouchableOpacity
                style={[
                  styles.iconPillBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => setTheme(isDark ? 'light' : 'dark')}
                activeOpacity={0.8}
              >
                {isDark ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color="#64748B" />}
              </TouchableOpacity>

              {/* Language Switcher Pill */}
              <TouchableOpacity
                style={[
                  styles.iconPillBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
                onPress={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                activeOpacity={0.8}
              >
                <Globe size={15} color={stitchTheme.textSecondary} />
                <Text style={[styles.langText, { color: stitchTheme.textPrimary }]}>
                  {language.toUpperCase()}
                </Text>
              </TouchableOpacity>

              {/* Notifications Pill */}
              <View
                style={[
                  styles.iconPillBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: stitchTheme.cardBorder,
                  },
                ]}
              >
                <Bell size={17} color={stitchTheme.textSecondary} />
                {pendingSubmissions.length > 0 && <View style={styles.bellDot} />}
              </View>
            </View>
          </View>

          {/* Section Body */}
          <View style={styles.contentPadding}>{renderContent()}</View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  layoutWrapper: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 20,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.2,
  },
  navScrollView: {
    flex: 1,
  },
  navGroup: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  navBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  sidebarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    minHeight: '100%',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleSwitcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleSwitcherPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10B981',
  },
  iconPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  contentPadding: {
    padding: 24,
  },
  animateView: {
    gap: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statTrendText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statContent: {
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 11.5,
  },
  statCardIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  dashboardGrid: {
    gap: 20,
  },
  chartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tableContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableHead: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
  },
  tableCellView: {
    justifyContent: 'center',
  },
  tableCellTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  tableCellSubtitle: {
    fontSize: 11,
  },
  tableImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusTextApproved: {
    color: '#10B981',
  },
  statusTextRejected: {
    color: '#EF4444',
  },
  statusTextPendingTable: {
    color: '#F59E0B',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsGrid: {
    gap: 16,
  },
  emptyStateFull: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyStateText: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  pageHeaderSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  deptPillsScroll: {
    marginBottom: 10,
  },
  deptPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  deptPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  staffStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  staffStatCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  staffStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  staffStatLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  staffStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  supportLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ticketListCol: {
    flex: 1,
    minWidth: 280,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketCard: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 6,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketUser: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDept: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketTime: {
    fontSize: 11,
  },
  ticketThreadCol: {
    flex: 2,
    minWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    height: 480,
    justifyContent: 'space-between',
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  threadSubject: {
    fontSize: 14,
    fontWeight: '700',
  },
  threadUser: {
    fontSize: 11.5,
    marginTop: 2,
  },
  messagesScroll: {
    padding: 16,
    flex: 1,
  },
  chatBubbleContainer: {
    maxWidth: '80%',
    marginBottom: 12,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 14,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  threadComposer: {
    padding: 14,
    borderTopWidth: 1,
  },
  aiDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  aiDraftText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
  },
  composerInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  sendButton: {
    width: 42,
    height: 42,
    backgroundColor: '#059669',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardsGrid: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
    gap: 2,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reportMeta: {
    fontSize: 12,
  },
  downloadButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  roleModalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  roleOptionDept: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  roleOptionSections: {
    fontSize: 11,
    marginTop: 2,
  },
  activePillBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  actionHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    paddingTop: 16,
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  attachmentModalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  docPreviewCard: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  docPreviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  docPreviewText: {
    fontSize: 13,
    textAlign: 'center',
  },
  galleryImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
});

// Helper SubmissionCard for Document Review
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
  onViewDocs: () => void;
  onViewMedia: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.cardBorder,
        borderWidth: 1,
        borderRadius: 16,
        padding: 18,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
          {submission.title}
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
            Pending Verification
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: theme.textSecondary }}>
        {submission.location.district}, {submission.location.city} • {(submission.price / 1000000).toFixed(1)}M FCFA
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
          }}
          onPress={onViewDocs}
        >
          <FileText size={14} color={theme.textPrimary} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>View ACD Deed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
          }}
          onPress={onViewMedia}
        >
          <Eye size={14} color={theme.textPrimary} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>View Photos ({submission.photos.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: '#059669',
            paddingVertical: 9,
            borderRadius: 10,
          }}
          onPress={onApprove}
        >
          <CheckCircle size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Approve Document</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            paddingVertical: 9,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
          }}
          onPress={onReject}
        >
          <XCircle size={16} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
