import {
  Customer,
  customerEmailError,
  customerMessages,
  customerNameError,
  memberOrganization,
  optionalTextError,
  sortByName,
} from './customer';

describe('customerNameError', () => {
  it('requires a name', () => {
    expect(customerNameError('   ')).toBe(customerMessages.name);
  });

  it('rejects a name longer than 200 characters', () => {
    expect(customerNameError('a'.repeat(201))).toBe(customerMessages.tooLong);
  });

  it('accepts a name with surrounding spaces', () => {
    expect(customerNameError('  Delta Factory  ')).toBeNull();
  });
});

describe('customerEmailError', () => {
  it('allows an empty email because it is optional', () => {
    expect(customerEmailError('')).toBeNull();
  });

  it('rejects an email without a domain', () => {
    expect(customerEmailError('office@')).toBe(customerMessages.emailFormat);
  });

  it('accepts a valid email', () => {
    expect(customerEmailError('office@delta.com')).toBeNull();
  });
});

describe('optionalTextError', () => {
  it('rejects text over the limit after trimming', () => {
    expect(optionalTextError('a'.repeat(51), 50)).toBe(customerMessages.tooLong);
    expect(optionalTextError(` ${'a'.repeat(50)} `, 50)).toBeNull();
  });
});

describe('memberOrganization', () => {
  const memberships = [{ id: 'org-north', name: 'North' }];

  it('returns the organization when it is one of the memberships', () => {
    expect(memberOrganization(memberships, 'org-north')).toEqual(memberships[0]);
  });

  it('returns null for an organization the user does not belong to', () => {
    expect(memberOrganization(memberships, 'org-south')).toBeNull();
  });
});

describe('sortByName', () => {
  it('orders customers alphabetically', () => {
    const customer = (id: string, name: string): Customer => ({
      id,
      name,
      contactName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      active: true,
    });

    expect(
      sortByName([customer('2', 'Zeta'), customer('1', 'Alpha')]).map(
        (item) => item.name,
      ),
    ).toEqual(['Alpha', 'Zeta']);
  });
});
