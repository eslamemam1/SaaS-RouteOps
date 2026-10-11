import { TestBed } from '@angular/core/testing';
import { Avatar, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsOf('أحمد محمد علي')).toBe('أم');
    expect(initialsOf('  sara   adel ')).toBe('SA');
    expect(initialsOf('Mona')).toBe('M');
    expect(initialsOf('')).toBe('');
  });
});

describe('Avatar', () => {
  it('shows the photo when there is one, and the initials otherwise', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', 'Omar Khaled');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent?.trim()).toBe('OK');
    expect(element.querySelector('img')).toBeNull();

    fixture.componentRef.setInput('src', 'https://example.test/omar.webp');
    await fixture.whenStable();

    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/omar.webp',
    );
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });
});
