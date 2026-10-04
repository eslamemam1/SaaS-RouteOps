import {
  companyAccountMessages,
  emailError,
  organizationNameError,
  passwordError,
} from './company-account';
import { activeOrganization, Organization } from './organization';

const north: Organization = { id: 'org-north', name: 'North' };
const south: Organization = { id: 'org-south', name: 'South' };

describe('organization name', () => {
  it('rejects a blank name', () => {
    expect(organizationNameError('   ')).toBe(companyAccountMessages.organizationName);
  });

  it('rejects a name longer than 200 characters', () => {
    expect(organizationNameError('a'.repeat(201))).toBe(
      companyAccountMessages.organizationNameLength,
    );
  });

  it('accepts a trimmed name', () => {
    expect(organizationNameError('  North Fleet  ')).toBeNull();
  });
});

describe('email and password', () => {
  it('rejects an email without a domain', () => {
    expect(emailError('owner@fleet')).toBe(companyAccountMessages.emailFormat);
  });

  it('rejects a password shorter than 6 characters', () => {
    expect(passwordError('short')).toBe(companyAccountMessages.password);
  });
});

describe('active organization', () => {
  it('selects the only membership', () => {
    expect(activeOrganization([north], null)).toEqual(north);
  });

  it('waits for a choice when the user belongs to more than one organization', () => {
    expect(activeOrganization([north, south], null)).toBeNull();
  });

  it('ignores an organization id that is not one of the memberships', () => {
    expect(activeOrganization([north], 'org-other')).toBeNull();
  });

  it('selects a requested membership', () => {
    expect(activeOrganization([north, south], south.id)).toEqual(south);
  });
});
