/*
# Habitra v4 — Role-Based Access Control, Wallets & Building Registration

## Overview
1. User Profiles with roles (admin, building_owner, flat_owner, tenant)
2. Wallet system for rent & maintenance payments
3. Building registration with proof verification
4. Updated RLS policies for role-based data access
*/

-- 1. User Profiles with Roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'tenant' CHECK (role IN ('admin','building_owner','flat_owner','tenant')),
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own profile
DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
CREATE POLICY "users_read_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (id = auth.uid());

-- Admins can read all profiles
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;
CREATE POLICY "admins_read_all_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Users can insert their own profile (on signup)
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
CREATE POLICY "users_insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
CREATE POLICY "users_update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());

-- Admins can update any profile (for verification, role changes)
DROP POLICY IF EXISTS "admins_update_all_profiles" ON user_profiles;
CREATE POLICY "admins_update_all_profiles" ON user_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- 2. Building Registrations (proof verification)
CREATE TABLE IF NOT EXISTS building_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  building_name text NOT NULL,
  building_address text,
  registration_number text,
  proof_document_url text,
  proof_type text CHECK (proof_type IN ('registration_certificate','property_tax','electricity_bill','society_bylaws','other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  admin_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE building_registrations ENABLE ROW LEVEL SECURITY;

-- Building owners can see their own registrations
DROP POLICY IF EXISTS "owners_read_own_registrations" ON building_registrations;
CREATE POLICY "owners_read_own_registrations" ON building_registrations FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

-- Admins can see all registrations
DROP POLICY IF EXISTS "admins_read_all_registrations" ON building_registrations;
CREATE POLICY "admins_read_all_registrations" ON building_registrations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Building owners can submit registrations
DROP POLICY IF EXISTS "owners_insert_registrations" ON building_registrations;
CREATE POLICY "owners_insert_registrations" ON building_registrations FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

-- Admins can update registrations (approve/reject)
DROP POLICY IF EXISTS "admins_update_registrations" ON building_registrations;
CREATE POLICY "admins_update_registrations" ON building_registrations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- 3. Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
DROP POLICY IF EXISTS "users_read_own_wallet" ON wallets;
CREATE POLICY "users_read_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Admins can read all wallets
DROP POLICY IF EXISTS "admins_read_all_wallets" ON wallets;
CREATE POLICY "admins_read_all_wallets" ON wallets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Users can create their own wallet
DROP POLICY IF EXISTS "users_insert_own_wallet" ON wallets;
CREATE POLICY "users_insert_own_wallet" ON wallets FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update their own wallet (for balance changes)
DROP POLICY IF EXISTS "users_update_own_wallet" ON wallets;
CREATE POLICY "users_update_own_wallet" ON wallets FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- 4. Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit','debit')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  purpose text NOT NULL CHECK (purpose IN ('rent_payment','maintenance_payment','deposit','refund','topup','payout','penalty')),
  reference_id text,
  description text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
DROP POLICY IF EXISTS "users_read_own_transactions" ON wallet_transactions;
CREATE POLICY "users_read_own_transactions" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_transactions.wallet_id AND w.user_id = auth.uid())
  );

-- Admins can read all transactions
DROP POLICY IF EXISTS "admins_read_all_transactions" ON wallet_transactions;
CREATE POLICY "admins_read_all_transactions" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Users can insert transactions for their own wallet
DROP POLICY IF EXISTS "users_insert_own_transactions" ON wallet_transactions;
CREATE POLICY "users_insert_own_transactions" ON wallet_transactions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_transactions.wallet_id AND w.user_id = auth.uid())
  );

-- 5. Link tenants and flat_owners to auth users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='user_id') THEN
    ALTER TABLE tenants ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Update societies to allow building_owner role access (not just admin_id)
-- Add additional RLS policies for flat_owners and tenants to access their relevant data

-- Tenants can read their own tenant record
DROP POLICY IF EXISTS "tenants_read_own_record" ON tenants;
CREATE POLICY "tenants_read_own_record" ON tenants FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Flat owners can read tenants in their flats
DROP POLICY IF EXISTS "flat_owners_read_their_tenants" ON tenants;
CREATE POLICY "flat_owners_read_their_tenants" ON tenants FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM flats f
      JOIN flat_owners fo ON fo.id = f.owner_id
      WHERE f.id = tenants.flat_id AND fo.user_id = auth.uid()
    )
  );

-- Flat owners can read their own flat_owner record
DROP POLICY IF EXISTS "flat_owners_read_own_record" ON flat_owners;
CREATE POLICY "flat_owners_read_own_record" ON flat_owners FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Tenants can read invoices for their flat
DROP POLICY IF EXISTS "tenants_read_own_invoices" ON invoices;
CREATE POLICY "tenants_read_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = invoices.tenant_id AND t.user_id = auth.uid()
    )
  );

-- Flat owners can read invoices for their flats
DROP POLICY IF EXISTS "flat_owners_read_flat_invoices" ON invoices;
CREATE POLICY "flat_owners_read_flat_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM flats f
      JOIN flat_owners fo ON fo.id = f.owner_id
      WHERE f.id = invoices.flat_id AND fo.user_id = auth.uid()
    )
  );

-- Tenants can read their flat info
DROP POLICY IF EXISTS "tenants_read_own_flat" ON flats;
CREATE POLICY "tenants_read_own_flat" ON flats FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tenants t WHERE t.flat_id = flats.id AND t.user_id = auth.uid()
    )
  );

-- Flat owners can read their own flats
DROP POLICY IF EXISTS "flat_owners_read_own_flats" ON flats;
CREATE POLICY "flat_owners_read_own_flats" ON flats FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM flat_owners fo WHERE fo.id = flats.owner_id AND fo.user_id = auth.uid()
    )
  );

-- Tenants can submit maintenance tickets
DROP POLICY IF EXISTS "tenants_insert_tickets" ON maintenance_tickets;
CREATE POLICY "tenants_insert_tickets" ON maintenance_tickets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = maintenance_tickets.tenant_id AND t.user_id = auth.uid()
    )
  );

-- Tenants can read their own tickets
DROP POLICY IF EXISTS "tenants_read_own_tickets" ON maintenance_tickets;
CREATE POLICY "tenants_read_own_tickets" ON maintenance_tickets FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = maintenance_tickets.tenant_id AND t.user_id = auth.uid()
    )
  );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_building_registrations_owner ON building_registrations(owner_id);
CREATE INDEX IF NOT EXISTS idx_building_registrations_status ON building_registrations(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_flat_owners_user_id ON flat_owners(user_id);
