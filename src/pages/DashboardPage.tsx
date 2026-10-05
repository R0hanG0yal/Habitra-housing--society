import { useMemo } from "react";
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Home,
  ArrowRight,
  ArrowUpRight,
  Users,
  CheckCircle2,
  CalendarClock,
  Wrench,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { useSocietyData, useInvoices, useExpenses } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { TenantDashboard } from "@/pages/TenantDashboard";
import { OwnerDashboard } from "@/pages/OwnerDashboard";
import { useRouter } from "@/lib/router";
import { StatCard } from "@/components/ui/StatCard";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  currentMonthKey,
  daysOverdue,
} from "@/lib/format";
import { generateInvoicesForMonth, applyLateFees } from "@/lib/invoices";

export function DashboardPage() {
  const { role } = useAuth();

  if (role === 'tenant') {
    return <TenantDashboard />;
  }

  if (role === 'flat_owner') {
    return <OwnerDashboard />;
  }

  return <BuildingDashboard />;
}

function BuildingDashboard() {
  const {
    society,
    societyId,
    flats,
    tenants,
    settings,
    loading,
    error,
    reload,
  } = useSocietyData();
  const { navigate } = useRouter();
  const month = currentMonthKey();
  const { invoices, reload: reloadInvoices } = useInvoices(societyId, month);
  const { expenses } = useExpenses(societyId);

  const monthInvoices = invoices;
  const monthPaid = monthInvoices.filter((i) => i.status === "paid");
  const collected = monthPaid.reduce(
    (sum, i) =>
      sum + (i.payments?.reduce((p, x) => p + Number(x.amount), 0) ?? 0),
    0,
  );
  const totalDue = monthInvoices.reduce(
    (sum, i) => sum + Number(i.amount) + Number(i.late_fee_applied),
    0,
  );
  const pending = totalDue - collected;
  const collectionRate =
    totalDue > 0 ? Math.round((collected / totalDue) * 100) : 0;

  const monthPrefix = month.slice(0, 7);
  const monthExpenses = expenses.filter(
    (e) => e.expense_date.slice(0, 7) === monthPrefix,
  );
  const monthExpenseTotal = monthExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );
  const netProfit = collected - monthExpenseTotal;

  const defaulters = useMemo(() => {
    return monthInvoices
      .filter((i) => i.status !== "paid")
      .map((i) => ({ invoice: i, overdueDays: daysOverdue(i.due_date) }))
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 6);
  }, [monthInvoices]);

  const leaseExpiring = useMemo(() => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    return tenants
      .filter(
        (t) =>
          t.lease_end &&
          new Date(t.lease_end) <= soon &&
          new Date(t.lease_end) >= now,
      )
      .sort((a, b) => (a.lease_end ?? "").localeCompare(b.lease_end ?? ""))
      .slice(0, 5);
  }, [tenants]);

  async function handleGenerate() {
    if (!societyId) return;
    await generateInvoicesForMonth(societyId, flats, month);
    await applyLateFees(societyId, flats, settings);
    await reloadInvoices();
    await reload();
  }

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;

  const occupiedCount = flats.filter((f) => f.status === "occupied").length;
  const vacantCount = flats.filter((f) => f.status === "vacant").length;
  const tenantCount = tenants.length;
  const ownerOccupiedCount = Math.max(0, occupiedCount - tenantCount);
  const occupancyPct =
    flats.length > 0 ? Math.round((occupiedCount / flats.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            {formatMonth(month)}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink-900 mt-1">
            Good day, {society?.name ?? "Habitra"}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {flats.length} units · {occupancyPct}% occupancy ·{" "}
            {tenantCount} active leases
          </p>
        </div>
        <Button onClick={handleGenerate}>
          <TrendingUp size={15} /> Generate this month's invoices
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Collected this month"
          value={formatCurrency(collected)}
          hint={`From ${monthPaid.length} of ${monthInvoices.length} invoices`}
          icon={<Wallet size={18} />}
          tone="success"
          trend={{
            value: `${collectionRate}% collection rate`,
            direction: collectionRate >= 70 ? "up" : "flat",
          }}
        />
        <StatCard
          label="Pending / outstanding"
          value={formatCurrency(pending)}
          hint={
            pending > 0
              ? `${monthInvoices.length - monthPaid.length} invoices unpaid`
              : "All caught up"
          }
          icon={<AlertTriangle size={18} />}
          tone={pending > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Expenses this month"
          value={formatCurrency(monthExpenseTotal)}
          hint={`${monthExpenses.length} entries`}
          icon={<TrendingDown size={18} />}
          tone="default"
        />
        <StatCard
          label="Net position"
          value={formatCurrency(netProfit)}
          hint={netProfit >= 0 ? "In the green" : "Running at a loss"}
          icon={<TrendingUp size={18} />}
          tone={netProfit >= 0 ? "success" : "danger"}
        />
      </div>

      {flats.length === 0 ? (
        <Card>
          <EmptyState
            title="No units added yet"
            description="Add your first unit to start tracking rent and maintenance collection."
            action={
              <Button onClick={() => navigate("/flats")}>
                Add your first unit <ArrowRight size={15} />
              </Button>
            }
            icon={<Home size={22} />}
          />
        </Card>
      ) : (
        <>
          {/* Operations & AMC overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Occupancy */}
            <Card>
              <CardBody className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-2 text-ink-500">
                      Occupancy
                    </span>
                    <span className="text-[11px] text-success-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Form I Register
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-4">
                    <span className="text-[34px] leading-10 font-bold font-mono tabular-nums text-ink-900">
                      {occupancyPct}%
                    </span>
                    <span className="text-ink-500 text-sm font-medium">
                      {occupiedCount} of {flats.length} units
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-success-500 transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-line text-xs">
                  <div className="bg-canvas rounded-lg p-2.5 ring-1 ring-line">
                    <span className="text-ink-500 block text-[10px] uppercase tracking-wide font-semibold">
                      Owner-occupied
                    </span>
                    <span className="text-ink-900 font-bold font-mono tabular-nums">
                      {ownerOccupiedCount}
                    </span>
                  </div>
                  <div className="bg-canvas rounded-lg p-2.5 ring-1 ring-line">
                    <span className="text-ink-500 block text-[10px] uppercase tracking-wide font-semibold">
                      Tenanted
                    </span>
                    <span className="text-ink-900 font-bold font-mono tabular-nums">
                      {tenantCount}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* AMC status */}
            <Card>
              <CardBody className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-2 text-ink-500">
                      Infrastructure &amp; AMC
                    </span>
                    <span className="text-[11px] text-success-600 font-semibold flex items-center gap-1">
                      <ShieldCheck size={12} /> Active
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-4">
                    <span className="text-[34px] leading-10 font-bold font-mono tabular-nums text-ink-900">
                      3
                    </span>
                    <span className="text-ink-500 text-sm font-medium">
                      critical contracts live
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-2">
                    Elevator, diesel generator, and water filtration contracts
                    verified for quarterly inspection.
                  </p>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-line text-xs">
                  {[
                    ["Otis Lift AMC", "Valid till Nov 2026"],
                    ["Kirloskar DG 125 kVA", "Service log current"],
                    ["Eureka Forbes STP", "Filter check passed"],
                  ].map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-ink-700 font-medium flex items-center gap-1.5">
                        <Wrench size={12} className="text-ink-400" /> {name}
                      </span>
                      <span className="text-success-600 text-[11px] font-semibold">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Quick launch */}
            <Card>
              <CardBody className="flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                    <Home size={15} className="text-ink-900" /> Operations Hub
                  </h3>
                  <p className="text-xs text-ink-500 mt-1">
                    Jump straight into society operations, accounting and
                    compliance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    ["Units & Flats", "Society registry", "/flats"],
                    ["Maintenance Dues", "Demand & receipts", "/invoices"],
                    ["AGM & E-Voting", "Quorum & resolutions", "/agm"],
                    ["Fire & Safety NOC", "Statutory calendar", "/compliance"],
                    ["Flat Owners", "UPI VPA & payouts", "/owners"],
                    ["DPDP Data Trust", "Consent & purge logs", "/datatrust"],
                  ].map(([label, sub, to]) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className="p-2.5 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-transparent hover:border-line text-left transition group"
                    >
                      <p className="text-xs font-semibold text-ink-900 flex items-center gap-1">
                        {label}
                        <ArrowUpRight
                          size={11}
                          className="text-ink-300 group-hover:text-ink-900 transition-colors"
                        />
                      </p>
                      <p className="text-[10px] text-ink-500 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Defaulters — sorted by days overdue</CardTitle>
                  <CardDescription>
                    Units with unpaid maintenance or rent this month
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/invoices")}
                >
                  View all <ArrowRight size={14} />
                </Button>
              </CardHeader>
              <CardBody className="p-0">
                {defaulters.length === 0 ? (
                  <EmptyState
                    title="No defaulters this month"
                    description={
                      monthInvoices.length === 0
                        ? "This month's invoices have not been generated yet."
                        : "Every occupied unit is paid up. All accounts current."
                    }
                    icon={<CheckCircle2 size={22} />}
                  />
                ) : (
                  <div className="divide-y divide-line">
                    {defaulters.map(({ invoice, overdueDays }) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-canvas/60 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">
                            {invoice.flats?.flat_no ?? "-"} ·{" "}
                            {invoice.tenants?.name ?? "Vacant"}
                          </p>
                          <p className="text-xs text-ink-500 mt-0.5">
                            Due {formatDate(invoice.due_date)} ·{" "}
                            {overdueDays > 0
                              ? `${overdueDays} days overdue`
                              : "Due soon"}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-mono font-bold text-ink-900 tabular-nums">
                            {formatCurrency(
                              Number(invoice.amount) +
                                Number(invoice.late_fee_applied),
                            )}
                          </p>
                          <div className="mt-1 flex justify-end">
                            <StatusBadge status={invoice.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Leases expiring</CardTitle>
                  <CardDescription>Within the next 30 days</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/tenants")}
                >
                  <ArrowRight size={14} />
                </Button>
              </CardHeader>
              <CardBody className="p-0">
                {leaseExpiring.length === 0 ? (
                  <EmptyState
                    title="No leases expiring soon"
                    description="All active leases run beyond the next 30 days."
                    icon={<CalendarClock size={22} />}
                  />
                ) : (
                  <div className="divide-y divide-line">
                    {leaseExpiring.map((t) => {
                      const flat = flats.find((f) => f.id === t.flat_id);
                      const days = Math.ceil(
                        (new Date(t.lease_end!).getTime() - Date.now()) /
                          86400000,
                      );
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-canvas/60 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900 truncate">
                              {t.name}
                            </p>
                            <p className="text-xs text-ink-500 mt-0.5">
                              {flat?.flat_no ?? "-"} · Expires{" "}
                              {formatDate(t.lease_end)}
                            </p>
                          </div>
                          <Badge tone={days <= 7 ? "overdue" : "pending"}>
                            {days}d left
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick stats</CardTitle>
              <CardDescription>Society at a glance</CardDescription>
            </CardHeader>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <QuickStat
                icon={<Home size={15} />}
                label="Units"
                value={`${flats.length}`}
                sub={`${occupiedCount} occupied · ${vacantCount} vacant`}
              />
              <QuickStat
                icon={<Users size={15} />}
                label="Tenants"
                value={`${tenants.length}`}
                sub={`${tenants.filter((t) => t.whatsapp_opt_in).length} opted in to WhatsApp`}
              />
              <QuickStat
                icon={<Receipt size={15} />}
                label="Invoices this month"
                value={`${monthInvoices.length}`}
                sub={`${monthPaid.length} paid · ${monthInvoices.length - monthPaid.length} unpaid`}
              />
              <QuickStat
                icon={<TrendingUp size={15} />}
                label="Average rent"
                value={formatCurrency(
                  flats.reduce(
                    (s, f) =>
                      s +
                      (f.rent_config?.[0]?.amount
                        ? Number(f.rent_config[0].amount)
                        : 0),
                    0,
                  ) / Math.max(occupiedCount, 1),
                )}
                sub="Across occupied units"
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-surface-2 text-ink-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-500 font-medium">{label}</p>
        <p className="text-sm font-bold text-ink-900 font-mono tabular-nums">
          {value}
        </p>
        <p className="text-[11px] text-ink-500">{sub}</p>
      </div>
    </div>
  );
}
