import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubscriptionOffer } from '@routeops/shared/pricing';
import { PricingRepository } from '../application/pricing-repository';
import { contactDetails, whatsappHref } from '../domain/contact-details';
import { Home } from './home';
import { featureKeys, siteText } from './site-text';

const arabic = siteText.ar.home;

const autumn: SubscriptionOffer = {
  id: 'autumn',
  kind: 'percent',
  nameAr: 'عرض الخريف',
  nameEn: 'Autumn offer',
  code: null,
  percentOff: 20,
  trialDays: null,
  planIds: ['starter'],
  months: [3],
  startsOn: '2020-01-01',
  endsOn: null,
  isActive: true,
};

describe('Home', () => {
  let offers: () => Promise<SubscriptionOffer[]>;

  beforeEach(async () => {
    localStorage.clear();
    offers = async () => [];
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: PricingRepository,
          useValue: { load: async () => undefined, offers: () => offers() },
        },
      ],
    }).compileComponents();
  });

  it('points to the prices from the hero while an offer runs', async () => {
    offers = async () => [
      { ...autumn, id: 'ended', percentOff: 50, endsOn: '2021-01-01' },
      autumn,
    ];
    const element = await render();

    const link = element.querySelector('.home-offer');
    expect(link?.getAttribute('href')).toBe('/pricing');
    expect(link?.getAttribute('data-offer')).toBe('autumn');
    expect(link?.textContent).toContain('خصم 20%');
    expect(link?.textContent).toContain('عرض الخريف');
  });

  it('shows no offer when there is none or the offers cannot be read', async () => {
    offers = async () => {
      throw new Error('load');
    };
    const element = await render();

    expect(element.querySelector('.home-offer')).toBeNull();
    expect(element.querySelector('h1')).not.toBeNull();
  });

  it('presents the product, every main feature, the steps, and the questions', async () => {
    const element = await render();

    expect(element.querySelector('h1')?.textContent).toContain(arabic.title);
    expect(element.querySelector('h1')?.textContent).toContain(arabic.titleHighlight);
    expect(element.querySelectorAll('.home-feature')).toHaveLength(featureKeys.length);
    expect(element.querySelectorAll('.home-step')).toHaveLength(arabic.steps.length);
    expect(element.querySelectorAll('.home-faq details')).toHaveLength(arabic.faq.length);
  });

  it('asks for an account on the contact page or straight on WhatsApp', async () => {
    const element = await render();

    const links = [...element.querySelectorAll('app-home-hero app-site-actions a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/contact',
      whatsappHref(contactDetails.whatsapp, siteText.ar.contact.whatsappMessage),
    ]);
    expect(links[1].getAttribute('target')).toBe('_blank');
    expect(element.querySelectorAll('app-site-actions')).toHaveLength(2);
  });

  it('hides the product illustration from screen readers', async () => {
    const element = await render();

    expect(element.querySelector('app-product-preview')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('app-product-preview')?.textContent).toContain(
      arabic.preview.trips[0].route,
    );
  });

  it('switches to English', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('app-language-switch button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('h1')?.textContent).toContain(siteText.en.home.title);
    expect(element.querySelector('app-product-preview')?.textContent).toContain(siteText.en.home.preview.statuses.done);
  });
});

async function render(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}
