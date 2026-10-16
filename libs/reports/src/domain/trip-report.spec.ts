import {
  costShares,
  customerInvoiceLines,
  daysSoFar,
  ExpenseTotal,
  expenseSum,
  invoiceDateError,
  invoiceDaysSoFar,
  invoiceRate,
  isReportMonth,
  memberOrganization,
  monthDays,
  previousMonthDays,
  ReportChoices,
  reportLines,
  ReportOrganization,
  reportTotal,
  TripCount,
} from './trip-report';

describe('report months', () => {
  it('accepts only a year and a month', () => {
    expect(isReportMonth('2026-10')).toBe(true);
    expect(isReportMonth('2026-13')).toBe(false);
    expect(isReportMonth('2026-10-01')).toBe(false);
    expect(isReportMonth('')).toBe(false);
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
      { id: 'bus-1', label: 'أ ب ج 1234', ownership: 'owned', ownerName: '', type: 'bus' },
      { id: 'van-2', label: 'د هـ و 5678', ownership: 'rented', ownerName: 'مكتب النور', type: 'microbus' },
    ],
    routes: [
      { id: 'delta-1', label: 'خط المعادي', customerId: 'delta' },
      { id: 'nour-1', label: 'خط المعادي', customerId: 'nour' },
    ],
    drivers: [{ id: 'ahmed', label: 'أحمد علي' }],
  };
  const counts: TripCount[] = [
    { customerId: 'delta', routeId: 'delta-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 40, extra: 0, full: 20, extraFull: 0, revenue: 400000, unpriced: 0 },
    { customerId: 'nour', routeId: 'nour-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 10, extra: 2, full: 5, extraFull: 1, revenue: 150000, unpriced: 0 },
    { customerId: 'nour', routeId: '', vehicleId: 'van-2', driverId: '', done: 22, extra: 1, full: 11, extraFull: 0.5, revenue: 210000, unpriced: 1 },
  ];

  it('adds up the trips of each client company, most trips first', () => {
    expect(reportLines(counts, 'customer', choices)).toEqual([
      { id: 'delta', label: 'Delta Factory', done: 40, extra: 0, full: 20, extraFull: 0, revenue: 400000, unpriced: 0, expenses: 0, driverCost: 0, vehicleCost: 0 },
      { id: 'nour', label: 'Nour Company', done: 32, extra: 3, full: 16, extraFull: 1.5, revenue: 360000, unpriced: 1, expenses: 0, driverCost: 0, vehicleCost: 0 },
    ]);
  });

  it('adds up the trips of each vehicle', () => {
    expect(reportLines(counts, 'vehicle', choices)).toEqual([
      { id: 'bus-1', label: 'أ ب ج 1234', done: 50, extra: 2, full: 25, extraFull: 1, revenue: 550000, unpriced: 0, expenses: 0, driverCost: 0, vehicleCost: 0 },
      { id: 'van-2', label: 'د هـ و 5678', done: 22, extra: 1, full: 11, extraFull: 0.5, revenue: 210000, unpriced: 1, expenses: 0, driverCost: 0, vehicleCost: 0 },
    ]);
  });

  it('subtracts the expenses of each vehicle, including one without trips', () => {
    const expenses: ExpenseTotal[] = [
      { category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 80000 },
      { category: 'maintenance', vehicleId: 'bus-1', driverId: '', total: 20000 },
      { category: 'rent', vehicleId: 'van-3', driverId: '', total: 300000 },
      { category: 'office', vehicleId: '', driverId: '', total: 15000 },
    ];

    expect(
      reportLines(counts, 'vehicle', choices, expenses).map((line) => [line.id, line.expenses]),
    ).toEqual([
      ['bus-1', 100000],
      ['van-2', 0],
      ['van-3', 300000],
      ['', 15000],
    ]);
    expect(reportLines(counts, 'customer', choices, expenses)).toHaveLength(2);
    expect(expenseSum(expenses)).toBe(415000);
  });

  it('keeps trips without a driver on their own line', () => {
    expect(reportLines(counts, 'driver', choices)).toEqual([
      { id: 'ahmed', label: 'أحمد علي', done: 50, extra: 2, full: 25, extraFull: 1, revenue: 550000, unpriced: 0, expenses: 0, driverCost: 0, vehicleCost: 0 },
      { id: '', label: '', done: 22, extra: 1, full: 11, extraFull: 0.5, revenue: 210000, unpriced: 1, expenses: 0, driverCost: 0, vehicleCost: 0 },
    ]);
  });

  it('shares a driver and a vehicle over their routes by done trips', () => {
    const expenses: ExpenseTotal[] = [
      { category: 'salaries', vehicleId: '', driverId: 'ahmed', total: 500000 },
      { category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 100000 },
      { category: 'rent', vehicleId: 'van-2', driverId: '', total: 1200000 },
      { category: 'office', vehicleId: '', driverId: '', total: 30000 },
    ];

    expect(
      reportLines(counts, 'route', choices, expenses).map((line) => [
        line.id,
        line.driverCost,
        line.vehicleCost,
      ]),
    ).toEqual([
      ['delta-1', 400000, 80000],
      ['', 0, 1200000],
      ['nour-1', 100000, 20000],
    ]);
    expect(costShares(counts, expenses).other).toBe(30000);
  });

  it('puts a salary on the driver and other costs of a vehicle on the vehicle', () => {
    const route: TripCount[] = [
      { customerId: 'delta', routeId: 'delta-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 44, extra: 0, full: 22, extraFull: 0, revenue: 2500000, unpriced: 0 },
    ];
    const expenses: ExpenseTotal[] = [
      { category: 'salaries', vehicleId: 'bus-1', driverId: 'ahmed', total: 500000 },
      { category: 'rent', vehicleId: 'bus-1', driverId: 'ahmed', total: 1200000 },
    ];

    expect(costShares(route, expenses).routes.get('delta-1')).toEqual({
      driver: 500000,
      vehicle: 1200000,
    });
  });

  it('leaves the costs of a driver without done trips to no route', () => {
    const expenses: ExpenseTotal[] = [
      { category: 'salaries', vehicleId: '', driverId: 'karim', total: 400000 },
    ];

    expect(costShares(counts, expenses)).toEqual({ routes: new Map(), other: 400000 });
  });

  it('splits a cost in whole piasters that add up to it', () => {
    const routes: TripCount[] = ['a', 'b', 'c'].map((routeId) => ({
      customerId: 'delta',
      routeId,
      vehicleId: '',
      driverId: 'ahmed',
      done: 1,
      extra: 0,
      full: 0.5,
      extraFull: 0,
      revenue: 0,
      unpriced: 0,
    }));
    const expenses: ExpenseTotal[] = [
      { category: 'salaries', vehicleId: '', driverId: 'ahmed', total: 100 },
    ];

    const shares = costShares(routes, expenses);

    expect([...shares.routes].map(([id, costs]) => [id, costs.driver])).toEqual([
      ['a', 34],
      ['b', 33],
      ['c', 33],
    ]);
    expect(shares.other).toBe(0);
  });

  it('totals the month', () => {
    expect(reportTotal(counts)).toEqual({ done: 72, extra: 3, full: 36, extraFull: 1.5, revenue: 760000, unpriced: 1 });
    expect(reportTotal([])).toEqual({ done: 0, extra: 0, full: 0, extraFull: 0, revenue: 0, unpriced: 0 });
  });
});

describe('memberOrganization', () => {
  it('returns only an organization the user belongs to', () => {
    const north: ReportOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
    expect(memberOrganization([north], 'org-north')).toBe(north);
    expect(memberOrganization([north], 'org-south')).toBeNull();
  });
});

describe('customer invoice', () => {
  const choices: ReportChoices = {
    customers: [
      { id: 'delta', label: 'Delta Factory' },
      { id: 'nour', label: 'Nour Company' },
    ],
    vehicles: [
      { id: 'bus-1', label: 'أ ب ج 1234', ownership: 'owned', ownerName: '', type: 'bus' },
      { id: 'van-2', label: 'د هـ و 5678', ownership: 'rented', ownerName: 'مكتب النور', type: 'microbus' },
    ],
    routes: [
      { id: 'delta-1', label: 'خط المعادي', customerId: 'delta' },
      { id: 'nour-1', label: 'خط المعادي', customerId: 'nour' },
    ],
    drivers: [{ id: 'ahmed', label: 'أحمد علي' }],
  };
  const counts: TripCount[] = [
    { customerId: 'delta', routeId: 'delta-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 40, extra: 0, full: 20, extraFull: 0, revenue: 400000, unpriced: 0 },
    { customerId: 'nour', routeId: 'nour-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 10, extra: 2, full: 5, extraFull: 1, revenue: 150000, unpriced: 0 },
    { customerId: 'nour', routeId: '', vehicleId: 'van-2', driverId: '', done: 22, extra: 1, full: 11, extraFull: 0.5, revenue: 210000, unpriced: 1 },
  ];

  it('accepts only a past or today range of at most 93 days', () => {
    expect(invoiceDateError({ from: '2026-08-26', to: '2026-09-25' }, '2026-10-12')).toBeNull();
    expect(invoiceDateError({ from: '2026-10-01', to: '2026-10-12' }, '2026-10-12')).toBeNull();
    expect(invoiceDateError({ from: '2026-10-01', to: '2026-10-13' }, '2026-10-12')).toBe('date');
    expect(invoiceDateError({ from: '2026-10-12', to: '2026-10-01' }, '2026-10-12')).toBe('date');
    expect(invoiceDateError({ from: 'bad', to: '2026-10-01' }, '2026-10-12')).toBe('date');
    expect(
      invoiceDateError({ from: '2026-07-10', to: '2026-10-11' }, '2026-10-12'),
    ).toBe('tooManyDays');
    expect(invoiceDaysSoFar('2026-10-12')).toEqual({
      from: '2026-10-01',
      to: '2026-10-12',
    });
    expect(previousMonthDays('2026-10-12')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(previousMonthDays('2026-01-05')).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('gives the unit rate only when every full trip shared one price', () => {
    expect(invoiceRate(400000, 20)).toBe(20000);
    expect(invoiceRate(210000, 11)).toBeNull();
    expect(invoiceRate(0, 20)).toBeNull();
    expect(invoiceRate(400000, 0)).toBeNull();
  });

  it('builds invoice lines for one company with route type and extras', () => {
    expect(customerInvoiceLines(counts, 'nour', choices)).toEqual([
      {
        routeId: '',
        label: '',
        vehicleType: 'microbus',
        trips: 11,
        extra: 0.5,
        rate: null,
        revenue: 210000,
        unpriced: 1,
      },
      {
        routeId: 'nour-1',
        label: 'خط المعادي',
        vehicleType: 'bus',
        trips: 5,
        extra: 1,
        rate: 30000,
        revenue: 150000,
        unpriced: 0,
      },
    ]);
    expect(customerInvoiceLines(counts, 'delta', choices)).toEqual([
      {
        routeId: 'delta-1',
        label: 'خط المعادي',
        vehicleType: 'bus',
        trips: 20,
        extra: 0,
        rate: 20000,
        revenue: 400000,
        unpriced: 0,
      },
    ]);
  });

  it('keeps the vehicle type with the most trips when a route mixed types', () => {
    const mixed: TripCount[] = [
      { customerId: 'delta', routeId: 'delta-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 10, extra: 0, full: 5, extraFull: 0, revenue: 100000, unpriced: 0 },
      { customerId: 'delta', routeId: 'delta-1', vehicleId: 'van-2', driverId: 'ahmed', done: 30, extra: 0, full: 15, extraFull: 0, revenue: 300000, unpriced: 0 },
    ];

    expect(customerInvoiceLines(mixed, 'delta', choices)[0]).toMatchObject({
      vehicleType: 'microbus',
      trips: 20,
      rate: 20000,
      revenue: 400000,
    });
  });
});
