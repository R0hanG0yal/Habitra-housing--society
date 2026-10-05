import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Home as HomeIcon,
  IndianRupee,
} from "lucide-react";
import { useWallet, useInvoices } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Field } from "@/components/ui/Field";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/format";
import type { WalletTransaction } from "@/lib/roles";

export function WalletPage() {
  const { role, society } = useAuth();
  const societyId = society?.id ?? null;
  const { wallet, transactions, loading, error, reload, topUp, payFromWallet } =
    useWallet();
  const { invoices } = useInvoices(societyId);
  const { notify } = useToast();
  const [topUpModal, setTopUpModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");

  async function handleTopUp() {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      notify("Enter a valid amount.", "error");
      return;
    }
    setSubmitting(true);
    const res = await topUp(amount);
    setSubmitting(false);
    if (res.error) {
      notify(res.error, "error");
    } else {
      notify(`₹${amount.toLocaleString("en-IN")} added to wallet.`, "success");
      setTopUpModal(false);
      setTopUpAmount("");
    }
  }

  async function handlePayInvoice() {
    if (!selectedInvoiceId) return;
    const inv = unpaidInvoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;
    const amount = Number(inv.amount) + Number(inv.late_fee_applied);
    const purpose =
      role === "tenant"
        ? ("rent_payment" as const)
        : ("maintenance_payment" as const);

    setSubmitting(true);
    const res = await payFromWallet(
      amount,
      purpose,
      inv.id,
      `Payment for ${inv.flats?.flat_no ?? "unit"} - ${inv.month}`,
    );
    setSubmitting(false);
    if (res.error) {
      notify(res.error, "error");
    } else {
      notify(
        `Payment of ₹${amount.toLocaleString("en-IN")} successful!`,
        "success",
      );
      setPayModal(false);
      setSelectedInvoiceId(null);
    }
  }

  if (loading) return <PageLoader label="Loading wallet…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;

  const balance = wallet?.balance ?? 0;
  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Wallet</h1>
          <p className="text-sm text-ink-500">
            Manage your balance, payments, and transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setTopUpModal(true)}
          >
            <Plus size={15} /> Add Money
          </Button>
          {unpaidInvoices.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPayModal(true)}
            >
              <CreditCard size={15} /> Pay Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success-500/15 flex items-center justify-center">
              <Wallet size={24} className="text-success-500" />
            </div>
            <div>
              <p className="text-xs text-ink-500">Current Balance</p>
              <p className="text-2xl font-bold font-mono text-ink-900 tabular-nums">
                {formatCurrency(balance)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success-500/15 flex items-center justify-center">
              <TrendingUp size={24} className="text-success-500" />
            </div>
            <div>
              <p className="text-xs text-ink-500">Total Credits</p>
              <p className="text-lg font-bold font-mono text-success-500 tabular-nums">
                +{formatCurrency(totalCredits)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand-600/15 flex items-center justify-center">
              <TrendingDown size={24} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-ink-500">Total Debits</p>
              <p className="text-lg font-bold font-mono text-brand-600 tabular-nums">
                -{formatCurrency(totalDebits)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>
              Invoices you can pay from your wallet
            </CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line-strong">
              {unpaidInvoices.slice(0, 5).map((inv) => {
                const total = Number(inv.amount) + Number(inv.late_fee_applied);
                const canPay = balance >= total;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {inv.flats?.flat_no ?? "-"} · {inv.month}
                      </p>
                      <p className="text-xs text-ink-500">
                        Due {formatDate(inv.due_date)}
                        {Number(inv.late_fee_applied) > 0 &&
                          ` · Late fee: ${formatCurrency(Number(inv.late_fee_applied))}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold text-ink-900 tabular-nums">
                          {formatCurrency(total)}
                        </p>
                        <StatusBadge status={inv.status} />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!canPay}
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setPayModal(true);
                        }}
                      >
                        {canPay ? "Pay" : "Low Balance"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent wallet activity</CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Add money to your wallet to get started."
              icon={<Clock size={22} />}
            />
          ) : (
            <div className="divide-y divide-line-strong">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Top-Up Modal */}
      {topUpModal && (
        <Modal
          open
          onClose={() => setTopUpModal(false)}
          title="Add Money to Wallet"
          description="Enter the amount you want to add."
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTopUpModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTopUp}
                disabled={submitting || !topUpAmount}
              >
                {submitting ? "Processing…" : "Add Money"}
              </Button>
            </>
          }
        >
          <Field label="Amount (₹)" required>
            <Input
              type="number"
              min="1"
              step="1"
              autoFocus
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </Field>
          <div className="flex gap-2 mt-3">
            {[500, 1000, 5000, 10000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpAmount(String(amt))}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-3 hover:bg-surface-3 border border-line-strong text-ink-900 transition"
              >
                ₹{amt.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Pay Invoice Modal */}
      {payModal && (
        <Modal
          open
          onClose={() => {
            setPayModal(false);
            setSelectedInvoiceId(null);
          }}
          title="Pay Invoice from Wallet"
          description="Select an invoice to pay."
          size="sm"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setPayModal(false);
                  setSelectedInvoiceId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayInvoice}
                disabled={submitting || !selectedInvoiceId}
              >
                {submitting ? "Processing…" : "Confirm Payment"}
              </Button>
            </>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unpaidInvoices.map((inv) => {
              const total = Number(inv.amount) + Number(inv.late_fee_applied);
              const isSelected = selectedInvoiceId === inv.id;
              const canAfford = balance >= total;
              return (
                <button
                  key={inv.id}
                  disabled={!canAfford}
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`w-full p-3 rounded-md border text-left transition ${
                    isSelected
                      ? "bg-brand-600 text-white border-brand-600"
                      : canAfford
                        ? "bg-surface-3 hover:bg-surface-3 border-line-strong text-ink-900"
                        : "bg-surface-3/50 border-line-strong/50 text-ink-500 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-semibold ${isSelected ? "text-white" : ""}`}
                      >
                        {inv.flats?.flat_no ?? "-"} · {inv.month}
                      </p>
                      <p
                        className={`text-xs ${isSelected ? "text-white/70" : "text-ink-500"}`}
                      >
                        {canAfford
                          ? `Due ${formatDate(inv.due_date)}`
                          : "Insufficient balance"}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-mono font-bold tabular-nums ${isSelected ? "text-white" : ""}`}
                    >
                      {formatCurrency(total)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedInvoiceId && (
            <div className="mt-3 p-3 rounded-md bg-surface-3 border border-line-strong text-xs text-ink-900">
              <p className="font-semibold">After payment:</p>
              <p className="font-mono tabular-nums mt-1">
                Balance: {formatCurrency(balance)} →{" "}
                {formatCurrency(
                  balance -
                    (Number(
                      unpaidInvoices.find((i) => i.id === selectedInvoiceId)
                        ?.amount ?? 0,
                    ) +
                      Number(
                        unpaidInvoices.find((i) => i.id === selectedInvoiceId)
                          ?.late_fee_applied ?? 0,
                      )),
                )}
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === "credit";
  const purposeLabels: Record<string, string> = {
    rent_payment: "Rent Payment",
    maintenance_payment: "Maintenance Payment",
    deposit: "Security Deposit",
    refund: "Refund",
    topup: "Wallet Top-up",
    payout: "Payout",
    penalty: "Penalty",
  };

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            isCredit
              ? "bg-success-500/15 text-success-500"
              : "bg-brand-600/15 text-brand-600"
          }`}
        >
          {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">
            {purposeLabels[tx.purpose] ?? tx.purpose}
          </p>
          <p className="text-xs text-ink-500 truncate">
            {tx.description ?? formatDate(tx.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p
          className={`text-sm font-mono font-semibold tabular-nums ${
            isCredit ? "text-success-500" : "text-brand-600"
          }`}
        >
          {isCredit ? "+" : "-"}
          {formatCurrency(Number(tx.amount))}
        </p>
        <p className="text-[10px] text-ink-500">{formatDate(tx.created_at)}</p>
      </div>
    </div>
  );
}
