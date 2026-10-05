import { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  Wallet,
  Receipt,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Cpu,
  Lock,
  Vote,
  Sparkles,
  PhoneCall,
  Calendar,
  HelpCircle,
  ChevronDown,
  Star,
  Award,
  Layers,
  ArrowUpRight,
  Play,
  Zap,
  Clock,
} from "lucide-react";
import { useRouter } from "@/lib/router";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import type { UserRole } from "@/lib/roles";

export function LandingPage() {
  const { navigate } = useRouter();
  const { signIn, signUp } = useAuth();
  const { notify } = useToast();

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual",
  );
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoLead, setDemoLead] = useState({
    name: "",
    email: "",
    phone: "",
    societyName: "",
    units: "100",
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  // ROI Calculator State
  const [calcUnits, setCalcUnits] = useState(120);
  const [calcAvgMaint, setCalcAvgMaint] = useState(3800);

  // Calculations
  const monthlyCollection = calcUnits * calcAvgMaint;
  const annualCollection = monthlyCollection * 12;
  const recoveredLateDues = Math.round(annualCollection * 0.045); // 4.5% improvement in collection rate
  const staffHoursSaved = Math.round(calcUnits * 2.2); // 2.2 hours saved per flat/year

  // Demo Login Helper
  async function testDriveAs(role: UserRole) {
    const demoAccounts: Record<
      UserRole,
      { email: string; pass: string; name: string }
    > = {
      tenant: {
        email: "tenant.demo@habitra.com",
        pass: "HabitraDemo123!",
        name: "Aarav Sharma (Resident)",
      },
      flat_owner: {
        email: "landlord.demo@habitra.com",
        pass: "HabitraDemo123!",
        name: "Vikram Malhotra (Landlord)",
      },
      building_owner: {
        email: "secretary.demo@habitra.com",
        pass: "HabitraDemo123!",
        name: "Rajesh Singhania (RWA Secretary)",
      },
      admin: {
        email: "admin.demo@habitra.com",
        pass: "HabitraDemo123!",
        name: "Platform Master Admin",
      },
    };

    const target = demoAccounts[role];
    notify(`Launching test drive as ${target.name}…`, "info");

    const res = await signIn(target.email, target.pass);
    if (res.error) {
      // If demo user doesn't exist yet, sign up instantly
      const up = await signUp(target.email, target.pass, role, target.name);
      if (up.error) {
        notify("Could not launch demo. Redirecting to login.", "error");
        navigate("/login");
        return;
      }
    }
    notify(`Welcome to the live demo! Role: ${role.replace("_", " ")}`, "success");
    navigate("/");
  }

  function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!demoLead.name || !demoLead.email || !demoLead.phone) {
      notify("Please provide all required contact details.", "error");
      return;
    }
    setSubmittingLead(true);
    setTimeout(() => {
      setSubmittingLead(false);
      setDemoModalOpen(false);
      notify(
        `Thank you ${demoLead.name}! Our Enterprise Property Consultant will contact you within 2 business hours.`,
        "success",
      );
      setDemoLead({
        name: "",
        email: "",
        phone: "",
        societyName: "",
        units: "100",
      });
    }, 800);
  }

  return (
    <div className="min-h-screen bg-surface-1 text-ink-900 font-sans selection:bg-brand-600/20 selection:text-brand-900">
      {/* Top Announcement Bar */}
      <div className="bg-ink-950 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Badge tone="success" className="animate-pulse">
          NEW
        </Badge>
        <span>
          Habitra Enterprise 4.0: DPDP Act 2023 Compliant Resident Data Trust &
          Tri-Party SmartSplit™ Escrow Routing is live!
        </span>
        <button
          onClick={() => setDemoModalOpen(true)}
          className="underline font-semibold hover:text-brand-400 ml-1"
        >
          Book Consultation
        </button>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-md border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/landing")}
          >
            <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={22} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-ink-900">
                Habitra<span className="text-brand-600">.</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Enterprise Housing OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
            <a href="#features" className="hover:text-ink-900 transition">
              Modules
            </a>
            <a href="#testdrive" className="hover:text-ink-900 transition">
              Live Demo
            </a>
            <a href="#calculator" className="hover:text-ink-900 transition">
              ROI Calculator
            </a>
            <a href="#pricing" className="hover:text-ink-900 transition">
              Pricing Plans
            </a>
            <a href="#faq" className="hover:text-ink-900 transition">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/portal")}
              className="hidden sm:inline-flex"
            >
              Resident Quick Pay
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/")}
              className="shadow-sm"
            >
              Sign In / Open App <ArrowRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-line-strong">
        <div className="absolute inset-0 bg-radial from-brand-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800 mb-8 animate-fade-in">
            <Sparkles size={14} className="text-brand-600" />
            <span>India's Most Advanced Property ERP & Society Management System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Complete Automation for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-amber-600">
              Modern Housing Societies
            </span>{" "}
            & Gated Communities.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-ink-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate manual registers, delayed maintenance payments, and accounting
            headaches. Habitra unifies residents, landlords, RWAs, and security in
            one high-performance operating system.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("testdrive");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="shadow-lg shadow-brand-900/10 px-8 py-3.5 text-base"
            >
              <Play size={18} className="mr-2 fill-current" />
              1-Click Interactive Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setDemoModalOpen(true)}
              className="px-8 py-3.5 text-base bg-white"
            >
              <PhoneCall size={18} className="mr-2" />
              Book Live Consultation
            </Button>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-line-strong">
            <div>
              <p className="text-3xl font-extrabold text-ink-900 font-mono">98.4%</p>
              <p className="text-xs text-ink-500 font-medium mt-1">
                On-Time Dues Collection
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-ink-900 font-mono">100%</p>
              <p className="text-xs text-ink-500 font-medium mt-1">
                DPDP Act 2023 Compliant
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-ink-900 font-mono">₹14.8 Cr+</p>
              <p className="text-xs text-ink-500 font-medium mt-1">
                Processed via SmartSplit™
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-ink-900 font-mono">0 sec</p>
              <p className="text-xs text-ink-500 font-medium mt-1">
                Offline-First Zero Lag
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 1-Click Test Drive Section */}
      <section id="testdrive" className="py-20 bg-surface-2 border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Instant Experience
            </span>
            <h2 className="text-3xl font-bold text-ink-900 mt-4 tracking-tight">
              Test Drive Every Role in Real Time
            </h2>
            <p className="text-ink-600 mt-2 text-sm sm:text-base">
              No registration forms or credit card required. Click any persona below
              to test drive the live dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tenant Card */}
            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-sm hover:shadow-md hover:border-brand-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink-900">Tenant Persona</h3>
                <p className="text-xs text-ink-500 mt-1">Resident Apartment 101</p>
                <ul className="mt-4 space-y-2 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    Pay monthly rent & maintenance with wallet
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    Download GST / HRA rent tax receipts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    Log photo maintenance requests
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full group"
                onClick={() => testDriveAs("tenant")}
              >
                Launch Tenant View{" "}
                <ArrowRight
                  size={15}
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </div>

            {/* Flat Owner Card */}
            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-sm hover:shadow-md hover:border-brand-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink-900">Flat Owner / NRI</h3>
                <p className="text-xs text-ink-500 mt-1">Multi-Unit Real Estate Portfolio</p>
                <ul className="mt-4 space-y-2 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                    Track tenant occupancy & active leases
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                    SmartSplit direct-to-bank rent payouts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                    Cast remote proxy votes in AGM elections
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full group"
                onClick={() => testDriveAs("flat_owner")}
              >
                Launch Owner View{" "}
                <ArrowRight
                  size={15}
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </div>

            {/* Building Owner / RWA Secretary Card */}
            <div className="bg-white rounded-2xl border-2 border-brand-500 p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative">
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-600 text-white">
                Most Popular
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                  <Award size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink-900">RWA / Society Secretary</h3>
                <p className="text-xs text-ink-500 mt-1">Habitra Grand Residency</p>
                <ul className="mt-4 space-y-2 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-brand-600 shrink-0" />
                    Units & towers, tenant registry, and KYC
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-brand-600 shrink-0" />
                    1-Click auto invoice generation & late fees
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-brand-600 shrink-0" />
                    Financial ledger, audit logs & balance sheets
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                className="mt-6 w-full group"
                onClick={() => testDriveAs("building_owner")}
              >
                Launch RWA Secretary View{" "}
                <ArrowRight
                  size={15}
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </div>

            {/* Super Admin Card */}
            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-sm hover:shadow-md hover:border-brand-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink-900">Platform SuperAdmin</h3>
                <p className="text-xs text-ink-500 mt-1">Multi-Society Master Control</p>
                <ul className="mt-4 space-y-2 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                    Verify building ownership deeds & proof
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                    Manage roles, permissions, and platform users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                    System audit trails and database backups
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full group"
                onClick={() => testDriveAs("admin")}
              >
                Launch Admin View{" "}
                <ArrowRight
                  size={15}
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Society ROI Calculator */}
      <section id="calculator" className="py-20 border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Society Financial ROI
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
                Calculate Exactly How Much Habitra Saves Your Society
              </h2>
              <p className="text-ink-600 text-sm sm:text-base leading-relaxed">
                Most housing societies lose between 4% to 8% in delayed dues and spend
                over 40 hours monthly chasing payments. Habitra pays for itself in the
                first 30 days.
              </p>

              <div className="space-y-6 pt-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-ink-800 mb-2">
                    <span>Number of Units (Flats/Villas):</span>
                    <span className="font-mono text-brand-700 text-base">{calcUnits} units</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={800}
                    step={10}
                    value={calcUnits}
                    onChange={(e) => setCalcUnits(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-ink-400 mt-1 font-mono">
                    <span>20 units</span>
                    <span>400 units</span>
                    <span>800+ units</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-ink-800 mb-2">
                    <span>Average Monthly Maintenance per Flat:</span>
                    <span className="font-mono text-brand-700 text-base">
                      {formatCurrency(calcAvgMaint)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1500}
                    max={15000}
                    step={250}
                    value={calcAvgMaint}
                    onChange={(e) => setCalcAvgMaint(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-ink-400 mt-1 font-mono">
                    <span>₹1,500</span>
                    <span>₹7,500</span>
                    <span>₹15,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Calculation Display Card */}
            <div className="lg:col-span-6 bg-gradient-to-br from-ink-950 to-ink-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp size={180} />
              </div>

              <div className="relative z-10 space-y-6">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-400">
                  Annual Impact Projection
                </p>

                <div>
                  <p className="text-sm text-ink-300">Total Annual Dues Managed</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                    {formatCurrency(annualCollection)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Zap size={13} /> Recovered Late Dues
                    </p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">
                      {formatCurrency(recoveredLateDues)}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-1">
                      via auto-reminders & late fees
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                      <Clock size={13} /> Staff Hours Saved
                    </p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">
                      {staffHoursSaved} hrs/yr
                    </p>
                    <p className="text-[11px] text-ink-400 mt-1">
                      eliminated ledger data entry
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    onClick={() => setDemoModalOpen(true)}
                    className="w-full bg-brand-500 hover:bg-brand-400 text-white font-bold"
                  >
                    Lock In These Savings for Your Society
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Grid */}
      <section id="features" className="py-20 bg-surface-1 border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Enterprise Suite
            </span>
            <h2 className="text-3xl font-bold text-ink-900 mt-4 tracking-tight">
              Purpose-Built for Indian Housing Societies & High-Rise Townships
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                <Receipt size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                Tri-Party SmartSplit™ Invoicing
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                When a tenant pays their bill, the rent portion automatically routes
                to the landlord's verified bank account, and the maintenance fee + sinking fund
                instantly routes to the society RWA account. Zero manual reconciliation.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                DPDP Act 2023 Resident Data Trust
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                Meet statutory Indian data protection laws. Resident mobile numbers are
                masked for security guards. Visitor logs auto-purge after 30 days. Full
                right-to-erasure and consent revocation controls.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Cpu size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                Asset Digital Twin & SLA Engine
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                Catalog lifts, diesel generators, swimming pool filtration systems,
                and water pumps. Track warranty dates, AMC vendors, and auto-flag
                overdue servicing before equipment breakdowns occur.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <Vote size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                Digital AGM & Quorum Voting
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                Conduct legally compliant RWA general body meetings online. NRIs and
                traveling homeowners cast tamper-proof proxy votes on society bylaws,
                budget approvals, and executive committee elections.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                Guard Gatekeeper & Domestic Staff
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                Generate guest passcodes, monitor delivery agent entries, and manage
                domestic staff (maids, cooks, drivers) with daily attendance tracking
                and instant entry notifications.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-line-strong p-6 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mb-4">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                Integrated Society Wallet & Ledger
              </h3>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">
                Pre-funded resident wallet for recurring rent and maintenance deductions.
                Society expense accounting, voucher attachments, and real-time sinking
                fund ledger compliant with state society acts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Pricing Plans */}
      <section id="pricing" className="py-20 bg-surface-2 border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Transparent Pricing
            </span>
            <h2 className="text-3xl font-bold text-ink-900 mt-4 tracking-tight">
              Predictable Plans Scaled to Your Society's Size
            </h2>
            <p className="text-ink-600 mt-2 text-sm sm:text-base">
              No hidden gateway surcharges. Flat pricing with full access to all core modules.
            </p>

            {/* Annual / Monthly Toggle */}
            <div className="mt-6 inline-flex items-center gap-3 p-1.5 rounded-xl bg-white border border-line-strong shadow-xs">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  billingPeriod === "monthly"
                    ? "bg-ink-900 text-white shadow-xs"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  billingPeriod === "annual"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Annual <span className="text-[10px] text-brand-100 font-normal">(Save 18%)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter RWA */}
            <div className="bg-white rounded-2xl border border-line-strong p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink-900">Starter RWA</h3>
                <p className="text-xs text-ink-500 mt-1">
                  Ideal for standalone buildings & small societies
                </p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-ink-900 font-mono">
                    {billingPeriod === "annual" ? "₹1,699" : "₹1,999"}
                  </span>
                  <span className="text-xs text-ink-500 ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Up to 50 Units & Flats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Automated Invoicing & WhatsApp receipts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Guard Gatekeeper Visitor Logging
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Maintenance Ticket Helpdesk
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Offline-First Local Storage Sync
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-8 w-full"
                onClick={() => setDemoModalOpen(true)}
              >
                Get Started
              </Button>
            </div>

            {/* Growth Society */}
            <div className="bg-white rounded-2xl border-2 border-brand-600 p-8 shadow-md flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-600 text-white">
                Recommended
              </span>
              <div>
                <h3 className="text-xl font-bold text-ink-900">Growth Society</h3>
                <p className="text-xs text-ink-500 mt-1">
                  Medium-sized societies with multiple towers
                </p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-ink-900 font-mono">
                    {billingPeriod === "annual" ? "₹4,199" : "₹4,999"}
                  </span>
                  <span className="text-xs text-ink-500 ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Up to 250 Units & 8 Towers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Tri-Party SmartSplit™ Escrow Payouts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Sub-Meter Utilities & Water Leak Alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Digital AGM & Quorum Voting Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Asset Digital Twin & AMC Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-brand-600" />
                    Dedicated Priority WhatsApp Support
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                className="mt-8 w-full"
                onClick={() => setDemoModalOpen(true)}
              >
                Start 14-Day Free Trial
              </Button>
            </div>

            {/* Enterprise Township */}
            <div className="bg-white rounded-2xl border border-line-strong p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink-900">Enterprise Township</h3>
                <p className="text-xs text-ink-500 mt-1">
                  Large complexes, integrated townships & builder groups
                </p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-ink-900 font-mono">
                    {billingPeriod === "annual" ? "₹10,999" : "₹12,999"}
                  </span>
                  <span className="text-xs text-ink-500 ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-ink-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Unlimited Units & Infinite Towers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Multi-Society Centralized Master Dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Custom Domain & Society White-Labeling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    ERP & Tally / SAP Accounting Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Dedicated Account Manager & SLA Guarantee
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-8 w-full"
                onClick={() => setDemoModalOpen(true)}
              >
                Contact Enterprise Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Trust & Security Badges */}
      <section className="py-16 bg-white border-b border-line-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
              Engineered to Bank-Grade Security Standards
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl border border-line-strong bg-surface-1">
              <ShieldCheck size={28} className="text-brand-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink-900">DPDP Act 2023</p>
              <p className="text-xs text-ink-500 mt-0.5">Compliant Resident Privacy</p>
            </div>
            <div className="p-4 rounded-xl border border-line-strong bg-surface-1">
              <Lock size={28} className="text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink-900">256-Bit TLS Encryption</p>
              <p className="text-xs text-ink-500 mt-0.5">End-to-End Data In Flight</p>
            </div>
            <div className="p-4 rounded-xl border border-line-strong bg-surface-1">
              <Award size={28} className="text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink-900">RBI Compliant</p>
              <p className="text-xs text-ink-500 mt-0.5">Direct Bank Escrow Routing</p>
            </div>
            <div className="p-4 rounded-xl border border-line-strong bg-surface-1">
              <CheckCircle2 size={28} className="text-purple-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink-900">99.99% Uptime</p>
              <p className="text-xs text-ink-500 mt-0.5">Dual-Cloud Offline Fallback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 bg-surface-1 border-b border-line-strong">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Clear Answers
            </span>
            <h2 className="text-3xl font-bold text-ink-900 mt-4 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white rounded-2xl border border-line-strong p-5 open:shadow-sm">
              <summary className="font-bold text-ink-900 text-sm sm:text-base cursor-pointer flex justify-between items-center list-none">
                <span>Can we migrate our existing Excel or software data easily?</span>
                <ChevronDown
                  size={18}
                  className="text-ink-400 group-open:rotate-180 transition-transform"
                />
              </summary>
              <p className="text-xs sm:text-sm text-ink-600 mt-3 leading-relaxed">
                Yes! Our support team provides free onboarding assistance. You can import
                your complete flat directory, owner list, active tenant leases, and past
                dues via Excel/CSV within 24 hours.
              </p>
            </details>

            <details className="group bg-white rounded-2xl border border-line-strong p-5 open:shadow-sm">
              <summary className="font-bold text-ink-900 text-sm sm:text-base cursor-pointer flex justify-between items-center list-none">
                <span>How does SmartSplit™ handle rent and maintenance payments?</span>
                <ChevronDown
                  size={18}
                  className="text-ink-400 group-open:rotate-180 transition-transform"
                />
              </summary>
              <p className="text-xs sm:text-sm text-ink-600 mt-3 leading-relaxed">
                When a resident pays through UPI, NetBanking, or their Habitra Wallet,
                the payment gateway automatically splits the amount: the rent fee transfers
                directly to the landlord's bank account, and the maintenance fee transfers
                to the society's RWA account.
              </p>
            </details>

            <details className="group bg-white rounded-2xl border border-line-strong p-5 open:shadow-sm">
              <summary className="font-bold text-ink-900 text-sm sm:text-base cursor-pointer flex justify-between items-center list-none">
                <span>What happens if internet connectivity goes down at the guard gate?</span>
                <ChevronDown
                  size={18}
                  className="text-ink-400 group-open:rotate-180 transition-transform"
                />
              </summary>
              <p className="text-xs sm:text-sm text-ink-600 mt-3 leading-relaxed">
                Habitra is built with a resilient offline engine. Guards and managers can
                continue logging entries and checking flats completely offline. Everything
                syncs automatically once connectivity is restored.
              </p>
            </details>

            <details className="group bg-white rounded-2xl border border-line-strong p-5 open:shadow-sm">
              <summary className="font-bold text-ink-900 text-sm sm:text-base cursor-pointer flex justify-between items-center list-none">
                <span>Can we export our database backup at any time?</span>
                <ChevronDown
                  size={18}
                  className="text-ink-400 group-open:rotate-180 transition-transform"
                />
              </summary>
              <p className="text-xs sm:text-sm text-ink-600 mt-3 leading-relaxed">
                Absolutely. You have 100% data ownership. Secretaries can download an
                immutable, complete JSON or CSV database backup with one click anytime
                from the Settings panel.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-950 text-ink-400 py-12 border-t border-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Habitra Housing OS
              </span>
            </div>
            <div className="flex gap-6 text-xs text-ink-400">
              <button
                onClick={() => navigate("/privacy")}
                className="hover:text-white transition"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate("/terms")}
                className="hover:text-white transition"
              >
                Terms of Service
              </button>
              <button
                onClick={() => navigate("/refund")}
                className="hover:text-white transition"
              >
                Refund Policy
              </button>
              <button
                onClick={() => navigate("/cookies")}
                className="hover:text-white transition"
              >
                Cookie Settings
              </button>
            </div>
            <p className="text-xs text-ink-500">
              © {new Date().getFullYear()} Habitra Technologies Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Booking Lead Modal */}
      {demoModalOpen && (
        <Modal
          open
          onClose={() => setDemoModalOpen(false)}
          title="Schedule an Enterprise Demo"
          description="A dedicated Property Solutions Specialist will walk you through a customized demonstration for your housing society."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDemoModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDemoSubmit} disabled={submittingLead}>
                {submittingLead ? "Submitting…" : "Confirm Consultation"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <Field label="Your Full Name" required>
              <Input
                placeholder="e.g. Vikram Malhotra"
                value={demoLead.name}
                onChange={(e) =>
                  setDemoLead({ ...demoLead, name: e.target.value })
                }
                autoFocus
              />
            </Field>

            <Field label="Official Email Address" required>
              <Input
                type="email"
                placeholder="e.g. secretary@dlfheights.org"
                value={demoLead.email}
                onChange={(e) =>
                  setDemoLead({ ...demoLead, email: e.target.value })
                }
              />
            </Field>

            <Field label="Mobile / WhatsApp Number" required>
              <Input
                placeholder="e.g. +91 98765 43210"
                value={demoLead.phone}
                onChange={(e) =>
                  setDemoLead({ ...demoLead, phone: e.target.value })
                }
              />
            </Field>

            <Field label="Housing Society / Building Name" required>
              <Input
                placeholder="e.g. Palm Grove Residency, Block C"
                value={demoLead.societyName}
                onChange={(e) =>
                  setDemoLead({ ...demoLead, societyName: e.target.value })
                }
              />
            </Field>

            <Field label="Estimated Number of Units (Flats / Villas)">
              <Input
                type="number"
                placeholder="e.g. 150"
                value={demoLead.units}
                onChange={(e) =>
                  setDemoLead({ ...demoLead, units: e.target.value })
                }
              />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
