import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  QrCode,
  Phone,
  CheckCircle2,
  UserX,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useDomesticStaff } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { logAudit } from "@/lib/invoices";
import type { DomesticStaff, StaffRole } from "@/lib/types";
export function DomesticStaffPage() {
  const { societyId, flats, loading: sLoading } = useSocietyData();
  const { staff, loading, error, reload } = useDomesticStaff(societyId);
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [qrModal, setQrModal] = useState<DomesticStaff | null>(null);
  const [editing, setEditing] = useState<DomesticStaff | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !(s.phone ?? "").includes(q))
          return false;
      }
      return true;
    });
  }, [staff, roleFilter, search]);
  if (sLoading || loading)
    return <PageLoader label="Loading domestic staff…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const verifiedCount = staff.filter((s) => s.police_verified).length;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Domestic Staff &amp; Service Personnel
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {" "}
            {staff.length} registered helpers · {verifiedCount} police verified
            · Multi-flat gate passes{" "}
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
          <Plus size={15} /> Register domestic staff{" "}
        </Button>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Total Helpers</p>{" "}
          <p className="text-2xl font-bold font-mono text-ink-900 mt-1">
            {staff.length}
          </p>{" "}
          <p className="text-[11px] text-ink-500">Maids, cooks, drivers</p>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Police Verified</p>{" "}
          <p className="text-2xl font-bold font-mono text-success-500 mt-1">
            {verifiedCount}
          </p>{" "}
          <p className="text-[11px] text-ink-500">
            Documented background checks
          </p>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Active Gate Passes</p>{" "}
          <p className="text-2xl font-bold font-mono text-brand-600 mt-1">
            {" "}
            {staff.filter((s) => s.is_active).length}{" "}
          </p>{" "}
          <p className="text-[11px] text-ink-500">
            Biometric and QR enabled
          </p>{" "}
        </div>{" "}
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
                placeholder="Search by staff name or phone…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="sm:w-44"
            >
              {" "}
              <option value="all">All Roles</option>{" "}
              <option value="maid">Housemaid</option>{" "}
              <option value="cook">Cook</option>{" "}
              <option value="driver">Driver</option>{" "}
              <option value="cleaner">Cleaner</option>{" "}
              <option value="nanny">Nanny / Babysitter</option>{" "}
              <option value="gardener">Gardener</option>{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {filtered.length === 0 ? (
            <EmptyState
              title={
                staff.length === 0
                  ? "No domestic staff registered yet"
                  : "No staff match your search"
              }
              description={
                staff.length === 0
                  ? "Register maids, cooks, and drivers to issue QR gate passes and monitor attendance."
                  : "Try adjusting your search."
              }
              action={
                staff.length === 0 ? (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setModal(true);
                    }}
                  >
                    {" "}
                    <Plus size={15} /> Register first staff{" "}
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
                      Name &amp; Role
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Contact</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Aadhaar (Masked)
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Verification
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Pass ID</th>{" "}
                    <th className="text-left font-medium px-5 py-3">Status</th>{" "}
                    <th className="px-5 py-3"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-ink-50">
                      {" "}
                      <td className="px-5 py-3">
                        {" "}
                        <div className="font-semibold text-ink-900">
                          {s.name}
                        </div>{" "}
                        <span className="text-xs text-ink-500 capitalize">
                          {s.role}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-5 py-3 font-mono text-ink-700">
                        {s.phone ?? "-"}
                      </td>{" "}
                      <td className="px-5 py-3 font-mono text-xs text-ink-600">
                        {" "}
                        {s.aadhaar_masked
                          ? s.aadhaar_masked
                          : "•••• •••• ••••"}{" "}
                      </td>{" "}
                      <td className="px-5 py-3">
                        {" "}
                        {s.police_verified ? (
                          <Badge
                            tone="paid"
                            className="inline-flex items-center gap-1 text-[11px]"
                          >
                            {" "}
                            <ShieldCheck size={11} /> Verified{" "}
                          </Badge>
                        ) : (
                          <Badge tone="pending" className="text-[11px]">
                            Pending
                          </Badge>
                        )}{" "}
                      </td>{" "}
                      <td className="px-5 py-3 font-mono text-xs text-brand-700 font-semibold">
                        {" "}
                        {s.qr_pass_code ??
                          `PASS-${s.id.slice(0, 6).toUpperCase()}`}{" "}
                      </td>{" "}
                      <td className="px-5 py-3">
                        {" "}
                        <Badge tone={s.is_active ? "paid" : "overdue"}>
                          {" "}
                          {s.is_active ? "Active" : "Suspended"}{" "}
                        </Badge>{" "}
                      </td>{" "}
                      <td className="px-5 py-3 text-right">
                        {" "}
                        <div className="flex items-center justify-end gap-1.5">
                          {" "}
                          <button
                            onClick={() => setQrModal(s)}
                            className="p-1.5 text-brand-700 hover:bg-brand-50 rounded-lg text-xs flex items-center gap-1"
                            title="View Gate QR Pass"
                          >
                            {" "}
                            <QrCode size={14} /> Pass{" "}
                          </button>{" "}
                          <button
                            onClick={() => {
                              setEditing(s);
                              setModal(true);
                            }}
                            className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg text-xs"
                          >
                            {" "}
                            Edit{" "}
                          </button>{" "}
                        </div>{" "}
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
        <StaffModal
          societyId={societyId!}
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reload();
          }}
        />
      )}{" "}
      {qrModal && (
        <QrPassModal staff={qrModal} onClose={() => setQrModal(null)} />
      )}{" "}
    </div>
  );
}
function StaffModal({
  societyId,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  editing: DomesticStaff | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [role, setRole] = useState<StaffRole>(editing?.role ?? "maid");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [aadhaar, setAadhaar] = useState(editing?.aadhaar_masked ?? "");
  const [policeVerified, setPoliceVerified] = useState(
    editing?.police_verified ?? false,
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    editing?.emergency_phone ?? "",
  );
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter staff name.", "error");
      return;
    }
    setSaving(true);
    try {
      const code =
        editing?.qr_pass_code ??
        `HBT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const payload = {
        society_id: societyId,
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        aadhaar_masked: aadhaar.trim()
          ? `XXXX-XXXX-${aadhaar.slice(-4)}`
          : null,
        police_verified: policeVerified,
        emergency_phone: emergencyPhone.trim() || null,
        qr_pass_code: code,
        is_active: isActive,
      };
      if (editing) {
        const { error } = await supabase
          .from("domestic_staff")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        await logAudit(societyId, null, "update_staff", "staff", editing.id, {
          name,
        });
        notify("Staff profile updated.", "success");
      } else {
        const { data, error } = await supabase
          .from("domestic_staff")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        await logAudit(societyId, null, "register_staff", "staff", data.id, {
          name,
        });
        notify("Staff registered and Gate Pass generated.", "success");
      }
      onSaved();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to save staff.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit Staff Profile" : "Register Domestic Personnel"}
      description="Issue biometric / QR gate access and maintain verified police records."
      size="md"
      footer={
        <>
          {" "}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Staff"}
          </Button>{" "}
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <Field label="Full Name" required>
          {" "}
          <Input
            autoFocus
            placeholder="e.g. Meena Devi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />{" "}
        </Field>{" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Staff Role" required>
            {" "}
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              {" "}
              <option value="maid">Housemaid</option>{" "}
              <option value="cook">Cook / Chef</option>{" "}
              <option value="driver">Driver</option>{" "}
              <option value="cleaner">Cleaner</option>{" "}
              <option value="nanny">Nanny / Babysitter</option>{" "}
              <option value="gardener">Gardener</option>{" "}
              <option value="other">Other</option>{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Phone Number">
            {" "}
            <Input
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Aadhaar Last 4 Digits" hint="DPDP compliant masking">
            {" "}
            <Input
              maxLength={4}
              placeholder="e.g. 5678"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Emergency Contact Phone">
            {" "}
            <Input
              placeholder="9876543210"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200 flex items-center justify-between">
          {" "}
          <label className="flex items-center gap-2 cursor-pointer">
            {" "}
            <input
              type="checkbox"
              checked={policeVerified}
              onChange={(e) => setPoliceVerified(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />{" "}
            <span className="text-sm text-ink-800 font-medium">
              Police Verification Completed
            </span>{" "}
          </label>{" "}
          <label className="flex items-center gap-2 cursor-pointer">
            {" "}
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />{" "}
            <span className="text-sm text-ink-800 font-medium">
              Gate Pass Active
            </span>{" "}
          </label>{" "}
        </div>{" "}
      </div>{" "}
    </Modal>
  );
}
function QrPassModal({
  staff,
  onClose,
}: {
  staff: DomesticStaff;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Gate Access Pass"
      size="sm"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {" "}
      <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
        {" "}
        <div className="w-36 h-36 border-4 border-brand-900 rounded-2xl flex items-center justify-center bg-brand-50/50 p-2">
          {" "}
          <QrCode size={110} className="text-brand-900" />{" "}
        </div>{" "}
        <div>
          {" "}
          <p className="text-lg font-bold text-ink-900">{staff.name}</p>{" "}
          <p className="text-xs text-ink-500 capitalize">
            {staff.role} · Habitra Verified
          </p>{" "}
          <p className="font-mono text-xs font-semibold text-ink-900 mt-2 bg-surface-3 px-3 py-1 rounded-md border border-line-strong">
            {" "}
            {staff.qr_pass_code ?? "ACTIVE-PASS"}{" "}
          </p>{" "}
        </div>{" "}
        <p className="text-[11px] text-ink-400">
          {" "}
          Security guards scan this QR at entry gates to automatically log entry
          and notify resident flats.{" "}
        </p>{" "}
      </div>{" "}
    </Modal>
  );
}
