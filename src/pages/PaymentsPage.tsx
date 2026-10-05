import { useMemo, useState } from "react";
import { Wallet, Search, Download } from "lucide-react";
import { useSocietyData, usePayments } from "@/lib/hooks";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import { exportPaymentsCsv } from "@/lib/export";
export function PaymentsPage() {
  const { societyId, flats, loading, error, reload } = useSocietyData();
  const {
    payments,
    loading: pLoading,
    error: pError,
    reload: reloadP,
  } = usePayments(societyId);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const flatMap = useMemo(() => new Map(flats.map((f) => [f.id, f])), [flats]);
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (modeFilter !== "all" && p.mode !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const inv = p.invoices;
        const flatNo = inv?.flat_id
          ? (flatMap.get(inv.flat_id)?.flat_no?.toLowerCase() ?? "")
          : "";
        const ref = (p.reference_no ?? "").toLowerCase();
        if (!flatNo.includes(q) && !ref.includes(q)) return false;
      }
      return true;
    });
  }, [payments, search, modeFilter, flatMap]);
  const total = filtered.reduce((s, p) => s + Number(p.amount), 0);
  if (loading) return <PageLoader label="Loading payments…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">Payments</h1>{" "}
          <p className="text-sm text-ink-500">
            {filtered.length} payments · {formatCurrency(total)} total
          </p>{" "}
        </div>{" "}
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportPaymentsCsv(filtered, flatMap)}
          disabled={filtered.length === 0}
        >
          {" "}
          <Download size={15} /> Export CSV{" "}
        </Button>{" "}
      </div>{" "}
      <Card>
        {" "}
        <CardHeader>
          {" "}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {" "}
            <div className="relative flex-1">
              {" "}
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />{" "}
              <Input
                placeholder="Search by flat or reference…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="sm:w-40"
            >
              {" "}
              <option value="all">All modes</option>{" "}
              <option value="upi">UPI</option>{" "}
              <option value="cash">Cash</option>{" "}
              <option value="bank">Bank</option>{" "}
              <option value="cheque">Cheque</option>{" "}
              <option value="online">Online</option>{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {pLoading ? (
            <PageLoader label="Loading payments…" />
          ) : pError ? (
            <ErrorBanner message={pError} onRetry={reloadP} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                payments.length === 0
                  ? "No payments recorded yet"
                  : "No payments match your filters"
              }
              description={
                payments.length === 0
                  ? "Record a payment from the Invoices page to see it here."
                  : "Try adjusting the filters."
              }
              icon={<Wallet size={22} />}
            />
          ) : (
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-sm">
                {" "}
                <thead className="bg-ink-50 text-xs text-ink-500 uppercase tracking-wide">
                  {" "}
                  <tr>
                    {" "}
                    <th className="text-left font-medium px-5 py-3">
                      Date
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Flat</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Invoice month
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Amount</th>{" "}
                    <th className="text-left font-medium px-5 py-3">Mode</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Reference
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((p) => {
                    const flat = p.invoices?.flat_id
                      ? flatMap.get(p.invoices.flat_id)
                      : null;
                    return (
                      <tr key={p.id} className="hover:bg-ink-50">
                        {" "}
                        <td className="px-5 py-3 text-ink-700">
                          {formatDate(p.paid_on)}
                        </td>{" "}
                        <td className="px-5 py-3 font-mono font-medium text-ink-900">
                          {flat?.flat_no ?? "-"}
                        </td>{" "}
                        <td className="px-5 py-3 text-ink-700">
                          {formatMonth(p.invoices?.month)}
                        </td>{" "}
                        <td className="px-5 py-3 font-mono font-semibold text-ink-900">
                          {formatCurrency(Number(p.amount))}
                        </td>{" "}
                        <td className="px-5 py-3">
                          <Badge tone="info">{p.mode.toUpperCase()}</Badge>
                        </td>{" "}
                        <td className="px-5 py-3 font-mono text-ink-600">
                          {p.reference_no ?? "-"}
                        </td>{" "}
                      </tr>
                    );
                  })}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>
          )}{" "}
        </CardBody>{" "}
      </Card>{" "}
    </div>
  );
}
