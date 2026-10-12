import {
  Component,
  DOCUMENT,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBanknote,
  lucideBuilding2,
  lucideCalendarCheck,
  lucideGift,
  lucideTag,
} from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { Alert, FormDrawer } from '@routeops/shared/ui';
import { CompanyAccounts } from './company-accounts';
import { CompanySubscriptions } from './company-subscriptions';
import { organizationsText } from './organizations-text';
import { ProvisionCompanyForm } from './provision-company';
import { SubscriptionOffers } from './subscription-offers';
import { SubscriptionPayments } from './subscription-payments';
import { SubscriptionPlans } from './subscription-plans';

const sections = [
  { key: 'accounts', icon: lucideBuilding2 },
  { key: 'subscriptions', icon: lucideCalendarCheck },
  { key: 'payments', icon: lucideBanknote },
  { key: 'plans', icon: lucideTag },
  { key: 'offers', icon: lucideGift },
] as const;

type Section = (typeof sections)[number]['key'];

// The site operator's work: the companies, their subscriptions and payments, and the plans and offers on sale.
@Component({
  selector: 'app-operator-home',
  imports: [
    Alert,
    CompanyAccounts,
    CompanySubscriptions,
    FormDrawer,
    NgIcon,
    ProvisionCompanyForm,
    SubscriptionOffers,
    SubscriptionPayments,
    SubscriptionPlans,
  ],
  templateUrl: './operator-home.html',
  styleUrl: './operator-home.css',
  host: { class: 'ro-stack' },
})
export class OperatorHome {
  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(organizationsText);
  protected readonly sections = sections;
  protected readonly section = injectSection();
  protected readonly provisionOpen = signal(false);
  protected readonly provisioned = signal(false);
  private readonly accounts = viewChild(CompanyAccounts);
  private readonly payments = viewChild(SubscriptionPayments);
  protected readonly subscriptions = viewChild(CompanySubscriptions);
  protected readonly offers = viewChild(SubscriptionOffers);

  addCompany(): void {
    this.provisionOpen.set(true);
  }

  protected companyCreated(): void {
    this.provisionOpen.set(false);
    this.provisioned.set(true);
    this.section.set('accounts');
    void Promise.all([
      this.accounts()?.reload(),
      this.payments()?.reload(),
      this.subscriptions()?.reload(),
    ]);
  }

  // The arrow keys move between the sections in the reading direction of the language.
  protected move(event: KeyboardEvent): void {
    const last = sections.length - 1;
    const current = sections.findIndex(
      (section) => section.key === this.section(),
    );
    const arabic = this.language() === 'ar';
    const next =
      event.key === (arabic ? 'ArrowLeft' : 'ArrowRight')
        ? (current + 1) % sections.length
        : event.key === (arabic ? 'ArrowRight' : 'ArrowLeft')
          ? (current + last) % sections.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) {
      return;
    }
    event.preventDefault();
    const key = sections[next].key;
    this.section.set(key);
    (event.currentTarget as HTMLElement).parentElement
      ?.querySelector<HTMLElement>(`[data-section="${key}"]`)
      ?.focus();
  }
}

// The operator's last section, remembered in the browser.
function injectSection() {
  const storage = inject(DOCUMENT).defaultView?.localStorage;
  const key = 'routeops.operator.section';
  const stored = storage?.getItem(key);
  const section = signal<Section>(
    sections.find((option) => option.key === stored)?.key ?? 'accounts',
  );
  effect(() => storage?.setItem(key, section()));
  return section;
}
