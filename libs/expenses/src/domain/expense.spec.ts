import {
  availableChoices,
  categoryError,
  categoryTotals,
  defaultDay,
  descriptionError,
  DriverPay,
  Expense,
  expenseAmountError,
  expenseDetails,
  ExpenseOrganization,
  expenseTotal,
  memberOrganization,
  payBreakdown,
  monthDays,
  remainingPay,
  salaryDetails,
  shiftMonth,
  spentOnError,
  suggestedPay,
} from './expense';

const fuel: Expense = {
  id: 'expense-1',
  spentOn: '2026-10-03',
  category: 'fuel',
  amount: 50000,
  vehicleId: 'vehicle-1',
  driverId: '',
  description: '',
};
const rent: Expense = { ...fuel, id: 'expense-2', category: 'rent', amount: 300000 };
const moreFuel: Expense = { ...fuel, id: 'expense-3', amount: 25050 };

const ahmed: DriverPay = {
  driverId: 'driver-1',
  payType: 'salary',
  monthlySalary: 300000,
  salaryTrips: 26,
  tripPay: { outbound: 5000, return: 5000 },
  done: { outbound: 26, return: 26 },
  absent: { outbound: 0, return: 0 },
  recorded: 0,
};
const pay = ahmed;

describe('expense validation', () => {
  it('needs a real date', () => {
    expect(spentOnError('2026-10-05')).toBeNull();
    expect(spentOnError('')).toBe('date');
    expect(spentOnError('2026-02-30')).toBe('date');
  });

  it('needs one of the known categories', () => {
    expect(categoryError('fuel')).toBeNull();
    expect(categoryError('')).toBe('category');
    expect(categoryError('gifts')).toBe('category');
  });

  it('needs an amount above zero in the currency', () => {
    expect(expenseAmountError('250.50', 'EGP')).toBeNull();
    expect(expenseAmountError('٢٥٠', 'EGP')).toBeNull();
    expect(expenseAmountError('', 'EGP')).toBe('amount');
    expect(expenseAmountError('0', 'EGP')).toBe('amount');
    expect(expenseAmountError('1.234', 'EGP')).toBe('amount');
    expect(expenseAmountError('1.234', 'KWD')).toBeNull();
  });

  it('needs a description only for other expenses', () => {
    expect(descriptionError('', 'fuel')).toBeNull();
    expect(descriptionError('  ', 'other')).toBe('description');
    expect(descriptionError('هدايا', 'other')).toBeNull();
    expect(descriptionError('x'.repeat(501), 'fuel')).toBe('tooLong');
  });
});

describe('driver pay', () => {
  it('pays the salary for exactly the trips it covers', () => {
    expect(suggestedPay(ahmed)).toBe(300000);
  });

  it('adds each trip beyond the salary at its direction amount', () => {
    const busy = { ...ahmed, done: { outbound: 30, return: 28 } };
    expect(payBreakdown(busy)).toMatchObject({
      extra: { outbound: 4, return: 2 },
      extraAmount: 30000,
      deduction: 0,
      total: 330000,
    });
  });

  it('takes off the trips missed through absence', () => {
    const absent = {
      ...ahmed,
      done: { outbound: 24, return: 24 },
      absent: { outbound: 2, return: 2 },
    };
    expect(payBreakdown(absent)).toMatchObject({
      missed: { outbound: 2, return: 2 },
      deduction: 20000,
      total: 280000,
    });
  });

  it('takes nothing off for trips lost to a holiday', () => {
    expect(suggestedPay({ ...ahmed, done: { outbound: 24, return: 24 } })).toBe(300000);
  });

  it('lets absences use up the trips beyond the salary first', () => {
    const both = {
      ...ahmed,
      done: { outbound: 28, return: 26 },
      absent: { outbound: 2, return: 0 },
    };
    expect(payBreakdown(both)).toMatchObject({ extraAmount: 10000, deduction: 0, total: 310000 });
  });

  it('keeps a fixed salary whatever the driver does', () => {
    const fixed = {
      ...ahmed,
      salaryTrips: null,
      tripPay: null,
      done: { outbound: 40, return: 10 },
      absent: { outbound: 3, return: 3 },
    };
    expect(suggestedPay(fixed)).toBe(300000);
  });

  it('pays a driver paid per trip for every trip at its direction amount', () => {
    const mahmoud: DriverPay = {
      ...ahmed,
      payType: 'perTrip',
      monthlySalary: null,
      salaryTrips: null,
      tripPay: { outbound: 6000, return: 4000 },
      done: { outbound: 2, return: 2 },
      absent: { outbound: 1, return: 0 },
    };
    expect(payBreakdown(mahmoud)).toMatchObject({
      salary: 0,
      extra: { outbound: 2, return: 2 },
      deduction: 0,
      total: 20000,
    });
  });

  it('leaves what is not recorded yet, never below zero', () => {
    expect(remainingPay({ ...ahmed, recorded: 100000 })).toBe(200000);
    expect(remainingPay({ ...ahmed, recorded: 900000 })).toBe(0);
  });

  it('prepares a salary expense for the remaining pay with how it adds up', () => {
    expect(
      salaryDetails({ ...ahmed, recorded: 100000 }, '2026-10-05', 'EGP', 'راتب أكتوبر'),
    ).toEqual({
      spentOn: '2026-10-05',
      category: 'salaries',
      amount: '2000.00',
      vehicleId: '',
      driverId: 'driver-1',
      description: 'راتب أكتوبر',
    });
  });
});

describe('totals', () => {
  it('adds up the month', () => {
    expect(expenseTotal([fuel, rent, moreFuel])).toBe(375050);
    expect(expenseTotal([])).toBe(0);
  });

  it('groups the month by category, largest first', () => {
    expect(categoryTotals([fuel, rent, moreFuel])).toEqual([
      { category: 'rent', total: 300000 },
      { category: 'fuel', total: 75050 },
    ]);
  });
});

describe('expenseDetails', () => {
  it('shows the stored amount as typed', () => {
    expect(expenseDetails(moreFuel, 'EGP').amount).toBe('250.50');
  });
});

describe('months', () => {
  it('knows the first and last day of a month', () => {
    expect(monthDays('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('dates a new expense today, or the closest day of another month', () => {
    expect(defaultDay('2026-10', '2026-10-05')).toBe('2026-10-05');
    expect(defaultDay('2026-09', '2026-10-05')).toBe('2026-09-30');
    expect(defaultDay('2026-11', '2026-10-05')).toBe('2026-11-01');
  });
});

describe('availableChoices', () => {
  const choices = [
    { id: 'driver-1', label: 'أحمد', active: true },
    { id: 'driver-2', label: 'محمود', active: false },
  ];

  it('offers active choices and keeps the one already chosen', () => {
    expect(availableChoices(choices, '').map((choice) => choice.id)).toEqual([
      'driver-1',
    ]);
    expect(availableChoices(choices, 'driver-2')).toHaveLength(2);
  });
});

describe('memberOrganization', () => {
  const memberships: ExpenseOrganization[] = [
    { id: 'org-north', name: 'North', currency: 'EGP' },
  ];

  it('returns only an organization of the memberships', () => {
    expect(memberOrganization(memberships, 'org-north')).toEqual(memberships[0]);
    expect(memberOrganization(memberships, 'org-south')).toBeNull();
  });
});
