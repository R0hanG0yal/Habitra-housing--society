import { useMemo, useState } from "react";
import { UserCheck, Plus, Search, LogIn, LogOut, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useVisitors } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";
export function VisitorsPage() {
  const { societyId, flats, loading, error, reload } = useSocietyData();
  const {
    visitors,
    loading: vLoading,
    error: vError,
    reload: reloadV,
  } = useVisitors(societyId);
  const { notify } = useToast();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return visitors;
    const q = search.toLowerCase();
    return visitors.filter(
      (v) =>
        v.visitor_name.toLowerCase().includes(q) ||
        (v.phone ?? "").includes(q) ||
        (v.purpose ?? "").toLowerCase().includes(q),
    );
  }, [visitors, search]);
  if (loading) return <PageLoader label="Loading visitors…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const activeCount = visitors.filter((v) => !v.check_out).length;
  async function checkOut(id: string) {
    const { error } = await supabase
      .from("visitors")
      .update({ check_out: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("Visitor checked out.", "success");
    reloadV();
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-ink-900">Visitors</h1>{" "}
          <p className="text-sm text-ink-500">
            {visitors.length} entries · {activeCount} currently inside
          </p>{" "}
        </div>{" "}
        <Button
          size="sm"
          onClick={() => setModal(true)}
          disabled={flats.length === 0}
        >
          {" "}
          <Plus size={15} /> New entry{" "}
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
              placeholder="Search by name, phone, or purpose…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {vLoading ? (
            <PageLoader label="Loading…" />
          ) : vError ? (
            <ErrorBanner message={vError} onRetry={reloadV} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                visitors.length === 0
                  ? "No visitor entries yet"
                  : "No visitors match your search"
              }
              description={
                visitors.length === 0
                  ? "Log a guest or delivery entry."
                  : "Try a different search."
              }
              action={
                visitors.length === 0 ? (
                  <Button size="sm" onClick={() => setModal(true)}>
                    <Plus size={15} />
                    New entry
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
                      Visitor
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Phone</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Visiting
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">Purpose</th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Check in
                    </th>{" "}
                    <th className="text-left font-medium px-5 py-3">
                      Check out
                    </th>{" "}
                    <th className="px-5 py-3"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-ink-100">
                  {" "}
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-ink-50">
                      {" "}
                      <td className="px-5 py-3 font-medium text-ink-900">
                        {v.visitor_name}
                      </td>{" "}
                      <td className="px-5 py-3 font-mono text-ink-700">
                        {v.phone ?? "-"}
                      </td>{" "}
                      <td className="px-5 py-3 font-mono text-ink-700">
                        {v.flats?.flat_no ?? "-"}
                      </td>{" "}
                      <td className="px-5 py-3 text-ink-600">
                        {v.purpose ?? "-"}
                      </td>{" "}
                      <td className="px-5 py-3 text-xs text-ink-600">
                        {formatDateTime(v.check_in)}
                      </td>{" "}
                      <td className="px-5 py-3">
                        {" "}
                        {v.check_out ? (
                          <span className="text-xs text-ink-600">
                            {formatDateTime(v.check_out)}
                          </span>
                        ) : (
                          <Badge tone="pending">Inside</Badge>
                        )}{" "}
                      </td>{" "}
                      <td className="px-5 py-3 text-right">
                        {" "}
                        <div className="flex items-center justify-end gap-1">
                          {" "}
                          {!v.check_out && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkOut(v.id)}
                            >
                              {" "}
                              <LogOut size={14} /> Check out{" "}
                            </Button>
                          )}{" "}
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this entry?")) return;
                              const { error } = await supabase
                                .from("visitors")
                                .delete()
                                .eq("id", v.id);
                              if (error) {
                                notify(error.message, "error");
                                return;
                              }
                              notify("Entry deleted.", "success");
                              reloadV();
                            }}
                            className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                            aria-label="Delete entry"
                          >
                            {" "}
                            <Trash2 size={15} />{" "}
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
        <VisitorModal
          societyId={societyId!}
          flats={flats}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reloadV();
          }}
        />
      )}{" "}
    </div>
  );
}
function VisitorModal({
  societyId,
  flats,
  onClose,
  onSaved,
}: {
  societyId: string;
  flats: { id: string; flat_no: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [flatId, setFlatId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter visitor name.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("visitors").insert({
      society_id: societyId,
      flat_id: flatId || null,
      visitor_name: name.trim(),
      phone: phone.trim() || null,
      purpose: purpose.trim() || null,
    });
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("Visitor checked in.", "success");
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="New visitor entry"
      description="Log a guest or delivery."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            <LogIn size={15} />
            {saving ? "Saving…" : "Check in"}
          </Button>
        </>
      }
    >
      {" "}
      <div className="space-y-4">
        {" "}
        <Field label="Visitor name" required>
          {" "}
          <Input
            autoFocus
            placeholder="e.g. Amazon delivery"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />{" "}
        </Field>{" "}
        <div className="grid grid-cols-2 gap-4">
          {" "}
          <Field label="Phone">
            {" "}
            <Input
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field label="Visiting unit">
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
        <Field label="Purpose">
          {" "}
          <Input
            placeholder="e.g. Delivery, guest, maintenance"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />{" "}
        </Field>{" "}
      </div>{" "}
    </Modal>
  );
}
