# Habitra — Residential Operating System

An end-to-end housing society and property management operating system with role-based access control (RBAC), proof-backed building registrations, an automated escrow wallet, and offline-first local persistence.

---

## Key Features

- **Strict Role-Based Access Control (RBAC)**
  - **Tenants**: Dedicated tenant dashboard, active lease information, parking slot management, 1-click rent payment from wallet, and maintenance ticket tracking.
  - **Flat Owners**: Unit portfolio overview, rental yield analysis, tenant lease visibility, and direct bank payout withdrawals.
  - **Building Owners / Society Admins**: Full tower and flat inventory, resident rosters, utility meters, digital twin assets, statutory compliance, AGM governance, and vendor expense approvals.
  - **Super Admins**: Dedicated `/admin` console for user management and building verification review.

- **Automated Escrow Wallet System (`/wallet`)**
  - Instant top-up and seamless 1-click rent deduction.
  - Rental distributions to flat owners with bank account withdrawal.
  - Society maintenance and vendor payout processing.
  - Complete double-entry ledger with real-time balance tracking.

- **Building Registration with Ownership Proof (`/register-building`)**
  - Building owners register societies with official ownership proof (Property Tax Receipts, Bye-Laws, Electricity Bills, or Sanction Plans).
  - Multi-tier verification pipeline (`pending` ➔ `verified` ➔ `rejected`).
  - Join code system allowing residents to attach to verified societies.

- **Offline-First & Cloud-Ready Architecture**
  - Built-in persistent browser storage engine (`localStore.ts`) ensures full offline functionality even without active internet or database connections.
  - Seamless fallback to local storage if remote database is unreachable.
  - Ready for cloud deployment via Supabase.

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Tailwind CSS (Burgundy `#722F37`, Latte `#E8DCC6`, Mocha Cream `#B7A89A`, Charcoal `#2E1A11`)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) for rent receipts, HRA receipts, and maintenance bills
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/R0hanG0yal/Habitra-housing--society.git
cd Habitra-housing--society
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env` to connect your cloud Supabase database:
```bash
cp .env.example .env
```
*(If no Supabase credentials are provided, Habitra automatically operates in resilient local storage mode).*

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 5. Typecheck & Build
```bash
npm run typecheck
npm run build
```

---

## Database Migrations

SQL migrations for tables (`user_profiles`, `building_registrations`, `wallets`, `wallet_transactions`, etc.) and Row Level Security (RLS) policies are located in:
```
supabase/migrations/
```

---

## License

MIT License. Designed and built for modern residential communities.
