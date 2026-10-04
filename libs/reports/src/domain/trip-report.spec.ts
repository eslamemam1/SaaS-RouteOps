import {
  daysSoFar,
  isReportMonth,
  memberOrganization,
  monthDays,
  ReportChoices,
  reportLines,
  reportTotal,
  shiftMonth,
  TripCount,
} from './trip-report';

describe('report months', () => {
  it('accepts only a year and a month', () => {
    expect(isReportMonth('2026-10')).toBe(true);
    expect(isReportMonth('2026-13')).toBe(false);
    expect(isReportMonth('2026-10-01')).toBe(false);
    expect(isReportMonth('')).toBe(false);
  });

  it('moves across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('knows the last day of each month, including leap years', () => {
    expect(monthDays('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthDays('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthDays('2026-10')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });

  it('checks a month only up to today', () => {
    expect(daysSoFar('2026-10', '2026-10-04')).toEqual({
      from: '2026-10-01',
      to: '2026-10-04',
    });
    expect(daysSoFar('2026-09', '2026-10-04')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(daysSoFar('2026-11', '2026-10-04')).toBeNull();
  });
});

describe('report lines', () => {
  const choices: ReportChoices = {
    customers: [
      { id: 'delta', label: 'Delta Factory' },
      { id: 'nour', label: 'Nour Company' },
    ],
    vehicles: [
      { id: 'bus-1', label: 'أ ب ج 1234', ownership: 'owned', ownerName: '' },
      { id: 'van-2', label: 'د هـ و 5678', ownership: 'rented', ownerName: 'مكتب النور' },
    ],
    drivers: [{ id: 'ahmed', label: 'أحمد علي' }],
  };
  const counts: TripCount[] = [
    { customerId: 'delta', vehicleId: 'bus-1', driverId: 'ahmed', done: 40, extra: 0 },
    { customerId: 'nour', vehicleId: 'bus-1', driverId: 'ahmed', done: 10, extra: 2 },
    { customerId: 'nour', vehicleId: 'van-2', driverId: '', done: 22, extra: 1 },
  ];

  it('adds up the trips of each client company, most trips first', () => {
    expect(reportLines(counts, 'customer', choices)).toEqual([
      { id: 'delta', label: 'Delta Factory', done: 40, extra: 0 },
      { id: 'nour', label: 'Nour Company', done: 32, extra: 3 },
    ]);
  });

  it('adds up the trips of each vehicle', () => {
    expect(reportLines(counts, 'vehicle', choices)).toEqual([
      { id: 'bus-1', label: 'أ ب ج 1234', done: 50, extra: 2 },
      { id: 'van-2', label: 'د هـ و 5678', done: 22, extra: 1 },
    ]);
  });

  it('keeps trips without a driver on their own line', () => {
    expect(reportLines(counts, 'driver', choices)).toEqual([
      { id: 'ahmed', label: 'أحمد علي', done: 50, extra: 2 },
      { id: '', label: '', done: 22, extra: 1 },
    ]);
  });

  it('totals the month', () => {
    expect(reportTotal(counts)).toEqual({ done: 72, extra: 3 });
    expect(reportTotal([])).toEqual({ done: 0, extra: 0 });
  });
});

describe('memberOrganization', () => {
  it('returns only an organization the user belongs to', () => {
    const north = { id: 'org-north', name: 'North' };
    expect(memberOrganization([north], 'org-north')).toBe(north);
    expect(memberOrganization([north], 'org-south')).toBeNull();
  });
});
