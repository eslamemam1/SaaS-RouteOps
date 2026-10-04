import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { RouteAccessError } from '../application/route-access-error';
import { RouteRepository } from '../application/route-repository';
import {
  choiceLabel,
  RouteChoice,
  RouteChoices,
  RouteOrganization,
  RouteProblem,
  selectedDays,
  sortByName,
  TransportRoute,
  weekdays,
} from '../domain/transport-route';
import { RouteForm } from './route-form';
import { routesText } from './routes-text';

const noChoices: RouteChoices = { customers: [], vehicles: [], drivers: [] };

@Component({
  selector: 'app-transport-routes',
  imports: [RouteForm, RouterLink],
  templateUrl: './transport-routes.html',
})
export class TransportRoutes {
  private readonly repository = inject(RouteRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(routesText);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<RouteProblem>('load');
  protected readonly organization = signal<RouteOrganization | null>(null);
  protected readonly routes = signal<TransportRoute[]>([]);
  protected readonly choices = signal<RouteChoices>(noChoices);
  protected readonly editing = signal<TransportRoute | null>(null);

  constructor() {
    void this.load();
  }

  protected label(choices: readonly RouteChoice[], id: string): string {
    return choiceLabel(choices, id) || this.text().list.notSet;
  }

  protected daysLabel(route: TransportRoute): string {
    const days = selectedDays(route.days);
    if (days.length === weekdays.length) {
      return this.text().list.everyDay;
    }
    const text = this.text();
    return days.map((day) => text.weekdays[day]).join(text.list.daySeparator);
  }

  protected edit(route: TransportRoute): void {
    this.editing.set(route);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onSaved(route: TransportRoute): void {
    const others = this.routes().filter((item) => item.id !== route.id);
    this.routes.set(sortByName([...others, route]));
    this.editing.set(null);
    this.status.set('success');
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
      this.routes.set(routes);
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
