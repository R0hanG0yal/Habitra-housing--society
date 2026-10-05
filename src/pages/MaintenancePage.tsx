import { useMemo, useState } from "react";
import { Wrench, Plus, Trash2, Search, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useTickets } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";
import { logAudit } from "@/lib/invoices";
import type { TicketCategory, TicketStatus } from "@/lib/types";
const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "water", label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "plumbing", label: "Plumbing" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];
const STATUS_TONES: Record<
  TicketStatus,
  "neutral" | "info" | "paid" | "pending"
> = { open: "pending", assigned: "info", resolved: "paid", closed: "neutral" };
export function MaintenancePage() {
  const { societyId, flats, tenants, loading, error, reload } =
    useSocietyData();
  const {
    tickets,
    loading: tLoading,
    error: tError,
    reload: reloadT,
  } = useTickets(societyId);
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter]);
  if (loading) return <PageLoader label="Loading tickets…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "assigned",
  ).length;
  async function updateStatus(id: string, status: TicketStatus) {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved" || status === "closed")
      patch.resolved_at = new Date().toISOString();
    const { error } = await supabase
      .from("maintenance_tickets")
      .update(patch)
      .eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("Ticket updated.", "success");
    reloadT();
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Maintenance Tickets
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {tickets.length} tickets · {openCount} open
          </p>{" "}
        </div>{" "}
        <Button
          size="sm"
          onClick={() => setModal(true)}
          disabled={flats.length === 0}
        >
          {" "}
          <Plus size={15} /> New ticket{" "}
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
                placeholder="Search tickets…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-40"
            >
              {" "}
              <option value="all">All status</option>{" "}
              <option value="open">Open</option>{" "}
              <option value="assigned">Assigned</option>{" "}
              <option value="resolved">Resolved</option>{" "}
              <option value="closed">Closed</option>{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {tLoading ? (
            <PageLoader label="Loading…" />
          ) : tError ? (
            <ErrorBanner message={tError} onRetry={reloadT} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                tickets.length === 0
                  ? "No maintenance tickets yet"
                  : "No tickets match your filters"
              }
              description={
                tickets.length === 0
                  ? "Create a ticket for a repair or issue."
                  : "Try adjusting the filters."
              }
              action={
                tickets.length === 0 ? (
                  <Button size="sm" onClick={() => setModal(true)}>
                    <Plus size={15} />
                    New ticket
                  </Button>
                ) : undefined
              }
              icon={<Wrench size={22} />}
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {" "}
              {filtered.map((t) => (
                <div key={t.id} className="px-5 py-4">
                  {" "}
                  <div className="flex items-start justify-between gap-3">
                    {" "}
                    <div className="min-w-0">
                      {" "}
                      <div className="flex items-center gap-2 flex-wrap">
                        {" "}
                        <p className="text-sm font-medium text-ink-900">
                          {t.title}
                        </p>{" "}
                        <Badge
                          tone={STATUS_TONES[t.status]}
                          className="capitalize"
                        >
                          {t.status}
                        </Badge>{" "}
                        <Badge tone="neutral" className="capitalize">
                          {t.category}
                        </Badge>{" "}
                      </div>{" "}
                      <p className="text-xs text-ink-500 mt-1">
                        {" "}
                        {t.flats?.flat_no ?? "-"} · {t.tenants?.name ?? "-"} ·{" "}
                        {formatDateTime(t.created_at)}{" "}
                      </p>{" "}
                      {t.description && (
                        <p className="text-sm text-ink-600 mt-1.5">
                          {t.description}
                        </p>
                      )}{" "}
                      {t.assigned_to && (
                        <p className="text-xs text-ink-500 mt-1">
                          Assigned to: {t.assigned_to}
                        </p>
                      )}{" "}
                    </div>{" "}
                    <div className="flex items-center gap-1 shrink-0">
                      {" "}
                      {t.status !== "closed" && (
                        <Select
                          value={t.status}
                          onChange={(e) =>
                            updateStatus(t.id, e.target.value as TicketStatus)
                          }
                          className="h-8 text-xs w-28"
                        >
                          {" "}
                          <option value="open">Open</option>{" "}
                          <option value="assigned">Assigned</option>{" "}
                          <option value="resolved">Resolved</option>{" "}
                          <option value="closed">Closed</option>{" "}
                        </Select>
                      )}{" "}
                      {t.status === "resolved" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateStatus(t.id, "closed")}
                        >
                          {" "}
                          <CheckCircle2 size={14} /> Close{" "}
                        </Button>
                      )}{" "}
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this ticket?")) return;
                          const { error } = await supabase
                            .from("maintenance_tickets")
                            .delete()
                            .eq("id", t.id);
                          if (error) {
                            notify(error.message, "error");
                            return;
                          }
                          notify("Ticket deleted.", "success");
                          reloadT();
                        }}
                        className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                        aria-label="Delete ticket"
                      >
                        {" "}
                        <Trash2 size={15} />{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}{" "}
        </CardBody>{" "}
      </Card>{" "}
      {modal && (
        <TicketModal
          societyId={societyId!}
          flats={flats}
          tenants={tenants}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reloadT();
          }}
        />
      )}{" "}
    </div>
  );
}
function TicketModal({
  societyId,
  flats,
  tenants,
  onClose,
  onSaved,
}: {
  societyId: string;
  flats: { id: string; flat_no: string }[];
  tenants: { id: string; name: string; flat_id: string | null }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory>("plumbing");
  const [flatId, setFlatId] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const flatTenants = tenants.filter((t) => t.flat_id === flatId);
  async function save() {
    if (!title.trim()) {
      notify("Enter a title.", "error");
      return;
    }
    setSaving(true);
    const tenant = flatTenants[0];
    const { error } = await supabase.from("maintenance_tickets").insert({
      society_id: societyId,
      flat_id: flatId || null,
      tenant_id: tenant?.id ?? null,
      title: title.trim(),
      category,
      description: description.trim() || null,
      status: assignedTo ? "assigned" : "open",
      assigned_to: assignedTo.trim() || null,
    });
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    await logAudit(societyId, null, "create_ticket", "ticket", undefined, {
      title,
    });
    notify("Ticket created.", "success");
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="New maintenance ticket"
      description="Log a repair or issue raised by a tenant."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Create ticket"}
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
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Category">
            {" "}
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              {" "}
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Assign to unit">
            {" "}
            <Select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
              {" "}
              <option value="">-- No unit --</option>{" "}
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flat_no}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
        </div>{" "}
        <Field label="Description">
          {" "}
          <Textarea
            rows={3}
            placeholder="Describe the issue…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />{" "}
        </Field>{" "}
        <Field label="Assign to staff (optional)">
          {" "}
          <Input
            placeholder="e.g. Ramesh (plumber)"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
