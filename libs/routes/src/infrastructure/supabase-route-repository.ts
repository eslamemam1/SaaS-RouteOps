import { RouteAccessError } from '../application/route-access-error';
import { RouteRepository } from '../application/route-repository';
import {
  memberOrganization,
  RouteChoices,
  RouteOrganization,
  TransportRoute,
  TransportRouteDetails,
} from '../domain/transport-route';
import { RouteGateway } from './route-gateway';

export class SupabaseRouteRepository extends RouteRepository {
  constructor(private readonly gateway: RouteGateway) {
    super();
  }

  async organization(requestedId: string): Promise<RouteOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new RouteAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  list(organization: RouteOrganization): Promise<TransportRoute[]> {
    return this.gateway.listRoutes(organization.id);
  }

  choices(organization: RouteOrganization): Promise<RouteChoices> {
    return this.gateway.listChoices(organization.id);
  }

  add(
    organization: RouteOrganization,
    details: TransportRouteDetails,
  ): Promise<TransportRoute> {
    return this.gateway.insertRoute(organization.id, details);
  }

  update(
    organization: RouteOrganization,
    routeId: string,
    details: TransportRouteDetails,
  ): Promise<TransportRoute> {
    return this.gateway.updateRoute(organization.id, routeId, details);
  }
}
