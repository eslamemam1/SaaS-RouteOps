import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { shellText } from './shell-text';

@Component({ template: '' })
class Blank {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'sign-in', component: Blank, data: { shell: false } },
          { path: 'organizations/:organizationId/routes', component: Blank },
          { path: '', component: Blank },
        ]),
      ],
    }).compileComponents();
  });

  it('shows the product name and home link on the home page', async () => {
    const element = await open('/');

    expect(element.querySelector('.shell-brand')?.textContent).toContain('RouteOps');
    expect(navLabels(element)).toEqual([shellText.ar.home]);
  });

  it('links every section of the organization in the address', async () => {
    const element = await open('/organizations/org-north/routes');

    expect(navLabels(element)).toEqual([
      shellText.ar.home,
      ...Object.values(shellText.ar.sections),
    ]);
    const active = element.querySelector('.shell-nav-item-active');
    expect(active?.getAttribute('href')).toBe('/organizations/org-north/routes');
  });

  it('opens the sidebar from the menu button and closes it after moving to a page', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/organizations/org-north/routes');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const menu = element.querySelector<HTMLButtonElement>('.shell-menu-button');
    if (!menu) {
      throw new Error('The menu button is missing.');
    }

    menu.click();
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.shell-sidebar-open')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(element.querySelector('.shell-sidebar-open')).toBeNull();

    menu.click();
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.shell-sidebar-open')).toBeNull();
  });

  it('leaves the sign-in page without the sidebar', async () => {
    const element = await open('/sign-in');

    expect(element.querySelector('.shell-sidebar')).toBeNull();
  });
});

async function open(url: string): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function navLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll('.shell-nav-item span')].map(
    (item) => item.textContent?.trim() ?? '',
  );
}
