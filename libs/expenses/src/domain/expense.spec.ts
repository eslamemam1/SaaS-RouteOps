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

const pay: DriverPay = {
  driverId: 'driver-1',
  doneTrips: 4,
  monthlySalary: 500000,
  tripPay: 5000,
  recorded: 0,
};

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
  it('suggests the fixed salary plus the trip amount for each done trip', () => {
    expect(suggestedPay(pay)).toBe(520000);
    expect(suggestedPay({ ...pay, monthlySalary: null })).toBe(20000);
    expect(suggestedPay({ ...pay, tripPay: null })).toBe(500000);
  });

  it('leaves what is not recorded yet, never below zero', () => {
    expect(remainingPay({ ...pay, recorded: 200000 })).toBe(320000);
    expect(remainingPay({ ...pay, recorded: 900000 })).toBe(0);
  });

  it('prepares a salary expense for the remaining pay', () => {
    expect(salaryDetails({ ...pay, recorded: 20000 }, '2026-10-05', 'EGP')).toEqual({
      spentOn: '2026-10-05',
      category: 'salaries',
      amount: '5000.00',
      vehicleId: '',
      driverId: 'driver-1',
      description: '',
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
