import { Component, DOCUMENT, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormDrawer } from './form-drawer';
import { uiText } from './ui-text';

@Component({
  imports: [FormDrawer],
  template: `
    <app-form-drawer title="Add route" [(open)]="open">
      <form><input type="text" /></form>
    </app-form-drawer>
  `,
})
class Host {
  readonly open = signal(false);
}

describe('FormDrawer', () => {
  beforeEach(() => localStorage.clear());

  it('shows its content only while open and locks the page scroll', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(element.querySelector('form')).toBeNull();

    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Add route');
    expect(element.querySelector('form')).not.toBeNull();
    expect(root.classList).toContain('app-scroll-locked');
  });

  it('closes from its close button and from Escape', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector<HTMLButtonElement>(`.close[aria-label="${uiText.ar.close}"]`)
      ?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(TestBed.inject(DOCUMENT).documentElement.classList).not.toContain(
      'app-scroll-locked',
    );

    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    element
      .querySelector('[role="dialog"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBe(false);
  });
});
