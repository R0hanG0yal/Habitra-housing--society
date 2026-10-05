import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Wallet,
  Receipt,
  Wrench,
  FileText,
  Phone,
  LogOut,
  ArrowRight,
  Download,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/ui/Logo";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  currentMonthKey,
  daysOverdue,
} from "@/lib/format";
import { generateReceiptPdf } from "@/lib/receipt";
import type {
  Tenant,
  Flat,
  Society,
  InvoiceWithRelations,
  Payment,
  MaintenanceTicket,
  MaintenanceTicketWithRelations,
  DocumentRecord,
} from "@/lib/types";
type TenantSession = { tenant: Tenant; flat: Flat | null; society: Society };
export function TenantPortalPage() {
  const { notify } = useToast();
  const [phone, setPhone] = useState("");
  const [session, setSession] = useState<TenantSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "dues" | "history" | "complaints" | "documents"
  >("dues");
  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) {
      setError("Enter your registered phone number.");
      return;
    }
    setLoading(true);
    try {
      const cleanDigits = phone.replace(/\D/g, "");
      const variants = [
        cleanDigits,
        cleanDigits.replace(/^91/, ""),
        cleanDigits.length === 10 ? "91" + cleanDigits : cleanDigits,
      ];
      let tenantData: Tenant | null = null;
      for (const v of variants) {
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .eq("phone", v)
          .maybeSingle();
        if (data) {
          tenantData = data as Tenant;
          break;
        }
      }
      if (!tenantData) {
        setError(
          "No tenant found with this phone number. Please check and try again.",
        );
        setLoading(false);
        return;
      }
      const { data: flatData } = await supabase
        .from("flats")
        .select("*")
        .eq("id", tenantData.flat_id ?? "")
        .maybeSingle();
      const { data: socData } = await supabase
        .from("societies")
        .select("*")
        .eq("id", tenantData.society_id)
        .maybeSingle();
      setSession({
        tenant: tenantData,
        flat: flatData as Flat | null,
        society:
          (socData as Society | null) ??
          ({
            id: tenantData.society_id,
            name: "Society",
            address: null,
            admin_id: "",
            created_at: "",
          } as Society),
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        {" "}
        <div className="w-full max-w-md bg-surface-2 rounded-xl shadow-xs border border-line-strong p-8 animate-slide-up text-ink-900">
          {" "}
          <div className="flex flex-col items-center text-center mb-6">
            {" "}
            <Logo
              variant="stacked"
              theme="light"
              size="sm"
              tagline="Resident & Tenant Self-Service Portal"
            />{" "}
          </div>{" "}
          <form onSubmit={lookup} className="space-y-4">
            {" "}
            <Field
              label="Your registered phone number"
              required
              hint="Enter the number your landlord has on file"
            >
              {" "}
              <div className="relative">
                {" "}
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
                />{" "}
                <Input
                  className="pl-9 bg-canvas/40 border-line-strong text-ink-900 placeholder:text-ink-500"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />{" "}
              </div>{" "}
            </Field>{" "}
            {error && (
              <div className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm">
                {error}
              </div>
            )}{" "}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
              disabled={loading}
            >
              {" "}
              {loading ? "Looking up…" : "Access my account"}{" "}
              {!loading && <ArrowRight size={16} />}{" "}
            </Button>{" "}
          </form>{" "}
          <p className="mt-6 text-xs text-ink-500 text-center">
            {" "}
            No password needed. We look you up by your registered WhatsApp
            number.{" "}
          </p>{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <TenantDashboard
      session={session}
      onLogout={() => {
        setSession(null);
        setPhone("");
      }}
      tab={tab}
      setTab={setTab}
      notify={notify}
    />
  );
}
function TenantDashboard({
  session,
  onLogout,
  tab,
  setTab,
  notify,
}: {
  session: TenantSession;
  onLogout: () => void;
  tab: "dues" | "history" | "complaints" | "documents";
  setTab: (t: "dues" | "history" | "complaints" | "documents") => void;
  notify: (msg: string, kind?: "success" | "error" | "info") => void;
}) {
  const { tenant, flat, society } = session;
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicketWithRelations[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintModal, setComplaintModal] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, tickRes, docRes] = await Promise.all([
        supabase
          .from("invoices")
          .select(
            "*, flats(id,flat_no,tower_id), tenants(id,name,phone), payments(*)",
          )
          .eq("tenant_id", tenant.id)
          .order("month", { ascending: false }),
        supabase
          .from("maintenance_tickets")
          .select("*, flats(id,flat_no), tenants(id,name)")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("documents")
          .select("*")
          .eq("entity_type", "tenant")
          .eq("entity_id", tenant.id)
          .order("uploaded_at", { ascending: false }),
      ]);
      setInvoices((invRes.data ?? []) as InvoiceWithRelations[]);
      setTickets((tickRes.data ?? []) as MaintenanceTicketWithRelations[]);
      setDocuments((docRes.data ?? []) as DocumentRecord[]);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);
  useEffect(() => {
    load();
  }, [load]);
  const month = currentMonthKey();
  const currentInvoices = invoices.filter((i) => i.month === month);
  const totalDue = invoices.reduce(
    (s, i) =>
      i.status !== "paid"
        ? s +
          Number(i.amount) +
          Number(i.late_fee_applied) -
          (i.payments?.reduce((p, x) => p + Number(x.amount), 0) ?? 0)
        : s,
    0,
  );
  const totalPaid = invoices.reduce(
    (s, i) => s + (i.payments?.reduce((p, x) => p + Number(x.amount), 0) ?? 0),
    0,
  );
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const tabs = [
    { id: "dues" as const, label: "Current Dues", icon: <Wallet size={15} /> },
    {
      id: "history" as const,
      label: "Payment History",
      icon: <Receipt size={15} />,
    },
    {
      id: "complaints" as const,
      label: "My Complaints",
      icon: <Wrench size={15} />,
    },
    {
      id: "documents" as const,
      label: "Documents",
      icon: <FileText size={15} />,
    },
  ];
  return (
    <div className="min-h-screen bg-canvas">
      {" "}
      <header className="sticky top-0 z-30 bg-surface-2 text-ink-900 px-4 lg:px-8 h-14 flex items-center justify-between border-b border-line-strong">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <Logo variant="icon" size="sm" />{" "}
          <div className="border-l border-line-strong pl-3">
            {" "}
            <p className="text-sm font-semibold text-ink-900">
              {society.name}
            </p>{" "}
            <p className="text-xs text-ink-500">
              Tenant Portal · {flat?.flat_no ?? "-"}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <span className="text-sm text-ink-500 hidden sm:block">
            {tenant.name}
          </span>{" "}
          <button
            onClick={onLogout}
            className="text-ink-900 hover:bg-surface-3/50 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition"
          >
            {" "}
            <LogOut size={15} /> Exit{" "}
          </button>{" "}
        </div>{" "}
      </header>{" "}
      <main className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Welcome, {tenant.name}
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {flat?.flat_no ?? "-"} · {society.name}
          </p>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {" "}
          <StatCard
            label="Total outstanding"
            value={formatCurrency(totalDue)}
            icon={<AlertTriangle size={18} />}
            tone={totalDue > 0 ? "warning" : "success"}
          />{" "}
          <StatCard
            label="Total paid (all time)"
            value={formatCurrency(totalPaid)}
            icon={<CheckCircle2 size={18} />}
            tone="success"
          />{" "}
          <StatCard
            label="Overdue invoices"
            value={String(overdueCount)}
            icon={<Wallet size={18} />}
            tone={overdueCount > 0 ? "danger" : "default"}
          />{" "}
        </div>{" "}
        <div className="flex gap-1 border-b border-line-strong overflow-x-auto">
          {" "}
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-md whitespace-nowrap transition ${tab === t.id ? "border-brand-600 text-brand-600 bg-surface-2/30 font-semibold" : "border-transparent text-white/90 hover:text-white"}`}
            >
              {" "}
              {t.icon} {t.label}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        {loading ? (
          <PageLoader label="Loading…" />
        ) : tab === "dues" ? (
          <Card>
            {" "}
            <CardHeader>
              <CardTitle>Current month dues</CardTitle>
              <CardDescription>{formatMonth(month)}</CardDescription>
            </CardHeader>{" "}
            <CardBody className="p-0">
              {" "}
              {currentInvoices.length === 0 ? (
                <EmptyState
                  title="No dues this month"
                  description="Invoices haven't been generated yet for this month."
                  icon={<Wallet size={22} />}
                />
              ) : (
                <div className="divide-y divide-line-strong">
                  {" "}
                  {currentInvoices.map((inv) => {
                    const total =
                      Number(inv.amount) + Number(inv.late_fee_applied);
                    const paid =
                      inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ??
                      0;
                    const balance = total - paid;
                    const overdueDays = daysOverdue(inv.due_date);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between px-5 py-4"
                      >
                        {" "}
                        <div>
                          {" "}
                          <p className="text-sm font-medium text-ink-900">
                            {formatMonth(inv.month)}
                          </p>{" "}
                          <p className="text-xs text-ink-500">
                            Due {formatDate(inv.due_date)}{" "}
                            {overdueDays > 0 && inv.status !== "paid" && (
                              <span className="text-brand-600 font-semibold">
                                · {overdueDays}d overdue
                              </span>
                            )}
                          </p>{" "}
                          {inv.late_fee_applied > 0 && (
                            <p className="text-xs text-brand-600 font-medium mt-0.5">
                              Late fee:{" "}
                              {formatCurrency(Number(inv.late_fee_applied))}
                            </p>
                          )}{" "}
                        </div>{" "}
                        <div className="text-right">
                          {" "}
                          <p className="text-sm font-mono font-semibold text-ink-900">
                            {formatCurrency(balance)}
                          </p>{" "}
                          <StatusBadge status={inv.status} />{" "}
                        </div>{" "}
                      </div>
                    );
                  })}{" "}
                </div>
              )}{" "}
            </CardBody>{" "}
          </Card>
        ) : tab === "history" ? (
          <Card>
            {" "}
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>
                All payments recorded for your unit
              </CardDescription>
            </CardHeader>{" "}
            <CardBody className="p-0">
              {" "}
              {invoices.filter((i) => i.payments && i.payments.length > 0)
                .length === 0 ? (
                <EmptyState
                  title="No payments yet"
                  description="Your payment history will appear here once payments are recorded."
                  icon={<Receipt size={22} />}
                />
              ) : (
                <div className="divide-y divide-line-strong">
                  {" "}
                  {invoices
                    .filter((i) => i.payments && i.payments.length > 0)
                    .flatMap((inv) =>
                      (inv.payments ?? []).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-5 py-3"
                        >
                          {" "}
                          <div>
                            {" "}
                            <p className="text-sm font-medium text-ink-900">
                              {formatCurrency(Number(p.amount))}
                            </p>{" "}
                            <p className="text-xs text-ink-500">
                              {formatDate(p.paid_on)} · {p.mode.toUpperCase()} ·{" "}
                              {formatMonth(inv.month)}
                            </p>{" "}
                            {p.reference_no && (
                              <p className="text-xs text-ink-500 font-mono">
                                Ref: {p.reference_no}
                              </p>
                            )}{" "}
                          </div>{" "}
                          <div className="flex items-center gap-2">
                            {" "}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-ink-900 hover:bg-surface-3/50"
                              onClick={() => {
                                generateReceiptPdf(society, p, {
                                  flat_no: flat?.flat_no ?? "-",
                                  month: inv.month,
                                  tenant_name: tenant.name,
                                  rent_amount: inv.rent_amount ?? undefined,
                                  maintenance_amount:
                                    inv.maintenance_amount ?? undefined,
                                });
                                notify("Receipt downloaded.", "success");
                              }}
                            >
                              {" "}
                              <Download size={14} /> Receipt{" "}
                            </Button>{" "}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-line-strong text-ink-900 hover:bg-surface-3/30"
                              onClick={async () => {
                                const { generateHraRentPdf } =
                                  await import("@/lib/receipt");
                                await generateHraRentPdf(
                                  society,
                                  { name: tenant.name, phone: tenant.phone },
                                  flat?.flat_no ?? "-",
                                  {
                                    name: "Registered Flat Owner",
                                    pan_no: "ABCDE1234F",
                                  },
                                  inv.month,
                                  inv.rent_amount || Number(p.amount),
                                  p.paid_on,
                                );
                                notify(
                                  "Official HRA Rent Receipt (Sec 10(13A)) downloaded.",
                                  "success",
                                );
                              }}
                            >
                              {" "}
                              <FileText size={14} /> HRA Receipt{" "}
                            </Button>{" "}
                          </div>{" "}
                        </div>
                      )),
                    )}{" "}
                </div>
              )}{" "}
            </CardBody>{" "}
          </Card>
        ) : tab === "complaints" ? (
          <Card>
            {" "}
            <CardHeader className="flex items-center justify-between">
              {" "}
              <div>
                <CardTitle>My complaints</CardTitle>
                <CardDescription>
                  Raise and track maintenance issues
                </CardDescription>
              </div>{" "}
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 text-white"
                onClick={() => setComplaintModal(true)}
              >
                <Plus size={15} /> New complaint
              </Button>{" "}
            </CardHeader>{" "}
            <CardBody className="p-0">
              {" "}
              {tickets.length === 0 ? (
                <EmptyState
                  title="No complaints raised yet"
                  description="Raise a maintenance issue and track its status here."
                  action={
                    <Button
                      size="sm"
                      className="bg-brand-600 hover:bg-brand-700 text-white"
                      onClick={() => setComplaintModal(true)}
                    >
                      <Plus size={15} /> New complaint
                    </Button>
                  }
                  icon={<Wrench size={22} />}
                />
              ) : (
                <div className="divide-y divide-line-strong">
                  {" "}
                  {tickets.map((t) => (
                    <div key={t.id} className="px-5 py-4">
                      {" "}
                      <div className="flex items-center gap-2 flex-wrap">
                        {" "}
                        <p className="text-sm font-medium text-ink-900">
                          {t.title}
                        </p>{" "}
                        <Badge
                          tone={
                            t.status === "open"
                              ? "pending"
                              : t.status === "assigned"
                                ? "info"
                                : t.status === "resolved"
                                  ? "paid"
                                  : "neutral"
                          }
                          className="capitalize"
                        >
                          {t.status}
                        </Badge>{" "}
                        <Badge tone="neutral" className="capitalize">
                          {t.category}
                        </Badge>{" "}
                      </div>{" "}
                      {t.description && (
                        <p className="text-sm text-ink-500 mt-1">
                          {t.description}
                        </p>
                      )}{" "}
                      <p className="text-xs text-ink-500 mt-1">
                        Raised {formatDate(t.created_at)}
                        {t.assigned_to ? ` · Assigned to ${t.assigned_to}` : ""}
                      </p>{" "}
                    </div>
                  ))}{" "}
                </div>
              )}{" "}
            </CardBody>{" "}
          </Card>
        ) : (
          <Card>
            {" "}
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Agreements, KYC, and bills shared by your landlord
              </CardDescription>
            </CardHeader>{" "}
            <CardBody className="p-0">
              {" "}
              {documents.length === 0 ? (
                <EmptyState
                  title="No documents shared yet"
                  description="Your landlord can share rental agreements, KYC, and bills here."
                  icon={<FileText size={22} />}
                />
              ) : (
                <div className="divide-y divide-line-strong">
                  {" "}
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      {" "}
                      <div>
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <p className="text-sm font-medium text-ink-900">
                            {d.file_name}
                          </p>{" "}
                          <Badge tone="neutral" className="capitalize">
                            {d.doc_type}
                          </Badge>{" "}
                        </div>{" "}
                        <p className="text-xs text-ink-500">
                          Uploaded {formatDate(d.uploaded_at)}
                        </p>{" "}
                      </div>{" "}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ink-900 hover:bg-surface-3/50"
                        onClick={async () => {
                          const { data, error } = await supabase.storage
                            .from("documents")
                            .createSignedUrl(d.storage_path, 60);
                          if (error) {
                            notify(error.message, "error");
                            return;
                          }
                          window.open(data.signedUrl, "_blank");
                        }}
                      >
                        {" "}
                        <Download size={14} /> Download{" "}
                      </Button>{" "}
                    </div>
                  ))}{" "}
                </div>
              )}{" "}
            </CardBody>{" "}
          </Card>
        )}{" "}
      </main>{" "}
      {/* Tenant Portal Corporate Footer */}{" "}
      <footer className="border-t border-line-strong bg-surface-2 py-6 px-4 lg:px-8 mt-12 text-xs text-ink-900">
        {" "}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {" "}
          <div className="text-center sm:text-left space-y-0.5">
            {" "}
            <p className="font-semibold text-ink-900">
              Habitra Technologies Private Limited
            </p>{" "}
            <p className="text-[11px] text-ink-500">
              CIN: U72900KA2024PTC189021 · Bengaluru, India
            </p>{" "}
            <p className="text-[11px] text-success-500 font-medium">
              DPDP Act 2023 Compliant · 90-Day Auto-Purge Protocol
            </p>{" "}
          </div>{" "}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            {" "}
            <a
              href="/privacy"
              className="hover:text-brand-600 hover:underline transition"
            >
              Privacy Policy
            </a>{" "}
            <span className="text-ink-400">•</span>{" "}
            <a
              href="/terms"
              className="hover:text-brand-600 hover:underline transition"
            >
              Terms of Service
            </a>{" "}
            <span className="text-ink-400">•</span>{" "}
            <a
              href="/refund"
              className="hover:text-brand-600 hover:underline transition"
            >
              Refund Policy
            </a>{" "}
            <span className="text-ink-400">•</span>{" "}
            <a
              href="/cookies"
              className="hover:text-brand-600 hover:underline transition"
            >
              Cookie Policy
            </a>{" "}
          </div>{" "}
        </div>{" "}
      </footer>{" "}
      {complaintModal && (
        <ComplaintModal
          tenant={tenant}
          flat={flat}
          societyId={society.id}
          onClose={() => setComplaintModal(false)}
          onSaved={() => {
            setComplaintModal(false);
            load();
            notify("Complaint raised.", "success");
          }}
        />
      )}{" "}
    </div>
  );
}
function ComplaintModal({
  tenant,
  flat,
  societyId,
  onClose,
  onSaved,
}: {
  tenant: Tenant;
  flat: Flat | null;
  societyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<MaintenanceTicket["category"]>("plumbing");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!title.trim()) {
      notify("Enter a title.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("maintenance_tickets").insert({
      society_id: societyId,
      flat_id: flat?.id ?? null,
      tenant_id: tenant.id,
      title: title.trim(),
      category,
      description: description.trim() || null,
      status: "open",
    });
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Raise a complaint"
      description="Report a maintenance issue in your unit"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Submitting…" : "Submit complaint"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <Field label="Title" required>
          {" "}
          <Input
            autoFocus
            placeholder="e.g. Kitchen tap leaking"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />{" "}
        </Field>{" "}
        <Field label="Category">
          {" "}
          <Select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as MaintenanceTicket["category"])
            }
          >
            {" "}
            <option value="water">Water</option>{" "}
            <option value="electricity">Electricity</option>{" "}
            <option value="plumbing">Plumbing</option>{" "}
            <option value="cleaning">Cleaning</option>{" "}
            <option value="security">Security</option>{" "}
            <option value="other">Other</option>{" "}
          </Select>{" "}
        </Field>{" "}
        <Field label="Description">
          {" "}
          <Textarea
            rows={4}
            placeholder="Describe the issue in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
