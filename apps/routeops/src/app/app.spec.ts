import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { shellText } from './shell-text';

@Component({ template: '' })
class Blank {}

describe('App', () => {
  let compact = false;

  beforeEach(async () => {
    compact = false;
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'sign-in', component: Blank, data: { shell: false } },
          { path: 'organizations/:organizationId/routes', component: Blank },
          { path: '', component: Blank },
        ]),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of<BreakpointState>({ matches: compact, breakpoints: {} }),
          },
        },
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

  it('hides and shows the sidebar on a wide screen and remembers the choice', async () => {
    const fixture = await openFixture('/organizations/org-north/routes');
    const element = fixture.nativeElement as HTMLElement;
    const menu = menuButton(element);
    expect(menu.getAttribute('aria-expanded')).toBe('true');

    menu.click();
    await fixture.whenStable();
    expect(element.querySelector('.shell-sidebar-hidden')).toBeTruthy();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-label')).toBe(shellText.ar.openMenu);
    expect(localStorage.getItem('routeops.sidebar')).toBe('hidden');

    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    expect(element.querySelector('.shell-sidebar-hidden')).toBeTruthy();

    menu.click();
    await fixture.whenStable();
    expect(element.querySelector('.shell-sidebar-hidden')).toBeNull();
    expect(menu.getAttribute('aria-label')).toBe(shellText.ar.closeMenu);
    expect(localStorage.getItem('routeops.sidebar')).toBeNull();
  });

  it('starts with the sidebar hidden when that was the last choice', async () => {
    localStorage.setItem('routeops.sidebar', 'hidden');

    const element = await open('/');

    expect(element.querySelector('.shell-sidebar-hidden')).toBeTruthy();
    expect(menuButton(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the menu on a small screen and closes it after moving to a page', async () => {
    compact = true;
    const fixture = await openFixture('/organizations/org-north/routes');
    const element = fixture.nativeElement as HTMLElement;
    const menu = menuButton(element);
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    menu.click();
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.shell-sidebar-open')).toBeTruthy();
    expect(element.querySelector('.shell-sidebar-hidden')).toBeNull();

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

async function openFixture(url: string): Promise<ComponentFixture<App>> {
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  return fixture;
}

async function open(url: string): Promise<HTMLElement> {
  return (await openFixture(url)).nativeElement as HTMLElement;
}

function menuButton(element: HTMLElement): HTMLButtonElement {
  const menu = element.querySelector<HTMLButtonElement>('.shell-menu-button');
  if (!menu) {
    throw new Error('The menu button is missing.');
  }
  return menu;
}

function navLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll('.shell-nav-item span')].map(
    (item) => item.textContent?.trim() ?? '',
  );
}
