import {
  conflictingTrips,
  LoggedTrip,
  NotificationFacts,
  notifications,
} from './notification';

const trip: LoggedTrip = {
  id: 'trip-1',
  serviceDate: '2026-10-11',
  departureTime: '07:00',
  vehicleId: 'vehicle-1',
  driverId: 'driver-1',
  status: 'done',
  price: 5000,
};

const nothing: NotificationFacts = {
  trips: [],
  unopenedDays: [],
  unrecordedDriverPay: 0,
  unrecordedVehiclePay: 0,
  drivers: [],
  vehicles: [],
};

describe('notifications', () => {
  it('has none when everything is recorded', () => {
    expect(
      notifications({ ...nothing, trips: [trip] }, '2026-10-11', '12:00'),
    ).toEqual([]);
  });

  it('announces licenses that expired or expire within 30 days, the expired first', () => {
    const found = notifications(
      {
        ...nothing,
        drivers: [
          { id: 'driver-1', name: 'أحمد', licenseExpiry: '2026-11-10' },
          { id: 'driver-2', name: 'كريم', licenseExpiry: '2026-11-11' },
        ],
        vehicles: [
          { id: 'vehicle-1', name: 'ABC 123', licenseExpiry: '2026-10-01' },
        ],
      },
      '2026-10-11',
      '12:00',
    );

    expect(found.map((item) => [item.kind, item.name, item.urgent])).toEqual([
      ['vehicleLicenseExpired', 'ABC 123', true],
      ['driverLicenseSoon', 'أحمد', false],
    ]);
    expect(found[0].link).toEqual({
      section: 'vehicles',
      id: 'vehicle-1',
      query: {},
    });
  });

  it('counts past days nobody opened and links to the first', () => {
    const [found] = notifications(
      { ...nothing, unopenedDays: ['2026-10-11', '2026-10-05', '2026-10-02'] },
      '2026-10-11',
      '12:00',
    );

    expect(found.kind).toBe('unopenedDays');
    expect(found.count).toBe(2);
    expect(found.link.query).toEqual({ date: '2026-10-02' });
  });

  it("counts unrecorded trips of past days and today's trips whose time has come", () => {
    const [found] = notifications(
      {
        ...nothing,
        trips: [
          { ...trip, id: 'a', serviceDate: '2026-10-08', status: 'unrecorded' },
          {
            ...trip,
            id: 'b',
            departureTime: '07:00',
            status: 'unrecorded',
            vehicleId: '',
          },
          {
            ...trip,
            id: 'c',
            departureTime: '16:00',
            status: 'unrecorded',
            vehicleId: '',
          },
        ],
      },
      '2026-10-11',
      '12:00',
    );

    expect(found.kind).toBe('unrecordedTrips');
    expect(found.count).toBe(2);
    expect(found.link).toEqual({
      section: 'operations',
      id: '',
      query: { date: '2026-10-08' },
    });
  });

  it("links last month's unrecorded pay to that month's expenses", () => {
    const found = notifications(
      { ...nothing, unrecordedDriverPay: 2, unrecordedVehiclePay: 1 },
      '2026-01-11',
      '12:00',
    );

    expect(
      found.map((item) => [item.kind, item.count, item.link.query]),
    ).toEqual([
      ['driverPay', 2, { month: '2025-12' }],
      ['vehiclePay', 1, { month: '2025-12' }],
    ]);
  });

  it('counts done trips with no price', () => {
    const [found] = notifications(
      {
        ...nothing,
        trips: [
          { ...trip, price: null, vehicleId: '' },
          {
            ...trip,
            id: 'trip-2',
            price: null,
            status: 'cancelled',
            vehicleId: '',
          },
        ],
      },
      '2026-10-11',
      '12:00',
    );

    expect([found.kind, found.count]).toEqual(['unpriced', 1]);
  });
});

describe('conflictingTrips', () => {
  it('counts trips of the same vehicle or driver less than an hour apart', () => {
    expect(
      conflictingTrips([
        trip,
        { ...trip, id: 'trip-2', departureTime: '07:45', driverId: 'driver-2' },
        {
          ...trip,
          id: 'trip-3',
          departureTime: '08:00',
          vehicleId: 'vehicle-3',
          driverId: 'driver-3',
        },
        { ...trip, id: 'trip-4', departureTime: '09:00' },
      ]),
    ).toBe(2);
  });

  it('leaves cancelled trips and trips without a vehicle out', () => {
    expect(
      conflictingTrips([
        { ...trip, driverId: 'driver-1' },
        { ...trip, id: 'trip-2', departureTime: '07:30', status: 'cancelled' },
        {
          ...trip,
          id: 'trip-3',
          departureTime: '07:30',
          vehicleId: '',
          driverId: 'driver-3',
        },
        {
          ...trip,
          id: 'trip-4',
          departureTime: '07:40',
          vehicleId: '',
          driverId: 'driver-4',
        },
      ]),
    ).toBe(0);
  });
});
