import { TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  it('draws the route with a middle stop and hides itself from screen readers', async () => {
    const fixture = TestBed.createComponent(Logo);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelectorAll('.app-logo-stop')).toHaveLength(2);
    expect(element.querySelector('.app-logo-check')).toBeTruthy();
  });

  it('drops the middle stop in the compact version for small sizes', async () => {
    const fixture = TestBed.createComponent(Logo);
    fixture.componentRef.setInput('variant', 'compact');
    fixture.componentRef.setInput('size', 'sm');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.app-logo-stop')).toHaveLength(1);
    expect(element.getAttribute('data-size')).toBe('sm');
  });
});
