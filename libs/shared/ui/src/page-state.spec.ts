import { TestBed } from '@angular/core/testing';
import { PageState } from './page-state';
import { uiText } from './ui-text';

describe('PageState', () => {
  it('offers to try again only on an error the page can retry', async () => {
    const fixture = TestBed.createComponent(PageState);
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('message', 'Could not load.');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const retried = vi.fn();
    fixture.componentInstance.retry.subscribe(retried);

    expect(element.querySelector('button')).toBeNull();
    expect(element.getAttribute('role')).toBe('alert');

    fixture.componentRef.setInput('retryable', true);
    await fixture.whenStable();
    const button = element.querySelector('button');
    expect(button?.textContent?.trim()).toBe(uiText.ar.retry);

    button?.click();
    expect(retried).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('kind', 'loading');
    await fixture.whenStable();
    expect(element.querySelector('button')).toBeNull();
  });
});
