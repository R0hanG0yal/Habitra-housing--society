import { useMemo, useState } from "react";
import {
  Home,
  Plus,
  Building2,
  Pencil,
  Trash2,
  Search,
  UserCheck,
  Split,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { SettlementMode, FlatOwner, UnitType } from "@/lib/types";
import {
  saveLocalFlat,
  deleteLocalFlat,
  saveLocalTower,
} from "@/lib/localStore";
export function FlatsPage() {
  const { societyId, towers, flats, owners, loading, error, reload } =
    useSocietyData();
  const { notify } = useToast();
  const [towerModal, setTowerModal] = useState(false);
  const [flatModal, setFlatModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<FlatRow | null>(null);
  const [search, setSearch] = useState("");
  const [towerFilter, setTowerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState("all");
  const ownerMap = useMemo(
    () => new Map(owners.map((o) => [o.id, o])),
    [owners],
  );
  const filtered = useMemo(() => {
    return flats.filter((f) => {
      if (towerFilter !== "all" && f.tower_id !== towerFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (
        unitTypeFilter !== "all" &&
        (f.unit_type ?? "flat") !== unitTypeFilter
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        const tenantName = f.tenants?.[0]?.name ?? "";
        const ownerName = f.owner_id
          ? (ownerMap.get(f.owner_id)?.name ?? "")
          : "";
        if (
          !f.flat_no.toLowerCase().includes(q) &&
          !tenantName.toLowerCase().includes(q) &&
          !ownerName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [flats, search, towerFilter, statusFilter, unitTypeFilter, ownerMap]);
  if (loading) return <PageLoader label="Loading units & towers…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">
            Units &amp; Towers
          </h1>{" "}
          <p className="text-sm text-ink-500">
            {" "}
            {flats.length} units across {towers.length} towers · Tri-Party
            SmartSplit™ enabled{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTowerModal(true)}
          >
            {" "}
            <Building2 size={15} /> Add tower{" "}
          </Button>{" "}
          <Button
            size="sm"
            onClick={() => {
              setEditingFlat(null);
              setFlatModal(true);
            }}
            disabled={towers.length === 0}
          >
            {" "}
            <Plus size={15} /> Add unit{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      {towers.length === 0 ? (
        <Card>
          {" "}
          <EmptyState
            title="No towers yet"
            description="Add a tower or block first, then add flats inside it."
            action={
              <Button onClick={() => setTowerModal(true)}>
                {" "}
                <Building2 size={15} /> Add your first tower{" "}
              </Button>
            }
            icon={<Building2 size={22} />}
          />{" "}
        </Card>
      ) : (
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
                  placeholder="Search flat no., tenant, or owner…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />{" "}
              </div>{" "}
              <Select
                value={towerFilter}
                onChange={(e) => setTowerFilter(e.target.value)}
                className="sm:w-44"
              >
                {" "}
                <option value="all">All towers</option>{" "}
                {towers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}{" "}
              </Select>{" "}
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sm:w-36"
              >
                {" "}
                <option value="all">All status</option>{" "}
                <option value="occupied">Occupied</option>{" "}
                <option value="vacant">Vacant</option>{" "}
              </Select>{" "}
              <Select
                value={unitTypeFilter}
                onChange={(e) => setUnitTypeFilter(e.target.value)}
                className="sm:w-36"
              >
                {" "}
                <option value="all">All types</option>{" "}
                <option value="flat">Flat</option>{" "}
                <option value="shop">Shop</option>{" "}
                <option value="office">Office</option>{" "}
                <option value="pg">PG Room</option>{" "}
              </Select>{" "}
            </div>{" "}
          </CardHeader>{" "}
          <CardBody className="p-0">
            {" "}
            {filtered.length === 0 ? (
              <EmptyState
                title={
                  flats.length === 0
                    ? "No flats added yet"
                    : "No flats match your filters"
                }
                description={
                  flats.length === 0
                    ? "Add your first flat to start tracking rent and maintenance."
                    : "Try adjusting your search filters."
                }
                action={
                  flats.length === 0 ? (
                    <Button
                      onClick={() => {
                        setEditingFlat(null);
                        setFlatModal(true);
                      }}
                    >
                      <Plus size={15} />
                      Add flat
                    </Button>
                  ) : undefined
                }
                icon={<Home size={22} />}
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
                        Unit
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Tower / Floor
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Owner (Landlord)
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Resident / Tenant
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">Rent</th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Society Maint.
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Settlement
                      </th>{" "}
                      <th className="text-left font-medium px-5 py-3">
                        Status
                      </th>{" "}
                      <th className="px-5 py-3"></th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-ink-100">
                    {" "}
                    {filtered.map((f) => {
                      const owner = f.owner_id
                        ? ownerMap.get(f.owner_id)
                        : null;
                      const rent = f.rent_config?.[0]?.amount
                        ? Number(f.rent_config[0].amount)
                        : 0;
                      const maint =
                        (Number(f.base_maintenance_fee) || 0) +
                        (Number(f.sinking_fund_fee) || 0);
                      return (
                        <tr key={f.id} className="hover:bg-ink-50">
                          {" "}
                          <td className="px-5 py-3 font-mono font-medium text-ink-900">
                            {" "}
                            <div>{f.flat_no}</div>{" "}
                            <span className="text-xs text-ink-500 capitalize">
                              {f.unit_type ?? "flat"}
                            </span>{" "}
                          </td>{" "}
                          <td className="px-5 py-3 text-ink-700">
                            {" "}
                            <div>{f.towers?.name ?? "-"}</div>{" "}
                            <div className="text-xs text-ink-500">
                              Floor {f.floor ?? "-"} ·{" "}
                              {f.area_sqft ? `${f.area_sqft} sqft` : ""}
                            </div>{" "}
                          </td>{" "}
                          <td className="px-5 py-3">
                            {" "}
                            {owner ? (
                              <div>
                                {" "}
                                <p className="font-medium text-ink-900">
                                  {owner.name}
                                </p>{" "}
                                <p className="text-xs text-ink-500">
                                  {owner.phone}
                                </p>{" "}
                              </div>
                            ) : (
                              <span className="text-xs text-ink-400">
                                Unassigned
                              </span>
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 text-ink-700">
                            {" "}
                            {f.tenants?.[0]?.name ? (
                              <div>
                                {" "}
                                <p className="font-medium text-ink-900">
                                  {f.tenants[0].name}
                                </p>{" "}
                                <p className="text-xs text-ink-500">
                                  {f.tenants[0].phone ?? ""}
                                </p>{" "}
                              </div>
                            ) : (
                              <span className="text-xs text-ink-400">-</span>
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 font-mono text-ink-900">
                            {" "}
                            {rent > 0 ? formatCurrency(rent) : "-"}{" "}
                          </td>{" "}
                          <td className="px-5 py-3 font-mono text-ink-700">
                            {" "}
                            {maint > 0 ? (
                              <div>
                                {" "}
                                <p>{formatCurrency(maint)}</p>{" "}
                                <p className="text-[10px] text-ink-400 font-sans">
                                  {" "}
                                  Base:{" "}
                                  {formatCurrency(
                                    Number(f.base_maintenance_fee) || 0,
                                  )}{" "}
                                  · Sinking:{" "}
                                  {formatCurrency(
                                    Number(f.sinking_fund_fee) || 0,
                                  )}{" "}
                                </p>{" "}
                              </div>
                            ) : (
                              "-"
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3">
                            {" "}
                            {f.settlement_mode === "smart_split" ? (
                              <Badge
                                tone="info"
                                className="inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                {" "}
                                <Split size={11} /> SmartSplit™{" "}
                              </Badge>
                            ) : f.settlement_mode === "owner_inclusive" ? (
                              <Badge tone="neutral" className="text-[11px]">
                                Inclusive
                              </Badge>
                            ) : (
                              <Badge tone="paid" className="text-[11px]">
                                Direct Society
                              </Badge>
                            )}{" "}
                          </td>{" "}
                          <td className="px-5 py-3">
                            <StatusBadge status={f.status} />
                          </td>{" "}
                          <td className="px-5 py-3 text-right">
                            {" "}
                            <div className="flex items-center justify-end gap-1">
                              {" "}
                              <button
                                onClick={() => {
                                  setEditingFlat(f as unknown as FlatRow);
                                  setFlatModal(true);
                                }}
                                className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg"
                                aria-label="Edit flat"
                              >
                                {" "}
                                <Pencil size={15} />{" "}
                              </button>{" "}
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      `Delete flat ${f.flat_no}? This also deletes its rent config and invoices.`,
                                    )
                                  )
                                    return;
                                  try {
                                    const { error: delErr } = await supabase
                                      .from("flats")
                                      .delete()
                                      .eq("id", f.id);
                                    if (!delErr) {
                                      notify("Flat deleted.", "success");
                                      reload();
                                      return;
                                    }
                                  } catch {
                                    // Remote fallback
                                  }

                                  deleteLocalFlat(f.id);
                                  notify("Flat deleted.", "success");
                                  reload();
                                }}
                                className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                                aria-label="Delete flat"
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
      {towerModal && (
        <TowerModal
          societyId={societyId!}
          onClose={() => setTowerModal(false)}
          onSaved={() => {
            setTowerModal(false);
            reload();
          }}
        />
      )}{" "}
      {flatModal && (
        <FlatModal
          societyId={societyId!}
          towers={towers}
          owners={owners}
          editing={editingFlat}
          onClose={() => setFlatModal(false)}
          onSaved={() => {
            setFlatModal(false);
            reload();
          }}
        />
      )}{" "}
    </div>
  );
}
type FlatRow = {
  id: string;
  tower_id: string;
  owner_id?: string | null;
  flat_no: string;
  floor: number | null;
  area_sqft: number | null;
  status: "vacant" | "occupied";
  unit_type?: UnitType;
  settlement_mode?: SettlementMode;
  base_maintenance_fee?: number;
  sinking_fund_fee?: number;
  rent_config?:
    | {
        amount: number;
        due_day: number;
        late_fee_type: string;
        late_fee_value: number;
        grace_days: number;
      }[]
    | null;
};
function TowerModal({
  societyId,
  onClose,
  onSaved,
}: {
  societyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter a tower name.", "error");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("towers")
        .insert({ society_id: societyId, name: name.trim() })
        .select()
        .single();
      if (!error && data) {
        setSaving(false);
        notify("Tower added.", "success");
        onSaved();
        return;
      }
    } catch {
      // Remote fallback
    }

    saveLocalTower({ name: name.trim(), society_id: societyId });
    setSaving(false);
    notify("Tower added.", "success");
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Add tower / block"
      description="A tower groups flats together."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Add tower"}
          </Button>
        </>
      }
    >
      {" "}
      <Field label="Tower name" required>
        {" "}
        <Input
          autoFocus
          placeholder="e.g. Tower A, Block 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />{" "}
      </Field>{" "}
    </Modal>
  );
}
function FlatModal({
  societyId,
  towers,
  owners,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  towers: { id: string; name: string }[];
  owners: FlatOwner[];
  editing: FlatRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [towerId, setTowerId] = useState(
    editing?.tower_id ?? towers[0]?.id ?? "",
  );
  const [ownerId, setOwnerId] = useState(editing?.owner_id ?? "");
  const [flatNo, setFlatNo] = useState(editing?.flat_no ?? "");
  const [floor, setFloor] = useState(editing?.floor?.toString() ?? "");
  const [area, setArea] = useState(editing?.area_sqft?.toString() ?? "");
  const [status, setStatus] = useState<"vacant" | "occupied">(
    editing?.status === "occupied" ? "occupied" : "vacant",
  );
  const [unitType, setUnitType] = useState<UnitType>(
    editing?.unit_type ?? "flat",
  );
  const [settlementMode, setSettlementMode] = useState<SettlementMode>(
    editing?.settlement_mode ?? "smart_split",
  );
  const [baseMaint, setBaseMaint] = useState(
    editing?.base_maintenance_fee?.toString() ?? "3000",
  );
  const [sinkingFund, setSinkingFund] = useState(
    editing?.sinking_fund_fee?.toString() ?? "500",
  );
  const [amount, setAmount] = useState(
    editing?.rent_config?.[0]?.amount?.toString() ?? "",
  );
  const [dueDay, setDueDay] = useState(
    editing?.rent_config?.[0]?.due_day?.toString() ?? "5",
  );
  const [lateFeeType, setLateFeeType] = useState(
    editing?.rent_config?.[0]?.late_fee_type ?? "fixed",
  );
  const [lateFeeValue, setLateFeeValue] = useState(
    editing?.rent_config?.[0]?.late_fee_value?.toString() ?? "0",
  );
  const [graceDays, setGraceDays] = useState(
    editing?.rent_config?.[0]?.grace_days?.toString() ?? "0",
  );
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!flatNo.trim()) {
      notify("Enter a flat number.", "error");
      return;
    }
    if (!towerId) {
      notify("Select a tower.", "error");
      return;
    }
    setSaving(true);
    try {
      const flatPayload = {
        tower_id: towerId,
        owner_id: ownerId || null,
        flat_no: flatNo.trim(),
        floor: floor ? Number(floor) : null,
        area_sqft: area ? Number(area) : null,
        status: (status === "occupied" ? "occupied" : "vacant") as "vacant" | "occupied",
        unit_type: unitType,
        settlement_mode: settlementMode,
        base_maintenance_fee: Number(baseMaint) || 0,
        sinking_fund_fee: Number(sinkingFund) || 0,
      };
      try {
        if (editing) {
          const { error: fe } = await supabase
            .from("flats")
            .update(flatPayload)
            .eq("id", editing.id);
          if (!fe) {
            if (amount) {
              const rc = editing.rent_config?.[0];
              if (rc) {
                await supabase
                  .from("rent_config")
                  .update({
                    amount: Number(amount),
                    due_day: Number(dueDay),
                    late_fee_type: lateFeeType,
                    late_fee_value: Number(lateFeeValue),
                    grace_days: Number(graceDays),
                  })
                  .eq("flat_id", editing.id);
              } else {
                await supabase.from("rent_config").insert({
                  flat_id: editing.id,
                  society_id: societyId,
                  amount: Number(amount),
                  due_day: Number(dueDay),
                  late_fee_type: lateFeeType,
                  late_fee_value: Number(lateFeeValue),
                  grace_days: Number(graceDays),
                });
              }
            }
            notify("Flat updated.", "success");
            onSaved();
            return;
          }
        } else {
          const { data, error } = await supabase
            .from("flats")
            .insert({ ...flatPayload, society_id: societyId })
            .select()
            .single();
          if (!error && data) {
            if (amount) {
              await supabase.from("rent_config").insert({
                flat_id: data.id,
                society_id: societyId,
                amount: Number(amount),
                due_day: Number(dueDay),
                late_fee_type: lateFeeType,
                late_fee_value: Number(lateFeeValue),
                grace_days: Number(graceDays),
              });
            }
            notify("Flat added.", "success");
            onSaved();
            return;
          }
        }
      } catch {
        // Remote fallback
      }

      saveLocalFlat(
        {
          ...flatPayload,
          id: editing?.id,
          society_id: societyId,
        },
        amount
          ? {
              amount: Number(amount),
              due_day: Number(dueDay),
              late_fee_type: lateFeeType,
              late_fee_value: Number(lateFeeValue),
              grace_days: Number(graceDays),
            }
          : undefined,
      );
      notify(editing ? "Flat updated." : "Flat added.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit unit" : "Add unit"}
      description="Configure unit details, landlord assignment, SmartSplit settlement mode, and maintenance components."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save flat"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-5">
        {" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {" "}
          <Field label="Tower" required>
            {" "}
            <Select
              value={towerId}
              onChange={(e) => setTowerId(e.target.value)}
            >
              {" "}
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Unit number" required>
            {" "}
            <Input
              placeholder="e.g. A-302"
              value={flatNo}
              onChange={(e) => setFlatNo(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field
            label="Flat Owner (Landlord)"
            hint="Beneficiary for rent payout"
          >
            {" "}
            <Select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              {" "}
              <option value="">-- Select registered owner --</option>{" "}
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {" "}
                  {o.name} ({o.phone}) {o.is_nri ? "· NRI" : ""}{" "}
                </option>
              ))}{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Settlement Mode">
            {" "}
            <Select
              value={settlementMode}
              onChange={(e) =>
                setSettlementMode(e.target.value as SettlementMode)
              }
            >
              {" "}
              <option value="smart_split">
                SmartSplit™ (Auto-distribute Rent &amp; Society)
              </option>{" "}
              <option value="owner_inclusive">
                Owner Inclusive (Tenant pays Landlord)
              </option>{" "}
              <option value="direct_society">
                Direct Society (Self-occupied owner)
              </option>{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Floor">
            {" "}
            <Input
              type="number"
              placeholder="e.g. 3"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Area (sqft)">
            {" "}
            <Input
              type="number"
              placeholder="e.g. 1200"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Status">
            {" "}
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as "vacant" | "occupied")}
            >
              {" "}
              <option value="vacant">Vacant</option>{" "}
              <option value="occupied">Occupied</option>{" "}
            </Select>{" "}
          </Field>{" "}
          <Field label="Unit type">
            {" "}
            <Select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as UnitType)}
            >
              {" "}
              <option value="flat">Flat</option>{" "}
              <option value="shop">Shop</option>{" "}
              <option value="office">Office</option>{" "}
              <option value="pg">PG Room</option>{" "}
            </Select>{" "}
          </Field>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <p className="text-sm font-semibold text-ink-900 mb-2">
            Society Maintenance Components
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <Field label="Base Maintenance Fee (₹/month)">
              {" "}
              <Input
                type="number"
                value={baseMaint}
                onChange={(e) => setBaseMaint(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Statutory Sinking / Reserve Fund (₹/month)">
              {" "}
              <Input
                type="number"
                value={sinkingFund}
                onChange={(e) => setSinkingFund(e.target.value)}
              />{" "}
            </Field>{" "}
          </div>{" "}
        </div>{" "}
        <div className="pt-2 border-t border-ink-200">
          {" "}
          <p className="text-sm font-semibold text-ink-900 mb-2">
            Tenant Monthly Rent &amp; Rules
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <Field label="Monthly Base Rent (₹)">
              {" "}
              <Input
                type="number"
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Due day of month (1–28)">
              {" "}
              <Input
                type="number"
                min={1}
                max={28}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />{" "}
            </Field>{" "}
            <Field label="Late fee type">
              {" "}
              <Select
                value={lateFeeType}
                onChange={(e) => setLateFeeType(e.target.value)}
              >
                {" "}
                <option value="fixed">Fixed amount (₹)</option>{" "}
                <option value="percent">Percentage (%)</option>{" "}
              </Select>{" "}
            </Field>{" "}
            <Field label="Late fee value">
              {" "}
              <Input
                type="number"
                value={lateFeeValue}
                onChange={(e) => setLateFeeValue(e.target.value)}
              />{" "}
            </Field>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </Modal>
  );
}
