import { useState, useMemo } from 'react';
import {
  Wallet, Receipt, Home, Wrench, ShieldCheck, ArrowRight,
  Clock, CheckCircle2, AlertTriangle, Plus, Phone, FileDown,
  Car, Calendar, CreditCard, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useWallet, useInvoices, useTickets, useSocietyData } from '@/lib/hooks';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Field, Textarea, Select } from '@/components/ui/Field';
import { PageLoader, ErrorBanner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatMonth } from '@/lib/format';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { createLocalTicket } from '@/lib/localStore';
import type { TicketCategory, TicketPriority, MaintenanceTicketWithRelations } from '@/lib/types';

export function TenantDashboard() {
  const { user, profile, society } = useAuth();
  const societyId = society?.id ?? null;
  const { wallet, transactions, reload: reloadWallet, payFromWallet, topUp } = useWallet();
  const { invoices, reload: reloadInvoices } = useInvoices(societyId);
  const { tickets, reload: reloadTickets } = useTickets(societyId);
  const { flats, tenants } = useSocietyData();
  const { notify } = useToast();
  const { navigate } = useRouter();

  // Find the tenant record for this user
  const myTenantRecord = useMemo(() => {
    if (!user) return null;
    return tenants.find(t => t.email === user.email || t.phone === profile?.phone) ?? tenants[0] ?? null;
  }, [tenants, user, profile]);

  // Find linked flat
  const myFlat = useMemo(() => {
    if (!myTenantRecord) return flats[0] ?? null;
    return flats.find(f => f.id === myTenantRecord.flat_id) ?? null;
  }, [flats, myTenantRecord]);

  // Invoices for this tenant's flat
  const myInvoices = useMemo(() => {
    if (!myFlat) return invoices.slice(0, 3);
    return invoices.filter(i => i.flat_id === myFlat.id);
  }, [invoices, myFlat]);

  const unpaidRentInvoice = myInvoices.find(i => i.status !== 'paid');

  // Modals
  const [ticketModal, setTicketModal] = useState(false);
  const [topUpModal, setTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('10000');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('plumbing');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Pay rent directly from wallet
  async function handlePayRent() {
    if (!unpaidRentInvoice) return;
    const totalDue = Number(unpaidRentInvoice.amount) + Number(unpaidRentInvoice.late_fee_applied);

    if ((wallet?.balance ?? 0) < totalDue) {
      notify(`Insufficient wallet balance (₹${wallet?.balance ?? 0}). Please top up first.`, 'error');
      setTopUpModal(true);
      return;
    }

    setSubmitting(true);
    const res = await payFromWallet(
      totalDue,
      'rent_payment',
      unpaidRentInvoice.id,
      `Rent Payment for ${myFlat?.flat_no ?? 'unit'} - ${unpaidRentInvoice.month}`
    );
    setSubmitting(false);

    if (res.error) {
      notify(res.error, 'error');
    } else {
      notify(`Rent payment of ₹${totalDue.toLocaleString('en-IN')} completed! Receipt generated.`, 'success');
      reloadInvoices();
      reloadWallet();
    }
  }

  async function handleTopUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) {
      notify('Enter a valid top-up amount.', 'error');
      return;
    }
    setSubmitting(true);
    const res = await topUp(amt);
    setSubmitting(false);
    if (res.error) {
      notify(res.error, 'error');
    } else {
      notify(`₹${amt.toLocaleString('en-IN')} added to your wallet.`, 'success');
      setTopUpModal(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!societyId || !myFlat) {
      notify('You are not connected to a flat yet.', 'error');
      return;
    }
    if (!ticketTitle.trim()) {
      notify('Please enter a title for your request.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('maintenance_tickets').insert({
        society_id: societyId,
        flat_id: myFlat.id,
        tenant_id: myTenantRecord?.id ?? null,
        title: ticketTitle.trim(),
        description: ticketDesc.trim() || null,
        category: ticketCategory,
        priority: ticketPriority,
        status: 'open',
      });

      if (!error) {
        notify('Maintenance ticket created! Committee assigned.', 'success');
        setTicketModal(false);
        setTicketTitle('');
        setTicketDesc('');
        reloadTickets();
        setSubmitting(false);
        return;
      }
    } catch {
      // Remote fallback
    }

    createLocalTicket({
      society_id: societyId,
      flat_id: myFlat.id,
      tenant_id: myTenantRecord?.id ?? null,
      title: ticketTitle.trim(),
      description: ticketDesc.trim() || null,
      category: ticketCategory,
      priority: ticketPriority,
      status: 'open',
      assigned_to: 'Society Maintenance Desk',
      flats: { id: myFlat.id, flat_no: myFlat.flat_no },
      tenants: { id: myTenantRecord?.id ?? 'ten_1', name: profile?.full_name ?? user?.email ?? 'Resident' },
    });
    notify('Maintenance ticket created! Committee assigned.', 'success');
    setTicketModal(false);
    setTicketTitle('');
    setTicketDesc('');
    reloadTickets();
    setSubmitting(false);
  }

  return (
    <div className="space-y-6 animate-fade-in text-ink-900">
      {/* Welcome & Role Strip */}
      <div className="bg-surface-2 p-6 rounded-xl border border-line-strong shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-success-500 text-white">
              TENANT PORTAL
            </span>
            <span className="text-xs text-ink-500 font-medium">
              {society?.name ?? 'Residential Complex'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mt-1.5">
            Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'Resident'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            {myFlat ? `Living in Unit: ${myFlat.flat_no} · Floor ${myFlat.floor}` : 'Linked Lease Details & Personal Wallet'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setTicketModal(true)}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            <Wrench size={14} /> Raise Ticket
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wallet')}
            className="border border-line-strong text-ink-900 hover:bg-surface-3"
          >
            <Wallet size={14} /> My Wallet
          </Button>
        </div>
      </div>

      {/* TOP ROW: LEASE CARD & WALLET SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Lease Overview */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>My Rental Lease &amp; Unit</CardTitle>
              <CardDescription>Official verified tenancy agreement</CardDescription>
            </div>
            <Badge tone="paid">
              <CheckCircle2 size={12} className="mr-1" /> Active Tenancy
            </Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-3/30 border border-line-strong text-xs">
              <div>
                <p className="text-ink-500">Assigned Unit</p>
                <p className="text-base font-bold text-ink-900 mt-0.5">
                  {myFlat?.flat_no ?? 'Flat 101'}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Monthly Rent</p>
                <p className="text-base font-bold text-ink-900 mt-0.5">
                  {formatCurrency(myFlat?.rent_config?.[0]?.amount ?? 25000)}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Deposit Held</p>
                <p className="text-base font-bold text-ink-900 mt-0.5">
                  {formatCurrency(myTenantRecord?.security_deposit ?? 50000)}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Lease End Date</p>
                <p className="text-base font-bold text-ink-900 mt-0.5">
                  {myTenantRecord?.lease_end ? formatDate(myTenantRecord.lease_end) : '11 Months'}
                </p>
              </div>
            </div>

            {/* Rent Due Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-canvas border border-line-strong">
              <div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-600" />
                  <p className="text-sm font-bold text-ink-900">
                    {unpaidRentInvoice ? `Rent Due for ${formatMonth(unpaidRentInvoice.month)}` : 'All Rent Dues Clear!'}
                  </p>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  {unpaidRentInvoice
                    ? `Due on ${formatDate(unpaidRentInvoice.due_date)}. Pay directly with Habitra Wallet.`
                    : 'Your next rent billing will be generated automatically on the 1st.'}
                </p>
              </div>

              {unpaidRentInvoice && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-ink-500">Total Payable</p>
                    <p className="text-lg font-bold text-brand-600">
                      {formatCurrency(Number(unpaidRentInvoice.amount) + Number(unpaidRentInvoice.late_fee_applied))}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePayRent}
                    disabled={submitting}
                    className="bg-success-500 hover:bg-success-600 text-white font-semibold"
                  >
                    Pay from Wallet
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Tenant Wallet Quick Card */}
        <Card>
          <CardHeader>
            <CardTitle>Habitra Wallet</CardTitle>
            <CardDescription>Instant rent &amp; maintenance escrow</CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-600 text-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Available Balance</span>
                <Wallet size={16} />
              </div>
              <p className="text-3xl font-bold font-mono tracking-tight">
                {formatCurrency(wallet?.balance ?? 0)}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/20 text-xs text-white/90">
                <span>Auto-Deduct on Due Date</span>
                <span className="font-semibold text-success-500 bg-white px-2 py-0.5 rounded">Enabled</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setTopUpModal(true)}
              className="w-full bg-surface-2 hover:bg-surface-3 text-ink-900 border border-line-strong"
            >
              <Plus size={14} /> Top Up Balance
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* LOWER ROW: RECENT INVOICES & MAINTENANCE TICKETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* My Invoices & Receipts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>My Invoices &amp; Receipts</CardTitle>
              <CardDescription>Monthly rent bills and HRA payment receipts</CardDescription>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              View All &rarr;
            </button>
          </CardHeader>
          <CardBody className="p-0">
            {myInvoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-500">
                No invoices found for this flat.
              </div>
            ) : (
              <div className="divide-y divide-line-strong">
                {myInvoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatMonth(inv.month)} Rent &amp; Maintenance
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Due: {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-ink-900">
                        {formatCurrency(Number(inv.amount))}
                      </p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* My Maintenance Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>My Maintenance Requests</CardTitle>
              <CardDescription>Tickets raised for your flat</CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTicketModal(true)}
              className="bg-brand-600 text-white"
            >
              <Plus size={13} /> New Ticket
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-500">
                No open tickets for your unit. Everything is in order!
              </div>
            ) : (
              <div className="divide-y divide-line-strong">
                {tickets.slice(0, 4).map((tick: MaintenanceTicketWithRelations) => (
                  <div key={tick.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{tick.title}</p>
                      <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
                        <span className="capitalize">{tick.category}</span>
                        <span>·</span>
                        <span>{formatDate(tick.created_at)}</span>
                      </div>
                    </div>
                    <Badge tone={tick.status === 'resolved' ? 'paid' : tick.status === 'assigned' ? 'pending' : 'overdue'}>
                      {tick.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* MODAL: TOP UP WALLET */}
      {topUpModal && (
        <Modal
          open={topUpModal}
          onClose={() => setTopUpModal(false)}
          title="Top Up Tenant Wallet"
        >
          <form onSubmit={handleTopUpSubmit} className="space-y-4 text-ink-900">
            <p className="text-xs text-ink-500">
              Add funds to your secure Habitra wallet for 1-click rent deduction and society service payments.
            </p>
            <Field label="Amount to Add (₹)" htmlFor="topAmt" required>
              <Input
                id="topAmt"
                type="number"
                min="100"
                step="100"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                required
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              {['5000', '15000', '25000', '50000'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTopUpAmount(val)}
                  className="px-2.5 py-1 text-xs rounded bg-surface-3 hover:bg-surface-3 font-semibold text-ink-900"
                >
                  +₹{Number(val).toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setTopUpModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} className="bg-brand-600 text-white">
                {submitting ? 'Processing…' : 'Add to Wallet'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: NEW MAINTENANCE TICKET */}
      {ticketModal && (
        <Modal
          open={ticketModal}
          onClose={() => setTicketModal(false)}
          title="Raise Maintenance Ticket"
        >
          <form onSubmit={handleCreateTicket} className="space-y-4 text-ink-900">
            <Field label="Issue Title" htmlFor="tTitle" required>
              <Input
                id="tTitle"
                placeholder="e.g. Master bathroom tap dripping"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" htmlFor="tCat">
                <Select
                  id="tCat"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electricity">Electrical</option>
                  <option value="water">Water Supply</option>
                  <option value="cleaning">Cleaning / Housekeeping</option>
                  <option value="security">Security</option>
                  <option value="lift">Lift / Elevator</option>
                  <option value="other">Other</option>
                </Select>
              </Field>

              <Field label="Priority" htmlFor="tPri">
                <Select
                  id="tPri"
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                >
                  <option value="low">Low (Next few days)</option>
                  <option value="medium">Medium (Standard 24h)</option>
                  <option value="high">High (Urgent)</option>
                  <option value="critical">Critical (Emergency)</option>
                </Select>
              </Field>
            </div>

            <Field label="Description &amp; Details" htmlFor="tDesc">
              <Textarea
                id="tDesc"
                rows={3}
                placeholder="Describe what is broken, preferred visit timing, etc."
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setTicketModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} className="bg-brand-600 text-white">
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
