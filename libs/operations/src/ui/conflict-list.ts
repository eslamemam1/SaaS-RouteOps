import { Component, inject, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideTriangleAlert } from '@ng-icons/lucide';
import { formatTime, injectText, LanguageService } from '@routeops/shared/i18n';
import {
  choiceLabel,
  OperationChoices,
  TripConflict,
} from '../domain/daily-trip';
import { operationsText } from './operations-text';

@Component({
  selector: 'app-conflict-list',
  imports: [NgIcon],
  template: `
    @for (conflict of conflicts(); track conflict.trip.id + conflict.kind) {
      <div class="conflict">
        <ng-icon [svg]="warningIcon" aria-hidden="true" />
        <span>
          {{ text().conflict[conflict.kind] }}
          <bdi>{{ time(conflict.trip.departureTime) }}</bdi>
          ({{ routeName(conflict.trip.routeId) }})
        </span>
      </div>
    }
  `,
  styleUrl: './conflict-list.css',
})
export class ConflictList {
  readonly conflicts = input.required<readonly TripConflict[]>();
  readonly choices = input.required<OperationChoices>();

  protected readonly text = injectText(operationsText);
  protected readonly warningIcon = lucideTriangleAlert;
  private readonly language = inject(LanguageService).language;

  protected time(value: string): string {
    return formatTime(value, this.language());
  }

  protected routeName(routeId: string): string {
    return (
      choiceLabel(this.choices().routes, routeId) || this.text().day.noRoute
    );
  }
}
