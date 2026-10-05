export type Society = {
  id: string;
  name: string;
  address: string | null;
  admin_id: string;
  rwa_registration_no?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  upi_vpa?: string | null;
  sustainability_score?: number;
  health_score?: number;
  created_at: string;
};
export type Tower = {
  id: string;
  society_id: string;
  name: string;
  created_at: string;
};
export type UnitType = "flat" | "shop" | "office" | "pg";
export type SettlementMode =
  "smart_split" | "owner_inclusive" | "direct_society";
export type FlatOwner = {
  id: string;
  society_id: string;
  user_id?: string | null;
  name: string;
  phone: string;
  email: string | null;
  pan_no: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  upi_vpa: string | null;
  is_nri: boolean;
  permanent_address: string | null;
  created_at: string;
};
export type Flat = {
  id: string;
  tower_id: string;
  society_id: string;
  owner_id?: string | null;
  flat_no: string;
  floor: number | null;
  area_sqft: number | null;
  status: "vacant" | "occupied";
  unit_type: UnitType;
  settlement_mode: SettlementMode;
  base_maintenance_fee: number;
  sinking_fund_fee: number;
  created_at: string;
};
export type Tenant = {
  id: string;
  flat_id: string | null;
  society_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lease_start: string | null;
  lease_end: string | null;
  security_deposit: number;
  active: boolean;
  whatsapp_opt_in: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  aadhaar_no: string | null;
  pan_no: string | null;
  created_at: string;
};
export type RentConfig = {
  id: string;
  flat_id: string;
  society_id: string;
  amount: number;
  due_day: number;
  late_fee_type: "fixed" | "percent";
  late_fee_value: number;
  grace_days: number;
};
export type InvoiceStatus = "pending" | "paid" | "partial" | "overdue";
export type SettlementStatus =
  "pending" | "split_settled" | "owner_settled" | "society_direct";
export type Invoice = {
  id: string;
  flat_id: string;
  society_id: string;
  tenant_id: string | null;
  month: string;
  amount: number;
  rent_amount?: number;
  maintenance_amount?: number;
  utility_amount?: number;
  owner_payout_amount?: number;
  society_payout_amount?: number;
  settlement_status?: SettlementStatus;
  due_date: string;
  late_fee_applied: number;
  status: InvoiceStatus;
  created_at: string;
};
export type PaymentMode = "cash" | "bank" | "cheque" | "upi" | "online";
export type PaymentAppliesTo = "rent" | "advance" | "maintenance" | "split";
export type Payment = {
  id: string;
  invoice_id: string;
  society_id: string;
  amount: number;
  mode: PaymentMode;
  reference_no: string | null;
  paid_on: string;
  recorded_by: string | null;
  applies_to: PaymentAppliesTo;
  advance_months: number;
  created_at: string;
};
export type ReminderLog = {
  id: string;
  invoice_id: string | null;
  society_id: string;
  type: string;
  sent_on: string;
  channel: string;
  status: string;
  message: string | null;
};
export type Settings = {
  id: string;
  society_id: string;
  invoice_template: string;
  reminder_template: string;
  overdue_template: string;
  receipt_template: string;
  reminder_days_before: number;
  overdue_frequency_days: number;
  whatsapp_enabled: boolean;
  created_at: string;
};
export type AuditLog = {
  id: string;
  society_id: string;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
export type FlatWithRelations = Flat & {
  towers: Pick<Tower, "id" | "name"> | null;
  tenants: Tenant[] | null;
  owner?: FlatOwner | null;
  rent_config: RentConfig[] | null;
};
export type InvoiceFlat = Pick<
  Flat,
  | "id"
  | "flat_no"
  | "tower_id"
  | "settlement_mode"
  | "base_maintenance_fee"
  | "sinking_fund_fee"
> & {
  towers?: Pick<Tower, "id" | "name"> | null;
  owner?: Pick<
    FlatOwner,
    | "id"
    | "name"
    | "phone"
    | "pan_no"
    | "upi_vpa"
    | "bank_account_no"
    | "bank_ifsc"
  > | null;
};
export type InvoiceTenant = Pick<Tenant, "id" | "name" | "phone" | "email">;
export type InvoiceWithRelations = Invoice & {
  flats: InvoiceFlat | null;
  tenants: InvoiceTenant | null;
  payments: Payment[] | null;
};
export type PaymentWithRelations = Payment & {
  invoices:
    | (Pick<Invoice, "id" | "flat_id" | "month"> & {
        flats?: Pick<Flat, "id" | "flat_no"> | null;
      })
    | null;
};
export type ExpenseCategory =
  "maintenance" | "electricity" | "water" | "repairs" | "security" | "other";
export type Expense = {
  id: string;
  society_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
};
export type TicketCategory =
  | "water"
  | "electricity"
  | "plumbing"
  | "cleaning"
  | "security"
  | "lift"
  | "other";
export type TicketStatus = "open" | "assigned" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type MaintenanceTicket = {
  id: string;
  society_id: string;
  flat_id: string | null;
  tenant_id: string | null;
  title: string;
  category: TicketCategory;
  priority?: TicketPriority;
  description: string | null;
  status: TicketStatus;
  assigned_to: string | null;
  cost_estimate?: number | null;
  created_at: string;
  resolved_at: string | null;
};
export type MaintenanceTicketWithRelations = MaintenanceTicket & {
  flats: Pick<Flat, "id" | "flat_no"> | null;
  tenants: Pick<Tenant, "id" | "name"> | null;
};
export type Visitor = {
  id: string;
  society_id: string;
  flat_id: string | null;
  visitor_name: string;
  phone: string | null;
  purpose: string | null;
  check_in: string;
  check_out: string | null;
  created_at: string;
};
export type VisitorWithRelations = Visitor & {
  flats: Pick<Flat, "id" | "flat_no"> | null;
};
export type DocType =
  | "agreement"
  | "kyc"
  | "bill"
  | "property_paper"
  | "byelaws"
  | "agm_minutes"
  | "other";
export type DocumentRecord = {
  id: string;
  society_id: string;
  entity_type: "tenant" | "flat" | "society" | "asset";
  entity_id: string | null;
  doc_type: DocType;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
  created_at: string;
};

// ==========================================
export type AssetCategory = 'lift' | 'dg_set' | 'water_pump' | 'stp' | 'wtp' | 'solar' | 'fire_safety' | 'ev_charger' | 'clubhouse' | 'other';
export type AssetCondition =
  "excellent" | "good" | "fair" | "critical" | "maintenance_due";
export type SocietyAsset = {
  id: string;
  society_id: string;
  tower_id: string | null;
  name: string;
  category: AssetCategory;
  location: string | null;
  installation_date: string | null;
  expected_lifespan_years: number;
  condition: AssetCondition;
  amc_vendor_name: string | null;
  amc_vendor_phone: string | null;
  amc_expiry_date: string | null;
  last_serviced_date: string | null;
  annual_cost: number;
  telemetry_data?: Record<string, unknown> | null;
  created_at: string;
};
export type UtilityType = "water" | "dg_power" | "ev_charging";
export type UtilityReading = {
  id: string;
  society_id: string;
  flat_id: string;
  utility_type: UtilityType;
  previous_reading: number;
  current_reading: number;
  consumption_units: number;
  rate_per_unit: number;
  total_charge: number;
  reading_date: string;
  photo_url?: string | null;
  recorded_by?: string | null;
  invoice_id?: string | null;
  created_at: string;
};
export type ConditionPassport = {
  id: string;
  society_id: string;
  flat_id: string;
  tenant_id: string;
  passport_type: "move_in" | "move_out";
  inspection_date: string;
  checklist_data: {
    living_room?: string;
    kitchen?: string;
    bedrooms?: string;
    bathrooms?: string;
    fixtures_appliances?: string;
    keys_handed_over?: number;
    notes?: string;
  };
  meter_snapshots?: { water?: number; dg_power?: number };
  inspector_name?: string | null;
  tenant_signature?: string | null;
  owner_signature?: string | null;
  damage_deduction_amount?: number;
  deduction_notes?: string | null;
  society_noc_issued: boolean;
  gate_pass_token?: string | null;
  created_at: string;
};
export type ParkingSlotType =
  "covered" | "open" | "stilt" | "ev_equipped" | "two_wheeler";
export type ParkingStatus =
  "available" | "occupied" | "reserved_visitor" | "marketplace_listed";
export type ParkingSlot = {
  id: string;
  society_id: string;
  slot_number: string;
  slot_type: ParkingSlotType;
  assigned_flat_id: string | null;
  vehicle_reg_no: string | null;
  is_ev: boolean;
  current_status: ParkingStatus;
  created_at: string;
};
export type StaffRole =
  "maid" | "cook" | "driver" | "cleaner" | "nanny" | "gardener" | "other";
export type DomesticStaff = {
  id: string;
  society_id: string;
  name: string;
  role: StaffRole;
  phone: string | null;
  aadhaar_masked: string | null;
  police_verified: boolean;
  emergency_phone: string | null;
  qr_pass_code: string | null;
  is_active: boolean;
  rating: number;
  created_at: string;
};
export type ProcurementRequest = {
  id: string;
  society_id: string;
  title: string;
  description: string | null;
  estimated_budget: number;
  status: "rfq_open" | "evaluating" | "approved" | "po_issued" | "completed";
  bids: Array<{
    vendor_name: string;
    vendor_phone: string;
    quoted_amount: number;
    warranty_months: number;
    quote_date: string;
  }>;
  winning_vendor_name?: string | null;
  approved_amount?: number | null;
  committee_votes?: Record<string, string>;
  created_at: string;
};
export type AGMSession = {
  id: string;
  society_id: string;
  meeting_type: "agm" | "egm" | "committee";
  meeting_date: string;
  notice_issued_at: string;
  agenda: string[];
  quorum_target: number;
  quorum_achieved: number;
  resolutions: Array<{
    title: string;
    description: string;
    votes_in_favor: number;
    votes_against: number;
    passed: boolean;
  }>;
  meeting_minutes?: string | null;
  approved_by_president: boolean;
  approved_by_secretary: boolean;
  created_at: string;
};
export type ComplianceCategory =
  | "fire_safety"
  | "lift_license"
  | "dg_emission"
  | "water_potability"
  | "stp_discharge"
  | "structural_audit"
  | "other";
export type ComplianceRecord = {
  id: string;
  society_id: string;
  title: string;
  category: ComplianceCategory;
  issued_date: string | null;
  expiry_date: string;
  authority_name: string | null;
  status: "valid" | "expiring_soon" | "expired";
  document_url: string | null;
  responsible_person: string | null;
  created_at: string;
};

// Re-export role types
export type {
  UserRole,
  UserProfile,
  BuildingRegistration,
  Wallet,
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionPurpose,
  WalletTransactionStatus,
} from "./roles";
