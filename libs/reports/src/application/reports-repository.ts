import {
  DateRange,
  MonthReport,
  ReportChoices,
  ReportOrganization,
} from '../domain/trip-report';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class ReportsRepository {
  abstract organization(requestedId: string): Promise<ReportOrganization | null>;
  abstract choices(organization: ReportOrganization): Promise<ReportChoices>;
  // today is the member's local date; a trip whose day comes later never counts.
  abstract month(
    organization: ReportOrganization,
    month: string,
    today: string,
  ): Promise<MonthReport>;
  // Trip counts and unopened days for a chosen invoice range; expenses stay on month().
  abstract range(
    organization: ReportOrganization,
    days: DateRange,
    today: string,
  ): Promise<Pick<MonthReport, 'counts' | 'unopenedDays'>>;
}
