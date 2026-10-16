import { CustomerAccessError } from '../application/customer-access-error';
import { Customer, CustomerOrganization } from '../domain/customer';
import { CustomerGateway } from './customer-gateway';
import { SupabaseCustomerRepository } from './supabase-customer-repository';

const north: CustomerOrganization = { id: 'org-north', name: 'North' };
const delta: Customer = {
  id: 'customer-1',
  name: 'Delta Factory',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  active: true,
};

describe('SupabaseCustomerRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseCustomerRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    expect(gateway.membershipOrganizations).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an organization outside the memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseCustomerRepository(gateway);

    await expect(repository.organization('org-south')).resolves.toBeNull();
    expect(gateway.listCustomers).not.toHaveBeenCalled();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseCustomerRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new CustomerAccessError('signedOut'),
    );
    expect(gateway.membershipOrganizations).not.toHaveBeenCalled();
  });

  it('lists customers with the membership organization id', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseCustomerRepository(gateway);

    const organization = await repository.organization('org-north');
    await repository.list(organization ?? north);

    expect(gateway.listCustomers).toHaveBeenCalledWith('org-north');
  });

  it('removes a customer of the organization', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseCustomerRepository(gateway);

    await repository.remove(north, delta);

    expect(gateway.deleteCustomer).toHaveBeenCalledWith(
      'org-north',
      'customer-1',
    );
  });
});

function fakeGateway(
  userId: string | null,
  memberships: CustomerOrganization[],
): CustomerGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listCustomers: vi.fn(async () => []),
    insertCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(async () => undefined),
  };
}
