import {
  Customer,
  CustomerDetails,
  CustomerOrganization,
} from '../domain/customer';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class CustomerRepository {
  abstract organization(requestedId: string): Promise<CustomerOrganization | null>;
  abstract list(organization: CustomerOrganization): Promise<Customer[]>;
  abstract add(
    organization: CustomerOrganization,
    details: CustomerDetails,
  ): Promise<Customer>;
  abstract update(
    organization: CustomerOrganization,
    customerId: string,
    details: CustomerDetails,
  ): Promise<Customer>;
}
