import { useState, useMemo, type ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  UserCheck,
  FolderArchive,
  ChevronDown,
  Plus,
  TrendingDown,
  Cpu,
  Droplets,
  Car,
  ShieldCheck,
  FileCheck,
  ShoppingBag,
  Vote,
  CalendarCheck,
  Lock,
  Shield,
  CreditCard,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@/lib/router";
import { useWallet } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { AiAssistantModal } from "@/components/AiAssistantModal";
import { Logo } from "@/components/ui/Logo";
import { formatCurrency } from "@/lib/format";
import { getRoleLabel, type UserRole } from "@/lib/roles";

type NavCategory = {
  title: string;
  items: {
    label: string;
    path: string;
    icon: ReactNode;
    badge?: string;
  }[];
};

function getRoleNavCategories(role: UserRole | null): NavCategory[] {
  if (role === 'tenant') {
    return [
      {
        title: "My Home",
        items: [
          { label: "Dashboard", path: "/", icon: <LayoutDashboard size={17} /> },
          { label: "My Invoices & Rent", path: "/invoices", icon: <Receipt size={17} />, badge: "Rent" },
          { label: "Payment History", path: "/payments", icon: <CreditCard size={17} /> },
          { label: "Tenant Wallet", path: "/wallet", icon: <Wallet size={17} />, badge: "Pay" },
        ],
      },
      {
        title: "Services & Requests",
        items: [
          { label: "Maintenance Tickets", path: "/maintenance", icon: <Wrench size={17} /> },
          { label: "Assigned Parking", path: "/parking", icon: <Car size={17} /> },
          { label: "Society Notices & Bylaws", path: "/documents", icon: <FolderArchive size={17} /> },
          { label: "My Profile Settings", path: "/settings", icon: <Settings size={17} /> },
        ],
      },
    ];
  }

  if (role === 'flat_owner') {
    return [
      {
        title: "My Real Estate",
        items: [
          { label: "Owner Dashboard", path: "/", icon: <LayoutDashboard size={17} /> },
          { label: "My Units & Flats", path: "/flats", icon: <Home size={17} /> },
          { label: "Tenants & Leases", path: "/tenants", icon: <Users size={17} /> },
          { label: "Invoices & Dues", path: "/invoices", icon: <Receipt size={17} /> },
          { label: "Payments Received", path: "/payments", icon: <CreditCard size={17} /> },
          { label: "Wallet & Payouts", path: "/wallet", icon: <Wallet size={17} />, badge: "Payout" },
        ],
      },
      {
        title: "Governance & Upkeep",
        items: [
          { label: "Maintenance Requests", path: "/maintenance", icon: <Wrench size={17} /> },
          { label: "Parking Allocations", path: "/parking", icon: <Car size={17} /> },
          { label: "AGM & Resolutions", path: "/agm", icon: <Vote size={17} />, badge: "Vote" },
          { label: "Society Documents", path: "/documents", icon: <FolderArchive size={17} /> },
          { label: "Profile & Settings", path: "/settings", icon: <Settings size={17} /> },
        ],
      },
    ];
  }

  // Building owner categories
  const categories: NavCategory[] = [
    {
      title: "Operations & Billing",
      items: [
        { label: "Dashboard", path: "/", icon: <LayoutDashboard size={17} /> },
        { label: "Units & Towers", path: "/flats", icon: <Home size={17} /> },
        {
          label: "Flat Owners / NRI",
          path: "/owners",
          icon: <Building2 size={17} />,
          badge: "SmartSplit",
        },
        { label: "Tenants & Leases", path: "/tenants", icon: <Users size={17} /> },
        {
          label: "SmartSplit Invoices",
          path: "/invoices",
          icon: <Receipt size={17} />,
          badge: "HRA",
        },
        {
          label: "Escrow Payments",
          path: "/payments",
          icon: <CreditCard size={17} />,
        },
        {
          label: "Society Expenses",
          path: "/expenses",
          icon: <TrendingDown size={17} />,
        },
        {
          label: "Building Wallet",
          path: "/wallet",
          icon: <Wallet size={17} />,
          badge: "Funds",
        },
      ],
    },
    {
      title: "Smart Infrastructure",
      items: [
        {
          label: "Digital Twin Assets",
          path: "/assets",
          icon: <Cpu size={17} />,
          badge: "AI Twin",
        },
        {
          label: "Sub-Meters & Utilities",
          path: "/utilities",
          icon: <Droplets size={17} />,
          badge: "Leaks",
        },
        { label: "Parking & EV Bays", path: "/parking", icon: <Car size={17} /> },
        {
          label: "Tickets & SLA Engine",
          path: "/maintenance",
          icon: <Wrench size={17} />,
        },
        {
          label: "Domestic Staff Passes",
          path: "/staff",
          icon: <UserCheck size={17} />,
          badge: "QR",
        },
        {
          label: "Guard Gate & Visitors",
          path: "/visitors",
          icon: <ShieldCheck size={17} />,
        },
      ],
    },
    {
      title: "Governance & Trust",
      items: [
        {
          label: "Register / Verify Building",
          path: "/register-building",
          icon: <FileCheck size={17} />,
          badge: "Proof",
        },
        {
          label: "Condition Passports",
          path: "/passports",
          icon: <FileCheck size={17} />,
          badge: "NOC",
        },
        {
          label: "Procurement Tenders",
          path: "/procurement",
          icon: <ShoppingBag size={17} />,
        },
        { label: "Digital AGM & Voting", path: "/agm", icon: <Vote size={17} /> },
        {
          label: "Statutory Compliance",
          path: "/compliance",
          icon: <CalendarCheck size={17} />,
          badge: "NOC",
        },
        {
          label: "DPDP Data Trust Centre",
          path: "/datatrust",
          icon: <Lock size={17} />,
        },
        {
          label: "Documents Vault",
          path: "/documents",
          icon: <FolderArchive size={17} />,
        },
        { label: "Settings", path: "/settings", icon: <Settings size={17} /> },
      ],
    },
  ];

  // If Admin, prepend SuperAdmin tools
  if (role === 'admin') {
    categories.push({
      title: "Platform Administration",
      items: [
        {
          label: "Admin Panel",
          path: "/admin",
          icon: <Shield size={17} />,
          badge: "Admin",
        },
      ],
    });
  }

  return categories;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const {
    society,
    societies,
    switchSociety,
    createSociety,
    signOut,
    role,
    profile,
  } = useAuth();
  const { path, navigate } = useRouter();
  const { notify } = useToast();
  const { wallet } = useWallet();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const navCategories = useMemo(() => getRoleNavCategories(role), [role]);

  function go(p: string) {
    navigate(p);
    setMobileOpen(false);
  }

  const roleLabel = role ? getRoleLabel(role) : "Resident";
  const roleBadgeColor =
    role === "admin"
      ? "bg-white/15 text-white"
      : role === "building_owner"
      ? "bg-white/15 text-white"
      : role === "flat_owner"
      ? "bg-gold-500 text-white"
      : "bg-success-500 text-white";

  function downloadBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      society: society,
      exportVersion: "4.0.0",
      tables: {
        flats: localStorage.getItem("habitra.db.flats"),
        towers: localStorage.getItem("habitra.db.towers"),
        tenants: localStorage.getItem("habitra.db.tenants"),
        owners: localStorage.getItem("habitra.db.owners"),
        invoices: localStorage.getItem("habitra.db.invoices"),
        payments: localStorage.getItem("habitra.db.payments"),
        tickets: localStorage.getItem("habitra.db.tickets"),
        registrations: localStorage.getItem("habitra.db.registrations"),
      },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Habitra_${society?.name?.replace(/\s+/g, "_") || "Society"}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Database backup snapshot downloaded successfully.", "success");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink-800 flex font-sans selection:bg-brand-600 selection:text-white">
      {/* Desktop Sidebar — espresso chrome */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-ink-950 text-white sticky top-0 h-screen z-20">
        <SidebarContent
          society={society}
          role={role}
          roleLabel={roleLabel}
          roleBadgeColor={roleBadgeColor}
          navCategories={navCategories}
          path={path}
          onNavigate={go}
          onSignOut={signOut}
          onOpenAi={() => setAiModalOpen(true)}
        />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-ink-950 text-white flex flex-col animate-slide-up z-50 shadow-pop">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent
              society={society}
              role={role}
              roleLabel={roleLabel}
              roleBadgeColor={roleBadgeColor}
              navCategories={navCategories}
              path={path}
              onNavigate={go}
              onSignOut={signOut}
              onOpenAi={() => {
                setAiModalOpen(true);
                setMobileOpen(false);
              }}
            />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar — crisp white glass */}
        <header className="glass-topbar sticky top-0 z-30 border-b border-line/70 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-ink-600 hover:bg-surface-2 p-2 rounded-lg transition"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden flex items-center">
              <Logo
                variant="horizontal"
                theme="light"
                size="xs"
                onClick={() => go("/")}
              />
            </div>

            {/* Society Switcher or Property Identifier */}
            <div className="hidden lg:block relative">
              {(role === 'building_owner' || role === 'admin') ? (
                <>
                  <button
                    onClick={() => setSwitcherOpen((v) => !v)}
                    className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-surface-2 border border-transparent hover:border-line transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-ink-950 text-white flex items-center justify-center">
                      <Building2 size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-ink-900 leading-tight">
                        {society?.name ?? "Habitra Grand Palms CHS"}
                      </p>
                      <p className="text-[11px] text-ink-500 truncate max-w-[220px]">
                        {society?.address ?? "Cooperative Housing Society"}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-ink-400 ml-1 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {switcherOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setSwitcherOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-pop border border-line z-20 overflow-hidden animate-scale-in">
                        <div className="p-2 space-y-1">
                          {societies.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                switchSociety(s.id);
                                setSwitcherOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                                s.id === society?.id
                                  ? "bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200/60"
                                  : "text-ink-800 hover:bg-surface-2"
                              }`}
                            >
                              <p className="font-medium">{s.name}</p>
                              <p
                                className={`text-xs truncate ${s.id === society?.id ? "text-brand-600/80" : "text-ink-500"}`}
                              >
                                {s.address || "Standard Registered Property"}
                              </p>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-line p-2">
                          <button
                            onClick={() => {
                              setSwitcherOpen(false);
                              navigate("/register-building");
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-brand-600 hover:bg-brand-50 font-semibold transition"
                          >
                            <Plus size={14} /> Register new building with proof
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 pl-1.5 py-1.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-line text-brand-600 flex items-center justify-center shadow-xs">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900 leading-tight">
                      {society?.name ?? "Residential Complex"}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {profile?.full_name ? `${profile.full_name} · ` : ""}{roleLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2.5">
            {/* System Engine Status */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Habitra Offline-First Engine: 100% Data Preserved with Zero-Latency"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sync Active</span>
            </div>

            {/* Quick Backup Export for Building Owner / Admin */}
            {(role === 'building_owner' || role === 'admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadBackup}
                title="Export full society database snapshot as JSON"
                className="hidden xl:inline-flex"
              >
                <Download size={14} />
                <span>Backup JSON</span>
              </Button>
            )}

            {/* Role Badge in Header */}
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${roleBadgeColor}`}>
              {roleLabel}
            </span>

            {/* Quick Wallet Balance Pill */}
            <button
              onClick={() => go("/wallet")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-xs font-semibold text-ink-900 transition shadow-xs"
              title="View Habitra Wallet"
            >
              <Wallet size={14} className="text-brand-600" />
              <span className="font-mono">{formatCurrency(wallet?.balance ?? 0)}</span>
            </button>

            <Button size="sm" onClick={() => setAiModalOpen(true)}>
              <FileText size={14} />
              <span className="hidden sm:inline">Records Assistant</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-ink-600 hover:text-ink-900"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Main Routed Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Corporate & Legal Footer */}
        <footer className="border-t border-line bg-white py-6 px-4 lg:px-8 mt-auto text-xs text-ink-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <p className="font-semibold text-ink-700">
                Habitra Technologies Private Limited{" "}
                <span className="font-normal text-ink-500">
                  : CIN U72900KA2024PTC189021
                </span>
              </p>
              <p className="text-[11px]">
                Registered Office: Palm Tech Park, Outer Ring Road, Bellandur,
                Bengaluru 560103, Karnataka, India
              </p>
              <p className="text-[11px] text-ink-600 font-medium flex items-center justify-center md:justify-start gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                DPDP Act 2023 Certified | Model Tenancy Act &amp; State
                Cooperative Societies Compliant
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              {[
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
                ["Refund Policy", "/refund"],
                ["Cookie Policy", "/cookies"],
              ].map(([label, to]) => (
                <button
                  key={to}
                  onClick={() => go(to)}
                  className="hover:text-brand-600 transition font-medium"
                >
                  {label}
                </button>
              ))}
              <a
                href="mailto:dpo@habitra.in"
                className="hover:text-brand-600 transition font-medium"
              >
                DPO / Grievance Contact
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Assistant Grounded RAG Modal */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        societyName={society?.name ?? "Habitra Cooperative Society"}
      />

      {/* Add Property Modal */}
      {addModal && (
        <AddPropertyModal
          onClose={() => setAddModal(false)}
          onCreate={async (name, address) => {
            const res = await createSociety(name, address);
            if (res.error) {
              notify(res.error, "error");
              return false;
            }
            notify("Property added successfully to Habitra.", "success");
            setAddModal(false);
            return true;
          }}
        />
      )}
    </div>
  );
}

function AddPropertyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, address: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSubmitting(true);
    await onCreate(name, address);
    setSubmitting(false);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add new housing society / building"
      description="Manage multiple towers or sister housing societies under Habitra."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={submitting || !name.trim()}>
            {submitting ? "Adding…" : "Add Property"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Society / Building Name" required>
          <Input
            autoFocus
            placeholder="e.g. Palm Meadows CHS"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Address & Location (optional)">
          <Input
            placeholder="Street, city, pin code"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

function SidebarContent({
  society,
  role,
  roleLabel,
  roleBadgeColor,
  navCategories,
  path,
  onNavigate,
  onSignOut,
  onOpenAi,
}: {
  society: { name: string } | null;
  role: UserRole | null;
  roleLabel: string;
  roleBadgeColor: string;
  navCategories: NavCategory[];
  path: string;
  onNavigate: (p: string) => void;
  onSignOut: () => void;
  onOpenAi: () => void;
}) {
  return (
    <>
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <Logo
          variant="horizontal"
          theme="dark"
          size="sm"
          badge="RWA"
          onClick={() => onNavigate("/")}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-white/50 font-medium truncate max-w-[140px]">
            {society?.name ?? "Habitra Society"}
          </p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadgeColor}`}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Society Documents Search */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
            <FileText size={13} className="text-brand-300" /> Society Records
          </p>
          <p className="text-[10px] text-white/50">
            Bylaws, notices &amp; audits
          </p>
        </div>
        <button
          onClick={onOpenAi}
          className="px-2.5 py-1.5 rounded-lg bg-ink-950 hover:bg-black text-white text-[11px] font-semibold transition"
        >
          Search
        </button>
      </div>

      {/* Navigation Groups (Role Filtered) */}
      <nav className="flex-1 px-3 py-1 space-y-5 overflow-y-auto">
        {navCategories.map((category, catIdx) => (
          <div key={catIdx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
              {category.title}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const active =
                  path === item.path ||
                  (item.path !== "/" && path.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all ${
                      active
                        ? "bg-white/15 text-white font-semibold shadow-xs"
                        : "text-white/65 hover:text-white hover:bg-white/[0.07] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={active ? "text-white" : "text-white/50"}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white/[0.08] text-white/55"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-white/10 space-y-2.5">
        {role && (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
            </span>
            <span>RBI Escrow Active</span>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
