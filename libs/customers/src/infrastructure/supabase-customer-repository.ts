import { CustomerAccessError } from '../application/customer-access-error';
import { CustomerRepository } from '../application/customer-repository';
import {
  Customer,
  CustomerDetails,
  CustomerOrganization,
  memberOrganization,
} from '../domain/customer';
import { CustomerGateway } from './customer-gateway';

export class SupabaseCustomerRepository extends CustomerRepository {
  constructor(private readonly gateway: CustomerGateway) {
    super();
  }

  async organization(requestedId: string): Promise<CustomerOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new CustomerAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  list(organization: CustomerOrganization): Promise<Customer[]> {
    return this.gateway.listCustomers(organization.id);
  }

  add(
    organization: CustomerOrganization,
    details: CustomerDetails,
  ): Promise<Customer> {
    return this.gateway.insertCustomer(organization.id, details);
  }

  update(
    organization: CustomerOrganization,
    customerId: string,
    details: CustomerDetails,
  ): Promise<Customer> {
    return this.gateway.updateCustomer(organization.id, customerId, details);
  }
}
