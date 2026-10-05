/*
# Society Rent & Maintenance Collection — Core Schema

## Overview
Creates the full data model for managing societies, towers, flats, tenants,
rent configuration, monthly invoices, payments, WhatsApp reminders, settings,
and an audit log. Each admin owns one society (multi-society SaaS is a later
phase); all child tables carry society_id for straightforward RLS ownership
checks.

## New Tables
1. `societies` — top-level property owned by an authenticated admin.
2. `towers` — blocks/towers within a society.
3. `flats` — individual units.
4. `tenants` — residents assigned to a flat.
5. `rent_config` — per-flat monthly rent/maintenance rules.
6. `invoices` — monthly generated dues per flat.
7. `payments` — recorded payments against invoices.
8. `reminders_log` — log of WhatsApp reminders sent.
9. `settings` — per-society templates and rules.
10. `audit_log` — who did what.

## Security
- RLS enabled on every table.
- Owner-scoped CRUD: an authenticated admin can access only rows whose
  society_id belongs to a society they own (societies.admin_id = auth.uid()).
- Uses `TO authenticated` with ownership predicates. No anon access — this app
  has a sign-in screen.

## Notes
- All child tables duplicate society_id to keep ownership checks O(1).
- Idempotent statements (IF NOT EXISTS, DROP POLICY IF EXISTS).
- Amounts stored as numeric(12,2) for precise currency handling.
*/

-- societies
CREATE TABLE IF NOT EXISTS societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_society" ON societies;
CREATE POLICY "select_own_society" ON societies FOR SELECT
  TO authenticated USING (auth.uid() = admin_id);
DROP POLICY IF EXISTS "insert_own_society" ON societies;
CREATE POLICY "insert_own_society" ON societies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = admin_id);
DROP POLICY IF EXISTS "update_own_society" ON societies;
CREATE POLICY "update_own_society" ON societies FOR UPDATE
  TO authenticated USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
DROP POLICY IF EXISTS "delete_own_society" ON societies;
CREATE POLICY "delete_own_society" ON societies FOR DELETE
  TO authenticated USING (auth.uid() = admin_id);

-- towers
CREATE TABLE IF NOT EXISTS towers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE towers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_towers" ON towers;
CREATE POLICY "select_own_towers" ON towers FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = towers.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_towers" ON towers;
CREATE POLICY "insert_own_towers" ON towers FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = towers.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_towers" ON towers;
CREATE POLICY "update_own_towers" ON towers FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = towers.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = towers.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_towers" ON towers;
CREATE POLICY "delete_own_towers" ON towers FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = towers.society_id AND societies.admin_id = auth.uid()));

-- flats
CREATE TABLE IF NOT EXISTS flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_no text NOT NULL,
  floor int,
  area_sqft numeric(10,2),
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant','occupied')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_flats" ON flats;
CREATE POLICY "select_own_flats" ON flats FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flats.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_flats" ON flats;
CREATE POLICY "insert_own_flats" ON flats FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = flats.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_flats" ON flats;
CREATE POLICY "update_own_flats" ON flats FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flats.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = flats.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_flats" ON flats;
CREATE POLICY "delete_own_flats" ON flats FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = flats.society_id AND societies.admin_id = auth.uid()));

-- tenants
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  lease_start date,
  lease_end date,
  security_deposit numeric(12,2) DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  whatsapp_opt_in boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tenants" ON tenants;
CREATE POLICY "select_own_tenants" ON tenants FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = tenants.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_tenants" ON tenants;
CREATE POLICY "insert_own_tenants" ON tenants FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = tenants.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_tenants" ON tenants;
CREATE POLICY "update_own_tenants" ON tenants FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = tenants.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = tenants.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_tenants" ON tenants;
CREATE POLICY "delete_own_tenants" ON tenants FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = tenants.society_id AND societies.admin_id = auth.uid()));

-- rent_config
CREATE TABLE IF NOT EXISTS rent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_day int NOT NULL DEFAULT 5 CHECK (due_day BETWEEN 1 AND 28),
  late_fee_type text NOT NULL DEFAULT 'fixed' CHECK (late_fee_type IN ('fixed','percent')),
  late_fee_value numeric(12,2) NOT NULL DEFAULT 0,
  grace_days int NOT NULL DEFAULT 0
);
ALTER TABLE rent_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_rent_config" ON rent_config;
CREATE POLICY "select_own_rent_config" ON rent_config FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = rent_config.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_rent_config" ON rent_config;
CREATE POLICY "insert_own_rent_config" ON rent_config FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = rent_config.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_rent_config" ON rent_config;
CREATE POLICY "update_own_rent_config" ON rent_config FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = rent_config.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = rent_config.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_rent_config" ON rent_config;
CREATE POLICY "delete_own_rent_config" ON rent_config FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = rent_config.society_id AND societies.admin_id = auth.uid()));

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  month date NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  late_fee_applied numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','partial','overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flat_id, month)
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_invoices" ON invoices;
CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = invoices.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_invoices" ON invoices;
CREATE POLICY "insert_own_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = invoices.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_invoices" ON invoices;
CREATE POLICY "update_own_invoices" ON invoices FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = invoices.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = invoices.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_invoices" ON invoices;
CREATE POLICY "delete_own_invoices" ON invoices FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = invoices.society_id AND societies.admin_id = auth.uid()));

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'cash' CHECK (mode IN ('cash','bank','cheque','upi','online')),
  reference_no text,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = payments.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = payments.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = payments.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = payments.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = payments.society_id AND societies.admin_id = auth.uid()));

-- reminders_log
CREATE TABLE IF NOT EXISTS reminders_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  type text NOT NULL,
  sent_on timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'sent',
  message text
);
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_reminders" ON reminders_log;
CREATE POLICY "select_own_reminders" ON reminders_log FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = reminders_log.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_reminders" ON reminders_log;
CREATE POLICY "insert_own_reminders" ON reminders_log FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = reminders_log.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_reminders" ON reminders_log;
CREATE POLICY "delete_own_reminders" ON reminders_log FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = reminders_log.society_id AND societies.admin_id = auth.uid()));

-- settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL UNIQUE REFERENCES societies(id) ON DELETE CASCADE,
  invoice_template text NOT NULL DEFAULT 'Hello {tenant_name}, your rent invoice for {flat_no} for {month} is {amount}, due on {due_date}. - {society_name}',
  reminder_template text NOT NULL DEFAULT 'Reminder: {tenant_name}, your rent of {amount} for {flat_no} is due on {due_date}. Please pay on time. - {society_name}',
  overdue_template text NOT NULL DEFAULT 'URGENT: {tenant_name}, your rent of {amount} for {flat_no} is OVERDUE. Please pay immediately to avoid late fees. - {society_name}',
  receipt_template text NOT NULL DEFAULT 'Payment received: {amount} for {flat_no} on {paid_on}. Reference: {reference_no}. Thank you! - {society_name}',
  reminder_days_before int NOT NULL DEFAULT 3,
  overdue_frequency_days int NOT NULL DEFAULT 3,
  whatsapp_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = settings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = settings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = settings.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = settings.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = settings.society_id AND societies.admin_id = auth.uid()));

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_audit" ON audit_log;
CREATE POLICY "select_own_audit" ON audit_log FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = audit_log.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_audit" ON audit_log;
CREATE POLICY "insert_own_audit" ON audit_log FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = audit_log.society_id AND societies.admin_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flats_society ON flats(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_tower ON flats(tower_id);
CREATE INDEX IF NOT EXISTS idx_tenants_society ON tenants(society_id);
CREATE INDEX IF NOT EXISTS idx_tenants_flat ON tenants(flat_id);
CREATE INDEX IF NOT EXISTS idx_invoices_society ON invoices(society_id);
CREATE INDEX IF NOT EXISTS idx_invoices_flat_month ON invoices(flat_id, month);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_society ON payments(society_id);
CREATE INDEX IF NOT EXISTS idx_reminders_society ON reminders_log(society_id);
CREATE INDEX IF NOT EXISTS idx_audit_society ON audit_log(society_id);
