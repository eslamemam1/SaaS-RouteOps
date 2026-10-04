import {
  dateError,
  emptyVehicleDetails,
  licenseExpired,
  memberOrganization,
  normalizePlate,
  ofOwnership,
  ownerNameError,
  plateError,
  seatsError,
  sortByPlate,
  Vehicle,
  vehicleTypeError,
  wholeNumber,
  yearError,
} from './vehicle';

describe('ownerNameError', () => {
  it('needs no owner for a company vehicle', () => {
    expect(ownerNameError('', 'owned')).toBeNull();
  });

  it('requires the owner of a rented or contractor vehicle', () => {
    expect(ownerNameError('  ', 'rented')).toBe('ownerName');
    expect(ownerNameError('', 'contractor')).toBe('ownerName');
    expect(ownerNameError('مكتب النور', 'rented')).toBeNull();
  });

  it('rejects an owner name longer than 200 characters', () => {
    expect(ownerNameError('م'.repeat(201), 'contractor')).toBe('tooLong');
  });
});

describe('ofOwnership', () => {
  const vehicles: Vehicle[] = [
    { ...emptyVehicleDetails, id: 'a', plateNumber: 'A', type: 'bus' },
    {
      ...emptyVehicleDetails,
      id: 'b',
      plateNumber: 'B',
      type: 'bus',
      ownership: 'rented',
      ownerName: 'مكتب النور',
    },
  ];

  it('keeps every vehicle when no ownership is chosen', () => {
    expect(ofOwnership(vehicles, '')).toHaveLength(2);
  });

  it('keeps only vehicles of the chosen ownership', () => {
    expect(ofOwnership(vehicles, 'rented').map((vehicle) => vehicle.id)).toEqual(['b']);
  });
});

describe('plateError', () => {
  it('requires a plate number', () => {
    expect(plateError('   ')).toBe('plate');
  });

  it('rejects a plate longer than 20 characters', () => {
    expect(plateError('1'.repeat(21))).toBe('tooLong');
  });

  it('counts the plate after collapsing extra spaces', () => {
    expect(normalizePlate('  أ  ب ج   1234 ')).toBe('أ ب ج 1234');
    expect(plateError(`  ${'1'.repeat(20)}  `)).toBeNull();
  });
});

describe('vehicleTypeError', () => {
  it('requires one of the known types', () => {
    expect(vehicleTypeError('')).toBe('type');
    expect(vehicleTypeError('truck')).toBe('type');
    expect(vehicleTypeError('microbus')).toBeNull();
  });
});

describe('wholeNumber', () => {
  it('reads Western and Arabic-Indic digits', () => {
    expect(wholeNumber(' 2020 ')).toBe(2020);
    expect(wholeNumber('٢٠٢٠')).toBe(2020);
  });

  it('returns null for anything that is not a whole number', () => {
    expect(wholeNumber('')).toBeNull();
    expect(wholeNumber('14.5')).toBeNull();
    expect(wholeNumber('-3')).toBeNull();
  });
});

describe('yearError', () => {
  it('allows an empty year because it is optional', () => {
    expect(yearError('', 2026)).toBeNull();
  });

  it('accepts years from 1950 up to next year', () => {
    expect(yearError('1950', 2026)).toBeNull();
    expect(yearError('2027', 2026)).toBeNull();
  });

  it('rejects years outside the range or not a number', () => {
    expect(yearError('1949', 2026)).toBe('year');
    expect(yearError('2028', 2026)).toBe('year');
    expect(yearError('new', 2026)).toBe('year');
  });
});

describe('seatsError', () => {
  it('allows empty seats because they are optional', () => {
    expect(seatsError('')).toBeNull();
  });

  it('accepts 1 to 100 seats', () => {
    expect(seatsError('14')).toBeNull();
    expect(seatsError('١٤')).toBeNull();
  });

  it('rejects zero, more than 100, or a fraction', () => {
    expect(seatsError('0')).toBe('seats');
    expect(seatsError('101')).toBe('seats');
    expect(seatsError('14.5')).toBe('seats');
  });
});

describe('dateError', () => {
  it('allows an empty date and accepts a real date', () => {
    expect(dateError('')).toBeNull();
    expect(dateError('2027-02-28')).toBeNull();
  });

  it('rejects a date that does not exist', () => {
    expect(dateError('2027-02-30')).toBe('date');
    expect(dateError('28/02/2027')).toBe('date');
  });
});

describe('licenseExpired', () => {
  it('is expired only after the expiry date', () => {
    expect(licenseExpired('2026-10-03', '2026-10-04')).toBe(true);
    expect(licenseExpired('2026-10-04', '2026-10-04')).toBe(false);
    expect(licenseExpired('', '2026-10-04')).toBe(false);
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

describe('sortByPlate', () => {
  it('orders vehicles by plate number', () => {
    const vehicle = (id: string, plateNumber: string): Vehicle => ({
      ...emptyVehicleDetails,
      id,
      plateNumber,
      type: 'bus',
    });

    expect(
      sortByPlate([vehicle('2', 'B 200'), vehicle('1', 'A 100')]).map(
        (item) => item.plateNumber,
      ),
    ).toEqual(['A 100', 'B 200']);
  });
});
