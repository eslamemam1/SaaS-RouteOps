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
    const expenseTotals = vi.fn(async () => [
      { category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 5000 },
    ]);
    const unrecordedPay = vi.fn(async () => ({ drivers: 1, vehicles: 0 }));
    const repository = new SupabaseReportsRepository(
      gateway({ tripCounts, unopenedDays, expenseTotals, unrecordedPay }),
    );

    await expect(repository.month(north, '2026-10', '2026-10-04')).resolves.toEqual({
      counts: [],
      expenses: [{ category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 5000 }],
      unopenedDays: ['2026-10-02'],
      unrecorded: { drivers: 1, vehicles: 0 },
    });
    expect(unrecordedPay).toHaveBeenCalledWith(
      'org-north',
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-04',
    );
    expect(expenseTotals).toHaveBeenCalledWith('org-north', {
      from: '2026-10-01',
      to: '2026-10-31',
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

  it('loads trip counts for a chosen invoice range and refuses a bad range', async () => {
    const tripCounts = vi.fn(async () => [
      {
        customerId: 'delta',
        routeId: 'route-1',
        vehicleId: 'bus-1',
        driverId: 'ahmed',
        done: 2,
        extra: 0,
        full: 1,
        extraFull: 0,
        revenue: 20000,
        unpriced: 0,
        vehicleShare: 0,
        management: 0,
      },
    ]);
    const unopenedDays = vi.fn(async () => ['2026-08-27']);
    const repository = new SupabaseReportsRepository(
      gateway({ tripCounts, unopenedDays }),
    );
    const days = { from: '2026-08-26', to: '2026-09-25' };

    await expect(repository.range(north, days, '2026-10-12')).resolves.toEqual({
      counts: [
        {
          customerId: 'delta',
          routeId: 'route-1',
          vehicleId: 'bus-1',
          driverId: 'ahmed',
          done: 2,
          extra: 0,
          full: 1,
          extraFull: 0,
          revenue: 20000,
          unpriced: 0,
          vehicleShare: 0,
          management: 0,
        },
      ],
      unopenedDays: ['2026-08-27'],
    });
    expect(tripCounts).toHaveBeenCalledWith('org-north', days, '2026-10-12');
    expect(unopenedDays).toHaveBeenCalledWith('org-north', days);

    await expect(
      repository.range(
        north,
        { from: '2026-10-01', to: '2026-10-13' },
        '2026-10-12',
      ),
    ).rejects.toEqual(new ReportsAccessError('date'));
    expect(tripCounts).toHaveBeenCalledTimes(1);
  });
});

function gateway(overrides: Partial<ReportsGateway>): ReportsGateway {
  return {
    sessionUserId: async () => 'user-1',
    membershipOrganizations: async () => [north],
    listChoices: async () => ({ customers: [], routes: [], vehicles: [], drivers: [] }),
    tripCounts: async () => [],
    unopenedDays: async () => [],
    expenseTotals: async () => [],
    unrecordedPay: async () => ({ drivers: 0, vehicles: 0 }),
    ...overrides,
  };
}
