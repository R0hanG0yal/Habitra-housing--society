import type { UserRole, UserProfile, BuildingRegistration, Wallet, WalletTransaction } from "@/lib/roles";
import type { Society, Flat, Tenant, FlatOwner, Invoice, Payment, MaintenanceTicketWithRelations } from "@/lib/types";

// Persistent keys in localStorage
const KEYS = {
  USERS: "habitra.db.users",
  CURRENT_USER: "habitra.db.current_user",
  PROFILES: "habitra.db.profiles",
  SOCIETIES: "habitra.db.societies",
  FLATS: "habitra.db.flats",
  TENANTS: "habitra.db.tenants",
  OWNERS: "habitra.db.owners",
  INVOICES: "habitra.db.invoices",
  PAYMENTS: "habitra.db.payments",
  TICKETS: "habitra.db.tickets",
  WALLETS: "habitra.db.wallets",
  WALLET_TXS: "habitra.db.wallet_txs",
  REGISTRATIONS: "habitra.db.registrations",
};

export interface LocalAuthUser {
  id: string;
  email: string;
  password?: string;
  created_at: string;
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

// ==========================================
// SEED INITIAL STRUCTURE IF EMPTY
// ==========================================
export function initLocalStore() {
  const societies = getItem<Society[]>(KEYS.SOCIETIES, []);
  if (societies.length === 0) {
    const defaultSocietyId = "soc_default_101";
    const defaultSociety: Society = {
      id: defaultSocietyId,
      name: "Habitra Grand Residency (Tower A & B)",
      address: "Plot 42, Sector 18, Palm Grove Road",
      admin_id: "admin_master_1",
      rwa_registration_no: "RWA/2026/KA/8841",
      bank_account_no: "0098104000123456",
      bank_ifsc: "HDFC0000981",
      upi_vpa: "habitra.rwa@hdfcbank",
      sustainability_score: 92,
      health_score: 96,
      created_at: new Date().toISOString(),
    };
    setItem(KEYS.SOCIETIES, [defaultSociety]);

    // Initial flats
    const defaultFlats: Flat[] = [
      {
        id: "flat_101",
        tower_id: "tower_1",
        society_id: defaultSocietyId,
        owner_id: "owner_1",
        flat_no: "101",
        floor: 1,
        area_sqft: 1450,
        status: "occupied",
        unit_type: "flat",
        settlement_mode: "smart_split",
        base_maintenance_fee: 4500,
        sinking_fund_fee: 800,
        created_at: new Date().toISOString(),
      },
      {
        id: "flat_202",
        tower_id: "tower_1",
        society_id: defaultSocietyId,
        owner_id: "owner_1",
        flat_no: "202",
        floor: 2,
        area_sqft: 1850,
        status: "occupied",
        unit_type: "flat",
        settlement_mode: "smart_split",
        base_maintenance_fee: 5500,
        sinking_fund_fee: 1000,
        created_at: new Date().toISOString(),
      },
      {
        id: "flat_303",
        tower_id: "tower_2",
        society_id: defaultSocietyId,
        owner_id: "owner_2",
        flat_no: "303",
        floor: 3,
        area_sqft: 1200,
        status: "vacant",
        unit_type: "flat",
        settlement_mode: "owner_inclusive",
        base_maintenance_fee: 3800,
        sinking_fund_fee: 650,
        created_at: new Date().toISOString(),
      },
    ];
    setItem(KEYS.FLATS, defaultFlats);

    // Initial Invoices
    const currentMonth = new Date().toISOString().slice(0, 7);
    const defaultInvoices: Invoice[] = [
      {
        id: "inv_rent_101",
        flat_id: "flat_101",
        society_id: defaultSocietyId,
        tenant_id: "tenant_1",
        month: currentMonth,
        amount: 28500,
        rent_amount: 24000,
        maintenance_amount: 4500,
        due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        late_fee_applied: 0,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ];
    setItem(KEYS.INVOICES, defaultInvoices);
  }
}

// ==========================================
// AUTH & USERS
// ==========================================
export function getLocalUsers(): LocalAuthUser[] {
  return getItem<LocalAuthUser[]>(KEYS.USERS, []);
}

export function getLocalProfiles(): UserProfile[] {
  return getItem<UserProfile[]>(KEYS.PROFILES, []);
}

export function getCurrentLocalUser(): LocalAuthUser | null {
  return getItem<LocalAuthUser | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentLocalUser(user: LocalAuthUser | null): void {
  setItem(KEYS.CURRENT_USER, user);
}

export function registerLocalUser(
  email: string,
  role: UserRole,
  fullName: string,
  password?: string,
): { user: LocalAuthUser; profile: UserProfile } {
  initLocalStore();
  const users = getLocalUsers();
  const profiles = getLocalProfiles();

  let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  let user: LocalAuthUser;

  if (existing) {
    user = existing;
  } else {
    user = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      email: email.toLowerCase(),
      password,
      created_at: new Date().toISOString(),
    };
    users.push(user);
    setItem(KEYS.USERS, users);
  }

  let profile = profiles.find((p) => p.id === user.id);
  if (!profile) {
    profile = {
      id: user.id,
      role,
      full_name: fullName.trim() || email.split("@")[0],
      phone: null,
      avatar_url: null,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(profile);
    setItem(KEYS.PROFILES, profiles);
  } else {
    profile.role = role;
    profile.full_name = fullName.trim() || profile.full_name;
    setItem(KEYS.PROFILES, profiles);
  }

  // Ensure wallet exists
  getOrCreateLocalWallet(user.id, role);

  // Link tenant or flat owner if applicable
  linkUserRoleEntities(user.id, email, fullName, role);

  setCurrentLocalUser(user);
  return { user, profile };
}

export function findLocalUserByEmail(email: string): LocalAuthUser | null {
  const users = getLocalUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getLocalProfile(userId: string): UserProfile | null {
  const profiles = getLocalProfiles();
  return profiles.find((p) => p.id === userId) ?? null;
}

export function updateLocalProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
  const profiles = getLocalProfiles();
  const idx = profiles.findIndex((p) => p.id === userId);
  if (idx === -1) return null;
  profiles[idx] = { ...profiles[idx], ...updates, updated_at: new Date().toISOString() };
  setItem(KEYS.PROFILES, profiles);
  return profiles[idx];
}

// Link user to tenant/flat_owner records
function linkUserRoleEntities(userId: string, email: string, name: string, role: UserRole) {
  const societies = getItem<Society[]>(KEYS.SOCIETIES, []);
  const societyId = societies[0]?.id ?? "soc_default_101";

  if (role === "tenant") {
    const tenants = getItem<Tenant[]>(KEYS.TENANTS, []);
    let t = tenants.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!t) {
      t = {
        id: "ten_" + userId.slice(4),
        flat_id: "flat_101",
        society_id: societyId,
        name: name || "Resident",
        phone: "+91 98765 43210",
        email: email.toLowerCase(),
        lease_start: new Date().toISOString().slice(0, 10),
        lease_end: new Date(Date.now() + 330 * 86400000).toISOString().slice(0, 10),
        security_deposit: 50000,
        active: true,
        whatsapp_opt_in: true,
        emergency_contact_name: "Family Member",
        emergency_contact_phone: "+91 98765 00000",
        aadhaar_no: "XXXX-XXXX-1234",
        pan_no: "ABCDE1234F",
        created_at: new Date().toISOString(),
      };
      tenants.push(t);
      setItem(KEYS.TENANTS, tenants);
    }
  } else if (role === "flat_owner") {
    const owners = getItem<FlatOwner[]>(KEYS.OWNERS, []);
    let o = owners.find((item) => item.user_id === userId || item.email?.toLowerCase() === email.toLowerCase());
    if (!o) {
      o = {
        id: "own_" + userId.slice(4),
        society_id: societyId,
        user_id: userId,
        name: name || "Flat Owner",
        phone: "+91 99887 76655",
        email: email.toLowerCase(),
        pan_no: "OWPAN9876K",
        bank_account_no: "99880011223344",
        bank_ifsc: "SBIN0001234",
        upi_vpa: `${email.split("@")[0]}@okhdfcbank`,
        is_nri: false,
        permanent_address: "Flat 101, Habitra Grand Residency",
        created_at: new Date().toISOString(),
      };
      owners.push(o);
      setItem(KEYS.OWNERS, owners);

      // Assign flats to this owner
      const flats = getItem<Flat[]>(KEYS.FLATS, []);
      flats.forEach((f) => {
        if (!f.owner_id || f.owner_id === "owner_1") {
          f.owner_id = o?.id;
        }
      });
      setItem(KEYS.FLATS, flats);
    }
  }
}

// ==========================================
// WALLETS & TRANSACTIONS
// ==========================================
export function getOrCreateLocalWallet(userId: string, role?: UserRole): Wallet {
  const wallets = getItem<Wallet[]>(KEYS.WALLETS, []);
  let wallet = wallets.find((w) => w.user_id === userId);
  if (!wallet) {
    const initialBalance = role === "tenant" ? 35000 : role === "flat_owner" ? 60000 : 150000;
    wallet = {
      id: "wal_" + userId.slice(4),
      user_id: userId,
      balance: initialBalance,
      currency: "INR",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    wallets.push(wallet);
    setItem(KEYS.WALLETS, wallets);

    // Initial transaction
    recordLocalWalletTransaction({
      wallet_id: wallet.id,
      type: "credit",
      amount: initialBalance,
      purpose: "topup",
      reference_id: "INIT_DEPOSIT",
      description: "Initial automated wallet balance allocation",
      status: "completed",
    });
  }
  return wallet;
}

export function updateLocalWalletBalance(walletId: string, newBalance: number): void {
  const wallets = getItem<Wallet[]>(KEYS.WALLETS, []);
  const idx = wallets.findIndex((w) => w.id === walletId);
  if (idx !== -1) {
    wallets[idx].balance = newBalance;
    wallets[idx].updated_at = new Date().toISOString();
    setItem(KEYS.WALLETS, wallets);
  }
}

export function getLocalWalletTransactions(walletId: string): WalletTransaction[] {
  const txs = getItem<WalletTransaction[]>(KEYS.WALLET_TXS, []);
  return txs.filter((t) => t.wallet_id === walletId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function recordLocalWalletTransaction(
  tx: Omit<WalletTransaction, "id" | "created_at">,
): WalletTransaction {
  const txs = getItem<WalletTransaction[]>(KEYS.WALLET_TXS, []);
  const newTx: WalletTransaction = {
    ...tx,
    id: "tx_" + Math.random().toString(36).substring(2, 10),
    created_at: new Date().toISOString(),
  };
  txs.unshift(newTx);
  setItem(KEYS.WALLET_TXS, txs);
  return newTx;
}

// ==========================================
// SOCIETIES
// ==========================================
export function getLocalSocieties(): Society[] {
  initLocalStore();
  return getItem<Society[]>(KEYS.SOCIETIES, []);
}

export function createLocalSociety(name: string, address: string | null, adminId: string): Society {
  const societies = getLocalSocieties();
  const newSoc: Society = {
    id: "soc_" + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    address: address?.trim() || null,
    admin_id: adminId,
    rwa_registration_no: "RWA/" + new Date().getFullYear() + "/" + Math.floor(1000 + Math.random() * 9000),
    bank_account_no: null,
    bank_ifsc: null,
    upi_vpa: null,
    sustainability_score: 85,
    health_score: 90,
    created_at: new Date().toISOString(),
  };
  societies.push(newSoc);
  setItem(KEYS.SOCIETIES, societies);
  return newSoc;
}

// ==========================================
// BUILDING REGISTRATIONS (Proof of ownership)
// ==========================================
export function getLocalBuildingRegistrations(): BuildingRegistration[] {
  return getItem<BuildingRegistration[]>(KEYS.REGISTRATIONS, []);
}

export function createLocalBuildingRegistration(
  reg: Omit<BuildingRegistration, "id" | "submitted_at" | "verified_at" | "verified_by">,
): BuildingRegistration {
  const regs = getLocalBuildingRegistrations();
  const newReg: BuildingRegistration = {
    ...reg,
    id: "breg_" + Math.random().toString(36).substring(2, 9),
    submitted_at: new Date().toISOString(),
    verified_at: null,
    verified_by: null,
  };
  regs.unshift(newReg);
  setItem(KEYS.REGISTRATIONS, regs);
  return newReg;
}

export function updateLocalBuildingRegistrationStatus(
  regId: string,
  status: "verified" | "rejected",
  adminNotes?: string,
  adminId?: string,
): void {
  const regs = getLocalBuildingRegistrations();
  const idx = regs.findIndex((r) => r.id === regId);
  if (idx !== -1) {
    regs[idx].status = status;
    regs[idx].admin_notes = adminNotes || null;
    regs[idx].verified_by = adminId || "admin";
    regs[idx].verified_at = new Date().toISOString();
    setItem(KEYS.REGISTRATIONS, regs);

    if (status === "verified") {
      // Create the society from verified registration
      createLocalSociety(regs[idx].building_name, regs[idx].building_address, regs[idx].owner_id);
    }
  }
}

// ==========================================
// TICKETS
// ==========================================
export function getLocalTickets(societyId: string): MaintenanceTicketWithRelations[] {
  const tickets = getItem<MaintenanceTicketWithRelations[]>(KEYS.TICKETS, []);
  return tickets.filter((t) => t.society_id === societyId);
}

export function createLocalTicket(
  ticket: Omit<MaintenanceTicketWithRelations, "id" | "created_at" | "resolved_at">,
): MaintenanceTicketWithRelations {
  const tickets = getItem<MaintenanceTicketWithRelations[]>(KEYS.TICKETS, []);
  const newTicket: MaintenanceTicketWithRelations = {
    ...ticket,
    id: "tick_" + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    resolved_at: null,
  };
  tickets.unshift(newTicket);
  setItem(KEYS.TICKETS, tickets);
  return newTicket;
}

// ==========================================
// INVOICES & PAYMENTS
// ==========================================
export function getLocalInvoices(societyId: string): Invoice[] {
  initLocalStore();
  const invoices = getItem<Invoice[]>(KEYS.INVOICES, []);
  return invoices.filter((i) => i.society_id === societyId);
}

export function updateLocalInvoiceStatus(invoiceId: string, status: Invoice["status"]): void {
  const invoices = getItem<Invoice[]>(KEYS.INVOICES, []);
  const idx = invoices.findIndex((i) => i.id === invoiceId);
  if (idx !== -1) {
    invoices[idx].status = status;
    setItem(KEYS.INVOICES, invoices);
  }
}
