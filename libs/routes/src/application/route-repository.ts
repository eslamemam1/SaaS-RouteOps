import {
  RouteChoices,
  RouteOrganization,
  TransportRoute,
  TransportRouteDetails,
} from '../domain/transport-route';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class RouteRepository {
  abstract organization(requestedId: string): Promise<RouteOrganization | null>;
  abstract list(organization: RouteOrganization): Promise<TransportRoute[]>;
  abstract choices(organization: RouteOrganization): Promise<RouteChoices>;
  abstract add(
    organization: RouteOrganization,
    details: TransportRouteDetails,
  ): Promise<TransportRoute>;
  abstract update(
    organization: RouteOrganization,
    routeId: string,
    details: TransportRouteDetails,
  ): Promise<TransportRoute>;
}
