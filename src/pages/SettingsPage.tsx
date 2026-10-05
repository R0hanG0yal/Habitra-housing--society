import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  MessageCircle,
  Save,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Sparkles,
  Download,
  Layers,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field, Textarea, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { ensureSettings, logAudit } from "@/lib/invoices";
import { Logo } from "@/components/ui/Logo";
import type { Settings as SettingsType, Tower } from "@/lib/types";
export function SettingsPage() {
  const {
    society,
    societyId,
    towers,
    settings,
    loading,
    error,
    reload,
    setSettings,
    setTowers,
  } = useSocietyData();
  const { notify } = useToast();
  const [tab, setTab] = useState<
    "society" | "templates" | "towers" | "whatsapp" | "brand"
  >("society");
  const [towerModal, setTowerModal] = useState(false);
  const [editingTower, setEditingTower] = useState<Tower | null>(null);
  useEffect(() => {
    if (societyId && !settings) {
      ensureSettings(societyId).then(() => reload());
    }
  }, [societyId, settings, reload]);
  if (loading) return <PageLoader label="Loading settings…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  const tabs = [
    { id: "society" as const, label: "Society", icon: <Building2 size={15} /> },
    {
      id: "brand" as const,
      label: "Brand & Logos",
      icon: <Sparkles size={15} />,
    },
    {
      id: "templates" as const,
      label: "Message templates",
      icon: <MessageCircle size={15} />,
    },
    {
      id: "towers" as const,
      label: "Towers & blocks",
      icon: <Building2 size={15} />,
    },
    {
      id: "whatsapp" as const,
      label: "WhatsApp",
      icon: <MessageCircle size={15} />,
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div>
        {" "}
        <h1 className="text-xl font-semibold text-ink-900">Settings</h1>{" "}
        <p className="text-sm text-ink-500">
          Manage your society, templates, and reminders
        </p>{" "}
      </div>{" "}
      <div className="flex gap-1 border-b border-ink-200 overflow-x-auto">
        {" "}
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${tab === t.id ? "border-brand-600 text-brand-600 font-semibold" : "border-transparent text-white/90 hover:text-white"}`}
          >
            {" "}
            {t.icon} {t.label}{" "}
          </button>
        ))}{" "}
      </div>{" "}
      {tab === "society" && (
        <SocietyTab society={society} societyId={societyId!} onSaved={reload} />
      )}{" "}
      {tab === "templates" && settings && (
        <TemplatesTab
          societyId={societyId!}
          settings={settings}
          onSave={(s) => {
            setSettings(s);
          }}
        />
      )}{" "}
      {tab === "templates" && !settings && (
        <Card>
          <EmptyState
            title="Settings not loaded"
            description="Try reloading the page."
            icon={<SettingsIcon size={22} />}
          />
        </Card>
      )}{" "}
      {tab === "towers" && (
        <TowersTab
          societyId={societyId!}
          towers={towers}
          onReload={reload}
          setTowers={setTowers}
          towerModal={towerModal}
          setTowerModal={setTowerModal}
          editingTower={editingTower}
          setEditingTower={setEditingTower}
        />
      )}{" "}
      {tab === "brand" && <BrandTab />}{" "}
      {tab === "whatsapp" && settings && (
        <WhatsAppTab
          societyId={societyId!}
          settings={settings}
          onSave={(s) => setSettings(s)}
        />
      )}{" "}
    </div>
  );
}
function SocietyTab({
  society,
  societyId,
  onSaved,
}: {
  society: { name: string; address: string | null } | null;
  societyId: string;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(society?.name ?? "");
  const [address, setAddress] = useState(society?.address ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter a society name.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("societies")
      .update({ name: name.trim(), address: address.trim() || null })
      .eq("id", societyId);
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    await logAudit(societyId, null, "update_society", "society", societyId, {
      name,
    });
    notify("Society details saved.", "success");
    onSaved();
  }
  return (
    <Card>
      {" "}
      <CardHeader>
        {" "}
        <CardTitle>Society details</CardTitle>{" "}
        <CardDescription>
          Shown on invoices and WhatsApp messages
        </CardDescription>{" "}
      </CardHeader>{" "}
      <CardBody className="space-y-4 max-w-lg">
        {" "}
        <Field label="Society name" required>
          {" "}
          <Input value={name} onChange={(e) => setName(e.target.value)} />{" "}
        </Field>{" "}
        <Field label="Address">
          {" "}
          <Textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />{" "}
        </Field>{" "}
        <Button onClick={save} disabled={saving}>
          {" "}
          <Save size={15} /> {saving ? "Saving…" : "Save changes"}{" "}
        </Button>{" "}
      </CardBody>{" "}
    </Card>
  );
}
function TemplatesTab({
  societyId,
  settings,
  onSave,
}: {
  societyId: string;
  settings: SettingsType;
  onSave: (s: SettingsType) => void;
}) {
  const { notify } = useToast();
  const [invoice, setInvoice] = useState(settings.invoice_template);
  const [reminder, setReminder] = useState(settings.reminder_template);
  const [overdue, setOverdue] = useState(settings.overdue_template);
  const [receipt, setReceipt] = useState(settings.receipt_template);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const { data, error } = await supabase
      .from("settings")
      .update({
        invoice_template: invoice,
        reminder_template: reminder,
        overdue_template: overdue,
        receipt_template: receipt,
      })
      .eq("society_id", societyId)
      .select()
      .single();
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    onSave(data as SettingsType);
    notify("Templates saved.", "success");
  }
  const placeholders =
    "{tenant_name}, {flat_no}, {month}, {amount}, {due_date}, {paid_on}, {reference_no}, {society_name}";
  return (
    <div className="space-y-4">
      {" "}
      <Card>
        {" "}
        <CardBody className="bg-brand-50 border-brand-200">
          {" "}
          <p className="text-sm text-brand-800">
            {" "}
            <span className="font-medium">Placeholders you can use:</span>{" "}
            <code className="text-xs font-mono">{placeholders}</code>{" "}
          </p>{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>Invoice message</CardTitle>
          <CardDescription>Sent when an invoice is generated</CardDescription>
        </CardHeader>{" "}
        <CardBody>
          {" "}
          <Textarea
            rows={3}
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>Reminder message</CardTitle>
          <CardDescription>Sent before the due date</CardDescription>
        </CardHeader>{" "}
        <CardBody>
          {" "}
          <Textarea
            rows={3}
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
          />{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>Overdue / escalation message</CardTitle>
          <CardDescription>Sent after the due date</CardDescription>
        </CardHeader>{" "}
        <CardBody>
          {" "}
          <Textarea
            rows={3}
            value={overdue}
            onChange={(e) => setOverdue(e.target.value)}
          />{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>Payment receipt</CardTitle>
          <CardDescription>Sent after a payment is recorded</CardDescription>
        </CardHeader>{" "}
        <CardBody>
          {" "}
          <Textarea
            rows={3}
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
          />{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Button onClick={save} disabled={saving}>
        {" "}
        <Save size={15} /> {saving ? "Saving…" : "Save templates"}{" "}
      </Button>{" "}
    </div>
  );
}
function TowersTab({
  societyId,
  towers,
  onReload,
  setTowers,
  towerModal,
  setTowerModal,
  editingTower,
  setEditingTower,
}: {
  societyId: string;
  towers: Tower[];
  onReload: () => void;
  setTowers: React.Dispatch<React.SetStateAction<Tower[]>>;
  towerModal: boolean;
  setTowerModal: (v: boolean) => void;
  editingTower: Tower | null;
  setEditingTower: (t: Tower | null) => void;
}) {
  const { notify } = useToast();
  return (
    <Card>
      {" "}
      <CardHeader className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <CardTitle>Towers &amp; blocks</CardTitle>{" "}
          <CardDescription>{towers.length} tower(s)</CardDescription>{" "}
        </div>{" "}
        <Button
          size="sm"
          onClick={() => {
            setEditingTower(null);
            setTowerModal(true);
          }}
        >
          {" "}
          <Plus size={15} /> Add tower{" "}
        </Button>{" "}
      </CardHeader>{" "}
      <CardBody className="p-0">
        {" "}
        {towers.length === 0 ? (
          <EmptyState
            title="No towers yet"
            description="Add a tower or block to group your flats."
            icon={<Building2 size={22} />}
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingTower(null);
                  setTowerModal(true);
                }}
              >
                <Plus size={15} />
                Add tower
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {" "}
            {towers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-5 py-3"
              >
                {" "}
                <p className="text-sm font-medium text-ink-900">
                  {t.name}
                </p>{" "}
                <div className="flex items-center gap-1">
                  {" "}
                  <button
                    onClick={() => {
                      setEditingTower(t);
                      setTowerModal(true);
                    }}
                    className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg"
                    aria-label="Edit tower"
                  >
                    <Pencil size={15} />
                  </button>{" "}
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          `Delete tower ${t.name}? Flats inside it will also be deleted.`,
                        )
                      )
                        return;
                      const { error } = await supabase
                        .from("towers")
                        .delete()
                        .eq("id", t.id);
                      if (error) {
                        notify(error.message, "error");
                        return;
                      }
                      setTowers((prev) => prev.filter((x) => x.id !== t.id));
                      notify("Tower deleted.", "success");
                      onReload();
                    }}
                    className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                    aria-label="Delete tower"
                  >
                    {" "}
                    <Trash2 size={15} />{" "}
                  </button>{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>
        )}{" "}
      </CardBody>{" "}
      {towerModal && (
        <TowerEditModal
          societyId={societyId}
          editing={editingTower}
          onClose={() => setTowerModal(false)}
          onSaved={() => {
            setTowerModal(false);
            onReload();
          }}
        />
      )}{" "}
    </Card>
  );
}
function TowerEditModal({
  societyId,
  editing,
  onClose,
  onSaved,
}: {
  societyId: string;
  editing: Tower | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!name.trim()) {
      notify("Enter a tower name.", "error");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("towers")
        .update({ name: name.trim() })
        .eq("id", editing.id);
      if (error) {
        notify(error.message, "error");
        setSaving(false);
        return;
      }
      notify("Tower updated.", "success");
    } else {
      const { error } = await supabase
        .from("towers")
        .insert({ society_id: societyId, name: name.trim() });
      if (error) {
        notify(error.message, "error");
        setSaving(false);
        return;
      }
      notify("Tower added.", "success");
    }
    setSaving(false);
    onSaved();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit tower" : "Add tower"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {" "}
      <Field label="Tower name" required>
        {" "}
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />{" "}
      </Field>{" "}
    </Modal>
  );
}
function WhatsAppTab({
  societyId,
  settings,
  onSave,
}: {
  societyId: string;
  settings: SettingsType;
  onSave: (s: SettingsType) => void;
}) {
  const { notify } = useToast();
  const [enabled, setEnabled] = useState(settings.whatsapp_enabled);
  const [daysBefore, setDaysBefore] = useState(
    String(settings.reminder_days_before),
  );
  const [overdueFreq, setOverdueFreq] = useState(
    String(settings.overdue_frequency_days),
  );
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const { data, error } = await supabase
      .from("settings")
      .update({
        whatsapp_enabled: enabled,
        reminder_days_before: Number(daysBefore) || 3,
        overdue_frequency_days: Number(overdueFreq) || 3,
      })
      .eq("society_id", societyId)
      .select()
      .single();
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    onSave(data as SettingsType);
    notify("WhatsApp settings saved.", "success");
  }
  return (
    <div className="space-y-4 max-w-lg">
      {" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>Reminder schedule</CardTitle>
          <CardDescription>
            When automated reminders should fire
          </CardDescription>
        </CardHeader>{" "}
        <CardBody className="space-y-4">
          {" "}
          <Field
            label="Days before due date to send reminder"
            hint="e.g. 3 means 3 days before the due date"
          >
            {" "}
            <Input
              type="number"
              min={0}
              max={28}
              value={daysBefore}
              onChange={(e) => setDaysBefore(e.target.value)}
            />{" "}
          </Field>{" "}
          <Field
            label="Overdue reminder frequency (days)"
            hint="How often to re-escalate after due date"
          >
            {" "}
            <Input
              type="number"
              min={1}
              max={30}
              value={overdueFreq}
              onChange={(e) => setOverdueFreq(e.target.value)}
            />{" "}
          </Field>{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Card>
        {" "}
        <CardHeader>
          <CardTitle>WhatsApp messaging</CardTitle>
          <CardDescription>Consent &amp; opt-in</CardDescription>
        </CardHeader>{" "}
        <CardBody className="space-y-4">
          {" "}
          <label className="flex items-start gap-3 cursor-pointer">
            {" "}
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />{" "}
            <div>
              {" "}
              <p className="text-sm font-medium text-ink-900">
                Enable WhatsApp reminders
              </p>{" "}
              <p className="text-xs text-ink-500 mt-0.5">
                {" "}
                Tenants must opt in per tenant record. Compliant with DPDP Act
                and WhatsApp Business policy.{" "}
              </p>{" "}
            </div>{" "}
          </label>{" "}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            {" "}
            <p className="font-medium mb-1">Note on automated sending</p>{" "}
            <p>
              Reminders currently open WhatsApp with a pre-filled message
              (click-). For fully automated, scheduled sending, connect the
              WhatsApp Business API via a provider (Gupshup, Interakt, Meta
              Cloud API) - requires Meta Business verification (1–2 weeks).
            </p>{" "}
          </div>{" "}
        </CardBody>{" "}
      </Card>{" "}
      <Button onClick={save} disabled={saving}>
        {" "}
        <Save size={15} /> {saving ? "Saving…" : "Save settings"}{" "}
      </Button>{" "}
    </div>
  );
}
function BrandTab() {
  const { notify } = useToast();
  const brandColors = [
    {
      name: "Cosmic Latte (Canvas)",
      hex: "#E8DCC6",
      role: "Main page canvas. Text written in crisp white #FFFFFF",
    },
    {
      name: "Mocha Cream (Cards & Surfaces)",
      hex: "#B7A89A",
      role: "Panels, cards, sidebars. Text written in rich brown #2E1A11",
    },
    {
      name: "Deep Burgundy (Luxury Highlight)",
      hex: "#722F37",
      role: "Primary CTAs, active highlights & accents. Text in white #FFFFFF",
    },
    {
      name: "Rich Brown (Mocha Text)",
      hex: "#2E1A11",
      role: "High-contrast typography for text over Mocha Cream",
    },
  ];
  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    notify(`Copied ${hex} to clipboard`, "success");
  }
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {" "}
      {/* Brand Identity Header */}{" "}
      <div className="bg-surface-2 border border-line-strong rounded-xl p-6 shadow-xs text-ink-900">
        {" "}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {" "}
          <div>
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-surface-3 text-ink-900 border border-line-strong">
                {" "}
                Official Brand Identity System{" "}
              </span>{" "}
              <span className="text-xs text-ink-500">
                Vector and High-DPI Formats
              </span>{" "}
            </div>{" "}
            <h2 className="text-xl font-bold text-ink-900 mt-2">
              The 3 Canonical Habitra Logo Formats
            </h2>{" "}
            <p className="text-sm text-ink-500 mt-1 max-w-2xl leading-relaxed">
              {" "}
              Habitra features 3 distinct, separated logo formats engineered for
              specific digital, mobile, and print contexts. All assets are
              calibrated against the Cosmic Latte (#E8DCC6), Mocha Cream
              (#B7A89A), and Deep Burgundy (#722F37) framework.{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <a
              href="/brand/habitra-icon@2x.png"
              download="habitra-brand-pack.png"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
            >
              {" "}
              <Download size={14} /> Download Assets{" "}
            </a>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Grid of the 3 Logo Types */}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {" "}
        {/* TYPE 1: ICON / LOGOMARK */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 text-ink-900">
          {" "}
          <div className="space-y-4">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-3 text-ink-900 border border-line-strong">
                {" "}
                Type 1: Symbol Only{" "}
              </span>{" "}
              <span className="text-xs font-semibold text-ink-900">
                Logomark
              </span>{" "}
            </div>{" "}
            {/* Visual Previews */}{" "}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {" "}
              <div className="bg-surface-2 rounded-lg p-4 flex flex-col items-center justify-center min-h-[130px] border border-line-strong">
                {" "}
                <Logo variant="icon" size="md" />{" "}
                <span className="text-[10px] text-ink-900 mt-2 font-mono">
                  On Mocha #B7A89A
                </span>{" "}
              </div>{" "}
              <div className="bg-canvas rounded-lg p-4 flex flex-col items-center justify-center min-h-[130px] border border-line-strong">
                {" "}
                <Logo variant="icon" size="md" />{" "}
                <span className="text-[10px] text-ink-900 mt-2 font-mono">
                  On Cosmic #E8DCC6
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <h3 className="text-sm font-bold text-ink-900">
                Twin-Tower Escrow Emblem
              </h3>{" "}
              <p className="text-xs text-ink-500 leading-relaxed">
                {" "}
                Symbolizes twin residential communities, escrow note exchange
                between landlord and society, and property appreciation
                trajectory in Deep Burgundy.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-canvas/60 p-3 rounded-lg border border-line-strong text-xs space-y-1">
              {" "}
              <p className="font-semibold text-ink-900">
                Primary Use Cases:
              </p>{" "}
              <ul className="list-disc list-inside text-ink-500 space-y-0.5 text-[11px]">
                {" "}
                <li>Browser Favicon &amp; Mobile PWA Icon</li>{" "}
                <li>Society Assistant Avatar Badge</li>{" "}
                <li>Collapsed Navigation &amp; Mobile Header</li>{" "}
                <li>Security Gate Pass Verification Chips</li>{" "}
              </ul>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2 pt-2 border-t border-line-strong">
            {" "}
            <a
              href="/brand/habitra-icon@2x.png"
              download="habitra-icon.png"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> PNG (2x){" "}
            </a>{" "}
            <a
              href="/brand/habitra-icon.svg"
              download="habitra-icon.svg"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> SVG{" "}
            </a>{" "}
          </div>{" "}
        </div>{" "}
        {/* TYPE 2: WORDMARK / LOGOTYPE */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 text-ink-900">
          {" "}
          <div className="space-y-4">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-3 text-ink-900 border border-line-strong">
                {" "}
                Type 2: Text Only{" "}
              </span>{" "}
              <span className="text-xs font-semibold text-ink-900">
                Logotype
              </span>{" "}
            </div>{" "}
            {/* Visual Previews */}{" "}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {" "}
              <div className="bg-brand-600 rounded-lg p-4 flex flex-col items-center justify-center min-h-[130px] border border-brand-700">
                {" "}
                <Logo variant="wordmark" theme="dark" size="sm" />{" "}
                <span className="text-[10px] text-white mt-2 font-mono">
                  On Burgundy #722F37
                </span>{" "}
              </div>{" "}
              <div className="bg-canvas rounded-lg p-4 flex flex-col items-center justify-center min-h-[130px] border border-line-strong">
                {" "}
                <Logo variant="wordmark" theme="light" size="sm" />{" "}
                <span className="text-[10px] text-ink-900 mt-2 font-mono">
                  On Cosmic #E8DCC6
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <h3 className="text-sm font-bold text-ink-900">
                Geometric Habitr^ Wordmark
              </h3>{" "}
              <p className="text-xs text-ink-500 leading-relaxed">
                {" "}
                Custom modern typography with the distinctive chevron/caret{" "}
                <strong>^</strong> letterform for high-precision brand
                recognition.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-canvas/60 p-3 rounded-lg border border-line-strong text-xs space-y-1">
              {" "}
              <p className="font-semibold text-ink-900">
                Primary Use Cases:
              </p>{" "}
              <ul className="list-disc list-inside text-ink-500 space-y-0.5 text-[11px]">
                {" "}
                <li>Official GST Invoices &amp; HRA Rent Receipts</li>{" "}
                <li>Legal Disclosures &amp; Terms Footers</li>{" "}
                <li>Letterhead Headers &amp; Society Circulars</li>{" "}
                <li>Dual-Receipt Watermark Stamp</li>{" "}
              </ul>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2 pt-2 border-t border-line-strong">
            {" "}
            <a
              href="/brand/habitra-wordmark-dark@2x.png"
              download="habitra-wordmark-mocha.png"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> Brown PNG{" "}
            </a>{" "}
            <a
              href="/brand/habitra-wordmark-light@2x.png"
              download="habitra-wordmark-cream.png"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> Light PNG{" "}
            </a>{" "}
          </div>{" "}
        </div>{" "}
        {/* TYPE 3: COMBINATION MARKS */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 text-ink-900">
          {" "}
          <div className="space-y-4">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-3 text-ink-900 border border-line-strong">
                {" "}
                Type 3: Lockups{" "}
              </span>{" "}
              <span className="text-xs font-semibold text-ink-900">
                Combination Mark
              </span>{" "}
            </div>{" "}
            {/* Visual Previews */}{" "}
            <div className="space-y-2 pt-2">
              {" "}
              <div className="bg-surface-2 rounded-lg p-3.5 flex flex-col items-center justify-center border border-line-strong">
                {" "}
                <Logo
                  variant="horizontal"
                  theme="light"
                  size="sm"
                  badge="OS"
                />{" "}
                <span className="text-[10px] text-ink-900 mt-1.5 font-mono">
                  Horizontal Lockup (Navbars/Sidebars)
                </span>{" "}
              </div>{" "}
              <div className="bg-canvas rounded-lg p-3.5 flex flex-col items-center justify-center border border-line-strong">
                {" "}
                <Logo variant="stacked" theme="light" size="xs" />{" "}
                <span className="text-[10px] text-ink-900 mt-1.5 font-mono">
                  Stacked Lockup (Auth/Splash)
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <h3 className="text-sm font-bold text-ink-900">
                Horizontal &amp; Stacked Lockups
              </h3>{" "}
              <p className="text-xs text-ink-500 leading-relaxed">
                {" "}
                Harmonious pairing of the twin-tower escrow symbol alongside the
                Habitr^ wordmark for primary brand touchpoints.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-canvas/60 p-3 rounded-lg border border-line-strong text-xs space-y-1">
              {" "}
              <p className="font-semibold text-ink-900">
                Primary Use Cases:
              </p>{" "}
              <ul className="list-disc list-inside text-ink-500 space-y-0.5 text-[11px]">
                {" "}
                <li>Desktop Sidebar &amp; App Brand Header</li>{" "}
                <li>Auth Page Showcase &amp; Tenant Portal</li>{" "}
                <li>Custom 404 &amp; Splash Screens</li>{" "}
                <li>Social OpenGraph Sharing Cards</li>{" "}
              </ul>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2 pt-2 border-t border-line-strong">
            {" "}
            <a
              href="/brand/habitra-logo-horizontal-light@2x.png"
              download="habitra-horizontal.png"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> Horizontal{" "}
            </a>{" "}
            <a
              href="/brand/habitra-logo-stacked@2x.png"
              download="habitra-stacked.png"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-canvas hover:bg-surface-3 border border-line-strong text-xs font-semibold text-ink-900 transition flex items-center justify-center gap-1.5"
            >
              {" "}
              <Download size={13} /> Stacked{" "}
            </a>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Brand Color System Tokens */}{" "}
      <div className="bg-surface-2 border border-line-strong rounded-xl p-6 shadow-xs space-y-4 text-ink-900">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <Palette className="w-5 h-5 text-brand-600" />{" "}
            <h3 className="text-base font-bold text-ink-900">
              Brand Color System Tokens (Cosmic Latte • Mocha Cream • Deep
              Burgundy)
            </h3>{" "}
          </div>{" "}
          <span className="text-xs text-ink-500">
            Click any swatch to copy hex code
          </span>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {" "}
          {brandColors.map((c) => (
            <button
              key={c.hex}
              onClick={() => copyHex(c.hex)}
              className="group p-4 rounded-lg border border-line-strong hover:border-brand-600 bg-canvas hover:shadow-xs transition text-left flex flex-col justify-between"
            >
              {" "}
              <div>
                {" "}
                <div
                  className="w-full h-12 rounded-md border border-line-strong shadow-xs mb-3 group-hover:scale-102 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />{" "}
                <p className="text-xs font-bold text-ink-900">{c.name}</p>{" "}
                <p className="text-[11px] text-ink-500 mt-0.5">{c.role}</p>{" "}
              </div>{" "}
              <div className="mt-3 pt-2 border-t border-line-strong flex items-center justify-between">
                {" "}
                <span className="font-mono text-xs font-bold text-brand-600">
                  {c.hex}
                </span>{" "}
                <span className="text-[10px] text-ink-500 group-hover:text-brand-600 transition">
                  Copy
                </span>{" "}
              </div>{" "}
            </button>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
