import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import {
  localToday,
  offerName,
  planName,
  SubscriptionOffer,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import {
  Alert,
  Button,
  FormDrawer,
  paginate,
  Pager,
  Tag,
  Tone,
} from '@routeops/shared/ui';
import { OfferStatus, offerStatus } from '../domain/offer';
import { SubscriptionRepository } from '../application/subscription-repository';
import { OfferForm } from './offer-form';
import { organizationsText } from './organizations-text';

const statusTones: Record<OfferStatus, Tone> = {
  running: 'success',
  upcoming: 'info',
  ended: 'neutral',
  stopped: 'danger',
};

const statusOrder: Record<OfferStatus, number> = {
  running: 0,
  upcoming: 1,
  stopped: 2,
  ended: 3,
};

// The operator's offers: what each gives, on which plans, and when it runs.
@Component({
  selector: 'app-subscription-offers',
  imports: [
    Alert,
    Button,
    FormDrawer,
    NgIcon,
    OfferForm,
    Pager,
    RouterLink,
    Tag,
  ],
  templateUrl: './subscription-offers.html',
})
export class SubscriptionOffers {
  private readonly repository = inject(SubscriptionRepository);
  private readonly language = inject(LanguageService).language;

  readonly changed = output<void>();

  protected readonly text = injectText(organizationsText);
  protected readonly addIcon = lucidePlus;
  protected readonly statusTones = statusTones;
  protected readonly today = localToday();

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly plans = signal<SubscriptionPlan[]>([]);
  protected readonly offers = signal<SubscriptionOffer[]>([]);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<SubscriptionOffer | null>(null);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);

  protected readonly rows = computed(() =>
    this.offers()
      .map((offer) => ({ offer, status: offerStatus(offer, this.today) }))
      .sort(
        (a, b) =>
          statusOrder[a.status] - statusOrder[b.status] ||
          b.offer.startsOn.localeCompare(a.offer.startsOn),
      ),
  );
  protected readonly offerPages = paginate(this.rows);
  private readonly plansById = computed(
    () => new Map(this.plans().map((plan) => [plan.id, plan])),
  );
  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(
        this.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
        { dateStyle: 'medium', timeZone: 'UTC' },
      ),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.status.set('loading');
    try {
      const [plans, offers] = await Promise.all([
        this.repository.listPlans(),
        this.repository.listOffers(),
      ]);
      this.plans.set(plans);
      this.offers.set(offers);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  protected add(): void {
    this.outcome.set(null);
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected edit(offer: SubscriptionOffer): void {
    this.outcome.set(null);
    this.editing.set(offer);
    this.formOpen.set(true);
  }

  protected saved(offer: SubscriptionOffer): void {
    const added = !this.offers().some((item) => item.id === offer.id);
    this.offers.update((offers) =>
      added
        ? [offer, ...offers]
        : offers.map((item) => (item.id === offer.id ? offer : item)),
    );
    this.formOpen.set(false);
    this.outcome.set(added ? 'added' : 'saved');
    this.changed.emit();
  }

  protected name(offer: SubscriptionOffer): string {
    return offerName(offer, this.language());
  }

  protected planNames(offer: SubscriptionOffer): string {
    return offer.planIds
      .map((id) => this.plansById().get(id))
      .filter((plan): plan is SubscriptionPlan => plan !== undefined)
      .map((plan) => planName(plan, this.language()))
      .join(this.separator());
  }

  protected periodNames(offer: SubscriptionOffer): string {
    const periods = this.text().plans.periods;
    return offer.months.map((months) => periods[months]).join(this.separator());
  }

  private separator(): string {
    return this.language() === 'ar' ? '، ' : ', ';
  }

  protected date(value: string): string {
    return this.dateFormat().format(new Date(`${value}T00:00:00Z`));
  }
}
