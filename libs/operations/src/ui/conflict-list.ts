import { Component, input } from '@angular/core';
import { injectText } from '@routeops/shared/i18n';
import { choiceLabel, OperationChoices, TripConflict } from '../domain/daily-trip';
import { operationsText } from './operations-text';

@Component({
  selector: 'app-conflict-list',
  template: `
    @for (conflict of conflicts(); track conflict.trip.id + conflict.kind) {
      <div class="error">
        {{ text().conflict[conflict.kind] }}
        <bdi>{{ conflict.trip.departureTime }}</bdi>
        ({{ routeName(conflict.trip.routeId) }})
      </div>
    }
  `,
})
export class ConflictList {
  readonly conflicts = input.required<readonly TripConflict[]>();
  readonly choices = input.required<OperationChoices>();

  protected readonly text = injectText(operationsText);

  protected routeName(routeId: string): string {
    return choiceLabel(this.choices().routes, routeId) || this.text().day.noRoute;
  }
}
