import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, whatsappLink } from "@/lib/format";
import { logAudit } from "@/lib/invoices";
import type { Tenant } from "@/lib/types";
import { saveLocalTenant, deleteLocalTenant } from "@/lib/localStore";
export function TenantsPage() {
  const { societyId, flats, tenants, loading, error, reload } =
    useSocietyData();
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");
  const flatMap = useMemo(() => new Map(flats.map((f) => [f.id, f])), [flats]);
  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.phone ?? "").includes(q) ||
        (t.email ?? "").toLowerCase().includes(q),
    );
  }, [tenants, search]);
  if (loading) return <PageLoader label="Loading tenants…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">Tenants</h1>{" "}
          <p className="text-sm text-ink-500">
            {tenants.length} tenants across {flats.length} flats
          </p>{" "}
        </div>{" "}
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
          disabled={flats.length === 0}
        >
          {" "}
          <Plus size={15} /> Add tenant{" "}
        </Button>{" "}
      </div>{" "}
      {flats.length === 0 ? (
        <Card>
          {" "}
          <EmptyState
            title="Add a flat first"
            description="You need at least one flat before you can add tenants."
            icon={<Users size={22} />}
          />{" "}
        </Card>
      ) : (
        <Card>
          {" "}
          <CardHeader>
            {" "}
            <div className="relative">
              {" "}
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />{" "}
              <Input
                placeholder="Search by name, phone, or email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
          </CardHeader>{" "}
          <CardBody className="p-0">
            {" "}
            {filtered.length === 0 ? (
              <EmptyState
                title={
                  tenants.length === 0
                    ? "No tenants added yet"
                    : "No tenants match your search"
                }
                description={
                  tenants.length === 0
                    ? "Add your first tenant and assign them to a flat."
                    : "Try a different search."
                }
                action={
                  tenants.length === 0 ? (
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setModal(true);
                      }}
                    >
                      <Plus size={15} />
                      Add tenant
                    </Button>
                  ) : undefined
                }
                icon={<Users size={22} />}
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
                        Name
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">Flat</th>{" "}
                      <th className="text-left font-medium px-5 py-3">Phone</th>{" "}
                      <th className="text-left font-medium px-5 py-3">Lease</th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Deposit
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        WhatsApp
                      </th>{" "}
                      <th className="px-5 py-3"></th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-ink-100">
                    {" "}
                    {filtered.map((t) => {
                      const flat = t.flat_id ? flatMap.get(t.flat_id) : null;
                      return (
                        <tr key={t.id} className="hover:bg-ink-50">
                          {" "}
                          <td className="px-5 py-3">
                            {" "}
                            <div className="font-medium text-ink-900">
                              {t.name}
                            </div>{" "}
                            {t.email && (
                              <div className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                                <Mail size={11} />
                                {t.email}
                              </div>
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 font-mono text-ink-700">
                            {flat?.flat_no ?? "-"}
                          </td>{" "}
                          <td className="px-5 py-3 text-ink-700">
                            {t.phone ?? "-"}
                          </td>{" "}
                          <td className="px-5 py-3 text-xs text-ink-600">
                            {" "}
                            {t.lease_start
                              ? `${formatDate(t.lease_start)} → ${formatDate(t.lease_end)}`
                              : "-"}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 font-mono text-ink-700">
                            {formatCurrency(Number(t.security_deposit))}
                          </td>{" "}
                          <td className="px-5 py-3">
                            {" "}
                            {t.whatsapp_opt_in ? (
                              <Badge tone="info">Opted in</Badge>
                            ) : (
                              <Badge tone="neutral">Off</Badge>
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 text-right">
                            {" "}
                            <div className="flex items-center justify-end gap-1">
                              {" "}
                              {t.phone && t.whatsapp_opt_in && (
                                <a
                                  href={whatsappLink(
                                    t.phone,
                                    `Hello ${t.name}, this is a message from your society office.`,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-ink-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"
                                  aria-label="WhatsApp tenant"
                                >
                                  {" "}
                                  <MessageCircle size={15} />{" "}
                                </a>
                              )}{" "}
                              <button
                                onClick={() => {
                                  setEditing(t);
                                  setModal(true);
                                }}
                                className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg"
                                aria-label="Edit tenant"
                              >
                                {" "}
                                <Pencil size={15} />{" "}
                              </button>{" "}
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      `Remove tenant ${t.name}? Their flat will be marked vacant.`,
                                    )
                                  )
                                    return;
                                  try {
                                    if (t.flat_id) {
                                      await supabase
                                        .from("flats")
                                        .update({ status: "vacant" })
                                        .eq("id", t.flat_id);
                                    }
                                    const { error } = await supabase
                                      .from("tenants")
                                      .delete()
                                      .eq("id", t.id);
                                    if (!error) {
                                      notify("Tenant removed.", "success");
                                      reload();
                                      return;
                                    }
                                  } catch {
                                    // Remote fallback
                                  }

                                  deleteLocalTenant(t.id);
                                  notify("Tenant removed.", "success");
                                  reload();
                                }}
                                className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                                aria-label="Delete tenant"
                              >
                                {" "}
                                <Trash2 size={15} />{" "}
                              </button>{" "}
                            </div>{" "}
                          </td>{" "}
                        </tr>
                      );
                    })}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </CardBody>{" "}
        </Card>
      )}{" "}
      {modal && (
        <TenantModal
          societyId={societyId!}
          flats={flats}
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reload();
          }}
        />
      )}{" "}
    </div>
  );
}
function TenantModal({
  societyId,
  flats,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  flats: { id: string; flat_no: string; status: string; tower_id: string }[];
  editing: Tenant | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [flatId, setFlatId] = useState(editing?.flat_id ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [leaseStart, setLeaseStart] = useState(editing?.lease_start ?? "");
  const [leaseEnd, setLeaseEnd] = useState(editing?.lease_end ?? "");
  const [deposit, setDeposit] = useState(
    editing?.security_deposit?.toString() ?? "0",
  );
  const [optIn, setOptIn] = useState(editing?.whatsapp_opt_in ?? true);
  const [emergName, setEmergName] = useState(
    editing?.emergency_contact_name ?? "",
  );
  const [emergPhone, setEmergPhone] = useState(
    editing?.emergency_contact_phone ?? "",
  );
  const [aadhaar, setAadhaar] = useState(editing?.aadhaar_no ?? "");
  const [pan, setPan] = useState(editing?.pan_no ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter the tenant name.", "error");
      return;
    }
    setSaving(true);
    try {
      try {
        if (editing) {
          const prevFlat = editing.flat_id;
          const { error } = await supabase
            .from("tenants")
            .update({
              name: name.trim(),
              flat_id: flatId || null,
              phone: phone.trim() || null,
              email: email.trim() || null,
              lease_start: leaseStart || null,
              lease_end: leaseEnd || null,
              security_deposit: Number(deposit) || 0,
              whatsapp_opt_in: optIn,
              emergency_contact_name: emergName.trim() || null,
              emergency_contact_phone: emergPhone.trim() || null,
              aadhaar_no: aadhaar.trim() || null,
              pan_no: pan.trim() || null,
            })
            .eq("id", editing.id);
          if (!error) {
            if (flatId && flatId !== prevFlat) {
              await supabase
                .from("flats")
                .update({ status: "occupied" })
                .eq("id", flatId);
            }
            if (prevFlat && prevFlat !== flatId) {
              await supabase
                .from("flats")
                .update({ status: "vacant" })
                .eq("id", prevFlat);
            }
            notify("Tenant updated.", "success");
            onSaved();
            return;
          }
        } else {
          const { data, error } = await supabase
            .from("tenants")
            .insert({
              society_id: societyId,
              name: name.trim(),
              flat_id: flatId || null,
              phone: phone.trim() || null,
              email: email.trim() || null,
              lease_start: leaseStart || null,
              lease_end: leaseEnd || null,
              security_deposit: Number(deposit) || 0,
              whatsapp_opt_in: optIn,
              emergency_contact_name: emergName.trim() || null,
              emergency_contact_phone: emergPhone.trim() || null,
              aadhaar_no: aadhaar.trim() || null,
              pan_no: pan.trim() || null,
              active: true,
            })
            .select()
            .single();
          if (!error && data) {
            if (flatId) {
              await supabase
                .from("flats")
                .update({ status: "occupied" })
                .eq("id", flatId);
            }
            notify("Tenant added.", "success");
            onSaved();
            return;
          }
        }
      } catch {
        // Remote fallback
      }

      saveLocalTenant({
        id: editing?.id,
        society_id: societyId,
        name: name.trim(),
        flat_id: flatId || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        lease_start: leaseStart || null,
        lease_end: leaseEnd || null,
        security_deposit: Number(deposit) || 0,
        whatsapp_opt_in: optIn,
        emergency_contact_name: emergName.trim() || null,
        emergency_contact_phone: emergPhone.trim() || null,
        aadhaar_no: aadhaar.trim() || null,
        pan_no: pan.trim() || null,
      });
      notify(editing ? "Tenant updated." : "Tenant added.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit tenant" : "Add tenant"}
      description="Assign a tenant to a flat and capture their WhatsApp number."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save tenant"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-5">
        {" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {" "}
          <Field label="Full name" required>
            {" "}
            <Input
              autoFocus
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Assign to flat">
            {" "}
            <Select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
              {" "}
              <option value="">- No flat (vacant) -</option>{" "}
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {" "}
                  {f.flat_no}{" "}
                  {f.status === "occupied" && f.id !== editing?.flat_id
                    ? "(occupied)"
                    : ""}{" "}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field
            label="Phone (WhatsApp)"
            hint="10-digit Indian number, e.g. 9876543210"
          >
            {" "}
            <div className="relative">
              {" "}
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />{" "}
              <Input
                className="pl-9"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />{" "}
            </div>{" "}
          </Field>{" "}
          <Field label="Email">
            {" "}
            <Input
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Lease start">
            {" "}
            <Input
              type="date"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Lease end">
            {" "}
            <Input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Security deposit (₹)">
            {" "}
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <p className="text-sm font-semibold text-ink-900 mb-3">
            KYC details
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <Field
              label="Aadhaar number"
              hint="Stored securely, masked in views"
            >
              {" "}
              <Input
                placeholder="XXXX XXXX XXXX"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="PAN number">
              {" "}
              <Input
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />{" "}
            </Field>{" "}
          </div>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <p className="text-sm font-semibold text-ink-900 mb-3">
            Emergency contact
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <Field label="Contact name">
              {" "}
              <Input
                placeholder="e.g. Sunita Sharma"
                value={emergName}
                onChange={(e) => setEmergName(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Contact phone">
              {" "}
              <Input
                placeholder="9876543210"
                value={emergPhone}
                onChange={(e) => setEmergPhone(e.target.value)}
              />{" "}
            </Field>{" "}
          </div>{" "}
        </div>{" "}
        <label className="flex items-center gap-3 cursor-pointer">
          {" "}
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />{" "}
          <span className="text-sm text-ink-700">
            {" "}
            Tenant has consented to receive WhatsApp messages (required for DPDP
            / WhatsApp Business compliance){" "}
          </span>{" "}
        </label>{" "}
      </div>{" "}
    </Modal>
  );
}
