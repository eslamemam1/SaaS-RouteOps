import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubscriptionPlan } from '@routeops/shared/pricing';
import {
  PriceList,
  PricingRepository,
} from '../application/pricing-repository';
import { Pricing } from './pricing';
import { siteText } from './site-text';

const arabic = siteText.ar.pricing;

const plan = (
  id: string,
  vehicleLimit: number | null,
  monthlyPrice: number | null,
): SubscriptionPlan => ({
  id,
  currency: 'EGP',
  nameAr: id,
  nameEn: id,
  vehicleLimit,
  monthlyPrice,
  isActive: true,
});

const priceList: PriceList = {
  plans: [
    plan('large', null, null),
    plan('growth', 15, 180000),
    plan('starter', 5, 75000),
  ],
  periods: [
    { months: 1, discountPercent: 0 },
    { months: 3, discountPercent: 10 },
    { months: 6, discountPercent: 15 },
    { months: 12, discountPercent: 20 },
  ],
};

describe('Pricing', () => {
  beforeEach(() => localStorage.clear());

  it('shows the plans from the smallest, priced per month', async () => {
    const element = await render(async () => priceList);

    expect(planIds(element)).toEqual(['starter', 'growth', 'large']);
    expect(amount(element, 'starter')).toContain('750');
    expect(amount(element, 'large')).toBe(arabic.agreed);
    expect(element.querySelector('.pricing-saving')).toBeNull();
  });

  it('takes the discount off a longer subscription', async () => {
    const element = await render(async () => priceList);

    click(element, '.pricing-period[data-months="3"]');
    await settle();

    expect(amount(element, 'starter')).toContain('2,025');
    expect(
      card(element, 'starter')?.querySelector('.pricing-was s')?.textContent,
    ).toContain('2,250');
    expect(
      card(element, 'starter')?.querySelector('.pricing-saving')?.textContent,
    ).toContain('225');
  });

  it('points out the plan that fits the fleet', async () => {
    const element = await render(async () => priceList);
    const input = element.querySelector<HTMLInputElement>(
      '.pricing-fleet input',
    );

    type(input, '٨');
    await settle();
    expect(
      element.querySelector('.pricing-plan-fits')?.getAttribute('data-plan'),
    ).toBe('growth');

    type(input, '40');
    await settle();
    expect(
      element.querySelector('.pricing-plan-fits')?.getAttribute('data-plan'),
    ).toBe('large');
  });

  it('says so when no plan is published, and offers to retry a failed load', async () => {
    const empty = await render(async () => ({ plans: [], periods: [] }));
    expect(empty.textContent).toContain(arabic.empty);

    const failed = await render(async () => {
      throw new Error('load');
    });
    expect(failed.textContent).toContain(arabic.load);
  });
});

async function render(load: () => Promise<PriceList>): Promise<HTMLElement> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Pricing],
    providers: [
      provideRouter([]),
      { provide: PricingRepository, useValue: { load } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(Pricing);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  await settle();
  return fixture.nativeElement as HTMLElement;
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
}

function planIds(element: HTMLElement): (string | null)[] {
  return [...element.querySelectorAll('.pricing-plan')].map((item) =>
    item.getAttribute('data-plan'),
  );
}

function card(element: HTMLElement, id: string): Element | null {
  return element.querySelector(`.pricing-plan[data-plan="${id}"]`);
}

function amount(element: HTMLElement, id: string): string {
  return (
    card(element, id)?.querySelector('.pricing-amount')?.textContent?.trim() ??
    ''
  );
}

function click(element: HTMLElement, selector: string): void {
  element.querySelector<HTMLElement>(selector)?.click();
}

function type(input: HTMLInputElement | null, value: string): void {
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
}
