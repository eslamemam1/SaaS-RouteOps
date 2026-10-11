import { Component, inject, input } from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { NotificationRepository } from './application/notification-repository';
import { SupabaseNotificationRepository } from './infrastructure/supabase-notification-repository';
import { NotificationBell } from './ui/notification-bell';

// The bell for the app shell's top bar, with the data access it needs, since the
// shell is outside every feature's routes.
@Component({
  selector: 'app-notifications',
  imports: [NotificationBell],
  template: '<app-notification-bell [organizationId]="organizationId()" />',
  providers: [
    {
      provide: NotificationRepository,
      useFactory: () =>
        new SupabaseNotificationRepository(inject(SUPABASE_CLIENT)),
    },
  ],
})
export class Notifications {
  readonly organizationId = input.required<string>();
}
