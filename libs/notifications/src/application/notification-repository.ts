import { NotificationFacts } from '../domain/notification';

export abstract class NotificationRepository {
  // What the bell needs on the organization's today. Row level security leaves
  // an organization the user is not a member of empty.
  abstract facts(
    organizationId: string,
    today: string,
  ): Promise<NotificationFacts>;
}
