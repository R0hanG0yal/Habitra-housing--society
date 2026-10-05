/*
# RentCollect v2 — Multi-property, KYC, Expenses, Tickets, Visitors, Documents

## Overview
Extends the schema for Level 1–3 features: multiple properties, unit types
(flat/shop/office/pg), tenant KYC + emergency contact, advance payments,
expenses with profit analysis, maintenance tickets, visitor management, and a
document vault backed by Supabase Storage.

## Changes to existing tables
1. `flats` — add `unit_type` (flat|shop|office|pg), default 'flat'.
2. `tenants` — add `emergency_contact_name`, `emergency_contact_phone`,
   `aadhaar_no`, `pan_no`.
3. `payments` — add `applies_to` (rent|advance), `advance_months` (int).

## New tables
1. `expenses` — per-society expense tracking.
2. `maintenance_tickets` — tenant-raised issues.
3. `visitors` — guest/delivery entries.
4. `documents` — metadata for uploaded files (actual files in Supabase Storage).

## Security
- RLS enabled on every new table with owner-scoped CRUD.
- Storage bucket `documents` created with policies allowing authenticated owners
  to manage files for their own society (path prefixed by society id).

## Notes
- Idempotent (IF NOT EXISTS, DO $$ blocks, DROP POLICY IF EXISTS).
- File paths in storage are prefixed with the society id so storage RLS can
  scope access per society.
*/

-- flats: add unit_type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='flats' AND column_name='unit_type') THEN
    ALTER TABLE flats ADD COLUMN unit_type text NOT NULL DEFAULT 'flat'
      CHECK (unit_type IN ('flat','shop','office','pg'));
  END IF;
END $$;

-- tenants: add KYC + emergency contact
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='tenants' AND column_name='emergency_contact_name') THEN
    ALTER TABLE tenants ADD COLUMN emergency_contact_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='tenants' AND column_name='emergency_contact_phone') THEN
    ALTER TABLE tenants ADD COLUMN emergency_contact_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='tenants' AND column_name='aadhaar_no') THEN
    ALTER TABLE tenants ADD COLUMN aadhaar_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='tenants' AND column_name='pan_no') THEN
    ALTER TABLE tenants ADD COLUMN pan_no text;
  END IF;
END $$;

-- payments: add advance fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='applies_to') THEN
    ALTER TABLE payments ADD COLUMN applies_to text NOT NULL DEFAULT 'rent'
      CHECK (applies_to IN ('rent','advance'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='advance_months') THEN
    ALTER TABLE payments ADD COLUMN advance_months int NOT NULL DEFAULT 0;
  END IF;
END $$;

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('maintenance','electricity','water','repairs','security','other')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = expenses.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = expenses.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = expenses.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = expenses.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = expenses.society_id AND societies.admin_id = auth.uid()));

-- maintenance_tickets
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('water','electricity','plumbing','cleaning','security','other')),
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','resolved','closed')),
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tickets" ON maintenance_tickets;
CREATE POLICY "select_own_tickets" ON maintenance_tickets FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = maintenance_tickets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_tickets" ON maintenance_tickets;
CREATE POLICY "insert_own_tickets" ON maintenance_tickets FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = maintenance_tickets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_tickets" ON maintenance_tickets;
CREATE POLICY "update_own_tickets" ON maintenance_tickets FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = maintenance_tickets.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = maintenance_tickets.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_tickets" ON maintenance_tickets;
CREATE POLICY "delete_own_tickets" ON maintenance_tickets FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = maintenance_tickets.society_id AND societies.admin_id = auth.uid()));

-- visitors
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_id uuid REFERENCES flats(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  phone text,
  purpose text,
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_visitors" ON visitors;
CREATE POLICY "select_own_visitors" ON visitors FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = visitors.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_visitors" ON visitors;
CREATE POLICY "insert_own_visitors" ON visitors FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = visitors.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_visitors" ON visitors;
CREATE POLICY "update_own_visitors" ON visitors FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = visitors.society_id AND societies.admin_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = visitors.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_visitors" ON visitors;
CREATE POLICY "delete_own_visitors" ON visitors FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = visitors.society_id AND societies.admin_id = auth.uid()));

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'society' CHECK (entity_type IN ('tenant','flat','society')),
  entity_id uuid,
  doc_type text NOT NULL DEFAULT 'other' CHECK (doc_type IN ('agreement','kyc','bill','property_paper','other')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = documents.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM societies WHERE societies.id = documents.society_id AND societies.admin_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM societies WHERE societies.id = documents.society_id AND societies.admin_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_society ON expenses(society_id);
CREATE INDEX IF NOT EXISTS idx_tickets_society ON maintenance_tickets(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_society ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_documents_society ON documents(society_id);

-- Storage bucket for documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files stored under <society_id>/<filename> so RLS can scope per society
DROP POLICY IF EXISTS "Owner can upload documents" ON storage.objects;
CREATE POLICY "Owner can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM societies
      WHERE societies.admin_id = auth.uid()
      AND split_part(name, '/', 1) = societies.id::text
    )
  );

DROP POLICY IF EXISTS "Owner can read documents" ON storage.objects;
CREATE POLICY "Owner can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM societies
      WHERE societies.admin_id = auth.uid()
      AND split_part(name, '/', 1) = societies.id::text
    )
  );

DROP POLICY IF EXISTS "Owner can delete documents" ON storage.objects;
CREATE POLICY "Owner can delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM societies
      WHERE societies.admin_id = auth.uid()
      AND split_part(name, '/', 1) = societies.id::text
    )
  );
