import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  getPermissions,
  getRoleLabel,
  getRoleDescription,
  getNavSections,
  type UserRole,
} from '@/lib/roles';

describe('Role-Based Access Control (RBAC)', () => {
  it('assigns platform admin full administrative permissions', () => {
    expect(hasPermission('admin', 'view_admin')).toBe(true);
    expect(hasPermission('admin', 'manage_admin')).toBe(true);
    expect(hasPermission('admin', 'manage_flats')).toBe(true);
    expect(hasPermission('admin', 'manage_tenants')).toBe(true);
  });

  it('restricts tenants from administrative and management permissions', () => {
    expect(hasPermission('tenant', 'view_admin')).toBe(false);
    expect(hasPermission('tenant', 'manage_buildings')).toBe(false);
    expect(hasPermission('tenant', 'manage_flats')).toBe(false);
    expect(hasPermission('tenant', 'manage_tenants')).toBe(false);
    expect(hasPermission('tenant', 'view_invoices')).toBe(true);
    expect(hasPermission('tenant', 'submit_maintenance')).toBe(true);
    expect(hasPermission('tenant', 'use_wallet')).toBe(true);
  });

  it('allows flat owners to manage their real estate and view rent dues', () => {
    expect(hasPermission('flat_owner', 'view_flats')).toBe(true);
    expect(hasPermission('flat_owner', 'view_tenants')).toBe(true);
    expect(hasPermission('flat_owner', 'view_invoices')).toBe(true);
    expect(hasPermission('flat_owner', 'view_wallet')).toBe(true);
    expect(hasPermission('flat_owner', 'view_admin')).toBe(false);
  });

  it('allows building owners to operate society infrastructure', () => {
    expect(hasPermission('building_owner', 'manage_flats')).toBe(true);
    expect(hasPermission('building_owner', 'manage_tenants')).toBe(true);
    expect(hasPermission('building_owner', 'manage_invoices')).toBe(true);
    expect(hasPermission('building_owner', 'manage_maintenance')).toBe(true);
    expect(hasPermission('building_owner', 'view_assets')).toBe(true);
    expect(hasPermission('building_owner', 'view_admin')).toBe(false);
  });

  it('evaluates hasAnyPermission correctly', () => {
    expect(hasAnyPermission('tenant', ['manage_buildings', 'view_invoices'])).toBe(true);
    expect(hasAnyPermission('tenant', ['manage_buildings', 'view_admin'])).toBe(false);
  });

  it('returns human-readable labels for all supported roles', () => {
    expect(getRoleLabel('admin')).toBe('Platform Admin');
    expect(getRoleLabel('building_owner')).toBe('Building Owner');
    expect(getRoleLabel('flat_owner')).toBe('Flat Owner');
    expect(getRoleLabel('tenant')).toBe('Tenant');
  });

  it('returns clear role descriptions', () => {
    expect(getRoleDescription('admin')).toContain('Full platform access');
    expect(getRoleDescription('tenant')).toContain('pay rent');
    expect(getRoleDescription('flat_owner')).toContain('receive rent payouts');
  });

  it('filters navigation sections by role permissions', () => {
    const tenantSections = getNavSections('tenant');
    const flatOwnerSections = getNavSections('flat_owner');
    const buildingOwnerSections = getNavSections('building_owner');
    const adminSections = getNavSections('admin');

    // Tenant should never see Admin Panel or Flats Management
    const tenantItemPaths = tenantSections.flatMap((s) => s.items.map((i) => i.path));
    expect(tenantItemPaths).not.toContain('/admin');
    expect(tenantItemPaths).not.toContain('/owners');
    expect(tenantItemPaths).toContain('/invoices');

    // Building Owner should have access to /flats, /owners, /tenants
    const bOwnerItemPaths = buildingOwnerSections.flatMap((s) => s.items.map((i) => i.path));
    expect(bOwnerItemPaths).toContain('/flats');
    expect(bOwnerItemPaths).toContain('/owners');
    expect(bOwnerItemPaths).toContain('/tenants');

    // Admin should have access to /admin
    const adminItemPaths = adminSections.flatMap((s) => s.items.map((i) => i.path));
    expect(adminItemPaths).toContain('/admin');
  });
});
