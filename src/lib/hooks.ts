import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type {
  FlatWithRelations,
  InvoiceWithRelations,
  PaymentWithRelations,
  ReminderLog,
  Settings,
  Society,
  Tower,
  Tenant,
  FlatOwner,
  Expense,
  MaintenanceTicketWithRelations,
  VisitorWithRelations,
  DocumentRecord,
  SocietyAsset,
  UtilityReading,
  ConditionPassport,
  ParkingSlot,
  DomesticStaff,
  ProcurementRequest,
  AGMSession,
  ComplianceRecord,
} from "@/lib/types";
import type {
  Wallet,
  WalletTransaction,
  WalletTransactionPurpose,
  BuildingRegistration,
  UserProfile,
} from "@/lib/roles";
import {
  getOrCreateLocalWallet,
  getLocalWalletTransactions,
  updateLocalWalletBalance,
  recordLocalWalletTransaction,
  getLocalBuildingRegistrations,
  getLocalProfiles,
  getLocalTickets,
  getLocalInvoices,
  updateLocalInvoiceStatus,
} from "@/lib/localStore";

// ==========================================
// SOCIETY DATA HOOK (role-aware)
// ==========================================
export function useSocietyData() {
  const { society, role } = useAuth();
  const societyId = society?.id ?? null;
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<FlatWithRelations[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<FlatOwner[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    try {
      const [t, f, ten, s, ow] = await Promise.all([
        supabase
          .from("towers")
          .select("*")
          .eq("society_id", societyId)
          .order("name", { ascending: true }),
        supabase
          .from("flats")
          .select("*, towers(id,name), tenants(*), rent_config(*)")
          .eq("society_id", societyId)
          .order("flat_no", { ascending: true }),
        supabase
          .from("tenants")
          .select("*")
          .eq("society_id", societyId)
          .order("name", { ascending: true }),
        supabase
          .from("settings")
          .select("*")
          .eq("society_id", societyId)
          .maybeSingle(),
        supabase
          .from("flat_owners")
          .select("*")
          .eq("society_id", societyId)
          .order("name", { ascending: true }),
      ]);
      if (t.error) throw t.error;
      if (f.error) throw f.error;
      if (ten.error) throw ten.error;
      if (s.error && s.error.code !== "PGRST116") throw s.error;
      setTowers(t.data as Tower[]);
      setFlats(f.data as FlatWithRelations[]);
      setTenants(ten.data as Tenant[]);
      setSettings(s.data as Settings | null);
      setOwners((ow.data ?? []) as FlatOwner[]);
      setLoading(false);
      return;
    } catch {
      // Remote fallback to local storage
    }

    try {
      const storedFlats = JSON.parse(localStorage.getItem("habitra.db.flats") || "[]");
      const storedTenants = JSON.parse(localStorage.getItem("habitra.db.tenants") || "[]");
      const storedOwners = JSON.parse(localStorage.getItem("habitra.db.owners") || "[]");
      setTowers([
        { id: "tower_1", name: "Tower A (Aster)", society_id: societyId, created_at: new Date().toISOString() },
        { id: "tower_2", name: "Tower B (Birch)", society_id: societyId, created_at: new Date().toISOString() },
      ]);
      setFlats(storedFlats.map((flat: any) => ({
        ...flat,
        towers: { id: flat.tower_id, name: "Tower A (Aster)" },
        tenants: storedTenants.filter((t: any) => t.flat_id === flat.id),
        rent_config: [{ id: "rc_" + flat.id, flat_id: flat.id, society_id: societyId, amount: 25000, due_day: 5, late_fee_type: "fixed", late_fee_value: 500, grace_days: 5 }],
      })));
      setTenants(storedTenants);
      setOwners(storedOwners);
    } catch (e) {
      console.warn("Local society data fallback:", e);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    society: society as Society | null,
    societyId,
    towers,
    flats,
    tenants,
    owners,
    settings,
    loading,
    error,
    reload: load,
    setTowers,
    setFlats,
    setTenants,
    setOwners,
    setSettings,
    role,
  };
}

// ==========================================
// INVOICES
// ==========================================
export function useInvoices(societyId: string | null, month?: string) {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from("invoices")
      .select(
        "*, flats(id,flat_no,tower_id,settlement_mode,base_maintenance_fee,sinking_fund_fee), tenants(id,name,phone,email), payments(*)",
      )
      .eq("society_id", societyId)
      .order("month", { ascending: false });
    if (month) query = query.eq("month", month);

    try {
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setInvoices(data as InvoiceWithRelations[]);
        setLoading(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    const localInvs = getLocalInvoices(societyId);
    const enriched = localInvs.map((inv) => ({
      ...inv,
      flats: {
        id: inv.flat_id,
        flat_no: inv.flat_id.replace("flat_", "Unit "),
        tower_id: "tower_1",
        settlement_mode: "smart_split" as const,
        base_maintenance_fee: 4500,
        sinking_fund_fee: 800,
      },
      tenants: {
        id: inv.tenant_id ?? "ten_1",
        name: "Resident",
        phone: "+91 98765 43210",
        email: null,
      },
      payments: [],
    })) as InvoiceWithRelations[];
    setInvoices(enriched);
    setLoading(false);
  }, [societyId, month]);

  useEffect(() => {
    load();
  }, [load]);

  return { invoices, loading, error, reload: load, setInvoices };
}

// ==========================================
// PAYMENTS
// ==========================================
export function usePayments(societyId: string | null) {
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("payments")
      .select("*, invoices(id,flat_id,month)")
      .eq("society_id", societyId)
      .order("paid_on", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPayments((data ?? []) as PaymentWithRelations[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { payments, loading, error, reload: load };
}

// ==========================================
// REMINDERS
// ==========================================
export function useReminders(societyId: string | null) {
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("reminders_log")
      .select("*")
      .eq("society_id", societyId)
      .order("sent_on", { ascending: false })
      .limit(100);
    if (error) {
      setError(error.message);
    } else {
      setReminders((data ?? []) as ReminderLog[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { reminders, loading, error, reload: load };
}

// ==========================================
// EXPENSES
// ==========================================
export function useExpenses(societyId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("society_id", societyId)
      .order("expense_date", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setExpenses((data ?? []) as Expense[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { expenses, loading, error, reload: load, setExpenses };
}

// ==========================================
// MAINTENANCE TICKETS
// ==========================================
export function useTickets(societyId: string | null) {
  const [tickets, setTickets] = useState<MaintenanceTicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("*, flats(id,flat_no), tenants(id,name)")
        .eq("society_id", societyId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setTickets(data as MaintenanceTicketWithRelations[]);
        setLoading(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    setTickets(getLocalTickets(societyId));
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { tickets, loading, error, reload: load, setTickets };
}

// ==========================================
// VISITORS
// ==========================================
export function useVisitors(societyId: string | null) {
  const [visitors, setVisitors] = useState<VisitorWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("visitors")
      .select("*, flats(id,flat_no)")
      .eq("society_id", societyId)
      .order("check_in", { ascending: false })
      .limit(200);
    if (error) {
      setError(error.message);
    } else {
      setVisitors((data ?? []) as VisitorWithRelations[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { visitors, loading, error, reload: load, setVisitors };
}

// ==========================================
// DOCUMENTS
// ==========================================
export function useDocuments(societyId: string | null) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("society_id", societyId)
      .order("uploaded_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setDocuments((data ?? []) as DocumentRecord[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { documents, loading, error, reload: load, setDocuments };
}

// ==========================================
// DIGITAL TWIN ASSETS
// ==========================================
export function useDigitalTwin(societyId: string | null) {
  const [assets, setAssets] = useState<SocietyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("society_assets")
      .select("*")
      .eq("society_id", societyId)
      .order("category", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setAssets((data ?? []) as SocietyAsset[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { assets, loading, error, reload: load, setAssets };
}

// ==========================================
// UTILITY READINGS
// ==========================================
export function useUtilityReadings(societyId: string | null, flatId?: string) {
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from("utility_readings")
      .select("*")
      .eq("society_id", societyId)
      .order("reading_date", { ascending: false });
    if (flatId) query = query.eq("flat_id", flatId);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setReadings((data ?? []) as UtilityReading[]);
    }
    setLoading(false);
  }, [societyId, flatId]);

  useEffect(() => {
    load();
  }, [load]);

  return { readings, loading, error, reload: load, setReadings };
}

// ==========================================
// PARKING
// ==========================================
export function useParking(societyId: string | null) {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("society_id", societyId)
      .order("slot_number", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setSlots((data ?? []) as ParkingSlot[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { slots, loading, error, reload: load, setSlots };
}

// ==========================================
// DOMESTIC STAFF
// ==========================================
export function useDomesticStaff(societyId: string | null) {
  const [staff, setStaff] = useState<DomesticStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("domestic_staff")
      .select("*")
      .eq("society_id", societyId)
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setStaff((data ?? []) as DomesticStaff[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { staff, loading, error, reload: load, setStaff };
}

// ==========================================
// CONDITION PASSPORTS
// ==========================================
export function useConditionPassports(societyId: string | null) {
  const [passports, setPassports] = useState<ConditionPassport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("condition_passports")
      .select("*")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPassports((data ?? []) as ConditionPassport[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { passports, loading, error, reload: load, setPassports };
}

// ==========================================
// PROCUREMENT
// ==========================================
export function useProcurement(societyId: string | null) {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("procurement_requests")
      .select("*")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setRequests((data ?? []) as ProcurementRequest[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { requests, loading, error, reload: load, setRequests };
}

// ==========================================
// AGM SESSIONS
// ==========================================
export function useAGM(societyId: string | null) {
  const [sessions, setSessions] = useState<AGMSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("agm_sessions")
      .select("*")
      .eq("society_id", societyId)
      .order("meeting_date", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setSessions((data ?? []) as AGMSession[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, error, reload: load, setSessions };
}

// ==========================================
// COMPLIANCE
// ==========================================
export function useCompliance(societyId: string | null) {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("compliance_records")
      .select("*")
      .eq("society_id", societyId)
      .order("expiry_date", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setRecords((data ?? []) as ComplianceRecord[]);
    }
    setLoading(false);
  }, [societyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { records, loading, error, reload: load, setRecords };
}

// ==========================================
// WALLET HOOKS
// ==========================================
export function useWallet() {
  const { user, role } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!walletError && walletData) {
        const w = walletData as Wallet;
        setWallet(w);

        const { data: txData, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", w.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!txError && txData) {
          setTransactions(txData as WalletTransaction[]);
        }
        setLoading(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    const localW = getOrCreateLocalWallet(user.id, role ?? undefined);
    setWallet(localW);
    const localTxs = getLocalWalletTransactions(localW.id);
    setTransactions(localTxs);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  async function topUp(amount: number) {
    if (!wallet) return { error: "No wallet found." };

    try {
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "credit",
          amount,
          purpose: "topup",
          description: `Wallet top-up of ₹${amount.toLocaleString("en-IN")}`,
          status: "completed",
        });

      const { error: balError } = await supabase
        .from("wallets")
        .update({
          balance: wallet.balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (!txError && !balError) {
        await load();
        return { error: null };
      }
    } catch {
      // Remote fallback
    }

    updateLocalWalletBalance(wallet.id, wallet.balance + amount);
    recordLocalWalletTransaction({
      wallet_id: wallet.id,
      type: "credit",
      amount,
      purpose: "topup",
      reference_id: "TOPUP_" + Date.now().toString().slice(-6),
      description: `Wallet top-up of ₹${amount.toLocaleString("en-IN")}`,
      status: "completed",
    });
    await load();
    return { error: null };
  }

  async function payFromWallet(
    amount: number,
    purpose: WalletTransactionPurpose = "rent_payment",
    referenceId?: string,
    description?: string,
  ) {
    if (!wallet) return { error: "No wallet found." };
    if (wallet.balance < amount) return { error: "Insufficient balance." };

    try {
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "debit",
          amount,
          purpose,
          reference_id: referenceId || null,
          description:
            description || `Payment of ₹${amount.toLocaleString("en-IN")}`,
          status: "completed",
        });

      const { error: balError } = await supabase
        .from("wallets")
        .update({
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (!txError && !balError) {
        await load();
        return { error: null };
      }
    } catch {
      // Remote fallback
    }

    updateLocalWalletBalance(wallet.id, wallet.balance - amount);
    recordLocalWalletTransaction({
      wallet_id: wallet.id,
      type: "debit",
      amount,
      purpose,
      reference_id: referenceId || null,
      description: description || `Payment of ₹${amount.toLocaleString("en-IN")}`,
      status: "completed",
    });
    if (referenceId && purpose === "rent_payment") {
      updateLocalInvoiceStatus(referenceId, "paid");
    }
    await load();
    return { error: null };
  }

  return {
    wallet,
    transactions,
    loading,
    error,
    reload: load,
    topUp,
    payFromWallet,
  };
}

// ==========================================
// BUILDING REGISTRATIONS
// ==========================================
export function useBuildingRegistrations() {
  const { user, role } = useAuth();
  const [registrations, setRegistrations] = useState<BuildingRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("building_registrations")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (role !== "admin") {
        query = query.eq("owner_id", user.id);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setRegistrations(data as BuildingRegistration[]);
        setLoading(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    const localRegs = getLocalBuildingRegistrations();
    const filtered =
      role === "admin"
        ? localRegs
        : localRegs.filter((r) => r.owner_id === user.id);
    setRegistrations(filtered);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { registrations, loading, error, reload: load, setRegistrations };
}

// ==========================================
// ADMIN: ALL USER PROFILES
// ==========================================
export function useAllUsers() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (role !== "admin") return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setUsers(data as UserProfile[]);
        setLoading(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    setUsers(getLocalProfiles());
    setLoading(false);
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, error, reload: load };
}
