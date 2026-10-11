import {
  DriverPayRow,
  remainingPay,
  remainingRent,
  suggestedPay,
  toDriverPay,
  toVehiclePay,
  VehiclePayRow,
} from './pay';

const driverRow: DriverPayRow = {
  driver_id: 'ahmed',
  pay_type: 'salary',
  monthly_salary: 600000,
  salary_trips: 22,
  outbound_pay: 10000,
  return_pay: 8000,
  done_outbound: 24,
  done_return: 20,
  absent_outbound: 0,
  absent_return: 2,
  recorded: 0,
};

const vehicleRow: VehiclePayRow = {
  vehicle_id: 'van-2',
  ownership: 'contractor',
  rent_type: 'per_trip',
  monthly_rent: null,
  outbound_rent: 15000,
  return_rent: 12000,
  done_outbound: 10,
  done_return: 8,
  recorded: 0,
};

describe('toDriverPay', () => {
  it('reads a database row as the driver pay terms and trips', () => {
    expect(toDriverPay(driverRow)).toEqual({
      driverId: 'ahmed',
      payType: 'salary',
      monthlySalary: 600000,
      salaryTrips: 22,
      tripPay: { outbound: 10000, return: 8000 },
      done: { outbound: 24, return: 20 },
      absent: { outbound: 0, return: 2 },
      recorded: 0,
    });
    expect(toDriverPay({ ...driverRow, pay_type: 'per_trip' })?.payType).toBe(
      'perTrip',
    );
  });

  it('refuses a pay type the app does not know', () => {
    expect(toDriverPay({ ...driverRow, pay_type: 'none' })).toBeNull();
    expect(toDriverPay({ ...driverRow, pay_type: 'weekly' })).toBeNull();
  });
});

describe('remainingPay', () => {
  it('suggests the salary with extra trips added and absences taken off', () => {
    const pay = toDriverPay(driverRow)!;

    expect(suggestedPay(pay)).toBe(600000 + 2 * 10000 - 2 * 8000);
  });

  it('leaves what is still due after a part was recorded, and never below zero', () => {
    const pay = toDriverPay(driverRow)!;

    expect(remainingPay({ ...pay, recorded: 300000 })).toBe(304000);
    expect(remainingPay({ ...pay, recorded: 900000 })).toBe(0);
  });
});

describe('remainingRent', () => {
  it('prices each done trip of a contractor vehicle by its direction', () => {
    const rent = toVehiclePay(vehicleRow)!;

    expect(rent.contractor).toBe(true);
    expect(remainingRent(rent)).toBe(10 * 15000 + 8 * 12000);
    expect(remainingRent({ ...rent, recorded: 100000 })).toBe(146000);
  });

  it('owes a monthly rent even without trips', () => {
    const rent = toVehiclePay({
      ...vehicleRow,
      ownership: 'rented',
      rent_type: 'monthly',
      monthly_rent: 400000,
      done_outbound: 0,
      done_return: 0,
    })!;

    expect(rent.contractor).toBe(false);
    expect(remainingRent(rent)).toBe(400000);
  });

  it('refuses a rent type the app does not know', () => {
    expect(toVehiclePay({ ...vehicleRow, rent_type: 'none' })).toBeNull();
  });
});
