import { useMemo, useState } from "react";
import {
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  Building2,
  Globe,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { whatsappLink } from "@/lib/format";
import { logAudit } from "@/lib/invoices";
import type { FlatOwner } from "@/lib/types";
import { saveLocalOwner, deleteLocalOwner } from "@/lib/localStore";
export function OwnersPage() {
  const { societyId, flats, owners, loading, error, reload } = useSocietyData();
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<FlatOwner | null>(null);
  const [search, setSearch] = useState("");
  const ownerFlatsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const f of flats) {
      if (f.owner_id) {
        const cur = map.get(f.owner_id) ?? [];
        cur.push(f.flat_no);
        map.set(f.owner_id, cur);
      }
    }
    return map;
  }, [flats]);
  const filtered = useMemo(() => {
    if (!search) return owners;
    const q = search.toLowerCase();
    return owners.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.email ?? "").toLowerCase().includes(q) ||
        (o.pan_no ?? "").toLowerCase().includes(q),
    );
  }, [owners, search]);
  if (loading) return <PageLoader label="Loading flat owners…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Flat Owners &amp; Landlords
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {" "}
            {owners.length} registered owners · Beneficiaries for SmartSplit™
            payouts &amp; HRA certificates{" "}
          </p>{" "}
        </div>{" "}
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          {" "}
          <Plus size={15} /> Add flat owner{" "}
        </Button>{" "}
      </div>{" "}
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
              placeholder="Search by owner name, phone, PAN, or email…"
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
                owners.length === 0
                  ? "No owners registered yet"
                  : "No owners match your search"
              }
              description={
                owners.length === 0
                  ? "Add your first landlord/owner to link them with units and enable automated SmartSplit™ rent routing."
                  : "Try a different search term."
              }
              action={
                owners.length === 0 ? (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setModal(true);
                    }}
                  >
                    {" "}
                    <Plus size={15} /> Add owner{" "}
                  </Button>
                ) : undefined
              }
              icon={<UserCheck size={22} />}
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
                      Owner Details
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Units Owned
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      PAN (For HRA)
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Payout Bank / UPI
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Classification
                    </th>{" "}
                    <th className="px-5 py-3"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((o) => {
                    const ownedFlats = ownerFlatsMap.get(o.id) ?? [];
                    return (
                      <tr key={o.id} className="hover:bg-ink-50">
                        {" "}
                        <td className="px-5 py-3">
                          {" "}
                          <div className="font-medium text-ink-900">
                            {o.name}
                          </div>{" "}
                          <div className="text-xs text-ink-500 flex items-center gap-1.5 mt-0.5">
                            {" "}
                            <Phone size={12} className="text-ink-400" />{" "}
                            {o.phone}{" "}
                            {o.email && (
                              <>
                                {" "}
                                <span>·</span>{" "}
                                <Mail size={12} className="text-ink-400" />{" "}
                                <span>{o.email}</span>{" "}
                              </>
                            )}{" "}
                          </div>{" "}
                        </td>{" "}
                        <td className="px-5 py-3">
                          {" "}
                          {ownedFlats.length === 0 ? (
                            <span className="text-xs text-ink-400">
                              No units linked
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {" "}
                              {ownedFlats.map((f) => (
                                <Badge key={f} tone="info">
                                  {" "}
                                  Flat {f}{" "}
                                </Badge>
                              ))}{" "}
                            </div>
                          )}{" "}
                        </td>{" "}
                        <td className="px-5 py-3 font-mono font-medium text-ink-800">
                          {" "}
                          {o.pan_no ? (
                            o.pan_no.toUpperCase()
                          ) : (
                            <span className="text-xs text-amber-600 font-sans">
                              Missing PAN
                            </span>
                          )}{" "}
                        </td>{" "}
                        <td className="px-5 py-3">
                          {" "}
                          {o.upi_vpa ? (
                            <div className="font-mono text-xs text-ink-800 flex items-center gap-1">
                              {" "}
                              <CreditCard
                                size={12}
                                className="text-emerald-600"
                              />{" "}
                              {o.upi_vpa}{" "}
                            </div>
                          ) : o.bank_account_no ? (
                            <div className="font-mono text-xs text-ink-700">
                              {" "}
                              A/C: ••••{o.bank_account_no.slice(-4)} (
                              {o.bank_ifsc ?? "Bank"}){" "}
                            </div>
                          ) : (
                            <span className="text-xs text-ink-400">
                              Not configured
                            </span>
                          )}{" "}
                        </td>{" "}
                        <td className="px-5 py-3">
                          {" "}
                          {o.is_nri ? (
                            <Badge
                              tone="pending"
                              className="inline-flex items-center gap-1"
                            >
                              {" "}
                              <Globe size={11} /> NRI Owner{" "}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Resident</Badge>
                          )}{" "}
                        </td>{" "}
                        <td className="px-5 py-3 text-right">
                          {" "}
                          <div className="flex items-center justify-end gap-1">
                            {" "}
                            {o.phone && (
                              <a
                                href={whatsappLink(
                                  o.phone,
                                  `Hello ${o.name}, this is regarding your property at Habitra.`,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-ink-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"
                                title="WhatsApp Owner"
                              >
                                {" "}
                                <Phone size={15} />{" "}
                              </a>
                            )}{" "}
                            <button
                              onClick={() => {
                                setEditing(o);
                                setModal(true);
                              }}
                              className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg"
                              aria-label="Edit owner"
                            >
                              {" "}
                              <Pencil size={15} />{" "}
                            </button>{" "}
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Delete owner ${o.name}? This will unlink them from their flats.`,
                                  )
                                )
                                  return;
                                try {
                                  const { error: de } = await supabase
                                    .from("flat_owners")
                                    .delete()
                                    .eq("id", o.id);
                                  if (de) {
                                    deleteLocalOwner(o.id);
                                  }
                                } catch {
                                  deleteLocalOwner(o.id);
                                }
                                await logAudit(
                                  societyId!,
                                  null,
                                  "delete_owner",
                                  "owner",
                                  o.id,
                                  { name: o.name },
                                ).catch(() => {});
                                notify("Owner deleted.", "success");
                                reload();
                              }}
                              className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                              aria-label="Delete owner"
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
      </Card>{" "}
      {modal && (
        <OwnerModal
          societyId={societyId!}
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
function OwnerModal({
  societyId,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  editing: FlatOwner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [panNo, setPanNo] = useState(editing?.pan_no ?? "");
  const [bankAcc, setBankAcc] = useState(editing?.bank_account_no ?? "");
  const [bankIfsc, setBankIfsc] = useState(editing?.bank_ifsc ?? "");
  const [upiVpa, setUpiVpa] = useState(editing?.upi_vpa ?? "");
  const [isNri, setIsNri] = useState(editing?.is_nri ?? false);
  const [address, setAddress] = useState(editing?.permanent_address ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter the owner name.", "error");
      return;
    }
    if (!phone.trim()) {
      notify("Enter a contact phone number.", "error");
      return;
    }
    setSaving(true);
    try {
      try {
        if (editing) {
          const { error } = await supabase
            .from("flat_owners")
            .update({
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim() || null,
              pan_no: panNo.trim() ? panNo.trim().toUpperCase() : null,
              bank_account_no: bankAcc.trim() || null,
              bank_ifsc: bankIfsc.trim() ? bankIfsc.trim().toUpperCase() : null,
              upi_vpa: upiVpa.trim() || null,
              is_nri: isNri,
              permanent_address: address.trim() || null,
            })
            .eq("id", editing.id);
          if (!error) {
            notify("Owner updated successfully.", "success");
            onSaved();
            return;
          }
        } else {
          const { data, error } = await supabase
            .from("flat_owners")
            .insert({
              society_id: societyId,
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim() || null,
              pan_no: panNo.trim() ? panNo.trim().toUpperCase() : null,
              bank_account_no: bankAcc.trim() || null,
              bank_ifsc: bankIfsc.trim() ? bankIfsc.trim().toUpperCase() : null,
              upi_vpa: upiVpa.trim() || null,
              is_nri: isNri,
              permanent_address: address.trim() || null,
            })
            .select()
            .single();
          if (!error && data) {
            notify("Owner registered successfully.", "success");
            onSaved();
            return;
          }
        }
      } catch {
        // Remote fallback
      }

      saveLocalOwner({
        id: editing?.id,
        society_id: societyId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        pan_no: panNo.trim() ? panNo.trim().toUpperCase() : null,
        bank_account_no: bankAcc.trim() || null,
        bank_ifsc: bankIfsc.trim() ? bankIfsc.trim().toUpperCase() : null,
        upi_vpa: upiVpa.trim() || null,
        is_nri: isNri,
        permanent_address: address.trim() || null,
      });
      notify(editing ? "Owner updated successfully." : "Owner registered successfully.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit Flat Owner" : "Register Flat Owner"}
      description="Details for Tri-Party SmartSplit™ rent routing, HRA receipts, and society communication."
      size="lg"
      footer={
        <>
          {" "}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Owner"}
          </Button>{" "}
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {" "}
          <Field label="Full Name" required>
            {" "}
            <Input
              autoFocus
              placeholder="e.g. Vikram Malhotra"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field
            label="Phone Number"
            required
            hint="WhatsApp enabled for remittance receipts"
          >
            {" "}
            <Input
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Email Address">
            {" "}
            <Input
              type="email"
              placeholder="vikram@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field
            label="PAN Number"
            hint="Required on official HRA rent receipts for tenants"
          >
            {" "}
            <Input
              placeholder="ABCDE1234F"
              value={panNo}
              onChange={(e) => setPanNo(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <p className="text-sm font-semibold text-ink-900 mb-2">
            SmartSplit™ Payout Destination
          </p>{" "}
          <p className="text-xs text-ink-500 mb-3">
            Where the landlord receives net rent after society maintenance is
            routed
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <Field label="UPI VPA (Instant Settlement)">
              {" "}
              <Input
                placeholder="e.g. vikram@okhdfcbank"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Bank Account Number">
              {" "}
              <Input
                placeholder="e.g. 5010023456789"
                value={bankAcc}
                onChange={(e) => setBankAcc(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Bank IFSC Code">
              {" "}
              <Input
                placeholder="e.g. HDFC0001234"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Permanent Address">
              {" "}
              <Input
                placeholder="City, State, Pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />{" "}
            </Field>{" "}
          </div>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <label className="flex items-center gap-2.5 cursor-pointer">
            {" "}
            <input
              type="checkbox"
              checked={isNri}
              onChange={(e) => setIsNri(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />{" "}
            <span className="text-sm text-ink-800 font-medium">
              {" "}
              This owner is an NRI or lives in another city (Activates NRI
              Concierge Mode){" "}
            </span>{" "}
          </label>{" "}
        </div>{" "}
      </div>{" "}
    </Modal>
  );
}
