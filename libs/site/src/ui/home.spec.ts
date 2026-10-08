import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { contactDetails, whatsappHref } from '../domain/contact-details';
import { Home } from './home';
import { featureKeys, siteText } from './site-text';

const arabic = siteText.ar.home;

describe('Home', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
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
  return fixture.nativeElement as HTMLElement;
}
