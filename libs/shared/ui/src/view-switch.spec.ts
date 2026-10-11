import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectListView, ViewSwitch } from './view-switch';

@Component({
  selector: 'app-list',
  imports: [ViewSwitch],
  template: `
    <app-view-switch [(view)]="view" />
    <table [class.ro-table-cards]="view() === 'cards'"></table>
  `,
})
class List {
  readonly view = injectListView('things');
}

describe('ViewSwitch', () => {
  beforeEach(() => localStorage.clear());

  it('shows a table first and switches the list to cards', async () => {
    const fixture = TestBed.createComponent(List);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const [table, cards] = [...element.querySelectorAll('button')];

    expect(table.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('table')?.classList).not.toContain(
      'ro-table-cards',
    );

    cards.click();
    await fixture.whenStable();

    expect(cards.getAttribute('aria-pressed')).toBe('true');
    expect(table.getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('table')?.classList).toContain(
      'ro-table-cards',
    );
  });

  it('remembers the chosen view of each list', async () => {
    const first = TestBed.createComponent(List);
    await first.whenStable();
    (first.nativeElement as HTMLElement).querySelectorAll('button')[1].click();
    await first.whenStable();
    first.destroy();

    const second = TestBed.createComponent(List);
    await second.whenStable();

    expect(second.componentInstance.view()).toBe('cards');
    expect(localStorage.getItem('routeops.view.things')).toBe('cards');
  });
});
