import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBell,
  lucideBus,
  lucideCalendarX,
  lucideCircleCheck,
  lucideClipboardCheck,
  lucideIdCard,
  lucideRefreshCw,
  lucideTag,
  lucideTriangleAlert,
  lucideWallet,
  lucideX,
} from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import { filter } from 'rxjs';
import { NotificationRepository } from '../application/notification-repository';
import {
  Notification,
  NotificationKind,
  notifications,
} from '../domain/notification';
import { notificationsText } from './notifications-text';

// After a page change the bell reads again, but not more often than this,
// so fixing something and moving on shows it gone.
const refreshAfterMs = 15_000;
// An open page still reads again now and then, as the day goes on.
const pollEveryMs = 5 * 60_000;

const kindIcons: Record<NotificationKind, string> = {
  driverLicenseExpired: lucideIdCard,
  vehicleLicenseExpired: lucideBus,
  unopenedDays: lucideCalendarX,
  conflicts: lucideTriangleAlert,
  unrecordedTrips: lucideClipboardCheck,
  driverPay: lucideWallet,
  vehiclePay: lucideWallet,
  unpriced: lucideTag,
  driverLicenseSoon: lucideIdCard,
  vehicleLicenseSoon: lucideBus,
};

@Component({
  selector: 'app-notification-bell',
  imports: [NgIcon, RouterLink],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  host: {
    class: 'notification-bell',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close(true)',
  },
})
export class NotificationBell {
  readonly organizationId = input.required<string>();

  private readonly repository = inject(NotificationRepository);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly language = inject(LanguageService).language;
  private readonly button = viewChild<ElementRef<HTMLButtonElement>>('button');
  protected readonly text = injectText(notificationsText);
  protected readonly icons = {
    bell: lucideBell,
    clear: lucideCircleCheck,
    close: lucideX,
    refresh: lucideRefreshCw,
    kinds: kindIcons,
  };
  protected readonly open = signal(false);
  protected readonly status = signal<'loading' | 'success' | 'error'>(
    'loading',
  );
  protected readonly items = signal<Notification[]>([]);
  protected readonly urgent = computed(() =>
    this.items().some((item) => item.urgent),
  );
  protected readonly badge = computed(() => {
    const count = this.items().length;
    return count > 9 ? '9+' : String(count);
  });
  protected readonly buttonLabel = computed(() => {
    const count = this.items().length;
    return count > 0 ? `${this.text().title} (${count})` : this.text().title;
  });
  private loadedAt = 0;
  private request = 0;

  constructor() {
    effect(() => {
      const organizationId = this.organizationId();
      untracked(() => {
        this.items.set([]);
        void this.load(organizationId);
      });
    });
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.open.set(false);
        if (Date.now() - this.loadedAt > refreshAfterMs) {
          void this.load(this.organizationId());
        }
      });
    const timer = setInterval(
      () => void this.load(this.organizationId()),
      pollEveryMs,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected toggle(): void {
    const opening = !this.open();
    this.open.set(opening);
    if (opening) {
      void this.load(this.organizationId());
    }
  }

  protected close(focusButton = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (focusButton) {
      afterNextRender(() => this.button()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }

  protected refresh(): void {
    void this.load(this.organizationId());
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (
      this.open() &&
      !this.host.nativeElement.contains(event.target as Node)
    ) {
      this.open.set(false);
    }
  }

  protected link(item: Notification): string[] {
    const path = ['/organizations', this.organizationId(), item.link.section];
    return item.link.id ? [...path, item.link.id] : path;
  }

  protected day(value: string): string {
    return formatDay(value, this.language());
  }

  private async load(organizationId: string): Promise<void> {
    const request = ++this.request;
    if (this.items().length === 0) {
      this.status.set('loading');
    }
    const now = new Date();
    try {
      const facts = await this.repository.facts(organizationId, localDate(now));
      if (request !== this.request) {
        return;
      }
      this.items.set(notifications(facts, localDate(now), localTime(now)));
      this.status.set('success');
      this.loadedAt = Date.now();
    } catch {
      if (request === this.request) {
        this.status.set('error');
      }
    }
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function localTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
