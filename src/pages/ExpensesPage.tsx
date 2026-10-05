import { useMemo, useState } from "react";
import { TrendingDown, Plus, Trash2, Search, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useExpenses } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, currentMonthKey } from "@/lib/format";
import { logAudit } from "@/lib/invoices";
import type { ExpenseCategory } from "@/lib/types";
const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "maintenance", label: "Maintenance" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "repairs", label: "Repairs" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];
export function ExpensesPage() {
  const { societyId, loading, error, reload } = useSocietyData();
  const {
    expenses,
    loading: eLoading,
    error: eError,
    reload: reloadE,
  } = useExpenses(societyId);
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const month = currentMonthKey().slice(0, 7);
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.expense_date.slice(0, 7) === month),
    [expenses, month],
  );
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const allTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(e.description ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, catFilter]);
  if (loading) return <PageLoader label="Loading expenses…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  function exportCsv() {
    const rows = [["Date", "Category", "Amount", "Description"]];
    for (const e of filtered) {
      rows.push([
        formatDate(e.expense_date),
        e.category,
        String(e.amount),
        e.description ?? "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">Expenses</h1>{" "}
          <p className="text-sm text-ink-500">
            Track maintenance, utility, and repair costs
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            {" "}
            <Download size={15} /> Export{" "}
          </Button>{" "}
          <Button size="sm" onClick={() => setModal(true)}>
            {" "}
            <Plus size={15} /> Add expense{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {" "}
        <StatCard
          label="This month"
          value={formatCurrency(monthTotal)}
          icon={<TrendingDown size={18} />}
          tone="warning"
        />{" "}
        <StatCard
          label="All time"
          value={formatCurrency(allTotal)}
          icon={<TrendingDown size={18} />}
          tone="default"
        />{" "}
        <StatCard
          label="Entries"
          value={String(expenses.length)}
          icon={<TrendingDown size={18} />}
          tone="default"
        />{" "}
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
                placeholder="Search description…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="sm:w-44"
            >
              {" "}
              <option value="all">All categories</option>{" "}
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {eLoading ? (
            <PageLoader label="Loading…" />
          ) : eError ? (
            <ErrorBanner message={eError} onRetry={reloadE} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                expenses.length === 0
                  ? "No expenses recorded yet"
                  : "No expenses match your filters"
              }
              description={
                expenses.length === 0
                  ? "Add your first expense to start tracking costs."
                  : "Try adjusting the filters."
              }
              action={
                expenses.length === 0 ? (
                  <Button size="sm" onClick={() => setModal(true)}>
                    <Plus size={15} />
                    Add expense
                  </Button>
                ) : undefined
              }
              icon={<TrendingDown size={22} />}
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
                    <th className="text-left font-medium px-5 py-3">
                      Category
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Amount</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Description
                    </th>{" "}
                    <th className="px-5 py-3"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-ink-50">
                      {" "}
                      <td className="px-5 py-3 text-ink-700">
                        {formatDate(e.expense_date)}
                      </td>{" "}
                      <td className="px-5 py-3">
                        <Badge tone="neutral" className="capitalize">
                          {e.category}
                        </Badge>
                      </td>{" "}
                      <td className="px-5 py-3 font-mono font-semibold text-ink-900">
                        {formatCurrency(Number(e.amount))}
                      </td>{" "}
                      <td className="px-5 py-3 text-ink-600">
                        {e.description ?? "-"}
                      </td>{" "}
                      <td className="px-5 py-3 text-right">
                        {" "}
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this expense?")) return;
                            const { error } = await supabase
                              .from("expenses")
                              .delete()
                              .eq("id", e.id);
                            if (error) {
                              notify(error.message, "error");
                              return;
                            }
                            notify("Expense deleted.", "success");
                            reloadE();
                          }}
                          className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                          aria-label="Delete expense"
                        >
                          {" "}
                          <Trash2 size={15} />{" "}
                        </button>{" "}
                      </td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>
          )}{" "}
        </CardBody>{" "}
      </Card>{" "}
      {modal && (
        <ExpenseModal
          societyId={societyId!}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reloadE();
          }}
        />
      )}{" "}
    </div>
  );
}
function ExpenseModal({
  societyId,
  onClose,
  onSaved,
}: {
  societyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [category, setCategory] = useState<ExpenseCategory>("maintenance");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!amount || Number(amount) <= 0) {
      notify("Enter a valid amount.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      society_id: societyId,
      category,
      amount: Number(amount),
      description: description.trim() || null,
      expense_date: date,
    });
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    await logAudit(societyId, null, "create_expense", "expense", undefined, {
      category,
      amount,
    });
    notify("Expense added.", "success");
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Add expense"
      description="Record a maintenance, utility, or repair cost."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Add expense"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Category" required>
            {" "}
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {" "}
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Amount (₹)" required>
            {" "}
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <Field label="Date">
          {" "}
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />{" "}
        </Field>{" "}
        <Field label="Description">
          {" "}
          <Textarea
            rows={2}
            placeholder="e.g. Lobby painting, pump repair"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
