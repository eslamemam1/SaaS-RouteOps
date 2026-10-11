import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@routeops/shared/i18n';
import { NotificationAccessError } from '../application/notification-access-error';
import { NotificationRepository } from '../application/notification-repository';
import { NotificationFacts } from '../domain/notification';
import { NotificationBell } from './notification-bell';
import { notificationsText } from './notifications-text';

@Component({
  imports: [NotificationBell],
  template: '<app-notification-bell organizationId="org-north" />',
})
class Shell {}

const nothing: NotificationFacts = {
  trips: [],
  unopenedDays: [],
  unrecordedDriverPay: 0,
  unrecordedVehiclePay: 0,
  drivers: [],
  vehicles: [],
};
const arabic = notificationsText.ar;

describe('NotificationBell', () => {
  it('counts the notifications and lists them with a link to the page that fixes each', async () => {
    const element = await open(async () => ({
      ...nothing,
      unrecordedDriverPay: 2,
      drivers: [{ id: 'driver-1', name: 'أحمد', licenseExpiry: '2000-01-01' }],
    }));

    expect(
      element.querySelector('.notification-bell-count')?.textContent?.trim(),
    ).toBe('2');
    expect(
      element.querySelector('.notification-bell-count-urgent'),
    ).not.toBeNull();

    await click(element.querySelector('.notification-bell-button'));

    const items = [
      ...element.querySelectorAll<HTMLAnchorElement>('.notification-item'),
    ];
    expect(
      items.map((item) =>
        item
          .querySelector('.notification-item-title')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim(),
      ),
    ).toEqual([
      arabic.kinds.driverLicenseExpired.title,
      `${arabic.kinds.driverPay.title} 2`,
    ]);
    expect(items[0].textContent).toContain('أحمد');
    expect(items[0].getAttribute('href')).toBe(
      '/organizations/org-north/drivers/driver-1',
    );
    expect(items[1].getAttribute('href')).toMatch(
      /^\/organizations\/org-north\/expenses\?month=/,
    );
  });

  it('says so when nothing needs attention', async () => {
    const element = await open(async () => nothing);

    expect(element.querySelector('.notification-bell-count')).toBeNull();

    await click(element.querySelector('.notification-bell-button'));

    expect(element.textContent).toContain(arabic.empty);
  });

  it('lets the member try again after a failed read', async () => {
    let fail = true;
    const element = await open(async () => {
      if (fail) {
        throw new NotificationAccessError('load');
      }
      return { ...nothing, unopenedDays: ['2000-01-01'] };
    });
    await click(element.querySelector('.notification-bell-button'));
    expect(element.textContent).toContain(arabic.loadFailed);

    fail = false;
    await click(element.querySelector('.notification-retry'));

    expect(element.querySelectorAll('.notification-item')).toHaveLength(1);
    expect(element.textContent).toContain(arabic.kinds.unopenedDays.title);
  });

  it('closes when the member clicks outside it', async () => {
    const element = await open(async () => nothing);
    await click(element.querySelector('.notification-bell-button'));
    expect(element.querySelector('.notification-panel')).not.toBeNull();

    document.body.click();
    await settle();

    expect(element.querySelector('.notification-panel')).toBeNull();
  });
});

let fixture: ReturnType<typeof TestBed.createComponent<Shell>>;

async function open(
  facts: NotificationRepository['facts'],
): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: NotificationRepository, useValue: { facts } },
    ],
  });
  TestBed.inject(LanguageService).setLanguage('ar');
  fixture = TestBed.createComponent(Shell);
  document.body.appendChild(fixture.nativeElement);
  await settle();
  return fixture.nativeElement as HTMLElement;
}

async function click(target: Element | null): Promise<void> {
  (target as HTMLElement | null)?.click();
  await settle();
}

async function settle(): Promise<void> {
  for (let turn = 0; turn < 3; turn++) {
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  }
}
