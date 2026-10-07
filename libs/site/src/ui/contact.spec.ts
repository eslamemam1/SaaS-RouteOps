import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { contactDetails, emailHref, phoneHref, whatsappHref } from '../domain/contact-details';
import { Contact } from './contact';
import { siteText } from './site-text';

const arabic = siteText.ar.contact;

describe('Contact', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('links the phone, WhatsApp, and email directly', async () => {
    const element = await render();

    const links = [...element.querySelectorAll('.contact-channel')].map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual([
      phoneHref(contactDetails.phone),
      whatsappHref(contactDetails.whatsapp, arabic.whatsappMessage),
      emailHref(contactDetails.email, arabic.emailSubject),
    ]);
  });

  it('opens WhatsApp in a new tab only', async () => {
    const element = await render();

    const targets = [...element.querySelectorAll('.contact-channel')].map((link) =>
      link.getAttribute('target'),
    );
    expect(targets).toEqual([null, '_blank', null]);
  });

  it('explains how a company gets an account and links to sign in', async () => {
    const element = await render();

    expect(element.querySelectorAll('.contact-steps li')).toHaveLength(
      arabic.accountSteps.length,
    );
    expect(element.querySelector('.contact-sign-in a')?.getAttribute('href')).toBe('/sign-in');
  });
});

async function render(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Contact);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}
