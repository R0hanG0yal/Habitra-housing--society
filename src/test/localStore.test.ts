import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveLocalFlat,
  getLocalFlats,
  deleteLocalFlat,
  saveLocalTower,
  getLocalTowers,
  saveLocalTenant,
  getLocalTenants,
  deleteLocalTenant,
  saveLocalOwner,
  getLocalOwners,
  deleteLocalOwner,
  createLocalBuildingRegistration,
  getLocalBuildingRegistrations,
  updateLocalBuildingRegistrationStatus,
  getLocalWallet,
  topUpLocalWallet,
  payFromLocalWallet,
  getLocalWalletTransactions,
} from '@/lib/localStore';

describe('localStore offline persistence engine', () => {
  const societyId = 'soc-test-123';
  const towerId = 'tow-test-456';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Towers & Flats CRUD', () => {
    it('creates and retrieves towers', () => {
      const tower = saveLocalTower(societyId, 'Tower Cedar');
      expect(tower.id).toBeDefined();
      expect(tower.name).toBe('Tower Cedar');
      expect(tower.society_id).toBe(societyId);

      const towers = getLocalTowers(societyId);
      expect(towers).toHaveLength(1);
      expect(towers[0].name).toBe('Tower Cedar');
    });

    it('creates, edits, and deletes flats', () => {
      const newFlat = saveLocalFlat(
        {
          society_id: societyId,
          tower_id: towerId,
          flat_no: '502',
          floor: 5,
          area_sqft: 1400,
          status: 'vacant',
          unit_type: 'flat',
          settlement_mode: 'smart_split',
          base_maintenance_fee: 3500,
          sinking_fund_fee: 500,
        },
        {
          amount: 25000,
          due_day: 5,
          late_fee_type: 'fixed',
          late_fee_value: 500,
          grace_days: 3,
        }
      );

      expect(newFlat.id).toBeDefined();
      expect(newFlat.flat_no).toBe('502');

      const flats = getLocalFlats(societyId);
      expect(flats).toHaveLength(1);
      expect(flats[0].flat_no).toBe('502');

      // Edit flat
      saveLocalFlat({
        ...flats[0],
        status: 'occupied',
        area_sqft: 1450,
      });

      const updatedFlats = getLocalFlats(societyId);
      expect(updatedFlats[0].status).toBe('occupied');
      expect(updatedFlats[0].area_sqft).toBe(1450);

      // Delete flat
      deleteLocalFlat(newFlat.id);
      expect(getLocalFlats(societyId)).toHaveLength(0);
    });
  });

  describe('Tenants & Owners CRUD', () => {
    it('creates, retrieves, and deletes tenants', () => {
      const tenant = saveLocalTenant({
        society_id: societyId,
        name: 'Aarav Sharma',
        phone: '9876543210',
        email: 'aarav@example.com',
        active: true,
        whatsapp_opt_in: true,
        security_deposit: 50000,
      });

      expect(tenant.id).toBeDefined();
      expect(tenant.name).toBe('Aarav Sharma');

      const list = getLocalTenants(societyId);
      expect(list).toHaveLength(1);
      expect(list[0].phone).toBe('9876543210');

      deleteLocalTenant(tenant.id);
      expect(getLocalTenants(societyId)).toHaveLength(0);
    });

    it('creates, retrieves, and deletes flat owners (landlords)', () => {
      const owner = saveLocalOwner({
        society_id: societyId,
        name: 'Vikram Malhotra',
        phone: '9988776655',
        email: 'vikram@example.com',
        pan_no: 'ABCDE1234F',
        is_nri: false,
      });

      expect(owner.id).toBeDefined();
      expect(owner.name).toBe('Vikram Malhotra');

      const owners = getLocalOwners(societyId);
      expect(owners).toHaveLength(1);
      expect(owners[0].pan_no).toBe('ABCDE1234F');

      deleteLocalOwner(owner.id);
      expect(getLocalOwners(societyId)).toHaveLength(0);
    });
  });

  describe('Building Registration & Admin Review', () => {
    it('submits a building registration application and updates status upon verification', () => {
      const reg = createLocalBuildingRegistration({
        society_id: null,
        owner_id: 'user-owner-1',
        building_name: 'Imperial Heights RWA',
        building_address: 'Sector 45, Gurgaon',
        registration_number: 'RWA-HR-2026-991',
        proof_type: 'registration_certificate',
        proof_document_url: 'data:application/pdf;base64,sample',
        status: 'pending',
        admin_notes: 'Initial registration application',
      });

      expect(reg.id).toBeDefined();
      expect(reg.status).toBe('pending');

      const all = getLocalBuildingRegistrations();
      expect(all.some((r) => r.id === reg.id)).toBe(true);

      // Admin verification
      updateLocalBuildingRegistrationStatus(
        reg.id,
        'verified',
        'admin-user-1',
        'Documents inspected and verified.'
      );

      const verifiedList = getLocalBuildingRegistrations();
      const verified = verifiedList.find((r) => r.id === reg.id);
      expect(verified?.status).toBe('verified');
      expect(verified?.verified_by).toBe('admin-user-1');
      expect(verified?.verified_at).toBeDefined();
    });
  });

  describe('Wallet Transactions & Ledger', () => {
    it('initializes wallet, tops up balance, and handles debit transactions', () => {
      const userId = 'user-wallet-test';
      const initialWallet = getLocalWallet(userId);
      expect(initialWallet.balance).toBe(0);

      // Top up ₹10,000
      const toppedWallet = topUpLocalWallet(userId, 10000, 'UPI_REF_987');
      expect(toppedWallet.balance).toBe(10000);

      // Pay maintenance ₹3,500
      const afterPay = payFromLocalWallet(
        userId,
        3500,
        'maintenance_payment',
        'INV-101',
        'Monthly Society Maintenance'
      );
      expect(afterPay.balance).toBe(6500);

      // Ledger history check
      const txs = getLocalWalletTransactions(toppedWallet.id);
      expect(txs).toHaveLength(2);
      expect(txs[0].type).toBe('debit'); // newest first
      expect(txs[0].amount).toBe(3500);
      expect(txs[1].type).toBe('credit');
      expect(txs[1].amount).toBe(10000);
    });

    it('rejects overdraft when wallet balance is insufficient', () => {
      const userId = 'user-broke';
      topUpLocalWallet(userId, 1000);

      expect(() => {
        payFromLocalWallet(userId, 5000, 'rent_payment');
      }).toThrow(/Insufficient wallet balance/);
    });
  });
});
