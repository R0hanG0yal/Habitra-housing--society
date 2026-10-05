import { supabase } from "@/lib/supabase";
import type {
  FlatWithRelations,
  Settings,
  Society,
  SettlementMode,
} from "@/lib/types";
import { monthKey } from "@/lib/format";
export type GenerateResult = {
  created: number;
  skipped: number;
  errors: string[];
};
export async function generateInvoicesForMonth(
  societyId: string,
  flats: FlatWithRelations[],
  month: string,
): Promise<GenerateResult> {
  const result: GenerateResult = { created: 0, skipped: 0, errors: [] };
  const occupied = flats.filter(
    (f) => f.status === "occupied" && f.rent_config && f.rent_config.length > 0,
  );
  if (occupied.length === 0) {
    return result;
  } /* Pre-fetch utility charges unbilled for this month if any */
const { data: utilities } = await supabase .from('utility_readings') .select('flat_id, total_charge') .eq('society_id', societyId) .is('invoice_id', null); const utilityMap = new Map<string, number>(); if (utilities) { for (const u of utilities) { utilityMap.set(u.flat_id, (utilityMap.get(u.flat_id) ?? 0) + Number(u.total_charge)); } } const rows = occupied.map((flat) => { const cfg = flat.rent_config![0]; const [y, m] = month.split('-'); const dueDate = `${y}-${m}-${String(cfg.due_day).padStart(2, '0')}`; const tenant = flat.tenants?.find((t) => t.active) ?? flat.tenants?.[0] ?? null; const rentAmt = Number(cfg.amount) || 0; const maintAmt = (Number(flat.base_maintenance_fee) || 3000) + (Number(flat.sinking_fund_fee) || 500); const utilAmt = utilityMap.get(flat.id) || 0; const mode: SettlementMode = flat.settlement_mode || 'smart_split'; let totalBilled = rentAmt; let ownerPayout = rentAmt; let societyPayout = maintAmt + utilAmt; if (mode === 'smart_split') { totalBilled = rentAmt + maintAmt + utilAmt; ownerPayout = rentAmt; societyPayout = maintAmt + utilAmt; } else if (mode === 'owner_inclusive') { totalBilled = rentAmt; ownerPayout = rentAmt - (maintAmt + utilAmt); societyPayout = maintAmt + utilAmt; } else if (mode === 'direct_society') { totalBilled = maintAmt + utilAmt; ownerPayout = 0; societyPayout = maintAmt + utilAmt; } return { flat_id: flat.id, society_id: societyId, tenant_id: tenant?.id ?? null, month, amount: totalBilled, rent_amount: rentAmt, maintenance_amount: maintAmt, utility_amount: utilAmt, owner_payout_amount: Math.max(0, ownerPayout), society_payout_amount: societyPayout, settlement_status: 'pending' as const, due_date: dueDate, late_fee_applied: 0, status: 'pending' as const, }; }); const { data, error } = await supabase .from('invoices') .upsert(rows, { onConflict: 'flat_id,month', ignoreDuplicates: true }) .select('id, flat_id'); if (error) { result.errors.push(error.message); return result; } /* Link any unbilled utility readings to the new invoice */
if (data && data.length > 0 && utilities && utilities.length > 0) { for (const inv of data) { await supabase .from('utility_readings') .update({ invoice_id: inv.id }) .eq('flat_id', inv.flat_id) .is('invoice_id', null); } } result.created = data?.length ?? 0; result.skipped = occupied.length - result.created; return result;
}
export async function applyLateFees(
  societyId: string,
  flats: FlatWithRelations[],
  settings: Settings | null,
  today = new Date(),
): Promise<number> {
  const month = monthKey(today);
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, flat_id, amount, due_date, late_fee_applied, status")
    .eq("society_id", societyId)
    .eq("month", month)
    .neq("status", "paid");
  if (error || !invoices || invoices.length === 0) return 0;
  const updates: { id: string; late_fee_applied: number; status: string }[] =
    [];
  for (const inv of invoices) {
    const due = new Date(inv.due_date);
    const grace = settings?.overdue_frequency_days ?? 0;
    const overduePoint = new Date(due);
    overduePoint.setDate(overduePoint.getDate() + grace);
    if (today < overduePoint) continue;
    const flat = flats.find((f) => f.id === inv.flat_id);
    const cfg = flat?.rent_config?.[0];
    if (!cfg) continue;
    let lateFee = Number(inv.late_fee_applied);
    if (lateFee === 0) {
      lateFee =
        cfg.late_fee_type === "percent"
          ? Math.round((Number(cfg.amount) * Number(cfg.late_fee_value)) / 100)
          : Number(cfg.late_fee_value);
    }
    const status = lateFee > 0 ? "overdue" : inv.status;
    updates.push({ id: inv.id, late_fee_applied: lateFee, status });
  }
  if (updates.length === 0) return 0;
  for (const u of updates) {
    await supabase
      .from("invoices")
      .update({ late_fee_applied: u.late_fee_applied, status: u.status })
      .eq("id", u.id);
  }
  return updates.length;
}
export async function logAudit(
  societyId: string,
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  await supabase.from("audit_log").insert({
    society_id: societyId,
    user_id: userId,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}
export async function logReminder(
  societyId: string,
  invoiceId: string | null,
  type: string,
  message: string,
) {
  await supabase.from("reminders_log").insert({
    society_id: societyId,
    invoice_id: invoiceId,
    type,
    sent_on: new Date().toISOString(),
    channel: "whatsapp",
    status: "sent",
    message,
  });
}
export async function ensureSettings(societyId: string): Promise<void> {
  const { data } = await supabase
    .from("settings")
    .select("id")
    .eq("society_id", societyId)
    .maybeSingle();
  if (!data) {
    await supabase.from("settings").insert({ society_id: societyId });
  }
}
export type { Society };
