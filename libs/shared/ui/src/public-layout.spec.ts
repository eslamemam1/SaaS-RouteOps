import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicLayout } from './public-layout';

async function render() {
  localStorage.clear();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(PublicLayout);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const toggle = element.querySelector<HTMLButtonElement>('.app-public-menu-toggle');
  const menu = element.querySelector('#app-public-menu');
  const open = async () => {
    toggle?.click();
    await fixture.whenStable();
  };
  return { fixture, element, toggle, menu, open };
}

describe('PublicLayout', () => {
  it('opens and closes the small-screen menu from its button', async () => {
    const { fixture, toggle, menu, open } = await render();

    expect(toggle?.getAttribute('aria-controls')).toBe('app-public-menu');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.getAttribute('aria-label')).toBe('فتح القائمة');

    await open();
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(toggle?.getAttribute('aria-label')).toBe('إغلاق القائمة');
    expect(menu?.classList).toContain('app-public-menu-open');

    toggle?.click();
    await fixture.whenStable();
    expect(menu?.classList).not.toContain('app-public-menu-open');
  });

  it('keeps the links and the language switch inside the menu', async () => {
    const { menu } = await render();

    expect(
      [...(menu?.querySelectorAll('.app-public-link') ?? [])].map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/', '/pricing', '/contact']);
    expect(menu?.querySelector('app-language-switch')).toBeTruthy();
  });

  it('closes the menu on Escape, on a chosen link, and on a click outside it', async () => {
    const { fixture, element, toggle, open } = await render();

    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');

    await open();
    element.querySelector<HTMLAnchorElement>('.app-public-link')?.click();
    await fixture.whenStable();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');

    await open();
    element.querySelector('main')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });
});
