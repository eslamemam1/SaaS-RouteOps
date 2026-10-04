import { ReportsAccessError } from '../application/reports-access-error';
import { ReportOrganization } from '../domain/trip-report';
import { ReportsGateway } from './reports-gateway';
import { SupabaseReportsRepository } from './supabase-reports-repository';

const north: ReportOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };

describe('SupabaseReportsRepository', () => {
  it('refuses a signed-out user', async () => {
    const repository = new SupabaseReportsRepository(gateway({ sessionUserId: async () => null }));

    await expect(repository.organization('org-north')).rejects.toEqual(
      new ReportsAccessError('signedOut'),
    );
  });

  it('opens only an organization from the user memberships', async () => {
    const repository = new SupabaseReportsRepository(gateway({}));

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    await expect(repository.organization('org-south')).resolves.toBeNull();
  });

  it('counts the whole month and checks missing days only up to today', async () => {
    const tripCounts = vi.fn(async () => []);
    const unopenedDays = vi.fn(async () => ['2026-10-02']);
    const repository = new SupabaseReportsRepository(gateway({ tripCounts, unopenedDays }));

    await expect(repository.month(north, '2026-10', '2026-10-04')).resolves.toEqual({
      counts: [],
      unopenedDays: ['2026-10-02'],
    });
    expect(tripCounts).toHaveBeenCalledWith(
      'org-north',
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-04',
    );
    expect(unopenedDays).toHaveBeenCalledWith('org-north', {
      from: '2026-10-01',
      to: '2026-10-04',
    });
  });

  it('does not look for missing days in a month that has not started', async () => {
    const unopenedDays = vi.fn(async () => []);
    const repository = new SupabaseReportsRepository(gateway({ unopenedDays }));

    await repository.month(north, '2026-11', '2026-10-04');

    expect(unopenedDays).not.toHaveBeenCalled();
  });
});

function gateway(overrides: Partial<ReportsGateway>): ReportsGateway {
  return {
    sessionUserId: async () => 'user-1',
    membershipOrganizations: async () => [north],
    listChoices: async () => ({ customers: [], vehicles: [], drivers: [] }),
    tripCounts: async () => [],
    unopenedDays: async () => [],
    ...overrides,
  };
}
