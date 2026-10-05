// ==========================================
// ROLE-BASED ACCESS CONTROL
// ==========================================

export type UserRole = "admin" | "building_owner" | "flat_owner" | "tenant";

export type UserProfile = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type BuildingRegistration = {
  id: string;
  society_id: string | null;
  owner_id: string;
  building_name: string;
  building_address: string | null;
  registration_number: string | null;
  proof_document_url: string | null;
  proof_type:
    | "registration_certificate"
    | "property_tax"
    | "electricity_bill"
    | "society_bylaws"
    | "other"
    | null;
  status: "pending" | "verified" | "rejected";
  admin_notes: string | null;
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type WalletTransactionType = "credit" | "debit";
export type WalletTransactionPurpose =
  | "rent_payment"
  | "maintenance_payment"
  | "deposit"
  | "refund"
  | "topup"
  | "payout"
  | "penalty";
export type WalletTransactionStatus =
  "pending" | "completed" | "failed" | "reversed";

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  purpose: WalletTransactionPurpose;
  reference_id: string | null;
  description: string | null;
  status: WalletTransactionStatus;
  created_at: string;
};

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

export type Permission =
  | "view_dashboard"
  | "view_all_buildings"
  | "manage_buildings"
  | "view_flats"
  | "manage_flats"
  | "view_tenants"
  | "manage_tenants"
  | "view_owners"
  | "manage_owners"
  | "view_invoices"
  | "manage_invoices"
  | "view_payments"
  | "manage_payments"
  | "view_expenses"
  | "manage_expenses"
  | "view_maintenance"
  | "submit_maintenance"
  | "manage_maintenance"
  | "view_wallet"
  | "use_wallet"
  | "view_visitors"
  | "manage_visitors"
  | "view_documents"
  | "manage_documents"
  | "view_reports"
  | "view_settings"
  | "manage_settings"
  | "view_admin"
  | "manage_admin"
  | "view_assets"
  | "manage_assets"
  | "view_utilities"
  | "manage_utilities"
  | "view_parking"
  | "manage_parking"
  | "view_staff"
  | "manage_staff"
  | "view_compliance"
  | "manage_compliance"
  | "view_agm"
  | "manage_agm"
  | "view_procurement"
  | "manage_procurement"
  | "view_passports"
  | "manage_passports"
  | "register_building";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_all_buildings",
    "manage_buildings",
    "view_flats",
    "manage_flats",
    "view_tenants",
    "manage_tenants",
    "view_owners",
    "manage_owners",
    "view_invoices",
    "manage_invoices",
    "view_payments",
    "manage_payments",
    "view_expenses",
    "manage_expenses",
    "view_maintenance",
    "manage_maintenance",
    "view_wallet",
    "use_wallet",
    "view_visitors",
    "manage_visitors",
    "view_documents",
    "manage_documents",
    "view_reports",
    "view_settings",
    "manage_settings",
    "view_admin",
    "manage_admin",
    "view_assets",
    "manage_assets",
    "view_utilities",
    "manage_utilities",
    "view_parking",
    "manage_parking",
    "view_staff",
    "manage_staff",
    "view_compliance",
    "manage_compliance",
    "view_agm",
    "manage_agm",
    "view_procurement",
    "manage_procurement",
    "view_passports",
    "manage_passports",
  ],
  building_owner: [
    "view_dashboard",
    "manage_buildings",
    "register_building",
    "view_flats",
    "manage_flats",
    "view_tenants",
    "manage_tenants",
    "view_owners",
    "manage_owners",
    "view_invoices",
    "manage_invoices",
    "view_payments",
    "manage_payments",
    "view_expenses",
    "manage_expenses",
    "view_maintenance",
    "manage_maintenance",
    "view_wallet",
    "use_wallet",
    "view_visitors",
    "manage_visitors",
    "view_documents",
    "manage_documents",
    "view_reports",
    "view_settings",
    "manage_settings",
    "view_assets",
    "manage_assets",
    "view_utilities",
    "manage_utilities",
    "view_parking",
    "manage_parking",
    "view_staff",
    "manage_staff",
    "view_compliance",
    "manage_compliance",
    "view_agm",
    "manage_agm",
    "view_procurement",
    "manage_procurement",
    "view_passports",
    "manage_passports",
  ],
  flat_owner: [
    "view_dashboard",
    "view_flats",
    "view_tenants",
    "view_invoices",
    "view_payments",
    "view_wallet",
    "use_wallet",
    "view_maintenance",
    "view_settings",
    "view_parking",
    "view_agm",
  ],
  tenant: [
    "view_dashboard",
    "view_invoices",
    "view_payments",
    "view_wallet",
    "use_wallet",
    "view_maintenance",
    "submit_maintenance",
    "view_parking",
    "view_settings",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ANY of the given permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Platform Admin";
    case "building_owner":
      return "Building Owner";
    case "flat_owner":
      return "Flat Owner";
    case "tenant":
      return "Tenant";
    default:
      return "Unknown";
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Full platform access. Manage all users, buildings, and data.";
    case "building_owner":
      return "Manage your buildings, flats, tenants, invoices, and expenses.";
    case "flat_owner":
      return "View your flats, tenants, invoices, and receive rent payouts.";
    case "tenant":
      return "View your flat, pay rent, submit maintenance requests.";
    default:
      return "";
  }
}

/**
 * Navigation items filtered by role
 */
export type NavItem = {
  label: string;
  path: string;
  icon: string; // lucide icon name
  badge?: string;
  requiredPermission: Permission;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export function getNavSections(role: UserRole): NavSection[] {
  const all: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/",
          icon: "LayoutDashboard",
          requiredPermission: "view_dashboard",
        },
        {
          label: "Wallet",
          path: "/wallet",
          icon: "Wallet",
          requiredPermission: "view_wallet",
        },
      ],
    },
    {
      title: "Property Management",
      items: [
        {
          label: "Units & Towers",
          path: "/flats",
          icon: "Home",
          requiredPermission: "view_flats",
        },
        {
          label: "Flat Owners",
          path: "/owners",
          icon: "Building2",
          requiredPermission: "view_owners",
        },
        {
          label: "Tenants & Leases",
          path: "/tenants",
          icon: "Users",
          requiredPermission: "view_tenants",
        },
      ],
    },
    {
      title: "Billing & Finance",
      items: [
        {
          label: "Invoices",
          path: "/invoices",
          icon: "Receipt",
          requiredPermission: "view_invoices",
        },
        {
          label: "Payments",
          path: "/payments",
          icon: "CreditCard",
          requiredPermission: "view_payments",
        },
        {
          label: "Expenses",
          path: "/expenses",
          icon: "TrendingDown",
          requiredPermission: "view_expenses",
        },
        {
          label: "Reports",
          path: "/reports",
          icon: "FileText",
          requiredPermission: "view_reports",
        },
      ],
    },
    {
      title: "Infrastructure",
      items: [
        {
          label: "Assets",
          path: "/assets",
          icon: "Cpu",
          requiredPermission: "view_assets",
        },
        {
          label: "Utilities",
          path: "/utilities",
          icon: "Droplets",
          requiredPermission: "view_utilities",
        },
        {
          label: "Parking",
          path: "/parking",
          icon: "Car",
          requiredPermission: "view_parking",
        },
        {
          label: "Maintenance",
          path: "/maintenance",
          icon: "Wrench",
          requiredPermission: "view_maintenance",
        },
        {
          label: "Staff",
          path: "/staff",
          icon: "UserCheck",
          requiredPermission: "view_staff",
        },
        {
          label: "Visitors",
          path: "/visitors",
          icon: "ShieldCheck",
          requiredPermission: "view_visitors",
        },
      ],
    },
    {
      title: "Governance",
      items: [
        {
          label: "Condition Passports",
          path: "/passports",
          icon: "FileCheck",
          requiredPermission: "view_passports",
        },
        {
          label: "Procurement",
          path: "/procurement",
          icon: "ShoppingBag",
          requiredPermission: "view_procurement",
        },
        {
          label: "AGM & Voting",
          path: "/agm",
          icon: "Vote",
          requiredPermission: "view_agm",
        },
        {
          label: "Compliance",
          path: "/compliance",
          icon: "CalendarCheck",
          requiredPermission: "view_compliance",
        },
        {
          label: "Documents",
          path: "/documents",
          icon: "FolderArchive",
          requiredPermission: "view_documents",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          label: "Settings",
          path: "/settings",
          icon: "Settings",
          requiredPermission: "view_settings",
        },
        {
          label: "Admin Panel",
          path: "/admin",
          icon: "Shield",
          requiredPermission: "view_admin",
        },
      ],
    },
  ];

  // Filter sections and items based on role permissions
  return all
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        hasPermission(role, item.requiredPermission),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
