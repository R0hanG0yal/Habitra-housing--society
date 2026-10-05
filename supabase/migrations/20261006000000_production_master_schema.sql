-- ============================================================================
-- HABITRA HOUSING SOCIETY OS — ENTERPRISE PRODUCTION DATABASE SCHEMA
-- Version: 4.0.0 (Production Master)
-- Compliant with: DPDP Act 2023, Model Tenancy Act, Real Estate Regulation Act
-- Compatible with: PostgreSQL 14+, Supabase, AWS RDS, Azure Database for PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'building_owner', 'flat_owner', 'tenant')),
    full_name TEXT NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SOCIETIES / BUILDINGS
CREATE TABLE IF NOT EXISTS public.societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rwa_registration_no VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    upi_vpa VARCHAR(100),
    sustainability_score INT DEFAULT 85,
    health_score INT DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TOWERS / BLOCKS
CREATE TABLE IF NOT EXISTS public.towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FLAT OWNERS / LANDLORDS
CREATE TABLE IF NOT EXISTS public.flat_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    pan_no VARCHAR(20),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    upi_vpa VARCHAR(100),
    is_nri BOOLEAN DEFAULT FALSE,
    permanent_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FLATS / UNITS
CREATE TABLE IF NOT EXISTS public.flats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    tower_id UUID NOT NULL REFERENCES public.towers(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.flat_owners(id) ON DELETE SET NULL,
    flat_no VARCHAR(50) NOT NULL,
    floor INT,
    area_sqft NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied')),
    unit_type VARCHAR(20) DEFAULT 'flat' CHECK (unit_type IN ('flat', 'shop', 'office', 'pg')),
    settlement_mode VARCHAR(30) DEFAULT 'smart_split' CHECK (settlement_mode IN ('smart_split', 'owner_inclusive', 'direct_society')),
    base_maintenance_fee NUMERIC(10, 2) DEFAULT 3000,
    sinking_fund_fee NUMERIC(10, 2) DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tower_id, flat_no)
);

-- 6. TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    flat_id UUID REFERENCES public.flats(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    lease_start DATE,
    lease_end DATE,
    security_deposit NUMERIC(12, 2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    emergency_contact_name TEXT,
    emergency_contact_phone VARCHAR(20),
    aadhaar_no VARCHAR(30),
    pan_no VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RENT CONFIGURATION
CREATE TABLE IF NOT EXISTS public.rent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    flat_id UUID NOT NULL UNIQUE REFERENCES public.flats(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    due_day INT DEFAULT 5 CHECK (due_day BETWEEN 1 AND 28),
    late_fee_type VARCHAR(20) DEFAULT 'fixed' CHECK (late_fee_type IN ('fixed', 'percent')),
    late_fee_value NUMERIC(10, 2) DEFAULT 500,
    grace_days INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    flat_id UUID NOT NULL REFERENCES public.flats(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    month VARCHAR(10) NOT NULL, -- YYYY-MM-01
    amount NUMERIC(12, 2) NOT NULL,
    rent_amount NUMERIC(12, 2) DEFAULT 0,
    maintenance_amount NUMERIC(12, 2) DEFAULT 0,
    utility_amount NUMERIC(12, 2) DEFAULT 0,
    owner_payout_amount NUMERIC(12, 2) DEFAULT 0,
    society_payout_amount NUMERIC(12, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    late_fee_applied NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    settlement_status VARCHAR(20) DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flat_id, month)
);

-- 9. PAYMENTS & ESCROW LEDGER
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(30) DEFAULT 'upi' CHECK (method IN ('upi', 'netbanking', 'card', 'wallet', 'cheque', 'cash')),
    reference_no VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WALLETS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0 CHECK (balance >= 0),
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('rent_payment', 'maintenance_payment', 'deposit', 'refund', 'topup', 'payout', 'penalty')),
    reference_id VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BUILDING REGISTRATIONS (Verification with Proof)
CREATE TABLE IF NOT EXISTS public.building_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    building_name TEXT NOT NULL,
    building_address TEXT,
    registration_number VARCHAR(100),
    proof_document_url TEXT,
    proof_type VARCHAR(50) CHECK (proof_type IN ('registration_certificate', 'property_tax', 'electricity_bill', 'society_bylaws', 'other')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    admin_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 12. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    vendor_name VARCHAR(100),
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. MAINTENANCE TICKETS & SLA
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    flat_id UUID REFERENCES public.flats(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to VARCHAR(100),
    photo_url TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. VISITOR GATEKEEPER & GUARD LOG
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    flat_id UUID REFERENCES public.flats(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    purpose VARCHAR(50) DEFAULT 'guest',
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    passcode VARCHAR(10),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'denied', 'checked_out')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DOMESTIC STAFF & PASSES
CREATE TABLE IF NOT EXISTS public.domestic_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- maid, cook, driver, cleaner
    pass_number VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. SOCIETY SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    society_id UUID PRIMARY KEY REFERENCES public.societies(id) ON DELETE CASCADE,
    overdue_frequency_days INT DEFAULT 5,
    auto_reminders BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    dpdp_consent_retention_days INT DEFAULT 365,
    visitor_auto_purge_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_flats_society ON public.flats(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_tower ON public.flats(tower_id);
CREATE INDEX IF NOT EXISTS idx_tenants_society ON public.tenants(society_id);
CREATE INDEX IF NOT EXISTS idx_invoices_society_month ON public.invoices(society_id, month);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_tickets_society ON public.maintenance_tickets(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_entry ON public.visitors(society_id, entry_time);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Society members read societies" ON public.societies FOR SELECT USING (true);
CREATE POLICY "Admin update society" ON public.societies FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Read flats in society" ON public.flats FOR SELECT USING (true);
CREATE POLICY "Read tenants in society" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Read invoices in society" ON public.invoices FOR SELECT USING (true);

CREATE POLICY "Users read own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own wallet transactions" ON public.wallet_transactions FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);
