import {
  emailError,
  organizationNameError,
  passwordError,
} from './company-account';
import { activeOrganization, Organization } from './organization';

const north: Organization = { id: 'org-north', name: 'North' };
const south: Organization = { id: 'org-south', name: 'South' };

describe('organization name', () => {
  it('rejects a blank name', () => {
    expect(organizationNameError('   ')).toBe('Enter an organization name.');
  });

  it('rejects a name longer than 200 characters', () => {
    expect(organizationNameError('a'.repeat(201))).toBe(
      'Use a shorter organization name.',
    );
  });

  it('accepts a trimmed name', () => {
    expect(organizationNameError('  North Fleet  ')).toBeNull();
  });
});

describe('email and password', () => {
  it('rejects an email without a domain', () => {
    expect(emailError('owner@fleet')).toBe('Use a valid email address.');
  });

  it('rejects a password shorter than 6 characters', () => {
    expect(passwordError('short')).toBe(
      'Use at least 6 characters for the password.',
    );
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
