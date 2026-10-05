import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { organizationsText } from './organizations-text';
import { SignOut } from './sign-out';

const arabic = organizationsText.ar;

@Component({ template: '' })
class Blank {}

describe('SignOut', () => {
  beforeEach(() => localStorage.clear());

  it('ends the session and opens the sign-in page', async () => {
    const signOut = vi.fn(async () => undefined);
    const fixture = await render(signOut);
    await settle(fixture);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Router).url).toBe('/sign-in');
  });

  it('stays on the page with a safe message and tries again when asked', async () => {
    const signOut = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new OrganizationAccessError('signOut'))
      .mockResolvedValueOnce(undefined);
    const fixture = await render(signOut);
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain(arabic.problems.signOut);
    expect(TestBed.inject(Router).url).toBe('/sign-out');

    element.querySelector<HTMLButtonElement>('button')!.click();
    await settle(fixture);

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(Router).url).toBe('/sign-in');
  });
});

async function render(signOut: () => Promise<void>) {
  const repository: OrganizationRepository = {
    isConfigured: () => true,
    signIn: async () => undefined,
    signOut,
    listMine: async () => [],
    currentUserIsOperator: async () => false,
    provisionCompany: async () => undefined,
  };
  await TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'sign-in', component: Blank },
        { path: 'sign-out', component: SignOut },
      ]),
      { provide: OrganizationRepository, useValue: repository },
    ],
  }).compileComponents();
  await TestBed.inject(Router).navigateByUrl('/sign-out');
  const fixture = TestBed.createComponent(SignOut);
  fixture.detectChanges();
  return fixture;
}

async function settle(fixture: ComponentFixture<SignOut>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
}
