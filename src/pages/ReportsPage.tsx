import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  Home,
  AlertTriangle,
} from "lucide-react";
import { useSocietyData, useInvoices, usePayments } from "@/lib/hooks";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatMonth,
  currentMonthKey,
  daysOverdue,
} from "@/lib/format";
import {
  exportInvoicesCsv,
  exportDefaultersCsv,
  exportPaymentsCsv,
} from "@/lib/export";
import { StatCard } from "@/components/ui/StatCard";
export function ReportsPage() {
  const { societyId, flats, loading, error, reload } = useSocietyData();
  const [month, setMonth] = useState(currentMonthKey());
  const { invoices, loading: invLoading } = useInvoices(societyId, month);
  const { payments, loading: pLoading } = usePayments(societyId);
  const flatMap = useMemo(() => new Map(flats.map((f) => [f.id, f])), [flats]);
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce(
      (s, i) => s + Number(i.amount) + Number(i.late_fee_applied),
      0,
    );
    const collected = invoices.reduce(
      (s, i) =>
        s + (i.payments?.reduce((p, x) => p + Number(x.amount), 0) ?? 0),
      0,
    );
    const pending = totalBilled - collected;
    const rate =
      totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;
    const defaulters = invoices.filter((i) => i.status !== "paid");
    return {
      totalBilled,
      collected,
      pending,
      rate,
      defaulterCount: defaulters.length,
    };
  }, [invoices]);
  const towerSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; billed: number; collected: number; count: number }
    >();
    for (const inv of invoices) {
      const flat = inv.flats?.id ? flatMap.get(inv.flats.id) : null;
      const towerName = flat?.towers?.name ?? "Unassigned";
      const key = flat?.tower_id ?? "none";
      const cur = map.get(key) ?? {
        name: towerName,
        billed: 0,
        collected: 0,
        count: 0,
      };
      cur.billed += Number(inv.amount) + Number(inv.late_fee_applied);
      cur.collected +=
        inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.billed - a.billed);
  }, [invoices, flatMap]);
  const monthTrend = useMemo(() => {
    const map = new Map<string, { month: string; collected: number }>();
    for (const p of payments) {
      const m = p.invoices?.month ?? p.paid_on.slice(0, 7) + "-01";
      const cur = map.get(m) ?? { month: m, collected: 0 };
      cur.collected += Number(p.amount);
      map.set(m, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [payments]);
  if (loading) return <PageLoader label="Loading reports…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      opts.push({
        value: v,
        label: d.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return opts;
  }, []);
  const maxTrend = Math.max(1, ...monthTrend.map((t) => t.collected));
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">Reports</h1>{" "}
          <p className="text-sm text-ink-500">
            Collection summary and exports
          </p>{" "}
        </div>{" "}
        <Select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-44"
        >
          {" "}
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}{" "}
        </Select>{" "}
      </div>{" "}
      {invLoading ? (
        <PageLoader label="Loading…" />
      ) : invoices.length === 0 ? (
        <Card>
          {" "}
          <EmptyState
            title="No data for this month"
            description="Generate invoices first, then come back to view reports."
            icon={<FileText size={22} />}
          />{" "}
        </Card>
      ) : (
        <>
          {" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {" "}
            <StatCard
              label="Total billed"
              value={formatCurrency(stats.totalBilled)}
              icon={<Home size={18} />}
              tone="default"
            />{" "}
            <StatCard
              label="Collected"
              value={formatCurrency(stats.collected)}
              icon={<TrendingUp size={18} />}
              tone="success"
            />{" "}
            <StatCard
              label="Pending"
              value={formatCurrency(stats.pending)}
              icon={<AlertTriangle size={18} />}
              tone="warning"
            />{" "}
            <StatCard
              label="Collection rate"
              value={`${stats.rate}%`}
              icon={<TrendingUp size={18} />}
              tone="default"
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {" "}
            <Card>
              {" "}
              <CardHeader>
                {" "}
                <CardTitle>Tower-wise summary</CardTitle>{" "}
                <CardDescription>
                  Billed vs collected by tower
                </CardDescription>{" "}
              </CardHeader>{" "}
              <CardBody className="p-0">
                {" "}
                {towerSummary.length === 0 ? (
                  <EmptyState
                    title="No tower data"
                    description="Assign flats to towers to see a breakdown."
                  />
                ) : (
                  <div className="divide-y divide-ink-100">
                    {" "}
                    {towerSummary.map((t) => {
                      const rate =
                        t.billed > 0
                          ? Math.round((t.collected / t.billed) * 100)
                          : 0;
                      return (
                        <div key={t.name} className="px-5 py-3">
                          {" "}
                          <div className="flex items-center justify-between">
                            {" "}
                            <p className="text-sm font-medium text-ink-900">
                              {t.name}
                            </p>{" "}
                            <p className="text-xs text-ink-500">
                              {t.count} invoice(s)
                            </p>{" "}
                          </div>{" "}
                          <div className="flex items-center justify-between mt-1">
                            {" "}
                            <p className="text-xs text-ink-600 font-mono">
                              {formatCurrency(t.collected)} /{" "}
                              {formatCurrency(t.billed)}
                            </p>{" "}
                            <p className="text-xs font-medium text-ink-700">
                              {rate}%
                            </p>{" "}
                          </div>{" "}
                          <div className="mt-2 h-1.5 bg-surface-3 rounded overflow-hidden">
                            {" "}
                            <div
                              className="h-full bg-success-500 rounded"
                              style={{ width: `${rate}%` }}
                            />{" "}
                          </div>{" "}
                        </div>
                      );
                    })}{" "}
                  </div>
                )}{" "}
              </CardBody>{" "}
            </Card>{" "}
            <Card>
              {" "}
              <CardHeader>
                {" "}
                <CardTitle>6-month collection trend</CardTitle>{" "}
                <CardDescription>
                  Total collected per month
                </CardDescription>{" "}
              </CardHeader>{" "}
              <CardBody>
                {" "}
                {monthTrend.length === 0 ? (
                  <EmptyState
                    title="No payment history yet"
                    description="Record payments to see the trend."
                  />
                ) : (
                  <div className="flex items-end justify-between gap-2 h-40">
                    {" "}
                    {monthTrend.map((t) => (
                      <div
                        key={t.month}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        {" "}
                        <div
                          className="w-full bg-brand-100 rounded-t-md flex items-end"
                          style={{ height: "100%" }}
                        >
                          {" "}
                          <div
                            className="w-full bg-brand-600 rounded-t-md transition-all"
                            style={{
                              height: `${(t.collected / maxTrend) * 100}%`,
                            }}
                            title={formatCurrency(t.collected)}
                          />{" "}
                        </div>{" "}
                        <span className="text-xs text-ink-500">
                          {formatMonth(t.month)}
                        </span>{" "}
                      </div>
                    ))}{" "}
                  </div>
                )}{" "}
              </CardBody>{" "}
            </Card>{" "}
          </div>{" "}
          <Card>
            {" "}
            <CardHeader>
              {" "}
              <CardTitle>Export reports</CardTitle>{" "}
              <CardDescription>
                Download CSV files for accounting or sharing
              </CardDescription>{" "}
            </CardHeader>{" "}
            <CardBody className="flex flex-wrap gap-3">
              {" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportInvoicesCsv(invoices)}
              >
                {" "}
                <Download size={15} /> Monthly statement{" "}
              </Button>{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDefaultersCsv(invoices)}
              >
                {" "}
                <Download size={15} /> Defaulter report{" "}
              </Button>{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPaymentsCsv(payments, flatMap)}
                disabled={pLoading}
              >
                {" "}
                <Download size={15} /> All payments{" "}
              </Button>{" "}
            </CardBody>{" "}
          </Card>{" "}
        </>
      )}{" "}
    </div>
  );
}
