import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  formatPrice,
  SubscriptionOffer,
  SubscriptionPeriod,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import { Select } from '@routeops/shared/ui';
import { CompanyAccount } from '../domain/organization';
import { OrganizationSubscription } from '../domain/subscription';
import { OrganizationRepository } from '../application/organization-repository';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { CompanySubscriptions } from './company-subscriptions';
import { organizationsText } from './organizations-text';
import { SubscriptionOffers } from './subscription-offers';
import { SubscriptionPlans } from './subscription-plans';

const starter: SubscriptionPlan = {
  id: 'plan-starter',
  currency: 'EGP',
  nameAr: 'بداية',
  nameEn: 'Starter',
  vehicleLimit: 5,
  monthlyPrice: 75_000,
  isActive: true,
};
const growth: SubscriptionPlan = {
  id: 'plan-growth',
  currency: 'EGP',
  nameAr: 'نمو',
  nameEn: 'Growth',
  vehicleLimit: 15,
  monthlyPrice: 150_000,
  isActive: true,
};
const periods: SubscriptionPeriod[] = [
  { months: 1, discountPercent: 0 },
  { months: 3, discountPercent: 10 },
  { months: 6, discountPercent: 15 },
  { months: 12, discountPercent: 20 },
];
const nile: CompanyAccount = {
  id: 'org-nile',
  name: 'Nile Transport',
  currency: 'EGP',
  isActive: true,
  logins: [],
  createdAt: '2026-01-01T09:00:00Z',
  lastSignInAt: null,
};
const nileSubscription: OrganizationSubscription = {
  id: 'subscription-1',
  organizationId: 'org-nile',
  planId: 'plan-starter',
  months: 3,
  trialDays: null,
  offerId: null,
  startsOn: '2026-08-01',
  endsOn: '2026-10-31',
  vehicleLimit: 5,
  price: 202_500,
  note: '',
};
const autumn: SubscriptionOffer = {
  id: 'offer-autumn',
  kind: 'percent',
  nameAr: 'عرض الخريف',
  nameEn: 'Autumn offer',
  code: null,
  percentOff: 20,
  trialDays: null,
  planIds: ['plan-starter'],
  months: [3, 6],
  startsOn: '2026-10-01',
  endsOn: '2026-11-30',
  isActive: true,
};
const trial: SubscriptionOffer = {
  ...autumn,
  id: 'offer-trial',
  kind: 'trial',
  nameAr: 'جرّب مجانًا',
  nameEn: 'Try free',
  percentOff: null,
  trialDays: 14,
  planIds: ['plan-starter', 'plan-growth'],
  months: [],
};
const arabic = organizationsText.ar;

describe('SubscriptionPlans', () => {
  it('shows each plan with its price for every period after the discount', async () => {
    const fixture = await render(SubscriptionPlans, {
      listPlans: async () => [growth, starter],
    });

    const rows = rowsOf(fixture, '.plans-table');
    expect(rows[0]).toContain('بداية');
    expect(rows[0]).toContain(formatPrice(75_000, 'EGP', 'ar'));
    expect(rows[0]).toContain(formatPrice(202_500, 'EGP', 'ar'));
    expect(rows[0]).toContain(formatPrice(720_000, 'EGP', 'ar'));
    expect(rows[1]).toContain('نمو');
  });

  it('saves the discounts of the longer periods and refuses one above 90', async () => {
    const saveDiscounts = vi.fn<SubscriptionRepository['saveDiscounts']>(
      async (changed) => [periods[0], ...changed],
    );
    const fixture = await render(SubscriptionPlans, { saveDiscounts });
    const element: HTMLElement = fixture.nativeElement;
    const discountForm =
      element.querySelector<HTMLFormElement>('.plans-discounts')!;

    fill(discountForm.querySelector('input[data-months="3"]')!, '٩٥');
    discountForm.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(saveDiscounts).not.toHaveBeenCalled();
    expect(element.textContent).toContain(arabic.subscriptionProblems.discount);

    fill(discountForm.querySelector('input[data-months="3"]')!, '12');
    discountForm.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(saveDiscounts).toHaveBeenCalledWith([
      { months: 3, discountPercent: 12 },
      { months: 6, discountPercent: 15 },
      { months: 12, discountPercent: 20 },
    ]);
    expect(element.textContent).toContain(arabic.plans.discountsSaved);
  });

  it('adds a plan from the form', async () => {
    const savePlan = vi.fn<SubscriptionRepository['savePlan']>(
      async () => growth,
    );
    const fixture = await render(SubscriptionPlans, { savePlan });
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain(arabic.plans.empty);

    button(fixture, arabic.plans.add).click();
    await settle(fixture);
    const planForm = element.querySelector('app-plan-form')!;
    const inputs =
      planForm.querySelectorAll<HTMLInputElement>('input[type="text"]');
    fill(inputs[0], 'نمو');
    fill(inputs[1], 'Growth');
    fill(inputs[2], '15');
    fill(inputs[3], '1500');
    planForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(savePlan).toHaveBeenCalledWith(null, {
      nameAr: 'نمو',
      nameEn: 'Growth',
      currency: 'EGP',
      vehicleLimit: '15',
      monthlyPrice: '1500',
      isActive: true,
    });
    expect(element.textContent).toContain(arabic.plans.added);
    expect(rowsOf(fixture, '.plans-table')[0]).toContain('نمو');
  });
});

describe('SubscriptionOffers', () => {
  it('adds a percent offer on the chosen plans and periods, and asks for a plan first', async () => {
    const saveOffer = vi.fn<SubscriptionRepository['saveOffer']>(
      async () => autumn,
    );
    const fixture = await render(SubscriptionOffers, {
      listPlans: async () => [starter, growth],
      saveOffer,
    });
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain(arabic.offers.empty);

    button(fixture, arabic.offers.add).click();
    await settle(fixture);
    const offerForm = element.querySelector('app-offer-form')!;
    const inputs =
      offerForm.querySelectorAll<HTMLInputElement>('input[type="text"]');
    fill(inputs[0], '٢٠');
    fill(inputs[1], 'عرض الخريف');
    fill(inputs[2], 'Autumn offer');
    offerForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(saveOffer).not.toHaveBeenCalled();
    expect(offerForm.textContent).toContain(
      arabic.subscriptionProblems.offerPlans,
    );

    offerForm
      .querySelector<HTMLInputElement>('input[data-plan="plan-starter"]')!
      .click();
    offerForm
      .querySelector<HTMLInputElement>('input[data-months="6"]')!
      .click();
    offerForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(saveOffer).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        kind: 'percent',
        nameAr: 'عرض الخريف',
        percentOff: '٢٠',
        code: '',
        planIds: ['plan-starter'],
        months: [6],
        endsOn: '',
        isActive: true,
      }),
    );
    expect(element.textContent).toContain(arabic.offers.added);
    expect(rowsOf(fixture, '.offers-table')[0]).toContain('عرض الخريف');
  });
});

describe('CompanySubscriptions', () => {
  it('marks a company that runs more vehicles than its plan allows', async () => {
    const fixture = await render(CompanySubscriptions, running());

    const row = rowsOf(fixture, '.subscriptions-companies')[0];
    expect(row).toContain('Nile Transport');
    expect(row).toContain('بداية');
    expect(row).toContain('6 / 5');
    expect(row).toContain(arabic.subscriptions.overLimit);
    expect(row).toContain(arabic.subscriptions.statuses.active);
  });

  it('renews a subscription from the day after it ends at the discounted price', async () => {
    const recordSubscription = vi.fn<
      SubscriptionRepository['recordSubscription']
    >(async (_account, details) => ({
      ...nileSubscription,
      id: 'subscription-2',
      startsOn: details.startsOn,
      endsOn: '2027-01-31',
    }));
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      recordSubscription,
    });

    button(fixture, arabic.subscriptions.renew).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const subscriptionForm = element.querySelector('app-subscription-form')!;
    expect(subscriptionForm.textContent).toContain(
      arabic.subscriptions.afterDiscount,
    );
    subscriptionForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(recordSubscription).toHaveBeenCalledWith(
      nile,
      {
        organizationId: 'org-nile',
        planId: 'plan-starter',
        offerId: '',
        months: '3',
        startsOn: '2026-11-01',
        vehicleLimit: '5',
        price: '2025.00',
        note: '',
      },
      null,
    );
    expect(element.textContent).toContain(arabic.subscriptions.recorded);
    expect(rowsOf(fixture, '.subscriptions-history')).toHaveLength(2);
  });

  it('suggests the plan that takes the company’s vehicles and prices the chosen period', async () => {
    const fixture = await render(CompanySubscriptions, running());

    button(fixture, arabic.subscriptions.add).click();
    await settle(fixture);
    selectsIn(fixture, 'app-subscription-form')[0].value.set('org-nile');
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const subscriptionForm = element.querySelector('app-subscription-form')!;
    const price = () =>
      subscriptionForm.querySelector<HTMLInputElement>(
        'input[inputmode="decimal"]',
      )!.value;
    expect(selectsIn(fixture, 'app-subscription-form')[1].value()).toBe(
      'plan-growth',
    );
    expect(price()).toBe('1500.00');
    expect(
      subscriptionForm.querySelector<HTMLInputElement>('input[type="date"]')!
        .value,
    ).toBe('2026-11-01');

    selectsIn(fixture, 'app-subscription-form')[2].value.set('12');
    await settle(fixture);

    expect(price()).toBe('14400.00');
    expect(subscriptionForm.textContent).toContain(
      formatPrice(1_800_000, 'EGP', 'ar'),
    );
  });

  it('corrects a subscription and keeps its agreed price until its period changes', async () => {
    const agreed = { ...nileSubscription, vehicleLimit: 8, price: 180_000 };
    const updateSubscription = vi.fn<
      SubscriptionRepository['updateSubscription']
    >(async (id, _account, details) => ({
      ...agreed,
      id,
      months: 6,
      endsOn: '2027-01-31',
      vehicleLimit: Number(details.vehicleLimit),
      price: 382_500,
    }));
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      listSubscriptions: async () => [agreed],
      updateSubscription,
    });

    button(fixture, arabic.subscriptions.edit).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const subscriptionForm = element.querySelector('app-subscription-form')!;
    const input = (selector: string) =>
      subscriptionForm.querySelector<HTMLInputElement>(selector)!.value;
    expect(element.textContent).toContain(arabic.subscriptions.editTitle);
    expect(subscriptionForm.textContent).toContain(
      arabic.subscriptions.companyFixed,
    );
    expect(input('input[inputmode="decimal"]')).toBe('1800.00');
    expect(input('input[inputmode="numeric"]')).toBe('8');
    expect(input('input[type="date"]')).toBe('2026-08-01');

    selectsIn(fixture, 'app-subscription-form')[2].value.set('6');
    await settle(fixture);
    expect(input('input[inputmode="decimal"]')).toBe('3825.00');
    subscriptionForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(updateSubscription).toHaveBeenCalledWith(
      'subscription-1',
      nile,
      {
        organizationId: 'org-nile',
        planId: 'plan-starter',
        offerId: '',
        months: '6',
        startsOn: '2026-08-01',
        vehicleLimit: '5',
        price: '3825.00',
        note: '',
      },
      null,
    );
    expect(element.textContent).toContain(arabic.subscriptions.updated);
    const history = rowsOf(fixture, '.subscriptions-history');
    expect(history).toHaveLength(1);
    expect(history[0]).toContain(formatPrice(382_500, 'EGP', 'ar'));
  });

  it('takes an offer off after the period discount and records it with the subscription', async () => {
    const recordSubscription = vi.fn<
      SubscriptionRepository['recordSubscription']
    >(async (_account, details) => ({
      ...nileSubscription,
      id: 'subscription-2',
      offerId: details.offerId,
      startsOn: details.startsOn,
      endsOn: '2027-01-31',
      price: 162_000,
    }));
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      listOffers: async () => [autumn, trial],
      recordSubscription,
    });

    button(fixture, arabic.subscriptions.renew).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const subscriptionForm = element.querySelector('app-subscription-form')!;
    const selects = selectsIn(fixture, 'app-subscription-form');
    expect(selects).toHaveLength(4);
    selects[2].value.set('offer-autumn');
    await settle(fixture);

    expect(
      subscriptionForm.querySelector<HTMLInputElement>(
        'input[inputmode="decimal"]',
      )!.value,
    ).toBe('1620.00');
    expect(subscriptionForm.textContent).toContain(
      arabic.subscriptions.afterOffer,
    );
    subscriptionForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(recordSubscription).toHaveBeenCalledWith(
      nile,
      expect.objectContaining({ offerId: 'offer-autumn', price: '1620.00' }),
      autumn,
    );
    expect(rowsOf(fixture, '.subscriptions-history')[0]).toContain(
      'عرض الخريف',
    );
  });

  it('gives a free trial with no period or price to a company that has not subscribed', async () => {
    const recordSubscription = vi.fn<
      SubscriptionRepository['recordSubscription']
    >(async (_account, details) => ({
      ...nileSubscription,
      planId: details.planId,
      offerId: details.offerId,
      months: null,
      trialDays: 14,
      startsOn: details.startsOn,
      endsOn: '2026-10-25',
      price: 0,
    }));
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      listSubscriptions: async () => [],
      listOffers: async () => [trial],
      recordSubscription,
    });

    button(fixture, arabic.subscriptions.add).click();
    await settle(fixture);
    selectsIn(fixture, 'app-subscription-form')[0].value.set('org-nile');
    await settle(fixture);
    selectsIn(fixture, 'app-subscription-form')[2].value.set('offer-trial');
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const subscriptionForm = element.querySelector('app-subscription-form')!;

    expect(selectsIn(fixture, 'app-subscription-form')).toHaveLength(3);
    expect(
      subscriptionForm.querySelector('input[inputmode="decimal"]'),
    ).toBeNull();
    expect(subscriptionForm.textContent).toContain(
      arabic.subscriptions.trialFree,
    );
    subscriptionForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(recordSubscription).toHaveBeenCalledWith(
      nile,
      expect.objectContaining({
        planId: 'plan-growth',
        offerId: 'offer-trial',
        startsOn: '2026-10-12',
      }),
      trial,
    );
    const history = rowsOf(fixture, '.subscriptions-history')[0];
    expect(history).toContain(arabic.subscriptions.trial);
    expect(history).toContain(arabic.subscriptions.free);
  });

  it('deletes a subscription only after a second press', async () => {
    const removeSubscription = vi.fn<
      SubscriptionRepository['removeSubscription']
    >(async () => undefined);
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      removeSubscription,
    });

    button(fixture, arabic.subscriptions.remove).click();
    await settle(fixture);
    expect(removeSubscription).not.toHaveBeenCalled();

    button(fixture, arabic.subscriptions.confirmRemove).click();
    await settle(fixture);

    expect(removeSubscription).toHaveBeenCalledWith('subscription-1');
    expect(rowsOf(fixture, '.subscriptions-history')).toHaveLength(0);
    expect(rowsOf(fixture, '.subscriptions-companies')[0]).toContain(
      arabic.subscriptions.statuses.none,
    );
  });

  it('shows a safe error when the subscriptions cannot load and tries again', async () => {
    const listSubscriptions = vi
      .fn<SubscriptionRepository['listSubscriptions']>()
      .mockRejectedValueOnce(new SubscriptionError('load'))
      .mockResolvedValueOnce([nileSubscription]);
    const fixture = await render(CompanySubscriptions, {
      ...running(),
      listSubscriptions,
    });
    expect(fixture.nativeElement.textContent).toContain(
      arabic.subscriptionProblems.load,
    );

    button(fixture, arabic.subscriptions.retry).click();
    await settle(fixture);

    expect(rowsOf(fixture, '.subscriptions-history')).toHaveLength(1);
  });
});

function running(): Partial<SubscriptionRepository> {
  return {
    listPlans: async () => [starter, growth],
    listSubscriptions: async () => [nileSubscription],
    vehicleUsage: async () => [
      { organizationId: 'org-nile', activeVehicles: 6, today: '2026-10-12' },
    ],
  };
}

async function render<T>(
  component: Type<T>,
  overrides: Partial<SubscriptionRepository>,
): Promise<ComponentFixture<T>> {
  const subscriptions: SubscriptionRepository = {
    listPlans: async () => [],
    savePlan: async () => {
      throw new Error('not used');
    },
    listPeriods: async () => periods,
    saveDiscounts: async () => periods,
    listOffers: async () => [],
    saveOffer: async () => {
      throw new Error('not used');
    },
    listSubscriptions: async () => [],
    recordSubscription: async () => {
      throw new Error('not used');
    },
    updateSubscription: async () => {
      throw new Error('not used');
    },
    removeSubscription: async () => undefined,
    vehicleUsage: async () => [],
    ...overrides,
  };
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      { provide: SubscriptionRepository, useValue: subscriptions },
      {
        provide: OrganizationRepository,
        useValue: { listCompanyAccounts: async () => [nile] },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
}

function fill(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function button<T>(
  fixture: ComponentFixture<T>,
  label: string,
): HTMLButtonElement {
  const element: HTMLElement = fixture.nativeElement;
  return [...element.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent?.trim() === label,
  )!;
}

function rowsOf<T>(fixture: ComponentFixture<T>, table: string): string[] {
  const element: HTMLElement = fixture.nativeElement;
  return [...element.querySelectorAll(`${table} tbody tr`)].map(
    (row) => row.textContent ?? '',
  );
}

function selectsIn<T>(fixture: ComponentFixture<T>, host: string): Select[] {
  return fixture.debugElement
    .queryAll(By.css(`${host} app-select`))
    .map((select) => select.componentInstance as Select);
}
