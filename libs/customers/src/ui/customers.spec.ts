import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CustomerAccessError } from '../application/customer-access-error';
import { CustomerRepository } from '../application/customer-repository';
import {
  Customer,
  customerMessages,
  CustomerOrganization,
} from '../domain/customer';
import { Customers } from './customers';

const north: CustomerOrganization = { id: 'org-north', name: 'North' };
const delta: Customer = {
  id: 'customer-1',
  name: 'Delta Factory',
  contactName: 'Mona',
  phone: '0100',
  email: '',
  address: '',
  notes: '',
  active: true,
};

describe('Customers', () => {
  it('shows loading and then the organization customers', async () => {
    let resolveList: (customers: Customer[]) => void = () => undefined;
    const harness = await open({
      list: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain('جارٍ تحميل العملاء.');

    resolveList([delta]);
    await settle(harness);

    expect(text(harness)).toContain('Delta Factory');
    expect(text(harness)).toContain('الشركة: North');
  });

  it('shows an empty state and the add form when there are no customers', async () => {
    const harness = await open({ list: async () => [] });
    await settle(harness);

    expect(text(harness)).toContain('لا يوجد عملاء بعد.');
    expect(text(harness)).toContain('إضافة عميل');
  });

  it('refuses an organization outside the user memberships', async () => {
    const list = vi.fn(async () => [delta]);
    const harness = await open({ organization: async () => null, list });
    await settle(harness);

    expect(text(harness)).toContain(customerMessages.organization);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows a safe error when loading fails', async () => {
    const harness = await open({
      list: async () => {
        throw new CustomerAccessError(customerMessages.load);
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(customerMessages.load);
  });
});

async function open(overrides: Partial<CustomerRepository>) {
  const repository: CustomerRepository = {
    organization: async () => north,
    list: async () => [],
    add: async () => delta,
    update: async () => delta,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'organizations/:organizationId/customers', component: Customers },
      ]),
      { provide: CustomerRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/customers', Customers);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
