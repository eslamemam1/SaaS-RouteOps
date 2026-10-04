import { ReportsAccessError } from '../application/reports-access-error';
import { ReportsRepository } from '../application/reports-repository';
import {
  daysSoFar,
  memberOrganization,
  monthDays,
  MonthReport,
  ReportChoices,
  ReportOrganization,
} from '../domain/trip-report';
import { ReportsGateway } from './reports-gateway';

export class SupabaseReportsRepository extends ReportsRepository {
  constructor(private readonly gateway: ReportsGateway) {
    super();
  }

  async organization(requestedId: string): Promise<ReportOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new ReportsAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  choices(organization: ReportOrganization): Promise<ReportChoices> {
    return this.gateway.listChoices(organization.id);
  }

  async month(
    organization: ReportOrganization,
    month: string,
    today: string,
  ): Promise<MonthReport> {
    const soFar = daysSoFar(month, today);
    const [counts, unopenedDays] = await Promise.all([
      this.gateway.tripCounts(organization.id, monthDays(month), today),
      soFar ? this.gateway.unopenedDays(organization.id, soFar) : [],
    ]);
    return { counts, unopenedDays };
  }
}
