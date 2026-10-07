import {
  dateError,
  Driver,
  driverNameError,
  DriverOrganization,
  emptyDriverDetails,
  licenseExpired,
  memberOrganization,
  nationalIdError,
  normalizeNationalId,
  optionalTextError,
  salaryError,
  salaryTripsError,
  toTripCount,
  tripAmountError,
  sortByName,
} from './driver';

describe('driverNameError', () => {
  it('requires a name', () => {
    expect(driverNameError('   ')).toBe('name');
  });

  it('rejects a name longer than 200 characters', () => {
    expect(driverNameError('a'.repeat(201))).toBe('tooLong');
  });

  it('accepts a name with surrounding spaces', () => {
    expect(driverNameError('  أحمد محمد  ')).toBeNull();
  });
});

describe('nationalIdError', () => {
  it('allows an empty national ID because it is optional', () => {
    expect(nationalIdError('')).toBeNull();
  });

  it('reads Arabic-Indic digits and ignores spaces', () => {
    expect(normalizeNationalId('٢٩٠ ٠١٠١ ١٢٣٤٥٦٧')).toBe('29001011234567');
    expect(nationalIdError('٢٩٠ ٠١٠١ ١٢٣٤٥٦٧')).toBeNull();
  });

  it('rejects symbols and text over 30 characters', () => {
    expect(nationalIdError('2900-101')).toBe('nationalId');
    expect(nationalIdError('1'.repeat(31))).toBe('tooLong');
  });
});

describe('optionalTextError', () => {
  it('rejects text over the limit after trimming', () => {
    expect(optionalTextError('a'.repeat(51), 50)).toBe('tooLong');
    expect(optionalTextError(` ${'a'.repeat(50)} `, 50)).toBeNull();
  });
});

describe('dateError', () => {
  it('allows an empty date and accepts a real date', () => {
    expect(dateError('')).toBeNull();
    expect(dateError('2028-02-29')).toBeNull();
  });

  it('rejects a date that does not exist', () => {
    expect(dateError('2027-02-29')).toBe('date');
  });
});

describe('licenseExpired', () => {
  it('is expired only after the expiry date', () => {
    expect(licenseExpired('2026-10-03', '2026-10-04')).toBe(true);
    expect(licenseExpired('2026-10-04', '2026-10-04')).toBe(false);
    expect(licenseExpired('', '2026-10-04')).toBe(false);
  });
});

describe('pay terms', () => {
  it('reads a trip count with Arabic or Latin digits', () => {
    expect(toTripCount('26')).toBe(26);
    expect(toTripCount('٢٦')).toBe(26);
    expect(toTripCount('')).toBeNull();
    expect(toTripCount('0')).toBeUndefined();
    expect(toTripCount('2.5')).toBeUndefined();
  });

  it('needs a salary only for a salaried driver', () => {
    expect(salaryError('', 'salary', 'EGP')).toBe('required');
    expect(salaryError('3000', 'salary', 'EGP')).toBeNull();
    expect(salaryError('', 'perTrip', 'EGP')).toBeNull();
  });

  it('needs the trip count once trip amounts are typed for a salary', () => {
    expect(salaryTripsError('', 'salary', '', '')).toBeNull();
    expect(salaryTripsError('', 'salary', '50', '')).toBe('required');
    expect(salaryTripsError('abc', 'salary', '', '')).toBe('trips');
    expect(salaryTripsError('', 'perTrip', '50', '50')).toBeNull();
  });

  it('needs trip amounts for a driver paid per trip and for a salary covering trips', () => {
    expect(tripAmountError('', 'perTrip', '', 'EGP')).toBe('required');
    expect(tripAmountError('', 'salary', '', 'EGP')).toBeNull();
    expect(tripAmountError('', 'salary', '26', 'EGP')).toBe('required');
    expect(tripAmountError('50.123', 'salary', '26', 'EGP')).toBe('amount');
    expect(tripAmountError('', 'none', '26', 'EGP')).toBeNull();
  });
});

describe('memberOrganization', () => {
  const memberships: DriverOrganization[] = [
    { id: 'org-north', name: 'North', currency: 'EGP' },
  ];

  it('returns the organization when it is one of the memberships', () => {
    expect(memberOrganization(memberships, 'org-north')).toEqual(memberships[0]);
  });

  it('returns null for an organization the user does not belong to', () => {
    expect(memberOrganization(memberships, 'org-south')).toBeNull();
  });
});

describe('sortByName', () => {
  it('orders drivers by name', () => {
    const driver = (id: string, fullName: string): Driver => ({
      ...emptyDriverDetails,
      id,
      fullName,
    });

    expect(
      sortByName([driver('2', 'Zaki'), driver('1', 'Adel')]).map(
        (item) => item.fullName,
      ),
    ).toEqual(['Adel', 'Zaki']);
  });
});
