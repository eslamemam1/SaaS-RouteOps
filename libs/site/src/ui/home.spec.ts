import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { featureKeys, siteText } from './site-text';

describe('Home', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('presents the product and every main feature', async () => {
    const element = await render();

    expect(element.querySelector('h1')?.textContent).toContain(siteText.ar.home.title);
    expect(element.querySelectorAll('.home-feature')).toHaveLength(featureKeys.length);
    expect(element.querySelectorAll('.home-step')).toHaveLength(siteText.ar.home.steps.length);
  });

  it('leads to the contact and sign-in pages', async () => {
    const element = await render();

    const links = [...element.querySelectorAll('.home-actions a')].map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/contact', '/sign-in']);
  });

  it('switches to English', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('app-language-switch button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('h1')?.textContent).toContain(siteText.en.home.title);
  });
});

async function render(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}
