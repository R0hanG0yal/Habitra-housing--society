import { useMemo, useState } from "react";
import {
  Car,
  Plus,
  Search,
  BatteryCharging,
  ShieldAlert,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useParking } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { logAudit } from "@/lib/invoices";
import type { ParkingSlot, ParkingSlotType, ParkingStatus } from "@/lib/types";
export function ParkingPage() {
  const { societyId, flats, loading: sLoading } = useSocietyData();
  const { slots, loading, error, reload } = useParking(societyId);
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [visitorModal, setVisitorModal] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const flatMap = useMemo(() => new Map(flats.map((f) => [f.id, f])), [flats]);
  const filtered = useMemo(() => {
    return slots.filter((s) => {
      if (statusFilter !== "all" && s.current_status !== statusFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const flatNo =
          flatMap.get(s.assigned_flat_id ?? "")?.flat_no?.toLowerCase() ?? "";
        if (
          !s.slot_number.toLowerCase().includes(q) &&
          !(s.vehicle_reg_no ?? "").toLowerCase().includes(q) &&
          !flatNo.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [slots, statusFilter, search, flatMap]);
  if (sLoading || loading)
    return <PageLoader label="Loading parking management…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const availableCount = slots.filter(
    (s) => s.current_status === "available",
  ).length;
  const evCount = slots.filter((s) => s.is_ev).length;
  const visitorCount = slots.filter(
    (s) => s.current_status === "reserved_visitor",
  ).length;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Advanced Parking &amp; EV Management
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {" "}
            {slots.length} total parking slots · {availableCount} available ·{" "}
            {evCount} EV equipped{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisitorModal(true)}
          >
            {" "}
            <Clock size={15} /> Book visitor parking{" "}
          </Button>{" "}
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setModal(true);
            }}
          >
            {" "}
            <Plus size={15} /> Add parking slot{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Total Slots</p>{" "}
          <p className="text-2xl font-bold font-mono text-ink-900 mt-1">
            {slots.length}
          </p>{" "}
          <p className="text-[11px] text-ink-500">Inventory mapped</p>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Available / Vacant</p>{" "}
          <p className="text-2xl font-bold font-mono text-success-500 mt-1">
            {availableCount}
          </p>{" "}
          <p className="text-[11px] text-ink-500">Ready for allocation</p>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">EV Charging Slots</p>{" "}
          <p className="text-2xl font-bold font-mono text-brand-600 mt-1">
            {evCount}
          </p>{" "}
          <p className="text-[11px] text-ink-500">Dedicated EV points</p>{" "}
        </div>{" "}
        <div className="bg-surface-2 rounded-xl border border-line-strong p-4 shadow-xs text-ink-900">
          {" "}
          <p className="text-xs text-ink-500">Visitor Reserved</p>{" "}
          <p className="text-2xl font-bold font-mono text-brand-600 mt-1">
            {visitorCount}
          </p>{" "}
          <p className="text-[11px] text-ink-500">Active visitor passes</p>{" "}
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
                placeholder="Search slot number, vehicle reg, or flat…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-48"
            >
              {" "}
              <option value="all">All Slot Status</option>{" "}
              <option value="available">Available</option>{" "}
              <option value="occupied">Occupied</option>{" "}
              <option value="reserved_visitor">Visitor Reserved</option>{" "}
              <option value="marketplace_listed">
                Marketplace Listed
              </option>{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {filtered.length === 0 ? (
            <EmptyState
              title={
                slots.length === 0
                  ? "No parking slots added yet"
                  : "No slots match your search"
              }
              description={
                slots.length === 0
                  ? "Add your society parking inventory to track flat allocations, EV charging, and visitor booking."
                  : "Try adjusting your search."
              }
              action={
                slots.length === 0 ? (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setModal(true);
                    }}
                  >
                    {" "}
                    <Plus size={15} /> Add first slot{" "}
                  </Button>
                ) : undefined
              }
              icon={<Car size={22} />}
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
                      Slot No.
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Type</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Allocated Unit
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Registered Vehicle
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      EV Ready
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Status</th>{" "}
                    <th className="px-5 py-3"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((s) => {
                    const flat = s.assigned_flat_id
                      ? flatMap.get(s.assigned_flat_id)
                      : null;
                    return (
                      <tr key={s.id} className="hover:bg-ink-50">
                        {" "}
                        <td className="px-5 py-3 font-mono font-bold text-ink-900">
                          {s.slot_number}
                        </td>{" "}
                        <td className="px-5 py-3 capitalize text-ink-700">
                          {s.slot_type.replace("_", " ")}
                        </td>{" "}
                        <td className="px-5 py-3 font-mono text-ink-800">
                          {flat?.flat_no ? `Flat ${flat.flat_no}` : "-"}
                        </td>{" "}
                        <td className="px-5 py-3 font-mono font-medium text-ink-900">
                          {" "}
                          {s.vehicle_reg_no
                            ? s.vehicle_reg_no.toUpperCase()
                            : "-"}{" "}
                        </td>{" "}
                        <td className="px-5 py-3">
                          {" "}
                          {s.is_ev ? (
                            <Badge
                              tone="paid"
                              className="inline-flex items-center gap-1 text-[11px]"
                            >
                              {" "}
                              <BatteryCharging size={11} /> EV Slot{" "}
                            </Badge>
                          ) : (
                            <span className="text-xs text-ink-400">
                              Standard
                            </span>
                          )}{" "}
                        </td>{" "}
                        <td className="px-5 py-3">
                          {" "}
                          <Badge
                            tone={
                              s.current_status === "available"
                                ? "paid"
                                : s.current_status === "occupied"
                                  ? "neutral"
                                  : s.current_status === "reserved_visitor"
                                    ? "pending"
                                    : "info"
                            }
                            className="capitalize"
                          >
                            {" "}
                            {s.current_status.replace("_", " ")}{" "}
                          </Badge>{" "}
                        </td>{" "}
                        <td className="px-5 py-3 text-right">
                          {" "}
                          <button
                            onClick={() => {
                              setEditing(s);
                              setModal(true);
                            }}
                            className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg text-xs font-medium"
                          >
                            {" "}
                            Edit{" "}
                          </button>{" "}
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
        <ParkingModal
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
      {visitorModal && (
        <VisitorParkingModal
          slots={slots.filter((s) => s.current_status === "available")}
          onClose={() => setVisitorModal(false)}
          onBooked={() => {
            setVisitorModal(false);
            reload();
            notify("Visitor parking permit issued.", "success");
          }}
        />
      )}{" "}
    </div>
  );
}
function ParkingModal({
  societyId,
  flats,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  flats: { id: string; flat_no: string }[];
  editing: ParkingSlot | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [slotNumber, setSlotNumber] = useState(editing?.slot_number ?? "");
  const [slotType, setSlotType] = useState<ParkingSlotType>(
    editing?.slot_type ?? "covered",
  );
  const [assignedFlatId, setAssignedFlatId] = useState(
    editing?.assigned_flat_id ?? "",
  );
  const [vehicleNo, setVehicleNo] = useState(editing?.vehicle_reg_no ?? "");
  const [isEv, setIsEv] = useState(editing?.is_ev ?? false);
  const [status, setStatus] = useState<ParkingStatus>(
    editing?.current_status ?? "available",
  );
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!slotNumber.trim()) {
      notify("Enter a slot number.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        society_id: societyId,
        slot_number: slotNumber.trim().toUpperCase(),
        slot_type: slotType,
        assigned_flat_id: assignedFlatId || null,
        vehicle_reg_no: vehicleNo.trim()
          ? vehicleNo.trim().toUpperCase()
          : null,
        is_ev: isEv,
        current_status:
          assignedFlatId && status === "available" ? "occupied" : status,
      };
      if (editing) {
        const { error } = await supabase
          .from("parking_slots")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        await logAudit(
          societyId,
          null,
          "update_parking_slot",
          "parking",
          editing.id,
          { slotNumber },
        );
        notify("Parking slot updated.", "success");
      } else {
        const { data, error } = await supabase
          .from("parking_slots")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        await logAudit(
          societyId,
          null,
          "create_parking_slot",
          "parking",
          data.id,
          { slotNumber },
        );
        notify("Parking slot added.", "success");
      }
      onSaved();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to save slot.",
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
      title={editing ? "Edit Parking Slot" : "Add Parking Slot"}
      description="Configure slot allocation, EV readiness, and vehicle registration."
      size="md"
      footer={
        <>
          {" "}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Slot"}
          </Button>{" "}
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Slot Identifier" required>
            {" "}
            <Input
              autoFocus
              placeholder="e.g. B1-42 or P-10"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Slot Type">
            {" "}
            <Select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value as ParkingSlotType)}
            >
              {" "}
              <option value="covered">Covered Basement</option>{" "}
              <option value="stilt">Stilt Parking</option>{" "}
              <option value="open">Open Surface</option>{" "}
              <option value="ev_equipped">EV Equipped</option>{" "}
              <option value="two_wheeler">Two-Wheeler Only</option>{" "}
            </Select>{" "}
          </Field>{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Allocated Flat">
            {" "}
            <Select
              value={assignedFlatId}
              onChange={(e) => setAssignedFlatId(e.target.value)}
            >
              {" "}
              <option value="">-- Unallocated / Floating --</option>{" "}
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  Flat {f.flat_no}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Vehicle Registration No.">
            {" "}
            <Input
              placeholder="e.g. DL-01-AB-1234"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
            />{" "}
          </Field>{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Status">
            {" "}
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ParkingStatus)}
            >
              {" "}
              <option value="available">Available</option>{" "}
              <option value="occupied">Occupied</option>{" "}
              <option value="reserved_visitor">Visitor Reserved</option>{" "}
              <option value="marketplace_listed">
                Marketplace Listed
              </option>{" "}
            </Select>{" "}
          </Field>{" "}
          <div className="flex items-center pt-6">
            {" "}
            <label className="flex items-center gap-2 cursor-pointer">
              {" "}
              <input
                type="checkbox"
                checked={isEv}
                onChange={(e) => setIsEv(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />{" "}
              <span className="text-sm text-ink-800 font-medium">
                Equipped with EV Charger
              </span>{" "}
            </label>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </Modal>
  );
}
function VisitorParkingModal({
  slots,
  onClose,
  onBooked,
}: {
  slots: ParkingSlot[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const { notify } = useToast();
  const [vehicleNo, setVehicleNo] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.id ?? "");
  const [timeWindow, setTimeWindow] = useState("6:00 PM – 10:00 PM");
  const [saving, setSaving] = useState(false);
  async function book() {
    if (!vehicleNo.trim()) {
      notify("Enter vehicle number.", "error");
      return;
    }
    if (!selectedSlot) {
      notify("No available parking slots.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("parking_slots")
      .update({
        vehicle_reg_no: vehicleNo.trim().toUpperCase(),
        current_status: "reserved_visitor",
      })
      .eq("id", selectedSlot);
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    onBooked();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Book Visitor Parking Permit"
      description="Reserve a temporary visitor parking permit for an incoming guest vehicle."
      size="md"
      footer={
        <>
          {" "}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button onClick={book} disabled={saving || slots.length === 0}>
            {" "}
            {saving ? "Issuing…" : "Issue Visitor Permit"}{" "}
          </Button>{" "}
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <Field
          label="Visitor Vehicle Number"
          required
          hint="e.g. RJ-14-AB-1234"
        >
          {" "}
          <Input
            autoFocus
            placeholder="RJ-14-AB-1234"
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value)}
          />{" "}
        </Field>{" "}
        <Field label="Select Available Slot" required>
          {" "}
          <Select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
          >
            {" "}
            {slots.length === 0 ? (
              <option value="">No vacant slots available</option>
            ) : (
              slots.map((s) => (
                <option key={s.id} value={s.id}>
                  Slot {s.slot_number} ({s.slot_type})
                </option>
              ))
            )}{" "}
          </Select>{" "}
        </Field>{" "}
        <Field label="Duration Window">
          {" "}
          <Input
            placeholder="e.g. 6:00 PM to 10:00 PM"
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
