import {
  arrivalError,
  availableChoices,
  choiceLabel,
  copyForAnotherCustomer,
  customerError,
  daysError,
  driverError,
  emptyTransportRouteDetails,
  isShift,
  memberOrganization,
  RouteOrganization,
  routeNameError,
  routeScheduleOverlap,
  routesOfCustomer,
  searchRoutes,
  selectedDays,
  sortByCustomerAndName,
  startPointError,
  timeError,
  TransportRoute,
  tripError,
  tripPriceError,
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

describe('driverError', () => {
  it('requires a driver', () => {
    expect(driverError('')).toBe('driver');
    expect(driverError('driver-1')).toBeNull();
  });
});

describe('tripPriceError', () => {
  it('accepts no price or an amount in the organization currency', () => {
    expect(tripPriceError('', 'EGP')).toBeNull();
    expect(tripPriceError('150.50', 'EGP')).toBeNull();
    expect(tripPriceError('1.250', 'KWD')).toBeNull();
  });

  it('rejects a text that is not an amount in that currency', () => {
    expect(tripPriceError('150.505', 'EGP')).toBe('tripPrice');
    expect(tripPriceError('-5', 'EGP')).toBe('tripPrice');
    expect(tripPriceError('abc', 'EGP')).toBe('tripPrice');
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

  it('prices a route with both trips as one shift', () => {
    expect(isShift({ outboundTime: '07:00', returnTime: '16:00' })).toBe(true);
    expect(isShift({ outboundTime: '07:00', returnTime: '' })).toBe(false);
    expect(isShift({ outboundTime: '', returnTime: '16:00' })).toBe(false);
  });

  it('needs an arrival after each departure', () => {
    expect(arrivalError('07:00', '')).toBe('time');
    expect(arrivalError('07:00', '07:00')).toBe('arrival');
    expect(arrivalError('07:00', '09:00')).toBeNull();
    expect(arrivalError('', '')).toBeNull();
  });
});

describe('routeScheduleOverlap', () => {
  const morning: TransportRoute = {
    ...emptyTransportRouteDetails,
    id: 'morning',
    name: 'Morning',
    customerId: 'delta',
    driverId: 'ahmed',
    vehicleId: 'bus-1',
    outboundTime: '07:00',
    outboundArrivalTime: '09:00',
    returnTime: '15:00',
    returnArrivalTime: '17:00',
  };

  it('blocks another active route for the same driver in an overlapping window', () => {
    expect(
      routeScheduleOverlap(
        {
          ...emptyTransportRouteDetails,
          active: true,
          driverId: 'ahmed',
          vehicleId: 'bus-2',
          outboundTime: '08:00',
          outboundArrivalTime: '10:00',
          days: morning.days,
        },
        [morning],
      ),
    ).toBe('driverOverlap');
  });

  it('allows morning and evening for the same driver', () => {
    expect(
      routeScheduleOverlap(
        {
          ...emptyTransportRouteDetails,
          active: true,
          driverId: 'ahmed',
          vehicleId: 'bus-2',
          outboundTime: '18:00',
          outboundArrivalTime: '20:00',
          days: morning.days,
        },
        [morning],
      ),
    ).toBeNull();
  });

  it('blocks the same vehicle on overlapping routes', () => {
    expect(
      routeScheduleOverlap(
        {
          ...emptyTransportRouteDetails,
          active: true,
          driverId: 'karim',
          vehicleId: 'bus-1',
          outboundTime: '08:00',
          outboundArrivalTime: '10:00',
          days: morning.days,
        },
        [morning],
      ),
    ).toBe('vehicleOverlap');
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
  const memberships: RouteOrganization[] = [
    { id: 'org-north', name: 'North', currency: 'EGP' },
  ];

  it('returns null for an organization the user does not belong to', () => {
    expect(memberOrganization(memberships, 'org-north')).toEqual(memberships[0]);
    expect(memberOrganization(memberships, 'org-south')).toBeNull();
  });
});

describe('the same route name for several customers', () => {
  const customers = [
    { id: 'nour', label: 'Nour Company', active: true },
    { id: 'delta', label: 'Delta Factory', active: true },
  ];
  const route = (
    id: string,
    name: string,
    customerId: string,
  ): TransportRoute => ({
    ...emptyTransportRouteDetails,
    id,
    name,
    customerId,
    vehicleId: `vehicle-${id}`,
    driverId: `driver-${id}`,
    startPoint: 'Hegaz Square',
    endPoint: 'Factory gate',
    outboundTime: '07:00',
    outboundArrivalTime: '09:00',
    notes: 'Gate 3',
  });
  const routes = [
    route('1', 'Nasr City', 'nour'),
    route('2', 'Heliopolis', 'delta'),
    route('3', 'Nasr City', 'delta'),
  ];

  it('groups routes by customer, then by name', () => {
    expect(
      sortByCustomerAndName(routes, customers).map((item) => item.id),
    ).toEqual(['2', '3', '1']);
  });

  it('shows one customer routes, or all of them', () => {
    expect(routesOfCustomer(routes, 'delta').map((item) => item.id)).toEqual([
      '2',
      '3',
    ]);
    expect(routesOfCustomer(routes, '')).toHaveLength(3);
  });

  it('finds routes by name, place, company, driver, or vehicle', () => {
    const choices = {
      customers,
      drivers: [{ id: 'driver-2', label: 'Ahmed Ali', active: true }],
      vehicles: [{ id: 'vehicle-3', label: 'ABC 1234', active: true }],
    };
    const ids = (search: string) =>
      searchRoutes(routes, search, choices).map((item) => item.id);

    expect(ids('nasr')).toEqual(['1', '3']);
    expect(ids('factory gate')).toEqual(['1', '2', '3']);
    expect(ids('ahmed')).toEqual(['2']);
    expect(ids('abc')).toEqual(['3']);
    expect(ids('  ')).toHaveLength(3);
    expect(ids('Maadi')).toEqual([]);
  });

  it('copies a route for another customer without its customer, vehicle, driver, or price', () => {
    expect(
      copyForAnotherCustomer({ ...routes[0], tripPrice: '150' }),
    ).toEqual({
      ...emptyTransportRouteDetails,
      name: 'Nasr City',
      startPoint: 'Hegaz Square',
      endPoint: 'Factory gate',
      outboundTime: '07:00',
      outboundArrivalTime: '09:00',
    });
  });
});
