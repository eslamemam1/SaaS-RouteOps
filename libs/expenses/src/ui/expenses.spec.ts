import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { ExpenseAccessError } from '../application/expense-access-error';
import { ExpenseRepository } from '../application/expense-repository';
import {
  DriverPay,
  Expense,
  ExpenseChoices,
  ExpenseMonth,
  ExpenseOrganization,
  VehiclePay,
} from '../domain/expense';
import { Expenses } from './expenses';
import { expensesText } from './expenses-text';

const north: ExpenseOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
const choices: ExpenseChoices = {
  vehicles: [{ id: 'vehicle-1', label: 'ق ط 1234', active: true }],
  drivers: [{ id: 'driver-1', label: 'أحمد محمد', active: true }],
};
const fuel: Expense = {
  id: 'expense-1',
  spentOn: '2026-10-03',
  category: 'fuel',
  amount: 25050,
  vehicleId: 'vehicle-1',
  driverId: '',
  description: 'تفويل',
};
const ahmedPay: DriverPay = {
  driverId: 'driver-1',
  payType: 'salary',
  monthlySalary: 300000,
  salaryTrips: 26,
  tripPay: { outbound: 5000, return: 5000 },
  done: { outbound: 30, return: 28 },
  absent: { outbound: 0, return: 0 },
  recorded: 0,
};
const busRent: VehiclePay = {
  vehicleId: 'vehicle-1',
  contractor: false,
  rentType: 'monthly',
  monthlyRent: 1200000,
  tripRent: null,
  done: { outbound: 20, return: 20 },
  recorded: 0,
};
const arabic = expensesText.ar;

describe('Expenses', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the month expenses', async () => {
    let resolveMonth: (month: ExpenseMonth) => void = () => undefined;
    const harness = await open({
      month: () =>
        new Promise((resolve) => {
          resolveMonth = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.loading);

    resolveMonth({ expenses: [fuel], pay: [], rent: [] });
    await settle(harness);

    expect(text(harness)).toContain('تفويل');
    expect(text(harness)).toContain('ق ط 1234');
    expect(text(harness)).toContain(arabic.categories.fuel);
    expect(text(harness)).toContain('250.50');
  });

  it('suggests each driver salary and prepares it as an expense', async () => {
    const harness = await open({
      month: async () => ({ expenses: [], pay: [ahmedPay], rent: [] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.pay.title);
    expect(text(harness)).toContain(arabic.pay.payTypes.salary);
    expect(text(harness)).toContain(`${arabic.pay.outbound} 30 · ${arabic.pay.return} 28`);
    expect(text(harness)).toContain(arabic.pay.extraPart);
    expect(text(harness)).toContain('3,300.00');

    button(harness, arabic.pay.record)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.addTitle);
    const form = harness.routeNativeElement!.querySelector('form')!;
    expect(form.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe(
      '3300.00',
    );
    const note = form.querySelector('textarea')?.value ?? '';
    expect(note).toContain(arabic.pay.noteSalary);
    expect(note).toContain(arabic.pay.extraPart);
  });

  it('suggests each vehicle pay and prepares it as a rent expense', async () => {
    const harness = await open({
      month: async () => ({ expenses: [], pay: [], rent: [busRent] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.rent.title);
    expect(text(harness)).toContain(arabic.rent.rentTypes.monthly);
    expect(text(harness)).toContain('12,000.00');

    button(harness, arabic.rent.record)?.click();
    await settle(harness);

    const form = harness.routeNativeElement!.querySelector('form')!;
    expect(form.querySelector<HTMLSelectElement>('select')?.value).toBe('rent');
    expect(form.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe(
      '12000.00',
    );
    expect(form.querySelector('textarea')?.value).toContain(arabic.rent.note);
  });

  it('shows the absence taken off a salary', async () => {
    const harness = await open({
      month: async () => ({
        expenses: [],
        pay: [
          {
            ...ahmedPay,
            done: { outbound: 24, return: 24 },
            absent: { outbound: 2, return: 2 },
          },
        ],
        rent: [],
      }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.pay.missedPart);
    expect(text(harness)).toContain('2,800.00');
  });

  it('marks a salary that is fully recorded', async () => {
    const harness = await open({
      month: async () => ({ expenses: [], pay: [{ ...ahmedPay, recorded: 330000 }], rent: [] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.pay.done);
    expect(button(harness, arabic.pay.record)).toBeUndefined();
  });

  it('shows an empty month that opens the add form', async () => {
    const harness = await open({});
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.empty);

    button(harness, arabic.list.add)?.click();
    await settle(harness);

    expect(harness.routeNativeElement?.querySelector('form')).toBeTruthy();
  });

  it('deletes an expense only after a second press and reloads the month', async () => {
    const remove = vi.fn(async () => undefined);
    const month = vi.fn(async () => ({ expenses: [fuel], pay: [], rent: [] }));
    const harness = await open({ month, remove });
    await settle(harness);

    button(harness, arabic.list.edit)?.click();
    await settle(harness);
    button(harness, arabic.form.remove)?.click();
    await settle(harness);

    expect(remove).not.toHaveBeenCalled();

    button(harness, arabic.form.confirmRemove)?.click();
    await settle(harness);
    await settle(harness);

    expect(remove).toHaveBeenCalledWith(north, 'expense-1');
    expect(month).toHaveBeenCalledTimes(2);
    expect(text(harness)).toContain(arabic.form.removed);
  });

  it('refuses an organization outside the user memberships', async () => {
    const month = vi.fn(async () => ({ expenses: [fuel], pay: [], rent: [] }));
    const harness = await open({ organization: async () => null, month });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(month).not.toHaveBeenCalled();
  });

  it('shows a safe error when loading fails', async () => {
    const harness = await open({
      month: async () => {
        throw new ExpenseAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it('shows the page in English after switching language', async () => {
    const harness = await open({ month: async () => ({ expenses: [fuel], pay: [], rent: [] }) });
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(expensesText.en.list.title);
    expect(text(harness)).toContain(expensesText.en.categories.fuel);
  });
});

async function open(overrides: Partial<ExpenseRepository>) {
  const repository: ExpenseRepository = {
    organization: async () => north,
    choices: async () => choices,
    month: async () => ({ expenses: [], pay: [], rent: [] }),
    add: async () => fuel,
    update: async () => fuel,
    remove: async () => undefined,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'organizations/:organizationId/expenses', component: Expenses },
      ]),
      { provide: ExpenseRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/expenses', Expenses);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function button(
  harness: RouterTestingHarness,
  label: string,
): HTMLButtonElement | undefined {
  return [
    ...(harness.routeNativeElement?.querySelectorAll<HTMLButtonElement>('button') ?? []),
  ].find((item) => item.textContent?.trim() === label);
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
