import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('shows the photo when there is one, and a person icon otherwise', async () => {
    const fixture = TestBed.createComponent(Avatar);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-avatar-placeholder')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();

    fixture.componentRef.setInput('src', 'https://example.test/omar.webp');
    await fixture.whenStable();

    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/omar.webp',
    );
    expect(element.querySelector('.app-avatar-placeholder')).toBeNull();
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to the person icon when the photo fails to load', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('src', 'https://example.test/expired.webp');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.app-avatar-placeholder')).not.toBeNull();

    fixture.componentRef.setInput('src', 'https://example.test/new.webp');
    await fixture.whenStable();

    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/new.webp',
    );
  });
});
