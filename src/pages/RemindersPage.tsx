import { useMemo, useState } from "react";
import {
  MessageCircle,
  Send,
  AlertTriangle,
  Bell,
  Search,
  Megaphone,
  Pencil,
} from "lucide-react";
import { useSocietyData, useInvoices, useReminders } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatDateTime,
  currentMonthKey,
  daysOverdue,
  whatsappLink,
} from "@/lib/format";
import { buildReminderMessage } from "@/lib/messages";
import { logReminder } from "@/lib/invoices";
import type { InvoiceWithRelations, Society } from "@/lib/types";
export function RemindersPage() {
  const { society, societyId, settings, loading, error, reload } =
    useSocietyData();
  const { notify } = useToast();
  const month = currentMonthKey();
  const {
    invoices,
    loading: invLoading,
    reload: reloadInv,
  } = useInvoices(societyId, month);
  const {
    reminders,
    loading: rLoading,
    reload: reloadR,
  } = useReminders(societyId);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState<{
    invoice: InvoiceWithRelations;
    kind: "reminder" | "overdue";
  } | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const pending = useMemo(
    () => invoices.filter((i) => i.status !== "paid" && i.tenants?.phone),
    [invoices],
  );
  const filtered = useMemo(() => {
    if (!search) return pending;
    const q = search.toLowerCase();
    return pending.filter(
      (i) =>
        (i.flats?.flat_no ?? "").toLowerCase().includes(q) ||
        (i.tenants?.name ?? "").toLowerCase().includes(q),
    );
  }, [pending, search]);
  async function sendReminder(
    inv: InvoiceWithRelations,
    kind: "reminder" | "overdue",
    customMsg?: string,
  ) {
    const template =
      kind === "overdue"
        ? settings?.overdue_template
        : settings?.reminder_template;
    if (!template || !inv.tenants?.phone) return;
    const msg =
      customMsg ??
      buildReminderMessage(
        template,
        society!,
        inv.tenants,
        inv.flats?.flat_no ?? "",
        inv,
      );
    await logReminder(societyId!, inv.id, kind, msg);
    window.open(whatsappLink(inv.tenants.phone, msg), "_blank");
    notify("Reminder sent.", "success");
    reloadR();
  }
  async function remindAll() {
    let count = 0;
    for (const inv of pending) {
      const kind = inv.status === "overdue" ? "overdue" : "reminder";
      const template =
        kind === "overdue"
          ? settings?.overdue_template
          : settings?.reminder_template;
      if (!template || !inv.tenants?.phone) continue;
      const msg = buildReminderMessage(
        template,
        society!,
        inv.tenants,
        inv.flats?.flat_no ?? "",
        inv,
      );
      await logReminder(societyId!, inv.id, kind, msg);
      window.open(whatsappLink(inv.tenants.phone, msg), "_blank");
      count++;
    }
    notify(`${count} reminder(s) opened in WhatsApp.`, "success");
    reloadR();
  }
  if (loading) return <PageLoader label="Loading reminders…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            WhatsApp Reminders
          </h1>{" "}
          <p className="text-sm text-ink-500">
            Send rent reminders, due notices, and receipts directly to tenants
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBroadcastOpen(true)}
          >
            {" "}
            <Megaphone size={15} /> Broadcast notice{" "}
          </Button>{" "}
          <Button size="sm" onClick={remindAll} disabled={pending.length === 0}>
            {" "}
            <Send size={15} /> Remind all ({pending.length}){" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong shadow-xs p-5 text-ink-900">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-10 h-10 rounded-lg bg-canvas text-ink-600 ring-1 ring-line-strong flex items-center justify-center">
              <Bell size={18} />
            </div>{" "}
            <div>
              {" "}
              <p className="text-xs text-ink-500 uppercase tracking-wide">
                Pending reminders
              </p>{" "}
              <p className="text-2xl font-bold text-ink-900 font-mono">
                {pending.length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong shadow-xs p-5 text-ink-900">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>{" "}
            <div>
              {" "}
              <p className="text-xs text-ink-500 uppercase tracking-wide">
                Overdue
              </p>{" "}
              <p className="text-2xl font-bold text-ink-900 font-mono">
                {pending.filter((i) => i.status === "overdue").length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong shadow-xs p-5 text-ink-900">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-10 h-10 rounded-lg bg-success-500 text-white flex items-center justify-center">
              <MessageCircle size={18} />
            </div>{" "}
            <div>
              {" "}
              <p className="text-xs text-ink-500 uppercase tracking-wide">
                Sent (all time)
              </p>{" "}
              <p className="text-2xl font-bold text-ink-900 font-mono">
                {reminders.length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {" "}
        <Card className="lg:col-span-2">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle>Send reminders</CardTitle>{" "}
            <CardDescription>
              {formatMonth(month)} · {pending.length} unpaid invoice(s)
            </CardDescription>{" "}
          </CardHeader>{" "}
          <CardBody className="p-0">
            {" "}
            {invLoading ? (
              <PageLoader label="Loading…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={
                  pending.length === 0
                    ? "No pending reminders"
                    : "No tenants match your search"
                }
                description={
                  pending.length === 0
                    ? "All occupied units are paid up this month."
                    : "Try a different search."
                }
                icon={<Bell size={22} />}
              />
            ) : (
              <>
                {" "}
                <div className="px-5 py-3 border-b border-ink-100">
                  {" "}
                  <div className="relative">
                    {" "}
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                    />{" "}
                    <Input
                      placeholder="Search unit or tenant…"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((inv) => {
                    const overdueDays = daysOverdue(inv.due_date);
                    const total =
                      Number(inv.amount) + Number(inv.late_fee_applied);
                    const paid =
                      inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ??
                      0;
                    const balance = total - paid;
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between px-5 py-3 gap-3"
                      >
                        {" "}
                        <div className="min-w-0">
                          {" "}
                          <div className="flex items-center gap-2">
                            {" "}
                            <p className="text-sm font-medium text-ink-900 truncate">
                              {inv.flats?.flat_no} · {inv.tenants?.name}
                            </p>{" "}
                            <StatusBadge status={inv.status} />{" "}
                          </div>{" "}
                          <p className="text-xs text-ink-500 mt-0.5">
                            {" "}
                            Due {formatDate(inv.due_date)} · Balance{" "}
                            {formatCurrency(balance)}{" "}
                            {overdueDays > 0 && (
                              <span className="text-red-600 ml-1">
                                · {overdueDays}d overdue
                              </span>
                            )}{" "}
                          </p>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-2 shrink-0">
                          {" "}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setCompose({ invoice: inv, kind: "reminder" })
                            }
                          >
                            {" "}
                            <Pencil size={14} /> Compose{" "}
                          </Button>{" "}
                          {inv.status === "overdue" && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => sendReminder(inv, "overdue")}
                            >
                              {" "}
                              <AlertTriangle size={14} /> Escalate{" "}
                            </Button>
                          )}{" "}
                        </div>{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
              </>
            )}{" "}
          </CardBody>{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CardHeader>
            {" "}
            <CardTitle>Recent reminders</CardTitle>{" "}
            <CardDescription>Last 100 sent</CardDescription>{" "}
          </CardHeader>{" "}
          <CardBody className="p-0">
            {" "}
            {rLoading ? (
              <PageLoader label="Loading…" />
            ) : reminders.length === 0 ? (
              <EmptyState
                title="No reminders sent yet"
                description="Sent reminders will appear here."
                icon={<Bell size={22} />}
              />
            ) : (
              <div className="divide-y divide-ink-100 max-h-96 overflow-y-auto">
                {" "}
                {reminders.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    {" "}
                    <div className="flex items-center justify-between">
                      {" "}
                      <p className="text-xs font-medium text-ink-900 capitalize">
                        {r.type}
                      </p>{" "}
                      <span className="text-xs text-ink-400">
                        {formatDateTime(r.sent_on)}
                      </span>{" "}
                    </div>{" "}
                    {r.message && (
                      <p className="text-xs text-ink-500 mt-1 line-clamp-2">
                        {r.message}
                      </p>
                    )}{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </CardBody>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-800">
        {" "}
        <p className="font-medium mb-1">How WhatsApp reminders work</p>{" "}
        <p className="text-brand-700 text-xs leading-relaxed">
          {" "}
          Clicking Compose lets you edit the message before sending. Clicking
          Remind All opens WhatsApp for each tenant with the message pre-filled.
          This uses WhatsApp's click- (wa.me) link, so no Business API approval
          is needed. For fully automated scheduled sending, connect the WhatsApp
          Business API under Settings.{" "}
        </p>{" "}
      </div>{" "}
      {compose && (
        <ComposeModal
          invoice={compose.invoice}
          kind={compose.kind}
          society={society!}
          template={
            compose.kind === "overdue"
              ? (settings?.overdue_template ?? "")
              : (settings?.reminder_template ?? "")
          }
          onClose={() => setCompose(null)}
          onSend={(msg) => {
            sendReminder(compose.invoice, compose.kind, msg);
            setCompose(null);
          }}
        />
      )}{" "}
      {broadcastOpen && (
        <BroadcastModal
          society={society!}
          pending={pending}
          onClose={() => setBroadcastOpen(false)}
          onSent={() => {
            setBroadcastOpen(false);
            reloadR();
          }}
        />
      )}{" "}
    </div>
  );
}
function ComposeModal({
  invoice,
  kind,
  society,
  template,
  onClose,
  onSend,
}: {
  invoice: InvoiceWithRelations;
  kind: "reminder" | "overdue";
  society: Society;
  template: string;
  onClose: () => void;
  onSend: (msg: string) => void;
}) {
  const defaultMsg = buildReminderMessage(
    template,
    society,
    invoice.tenants,
    invoice.flats?.flat_no ?? "",
    invoice,
  );
  const [msg, setMsg] = useState(defaultMsg);
  return (
    <Modal
      open
      onClose={onClose}
      title={
        kind === "overdue"
          ? "Compose escalation message"
          : "Compose reminder message"
      }
      description={`${invoice.flats?.flat_no ?? ""} · ${invoice.tenants?.name ?? ""}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSend(msg)}>
            <MessageCircle size={15} /> Send via WhatsApp
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-3">
        {" "}
        <Field
          label="Message"
          hint="Edit before sending. Placeholders are already filled in."
        >
          {" "}
          <Textarea
            rows={6}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />{" "}
        </Field>{" "}
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {" "}
          <MessageCircle size={13} className="text-emerald-600" /> Opens
          WhatsApp with this message pre-filled for{" "}
          {invoice.tenants?.phone ?? "the tenant"}.{" "}
        </div>{" "}
      </div>{" "}
    </Modal>
  );
}
function BroadcastModal({
  society,
  pending,
  onClose,
  onSent,
}: {
  society: Society;
  pending: InvoiceWithRelations[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { notify } = useToast();
  const [msg, setMsg] = useState(
    `Dear residents,\n\nThis is a notice from ${society.name}.\n\n[Write your announcement here - e.g. maintenance shutdown, event, policy update]\n\n- ${society.name}`,
  );
  const [sending, setSending] = useState(false);
  async function sendAll() {
    setSending(true);
    let count = 0;
    for (const inv of pending) {
      if (!inv.tenants?.phone) continue;
      window.open(whatsappLink(inv.tenants.phone, msg), "_blank");
      count++;
    }
    setSending(false);
    notify(`${count} broadcast message(s) opened in WhatsApp.`, "success");
    onSent();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Broadcast notice to all tenants"
      description={`Send the same message to ${pending.length} tenants with WhatsApp`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={sendAll} disabled={sending || !msg.trim()}>
            <Megaphone size={15} /> {sending ? "Opening…" : "Broadcast to all"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-3">
        {" "}
        <Field
          label="Notice message"
          hint="The same message is sent to every tenant with a WhatsApp number."
        >
          {" "}
          <Textarea
            rows={7}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
