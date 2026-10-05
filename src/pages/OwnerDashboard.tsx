import { useState, useMemo } from 'react';
import {
  Building2, Home, Users, Receipt, Wallet, TrendingUp,
  Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Calendar, Wrench, Shield, Vote, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSocietyData, useInvoices, useWallet } from '@/lib/hooks';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatMonth } from '@/lib/format';
import { useRouter } from '@/lib/router';

export function OwnerDashboard() {
  const { user, profile, society } = useAuth();
  const societyId = society?.id ?? null;
  const { flats, tenants, loading } = useSocietyData();
  const { invoices } = useInvoices(societyId);
  const { wallet, transactions, payFromWallet } = useWallet();
  const { notify } = useToast();
  const { navigate } = useRouter();

  // Filter flats owned by this user
  const myFlats = useMemo(() => {
    if (!user) return flats.slice(0, 2);
    const owned = flats.filter(f => f.owner?.user_id === user.id || f.owner?.email === user.email || f.owner_id === user.id);
    return owned.length > 0 ? owned : flats.slice(0, 3);
  }, [flats, user]);

  const totalFlats = myFlats.length;
  const occupiedFlats = myFlats.filter(f => f.status === 'occupied').length;
  const vacantFlats = totalFlats - occupiedFlats;

  // Monthly expected rental revenue
  const monthlyRentalRevenue = useMemo(() => {
    return myFlats.reduce((sum, f) => {
      const cfg = f.rent_config?.[0];
      return sum + (cfg ? Number(cfg.amount) : 0);
    }, 0);
  }, [myFlats]);

  // Invoices for my flats
  const myFlatIds = useMemo(() => new Set(myFlats.map(f => f.id)), [myFlats]);
  const myInvoices = useMemo(() => invoices.filter(i => myFlatIds.has(i.flat_id)), [invoices, myFlatIds]);
  const paidInvoices = myInvoices.filter(i => i.status === 'paid');
  const pendingInvoices = myInvoices.filter(i => i.status !== 'paid');

  // Payout withdraw modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      notify('Enter a valid payout amount.', 'error');
      return;
    }
    if ((wallet?.balance ?? 0) < amt) {
      notify('Withdrawal amount exceeds wallet balance.', 'error');
      return;
    }

    setSubmitting(true);
    const res = await payFromWallet(amt, 'payout', undefined, `Payout withdrawal to Bank A/C ${bankAccount.slice(-4)}`);
    setSubmitting(false);

    if (res.error) {
      notify(res.error, 'error');
    } else {
      notify(`Payout request of ₹${amt.toLocaleString('en-IN')} initiated to your bank account.`, 'success');
      setWithdrawModal(false);
      setWithdrawAmount('');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-ink-900">
      {/* Header */}
      <div className="bg-surface-2 p-6 rounded-xl border border-line-strong shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gold-500 text-white">
              FLAT OWNER PORTAL
            </span>
            <span className="text-xs text-ink-500 font-medium">
              {society?.name ?? 'Residential Complex'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mt-1.5">
            Owner Portfolio — {profile?.full_name || user?.email?.split('@')[0] || 'Landlord'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Track unit occupancy, monitor tenant rent collections, and withdraw monthly rental yields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setWithdrawModal(true)}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            <ArrowUpRight size={14} /> Withdraw Payout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/flats')}
            className="border border-line-strong text-ink-900 hover:bg-surface-3"
          >
            <Home size={14} /> My Units ({totalFlats})
          </Button>
        </div>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-2 p-4 rounded-xl border border-line-strong shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Properties Owned</span>
            <Home size={16} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-ink-900 mt-2">{totalFlats} Units</p>
          <p className="text-xs text-success-500 font-semibold mt-1">
            {occupiedFlats} Occupied · {vacantFlats} Vacant
          </p>
        </div>

        <div className="bg-surface-2 p-4 rounded-xl border border-line-strong shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Monthly Rental Yield</span>
            <TrendingUp size={16} className="text-success-500" />
          </div>
          <p className="text-2xl font-bold text-ink-900 mt-2">
            {formatCurrency(monthlyRentalRevenue)}
          </p>
          <p className="text-xs text-ink-500 mt-1">Gross contractual rent</p>
        </div>

        <div className="bg-surface-2 p-4 rounded-xl border border-line-strong shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Wallet Escrow Balance</span>
            <Wallet size={16} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-brand-600 font-mono mt-2">
            {formatCurrency(wallet?.balance ?? 0)}
          </p>
          <p className="text-xs text-success-500 font-semibold mt-1">Ready for bank transfer</p>
        </div>

        <div className="bg-surface-2 p-4 rounded-xl border border-line-strong shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>AGM Voting Shares</span>
            <Vote size={16} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-ink-900 mt-2">{totalFlats} Votes</p>
          <p className="text-xs text-ink-500 mt-1">1 Vote per unit owned</p>
        </div>
      </div>

      {/* MY UNITS LIST */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Flats &amp; Active Tenancies</CardTitle>
            <CardDescription>Live status of your owned real estate units</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/flats')}>
            Manage Units &rarr;
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-line-strong">
            {myFlats.map((flat) => {
              const activeTenant = flat.tenants?.find(t => t.active) ?? flat.tenants?.[0];
              const rentCfg = flat.rent_config?.[0];
              return (
                <div key={flat.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink-900">Unit {flat.flat_no}</h3>
                      <Badge tone={flat.status === 'occupied' ? 'paid' : 'pending'}>
                        {flat.status === 'occupied' ? 'Tenant Occupied' : 'Vacant'}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-500">
                      Floor {flat.floor ?? 1} · {flat.unit_type?.toUpperCase() ?? 'FLAT'} · {flat.area_sqft ?? 1250} sq.ft
                    </p>
                    {activeTenant ? (
                      <p className="text-xs text-ink-900 pt-1">
                        Tenant: <strong>{activeTenant.name}</strong> ({activeTenant.phone || 'Phone on file'})
                      </p>
                    ) : (
                      <p className="text-xs text-brand-600 font-semibold pt-1">
                        Ready for rental listing / lease assignment
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-ink-500">Monthly Rent</p>
                      <p className="text-base font-bold text-ink-900">
                        {formatCurrency(rentCfg?.amount ?? 0)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/invoices')}
                      className="border border-line-strong text-xs"
                    >
                      View Ledger
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* WITHDRAW PAYOUT MODAL */}
      {withdrawModal && (
        <Modal
          open={withdrawModal}
          onClose={() => setWithdrawModal(false)}
          title="Withdraw Rental Payout to Bank"
        >
          <form onSubmit={handleWithdraw} className="space-y-4 text-ink-900">
            <div className="p-3 bg-surface-3/40 rounded-lg border border-line-strong text-xs">
              <p className="text-ink-500">Available Wallet Balance</p>
              <p className="text-xl font-bold text-brand-600 font-mono mt-0.5">
                {formatCurrency(wallet?.balance ?? 0)}
              </p>
            </div>

            <Field label="Amount to Withdraw (₹)" htmlFor="wAmt" required>
              <Input
                id="wAmt"
                type="number"
                min="500"
                max={wallet?.balance ?? 0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g. 25000"
                required
              />
            </Field>

            <Field label="Beneficiary Bank Account Number" htmlFor="bAcc" required>
              <Input
                id="bAcc"
                placeholder="e.g. 021410100092182"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
              />
            </Field>

            <Field label="Bank IFSC Code" htmlFor="bIfsc" required>
              <Input
                id="bIfsc"
                placeholder="e.g. HDFC0000214"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                required
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setWithdrawModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} className="bg-brand-600 text-white">
                {submitting ? 'Transferring…' : 'Initiate Bank Transfer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
