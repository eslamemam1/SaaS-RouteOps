import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney, toMinorUnits } from '@routeops/shared/money';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  PageHeader,
  PageState,
  Tag,
} from '@routeops/shared/ui';
import { RouteAccessError } from '../application/route-access-error';
import { RouteRepository } from '../application/route-repository';
import {
  choiceLabel,
  copyForAnotherCustomer,
  RouteChoice,
  RouteChoices,
  RouteOrganization,
  RouteProblem,
  routesOfCustomer,
  selectedDays,
  sortByCustomerAndName,
  TransportRoute,
  TransportRouteDetails,
  weekdays,
} from '../domain/transport-route';
import { RouteForm } from './route-form';
import { routesText } from './routes-text';

const noChoices: RouteChoices = { customers: [], vehicles: [], drivers: [] };

@Component({
  selector: 'app-transport-routes',
  imports: [
    Alert,
    Button,
    Field,
    FormDrawer,
    NgIcon,
    PageHeader,
    PageState,
    RouteForm,
    RouterLink,
    Tag,
  ],
  templateUrl: './transport-routes.html',
  styleUrl: './transport-routes.css',
})
export class TransportRoutes {
  private readonly repository = inject(RouteRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(routesText);
  protected readonly addIcon = lucidePlus;
  private readonly language = inject(LanguageService).language;
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<RouteProblem>('load');
  protected readonly organization = signal<RouteOrganization | null>(null);
  protected readonly routes = signal<TransportRoute[]>([]);
  protected readonly choices = signal<RouteChoices>(noChoices);
  protected readonly editing = signal<TransportRoute | null>(null);
  protected readonly draft = signal<TransportRouteDetails | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);
  protected readonly customerFilter = signal('');
  protected readonly visibleRoutes = computed(() =>
    routesOfCustomer(this.routes(), this.customerFilter()),
  );
  protected readonly formTitle = computed(() => {
    const form = this.text().form;
    if (this.editing()) {
      return form.editTitle;
    }
    return this.draft() ? form.copyTitle : form.addTitle;
  });

  constructor() {
    void this.load();
  }

  protected label(choices: readonly RouteChoice[], id: string): string {
    return choiceLabel(choices, id) || this.text().list.notSet;
  }

  protected priceLabel(route: TransportRoute): string {
    const currency = this.organization()?.currency;
    const minor = currency ? toMinorUnits(route.tripPrice, currency) : null;
    return currency && typeof minor === 'number'
      ? formatMoney(minor, currency, this.language())
      : '';
  }

  protected daysLabel(route: TransportRoute): string {
    const days = selectedDays(route.days);
    if (days.length === weekdays.length) {
      return this.text().list.everyDay;
    }
    const text = this.text();
    return days.map((day) => text.weekdays[day]).join(text.list.daySeparator);
  }

  protected filterBy(customerId: string): void {
    this.customerFilter.set(customerId);
  }

  protected add(): void {
    this.open(null, null);
  }

  protected edit(route: TransportRoute): void {
    this.open(route, null);
  }

  protected copy(route: TransportRoute): void {
    this.open(null, copyForAnotherCustomer(route));
  }

  protected onDrawer(open: boolean): void {
    if (!open) {
      this.stopEditing();
    }
  }

  protected stopEditing(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.draft.set(null);
  }

  protected onSaved(route: TransportRoute): void {
    const others = this.routes().filter((item) => item.id !== route.id);
    this.routes.set(
      sortByCustomerAndName([...others, route], this.choices().customers),
    );
    this.outcome.set(this.editing() ? 'saved' : 'added');
    this.stopEditing();
    this.status.set('success');
  }

  private open(
    route: TransportRoute | null,
    draft: TransportRouteDetails | null,
  ): void {
    this.outcome.set(null);
    this.editing.set(route);
    this.draft.set(draft);
    this.formOpen.set(true);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const requestedId =
        this.activatedRoute.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.organization.set(organization);
      const [routes, choices] = await Promise.all([
        this.repository.list(organization),
        this.repository.choices(organization),
      ]);
      this.routes.set(sortByCustomerAndName(routes, choices.customers));
      this.choices.set(choices);
      this.status.set(routes.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof RouteAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }
}
