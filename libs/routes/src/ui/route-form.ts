import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button, Field } from '@routeops/shared/ui';
import { RouteAccessError } from '../application/route-access-error';
import { RouteRepository } from '../application/route-repository';
import {
  availableChoices,
  emptyTransportRouteDetails,
  RouteChoices,
  RouteOrganization,
  RouteProblem,
  TransportRoute,
  TransportRouteDetails,
  weekdays,
} from '../domain/transport-route';
import { routeDetailsSchema } from './route-fields';
import { routesText } from './routes-text';

@Component({
  selector: 'app-route-form',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './route-form.html',
})
export class RouteForm {
  private readonly repository = inject(RouteRepository);

  readonly organization = input.required<RouteOrganization>();
  readonly choices = input.required<RouteChoices>();
  readonly route = input<TransportRoute | null>(null);
  readonly draft = input<TransportRouteDetails | null>(null);
  readonly saved = output<TransportRoute>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(routesText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly weekdays = weekdays;
  protected readonly submitting = signal(false);
  protected readonly problem = signal<RouteProblem | null>(null);
  protected readonly model = signal<TransportRouteDetails>(
    emptyTransportRouteDetails,
  );
  protected readonly routeForm = form(this.model, (field) => {
    apply(
      field,
      routeDetailsSchema(
        this.problems,
        computed(() => this.organization().currency),
      ),
    );
  });

  protected readonly customers = computed(() =>
    availableChoices(this.choices().customers, this.model().customerId),
  );
  protected readonly vehicles = computed(() =>
    availableChoices(this.choices().vehicles, this.model().vehicleId),
  );
  protected readonly drivers = computed(() =>
    availableChoices(this.choices().drivers, this.model().driverId),
  );

  constructor() {
    effect(() => {
      const route = this.route();
      const details = route
        ? detailsOf(route)
        : (this.draft() ?? emptyTransportRouteDetails);
      untracked(() => {
        this.routeForm().reset(details);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.routeForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const existing = this.route();
        const saved = existing
          ? await this.repository.update(
              this.organization(),
              existing.id,
              this.model(),
            )
          : await this.repository.add(this.organization(), this.model());
        this.routeForm().reset(emptyTransportRouteDetails);
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof RouteAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

function detailsOf(route: TransportRoute): TransportRouteDetails {
  return {
    name: route.name,
    customerId: route.customerId,
    vehicleId: route.vehicleId,
    driverId: route.driverId,
    startPoint: route.startPoint,
    endPoint: route.endPoint,
    outboundTime: route.outboundTime,
    returnTime: route.returnTime,
    days: route.days,
    tripPrice: route.tripPrice,
    notes: route.notes,
    active: route.active,
  };
}
