/**
 * ImmoCI — Staff Role-Based Access Control (RBAC) & Permissions
 */

export type StaffRole =
  | 'Super Admin'
  | 'Admin'
  | 'Customer Care'
  | 'Property Manager'
  | 'Sales';

export type DepartmentType =
  | 'Operations & Logistics'
  | 'Legal & Compliance'
  | 'Sales & Commercial'
  | 'Customer Support'
  | 'Finance & Billing'
  | 'Platform Administration';

export type PermissionKey =
  // Dashboard
  | 'dashboard.view'
  // Properties
  | 'properties.view'
  | 'properties.create'
  | 'properties.edit'
  | 'properties.delete'
  | 'properties.approve'
  | 'properties.reject'
  // Customers
  | 'customers.view'
  | 'customers.edit'
  // Inquiries
  | 'inquiries.view'
  | 'inquiries.assign'
  | 'inquiries.update'
  | 'inquiries.close'
  // Chat
  | 'chat.view'
  | 'chat.send'
  | 'chat.manage'
  // Reports
  | 'reports.view'
  | 'reports.export'
  // Staff & RBAC
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.assign_roles'
  | 'staff.manage_permissions'
  // Settings
  | 'settings.view'
  | 'settings.modify';

export interface PermissionDefinition {
  key: PermissionKey;
  labelFr: string;
  labelEn: string;
  category: 'dashboard' | 'properties' | 'customers' | 'inquiries' | 'chat' | 'reports' | 'staff' | 'settings';
  descriptionFr: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  {
    key: 'dashboard.view',
    labelFr: 'Consulter le Tableau de bord',
    labelEn: 'View Dashboard',
    category: 'dashboard',
    descriptionFr: 'Accès aux métriques globales et vue d\'ensemble de l\'activité.',
  },

  // Properties
  {
    key: 'properties.view',
    labelFr: 'Consulter les annonces',
    labelEn: 'View Properties',
    category: 'properties',
    descriptionFr: 'Voir toutes les annonces immobilières publiées ou en attente.',
  },
  {
    key: 'properties.create',
    labelFr: 'Créer une annonce',
    labelEn: 'Create Property',
    category: 'properties',
    descriptionFr: 'Déposer une nouvelle annonce immobilière.',
  },
  {
    key: 'properties.edit',
    labelFr: 'Modifier une annonce',
    labelEn: 'Edit Property',
    category: 'properties',
    descriptionFr: 'Mettre à jour les informations, prix et photos d\'une annonce.',
  },
  {
    key: 'properties.delete',
    labelFr: 'Supprimer une annonce',
    labelEn: 'Delete Property',
    category: 'properties',
    descriptionFr: 'Archiver ou supprimer définitivement une annonce.',
  },
  {
    key: 'properties.approve',
    labelFr: 'Approuver une annonce',
    labelEn: 'Approve Property',
    category: 'properties',
    descriptionFr: 'Valider une annonce soumise et la publier sur la plateforme.',
  },
  {
    key: 'properties.reject',
    labelFr: 'Rejeter une annonce',
    labelEn: 'Reject Property',
    category: 'properties',
    descriptionFr: 'Refuser une soumission non conforme avec motif.',
  },

  // Customers
  {
    key: 'customers.view',
    labelFr: 'Consulter les comptes clients',
    labelEn: 'View Customers',
    category: 'customers',
    descriptionFr: 'Accéder à la liste des acheteurs et locataires enregistrés.',
  },
  {
    key: 'customers.edit',
    labelFr: 'Modifier les fiches clients',
    labelEn: 'Edit Customers',
    category: 'customers',
    descriptionFr: 'Mettre à jour les informations de contact ou statut client.',
  },

  // Inquiries
  {
    key: 'inquiries.view',
    labelFr: 'Consulter les demandes & leads',
    labelEn: 'View Inquiries',
    category: 'inquiries',
    descriptionFr: 'Voir toutes les demandes de visite et d\'information.',
  },
  {
    key: 'inquiries.assign',
    labelFr: 'Assigner les demandes',
    labelEn: 'Assign Inquiries',
    category: 'inquiries',
    descriptionFr: 'Attribuer une demande client à un agent ou collaborateur.',
  },
  {
    key: 'inquiries.update',
    labelFr: 'Mettre à jour le statut du dossier',
    labelEn: 'Update Inquiry Status',
    category: 'inquiries',
    descriptionFr: 'Changer le statut (En cours, En attente, Résolu).',
  },
  {
    key: 'inquiries.close',
    labelFr: 'Clôturer les demandes',
    labelEn: 'Close Inquiries',
    category: 'inquiries',
    descriptionFr: 'Clôturer un dossier traité ou sans suite.',
  },

  // Chat
  {
    key: 'chat.view',
    labelFr: 'Consulter les conversations',
    labelEn: 'View Chat',
    category: 'chat',
    descriptionFr: 'Lire les échanges en direct avec les clients et acquéreurs.',
  },
  {
    key: 'chat.send',
    labelFr: 'Envoyer des messages support',
    labelEn: 'Send Messages',
    category: 'chat',
    descriptionFr: 'Répondre directement aux clients dans le chat en temps réel.',
  },
  {
    key: 'chat.manage',
    labelFr: 'Gérer et archiver les échanges',
    labelEn: 'Manage Conversations',
    category: 'chat',
    descriptionFr: 'Transférer ou archiver des discussions terminées.',
  },

  // Reports
  {
    key: 'reports.view',
    labelFr: 'Consulter les rapports',
    labelEn: 'View Reports',
    category: 'reports',
    descriptionFr: 'Voir les rapports d\'activité, financiers et opérationnels.',
  },
  {
    key: 'reports.export',
    labelFr: 'Exporter en Excel (.xlsx)',
    labelEn: 'Export Excel Reports',
    category: 'reports',
    descriptionFr: 'Télécharger les données d\'activité et financières en format Excel.',
  },

  // Staff & RBAC
  {
    key: 'staff.view',
    labelFr: 'Consulter la liste de l\'équipe',
    labelEn: 'View Staff',
    category: 'staff',
    descriptionFr: 'Voir la liste des collaborateurs et leurs rôles.',
  },
  {
    key: 'staff.create',
    labelFr: 'Ajouter un collaborateur',
    labelEn: 'Create Staff',
    category: 'staff',
    descriptionFr: 'Créer un nouveau compte d\'accès pour un collaborateur.',
  },
  {
    key: 'staff.edit',
    labelFr: 'Modifier un collaborateur',
    labelEn: 'Edit Staff',
    category: 'staff',
    descriptionFr: 'Mettre à jour les coordonnées et affectations d\'un membre.',
  },
  {
    key: 'staff.assign_roles',
    labelFr: 'Attribuer les rôles',
    labelEn: 'Assign Roles',
    category: 'staff',
    descriptionFr: 'Changer le rôle d\'un collaborateur (ex: Sales -> Manager).',
  },
  {
    key: 'staff.manage_permissions',
    labelFr: 'Modifier les permissions détaillées',
    labelEn: 'Manage Permissions',
    category: 'staff',
    descriptionFr: 'Personnaliser individuellement les 25 cases d\'accès par collaborateur.',
  },

  // Settings
  {
    key: 'settings.view',
    labelFr: 'Consulter les paramètres',
    labelEn: 'View Settings',
    category: 'settings',
    descriptionFr: 'Voir les paramètres de l\'application et intégrations.',
  },
  {
    key: 'settings.modify',
    labelFr: 'Modifier les paramètres système',
    labelEn: 'Modify Settings',
    category: 'settings',
    descriptionFr: 'Modifier les clés API, webhooks et règles de modération.',
  },
];

export const PERMISSION_CATEGORIES: {
  id: PermissionDefinition['category'];
  titleFr: string;
  titleEn: string;
  icon: string;
}[] = [
  { id: 'dashboard', titleFr: 'Tableau de Bord', titleEn: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'properties', titleFr: 'Biens Immobiliers', titleEn: 'Properties', icon: 'Building2' },
  { id: 'customers', titleFr: 'Clients & Acheteurs', titleEn: 'Customers', icon: 'Users' },
  { id: 'inquiries', titleFr: 'Demandes & Prospects', titleEn: 'Inquiries', icon: 'FileText' },
  { id: 'chat', titleFr: 'Chat & Support Client', titleEn: 'Live Chat', icon: 'MessageSquare' },
  { id: 'reports', titleFr: 'Rapports & Exports', titleEn: 'Reports & Export', icon: 'BarChart3' },
  { id: 'staff', titleFr: 'Équipe & Gestion des Accès', titleEn: 'Staff & RBAC', icon: 'Shield' },
  { id: 'settings', titleFr: 'Paramètres Système', titleEn: 'Settings', icon: 'Settings' },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  'Super Admin': ALL_PERMISSIONS.map((p) => p.key),

  'Admin': [
    'dashboard.view',
    'properties.view',
    'properties.create',
    'properties.edit',
    'properties.approve',
    'properties.reject',
    'customers.view',
    'customers.edit',
    'inquiries.view',
    'inquiries.assign',
    'inquiries.update',
    'inquiries.close',
    'chat.view',
    'chat.send',
    'chat.manage',
    'reports.view',
    'reports.export',
    'staff.view',
    'staff.create',
    'staff.edit',
    'settings.view',
  ],

  'Customer Care': [
    'dashboard.view',
    'customers.view',
    'inquiries.view',
    'inquiries.update',
    'inquiries.close',
    'chat.view',
    'chat.send',
    'chat.manage',
    'reports.view',
  ],

  'Property Manager': [
    'dashboard.view',
    'properties.view',
    'properties.create',
    'properties.edit',
    'properties.approve',
    'properties.reject',
    'inquiries.view',
    'reports.view',
  ],

  'Sales': [
    'dashboard.view',
    'properties.view',
    'customers.view',
    'inquiries.view',
    'inquiries.update',
    'chat.view',
    'chat.send',
    'reports.view',
  ],
};

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  department: DepartmentType;
  status: 'Active' | 'Inactive';
  hireDate: string;
  lastActive: string;
  avatar: string;
  permissions: PermissionKey[];
}
