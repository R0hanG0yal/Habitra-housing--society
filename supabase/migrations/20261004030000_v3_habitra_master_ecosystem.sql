/*
# Habitra v3 — Master Operating Layer for Residential Communities & Rental Ecosystems

## Overview
Adds complete data model for:
1. Flat Owners (Landlords) & Tri-Party SmartSplit configuration
2. Society Digital Twin Assets (lifts, DG sets, pumps, solar, STP/WTP)
3. Sub-Meter Utility Telemetry (Water, DG backup, EV charging)
4. Digital Condition Passports (Move-In / Move-Out room-by-room audit & deposit escrow)
5. Advanced Parking Management (Slots, permits, EV, marketplace)
6. Domestic Staff & Service Workers (Maids, drivers, cooks, multi-flat passes)
7. Procurement Tenders & Vendor Quotations
8. Digital AGM & Governance (Quorum, resolutions, proxy, approved minutes)
9. Statutory Health & Safety Compliance Calendar
10. SmartSplit Invoicing breakdown (Rent, Maintenance, Utility, Payout statuses)
*/

-- 1. Societies additions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='rwa_registration_no') THEN
    ALTER TABLE societies ADD COLUMN rwa_registration_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='bank_account_no') THEN
    ALTER TABLE societies ADD COLUMN bank_account_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='bank_ifsc') THEN
    ALTER TABLE societies ADD COLUMN bank_ifsc text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='upi_vpa') THEN
    ALTER TABLE societies ADD COLUMN upi_vpa text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='sustainability_score') THEN
    ALTER TABLE societies ADD COLUMN sustainability_score int NOT NULL DEFAULT 78;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='societies' AND column_name='health_score') THEN
    ALTER TABLE societies ADD COLUMN health_score int NOT NULL DEFAULT 88;
  END IF;
END $$;

-- 2. Flat Owners (Landlords)
CREATE TABLE IF NOT EXISTS flat_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  pan_no text,
  bank_account_no text,
  bank_ifsc text,
  upi_vpa text,
  is_nri boolean NOT NULL DEFAULT false,
  permanent_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flat_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_flat_owners" ON flat_owners;
CREATE POLICY "select_own_flat_owners" ON flat_owners FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flat_owners.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_flat_owners" ON flat_owners;
CREATE POLICY "insert_own_flat_owners" ON flat_owners FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = flat_owners.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_flat_owners" ON flat_owners;
CREATE POLICY "update_own_flat_owners" ON flat_owners FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flat_owners.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_flat_owners" ON flat_owners;
CREATE POLICY "delete_own_flat_owners" ON flat_owners FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flat_owners.society_id AND societies.admin_id = auth.uid()));

-- 3. Flats additions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flats' AND column_name='owner_id') THEN
    ALTER TABLE flats ADD COLUMN owner_id uuid REFERENCES flat_owners(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flats' AND column_name='settlement_mode') THEN
    ALTER TABLE flats ADD COLUMN settlement_mode text NOT NULL DEFAULT 'smart_split'
      CHECK (settlement_mode IN ('smart_split', 'owner_inclusive', 'direct_society'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flats' AND column_name='base_maintenance_fee') THEN
    ALTER TABLE flats ADD COLUMN base_maintenance_fee numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flats' AND column_name='sinking_fund_fee') THEN
    ALTER TABLE flats ADD COLUMN sinking_fund_fee numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 4. Invoices additions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='rent_amount') THEN
    ALTER TABLE invoices ADD COLUMN rent_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='maintenance_amount') THEN
    ALTER TABLE invoices ADD COLUMN maintenance_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='utility_amount') THEN
    ALTER TABLE invoices ADD COLUMN utility_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='owner_payout_amount') THEN
    ALTER TABLE invoices ADD COLUMN owner_payout_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='society_payout_amount') THEN
    ALTER TABLE invoices ADD COLUMN society_payout_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='settlement_status') THEN
    ALTER TABLE invoices ADD COLUMN settlement_status text NOT NULL DEFAULT 'pending'
      CHECK (settlement_status IN ('pending', 'split_settled', 'owner_settled', 'society_direct'));
  END IF;
END $$;

-- 5. Digital Twin Assets
CREATE TABLE IF NOT EXISTS society_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  tower_id uuid REFERENCES towers(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('lift','dg_set','water_pump','stp','wtp','solar','fire_safety','ev_charger','clubhouse','other')),
  location text,
  installation_date date,
  expected_lifespan_years int DEFAULT 15,
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent','good','fair','critical','maintenance_due')),
  amc_vendor_name text,
  amc_vendor_phone text,
  amc_expiry_date date,
  last_serviced_date date,
  annual_cost numeric(12,2) DEFAULT 0,
  telemetry_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE society_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_society_assets" ON society_assets;
CREATE POLICY "select_own_society_assets" ON society_assets FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = society_assets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_society_assets" ON society_assets;
CREATE POLICY "insert_own_society_assets" ON society_assets FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = society_assets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_society_assets" ON society_assets;
CREATE POLICY "update_own_society_assets" ON society_assets FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = society_assets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_society_assets" ON society_assets;
CREATE POLICY "delete_own_society_assets" ON society_assets FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = society_assets.society_id AND societies.admin_id = auth.uid()));

-- 6. Utility Sub-Meter Readings
CREATE TABLE IF NOT EXISTS utility_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  utility_type text NOT NULL CHECK (utility_type IN ('water','dg_power','ev_charging')),
  previous_reading numeric(12,2) NOT NULL DEFAULT 0,
  current_reading numeric(12,2) NOT NULL,
  consumption_units numeric(12,2) NOT NULL DEFAULT 0,
  rate_per_unit numeric(8,2) NOT NULL DEFAULT 0,
  total_charge numeric(12,2) NOT NULL DEFAULT 0,
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  photo_url text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_utility_readings" ON utility_readings;
CREATE POLICY "select_own_utility_readings" ON utility_readings FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = utility_readings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_utility_readings" ON utility_readings;
CREATE POLICY "insert_own_utility_readings" ON utility_readings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = utility_readings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_utility_readings" ON utility_readings;
CREATE POLICY "update_own_utility_readings" ON utility_readings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = utility_readings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_utility_readings" ON utility_readings;
CREATE POLICY "delete_own_utility_readings" ON utility_readings FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = utility_readings.society_id AND societies.admin_id = auth.uid()));

-- 7. Digital Condition Passports
CREATE TABLE IF NOT EXISTS condition_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  passport_type text NOT NULL CHECK (passport_type IN ('move_in', 'move_out')),
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  checklist_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  meter_snapshots jsonb NOT NULL DEFAULT '{}'::jsonb,
  inspector_name text,
  tenant_signature text,
  owner_signature text,
  damage_deduction_amount numeric(12,2) DEFAULT 0,
  deduction_notes text,
  society_noc_issued boolean NOT NULL DEFAULT false,
  gate_pass_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE condition_passports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_condition_passports" ON condition_passports;
CREATE POLICY "select_own_condition_passports" ON condition_passports FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = condition_passports.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_condition_passports" ON condition_passports;
CREATE POLICY "insert_own_condition_passports" ON condition_passports FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = condition_passports.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_condition_passports" ON condition_passports;
CREATE POLICY "update_own_condition_passports" ON condition_passports FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = condition_passports.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_condition_passports" ON condition_passports;
CREATE POLICY "delete_own_condition_passports" ON condition_passports FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = condition_passports.society_id AND societies.admin_id = auth.uid()));

-- 8. Advanced Parking Slots
CREATE TABLE IF NOT EXISTS parking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  slot_number text NOT NULL,
  slot_type text NOT NULL DEFAULT 'covered' CHECK (slot_type IN ('covered','open','stilt','ev_equipped','two_wheeler')),
  assigned_flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  vehicle_reg_no text,
  is_ev boolean NOT NULL DEFAULT false,
  current_status text NOT NULL DEFAULT 'available' CHECK (current_status IN ('available','occupied','reserved_visitor','marketplace_listed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_parking_slots" ON parking_slots;
CREATE POLICY "select_own_parking_slots" ON parking_slots FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = parking_slots.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_parking_slots" ON parking_slots;
CREATE POLICY "insert_own_parking_slots" ON parking_slots FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = parking_slots.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_parking_slots" ON parking_slots;
CREATE POLICY "update_own_parking_slots" ON parking_slots FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = parking_slots.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_parking_slots" ON parking_slots;
CREATE POLICY "delete_own_parking_slots" ON parking_slots FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = parking_slots.society_id AND societies.admin_id = auth.uid()));

-- 9. Domestic Staff & Service Workers
CREATE TABLE IF NOT EXISTS domestic_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('maid','cook','driver','cleaner','nanny','gardener','other')),
  phone text,
  aadhaar_masked text,
  police_verified boolean NOT NULL DEFAULT false,
  emergency_phone text,
  qr_pass_code text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  rating numeric(3,2) DEFAULT 5.0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE domestic_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_domestic_staff" ON domestic_staff;
CREATE POLICY "select_own_domestic_staff" ON domestic_staff FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = domestic_staff.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_domestic_staff" ON domestic_staff;
CREATE POLICY "insert_own_domestic_staff" ON domestic_staff FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = domestic_staff.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_domestic_staff" ON domestic_staff;
CREATE POLICY "update_own_domestic_staff" ON domestic_staff FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = domestic_staff.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_domestic_staff" ON domestic_staff;
CREATE POLICY "delete_own_domestic_staff" ON domestic_staff FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = domestic_staff.society_id AND societies.admin_id = auth.uid()));

-- 10. Staff Flat Allocations
CREATE TABLE IF NOT EXISTS staff_flat_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES domestic_staff(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  working_hours text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE staff_flat_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_staff_flat_allocations" ON staff_flat_allocations;
CREATE POLICY "select_own_staff_flat_allocations" ON staff_flat_allocations FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_staff_flat_allocations" ON staff_flat_allocations;
CREATE POLICY "insert_own_staff_flat_allocations" ON staff_flat_allocations FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_staff_flat_allocations" ON staff_flat_allocations;
CREATE POLICY "delete_own_staff_flat_allocations" ON staff_flat_allocations FOR DELETE
  TO authenticated USING (true);

-- 11. Procurement Requests
CREATE TABLE IF NOT EXISTS procurement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_budget numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'rfq_open' CHECK (status IN ('rfq_open','evaluating','approved','po_issued','completed')),
  bids jsonb DEFAULT '[]'::jsonb,
  winning_vendor_name text,
  approved_amount numeric(12,2),
  committee_votes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE procurement_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_procurement_requests" ON procurement_requests;
CREATE POLICY "select_own_procurement_requests" ON procurement_requests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = procurement_requests.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_procurement_requests" ON procurement_requests;
CREATE POLICY "insert_own_procurement_requests" ON procurement_requests FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = procurement_requests.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_procurement_requests" ON procurement_requests;
CREATE POLICY "update_own_procurement_requests" ON procurement_requests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = procurement_requests.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_procurement_requests" ON procurement_requests;
CREATE POLICY "delete_own_procurement_requests" ON procurement_requests FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = procurement_requests.society_id AND societies.admin_id = auth.uid()));

-- 12. Digital AGM & Governance
CREATE TABLE IF NOT EXISTS agm_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  meeting_type text NOT NULL DEFAULT 'agm' CHECK (meeting_type IN ('agm','egm','committee')),
  meeting_date timestamptz NOT NULL,
  notice_issued_at timestamptz NOT NULL DEFAULT now(),
  agenda text[] NOT NULL DEFAULT '{}',
  quorum_target int NOT NULL DEFAULT 50,
  quorum_achieved int NOT NULL DEFAULT 0,
  resolutions jsonb DEFAULT '[]'::jsonb,
  meeting_minutes text,
  approved_by_president boolean NOT NULL DEFAULT false,
  approved_by_secretary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agm_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_agm_sessions" ON agm_sessions;
CREATE POLICY "select_own_agm_sessions" ON agm_sessions FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = agm_sessions.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_agm_sessions" ON agm_sessions;
CREATE POLICY "insert_own_agm_sessions" ON agm_sessions FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = agm_sessions.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_agm_sessions" ON agm_sessions;
CREATE POLICY "update_own_agm_sessions" ON agm_sessions FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = agm_sessions.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_agm_sessions" ON agm_sessions;
CREATE POLICY "delete_own_agm_sessions" ON agm_sessions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = agm_sessions.society_id AND societies.admin_id = auth.uid()));

-- 13. Health & Safety Statutory Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('fire_safety','lift_license','dg_emission','water_potability','stp_discharge','structural_audit','other')),
  issued_date date,
  expiry_date date NOT NULL,
  authority_name text,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','expiring_soon','expired')),
  document_url text,
  responsible_person text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_compliance_records" ON compliance_records;
CREATE POLICY "select_own_compliance_records" ON compliance_records FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = compliance_records.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_compliance_records" ON compliance_records;
CREATE POLICY "insert_own_compliance_records" ON compliance_records FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = compliance_records.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_compliance_records" ON compliance_records;
CREATE POLICY "update_own_compliance_records" ON compliance_records FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = compliance_records.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_compliance_records" ON compliance_records;
CREATE POLICY "delete_own_compliance_records" ON compliance_records FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = compliance_records.society_id AND societies.admin_id = auth.uid()));

-- 14. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_flat_owners_society ON flat_owners(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_owner ON flats(owner_id);
CREATE INDEX IF NOT EXISTS idx_society_assets_society ON society_assets(society_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_flat ON utility_readings(flat_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_society ON utility_readings(society_id);
CREATE INDEX IF NOT EXISTS idx_condition_passports_flat ON condition_passports(flat_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_society ON parking_slots(society_id);
CREATE INDEX IF NOT EXISTS idx_domestic_staff_society ON domestic_staff(society_id);
CREATE INDEX IF NOT EXISTS idx_procurement_society ON procurement_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_agm_sessions_society ON agm_sessions(society_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_society ON compliance_records(society_id);
