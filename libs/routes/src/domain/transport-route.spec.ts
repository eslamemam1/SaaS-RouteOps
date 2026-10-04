import {
  availableChoices,
  choiceLabel,
  customerError,
  daysError,
  emptyTransportRouteDetails,
  memberOrganization,
  routeNameError,
  selectedDays,
  sortByName,
  startPointError,
  timeError,
  TransportRoute,
  tripError,
} from './transport-route';

describe('route text fields', () => {
  it('requires a name and a start point', () => {
    expect(routeNameError('  ')).toBe('name');
    expect(startPointError('')).toBe('startPoint');
  });

  it('rejects text over the limit', () => {
    expect(routeNameError('a'.repeat(201))).toBe('tooLong');
    expect(startPointError('a'.repeat(301))).toBe('tooLong');
  });
});

describe('customerError', () => {
  it('requires a client company', () => {
    expect(customerError('')).toBe('customer');
    expect(customerError('customer-1')).toBeNull();
  });
});

describe('trip times', () => {
  it('accepts an empty time or a 24-hour HH:MM time', () => {
    expect(timeError('')).toBeNull();
    expect(timeError('07:30')).toBeNull();
    expect(timeError('23:59')).toBeNull();
  });

  it('rejects an invalid time', () => {
    expect(timeError('24:00')).toBe('time');
    expect(timeError('7:30')).toBe('time');
  });

  it('needs at least one of the outbound and return times', () => {
    expect(tripError('', '')).toBe('trip');
    expect(tripError('07:00', '')).toBeNull();
    expect(tripError('', '16:00')).toBeNull();
  });
});

describe('working days', () => {
  it('defaults to Saturday through Thursday', () => {
    expect(selectedDays(emptyTransportRouteDetails.days)).toEqual([
      'saturday',
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
    ]);
  });

  it('needs at least one day', () => {
    const none = {
      saturday: false,
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
    };

    expect(daysError(none)).toBe('days');
    expect(daysError({ ...none, friday: true })).toBeNull();
  });
});

describe('choices', () => {
  const choices = [
    { id: 'driver-1', label: 'Ahmed', active: true },
    { id: 'driver-2', label: 'Mahmoud', active: false },
  ];

  it('offers active choices plus the one already saved', () => {
    expect(availableChoices(choices, '').map((choice) => choice.id)).toEqual([
      'driver-1',
    ]);
    expect(
      availableChoices(choices, 'driver-2').map((choice) => choice.id),
    ).toEqual(['driver-1', 'driver-2']);
  });

  it('finds the label of a saved choice', () => {
    expect(choiceLabel(choices, 'driver-2')).toBe('Mahmoud');
    expect(choiceLabel(choices, '')).toBe('');
  });
});

describe('memberOrganization', () => {
  const memberships = [{ id: 'org-north', name: 'North' }];

  it('returns null for an organization the user does not belong to', () => {
    expect(memberOrganization(memberships, 'org-north')).toEqual(memberships[0]);
    expect(memberOrganization(memberships, 'org-south')).toBeNull();
  });
});

describe('sortByName', () => {
  it('orders routes by name', () => {
    const route = (id: string, name: string): TransportRoute => ({
      ...emptyTransportRouteDetails,
      id,
      name,
    });

    expect(
      sortByName([route('2', 'Zeta'), route('1', 'Alpha')]).map(
        (item) => item.name,
      ),
    ).toEqual(['Alpha', 'Zeta']);
  });
});
