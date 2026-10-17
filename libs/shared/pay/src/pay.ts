// What a driver or a vehicle's owner is owed for a month, from the rows
// driver_pay and vehicle_pay return. The expenses screen suggests these
// amounts, and the dashboard and reports warn about the ones still due, so all
// three use the same rule. Amounts are in the smallest currency unit.

// How a driver is paid: 'salary' for an employee with a monthly salary, or
// 'perTrip' for a driver paid for each trip.
export const payTypes = ['salary', 'perTrip'] as const;

export type PayType = (typeof payTypes)[number];

export const tripDirections = ['outbound', 'return'] as const;

export type TripDirection = (typeof tripDirections)[number];

export type PerDirection = Readonly<Record<TripDirection, number>>;

// A driver's pay terms for a month, the trips of the month, and the salary
// already recorded for them as expenses. done counts the trips the driver did,
// and extraTrips those of them a member added to a day by hand; absent counts
// trips planned for the driver that were cancelled or given to another driver
// because the driver was absent. A salary covers salaryTrips outbound and as
// many return trips. Without salaryTrips it is fixed, plus each extra trip at
// its direction's amount when the terms have trip amounts.
export interface DriverPay {
  readonly driverId: string;
  readonly payType: PayType;
  readonly monthlySalary: number | null;
  readonly salaryTrips: number | null;
  readonly tripPay: PerDirection | null;
  readonly done: PerDirection;
  readonly extraTrips: PerDirection;
  readonly absent: PerDirection;
  readonly recorded: number;
}

// How a suggested pay adds up. extra are the trips paid on top of the salary,
// or every trip of a driver paid per trip; missed are the trips taken off.
export interface PayBreakdown {
  readonly salary: number;
  readonly extra: PerDirection;
  readonly extraAmount: number;
  readonly missed: PerDirection;
  readonly deduction: number;
  readonly total: number;
}

// How the owner of a rented or contractor vehicle is paid: a fixed monthly
// rent, or an amount for each done outbound and return trip of the vehicle.
export const rentTypes = ['monthly', 'perTrip'] as const;

export type RentType = (typeof rentTypes)[number];

// A vehicle's rent terms for a month, its done trips, and the rent or
// contractor pay already recorded for it as expenses.
export interface VehiclePay {
  readonly vehicleId: string;
  readonly contractor: boolean;
  readonly rentType: RentType;
  readonly monthlyRent: number | null;
  readonly tripRent: PerDirection | null;
  readonly done: PerDirection;
  readonly recorded: number;
}

// A row of driver_pay. bigint columns arrive as numbers.
export interface DriverPayRow {
  readonly driver_id: string;
  readonly pay_type: string;
  readonly monthly_salary: number | null;
  readonly salary_trips: number | null;
  readonly outbound_pay: number | null;
  readonly return_pay: number | null;
  readonly done_outbound: number;
  readonly done_return: number;
  readonly absent_outbound: number;
  readonly absent_return: number;
  readonly recorded: number;
  readonly extra_outbound: number;
  readonly extra_return: number;
}

// A row of vehicle_pay.
export interface VehiclePayRow {
  readonly vehicle_id: string;
  readonly ownership: string;
  readonly rent_type: string;
  readonly monthly_rent: number | null;
  readonly outbound_rent: number | null;
  readonly return_rent: number | null;
  readonly done_outbound: number;
  readonly done_return: number;
  readonly recorded: number;
}

// null for a pay type this app does not know.
export function toDriverPay(row: DriverPayRow): DriverPay | null {
  const payType = columnTypes[row.pay_type];
  if (payType !== 'salary' && payType !== 'perTrip') {
    return null;
  }
  return {
    driverId: row.driver_id,
    payType,
    monthlySalary:
      row.monthly_salary === null ? null : Number(row.monthly_salary),
    salaryTrips: row.salary_trips,
    tripPay: amounts(row.outbound_pay, row.return_pay),
    done: { outbound: row.done_outbound, return: row.done_return },
    extraTrips: { outbound: row.extra_outbound, return: row.extra_return },
    absent: { outbound: row.absent_outbound, return: row.absent_return },
    recorded: Number(row.recorded),
  };
}

// null for a rent type this app does not know.
export function toVehiclePay(row: VehiclePayRow): VehiclePay | null {
  const rentType = columnTypes[row.rent_type];
  if (rentType !== 'monthly' && rentType !== 'perTrip') {
    return null;
  }
  return {
    vehicleId: row.vehicle_id,
    contractor: row.ownership === 'contractor',
    rentType,
    monthlyRent: row.monthly_rent === null ? null : Number(row.monthly_rent),
    tripRent: amounts(row.outbound_rent, row.return_rent),
    done: { outbound: row.done_outbound, return: row.done_return },
    recorded: Number(row.recorded),
  };
}

const columnTypes: Readonly<Record<string, PayType | RentType>> = {
  salary: 'salary',
  monthly: 'monthly',
  per_trip: 'perTrip',
};

function amounts(
  outbound: number | null,
  back: number | null,
): PerDirection | null {
  return outbound === null || back === null
    ? null
    : { outbound: Number(outbound), return: Number(back) };
}

// Beyond the trips the salary covers, each done trip earns its direction's
// amount. Below them, only trips missed through absence are taken off, so a
// holiday or a breakdown costs the driver nothing, and absences first use up
// any trips beyond the salary. A salary that covers no set number of trips is
// fixed, and each extra trip earns its direction's amount on top when the
// terms have trip amounts; absences take nothing off it.
export function payBreakdown(pay: DriverPay): PayBreakdown {
  const salary = pay.monthlySalary ?? 0;
  const rates = pay.tripPay ?? { outbound: 0, return: 0 };
  const covered = pay.payType === 'salary' ? pay.salaryTrips : 0;
  if (covered === null) {
    const extra = pay.tripPay ? pay.extraTrips : noTrips;
    const extraAmount = priced(extra, rates);
    return {
      salary,
      extra,
      extraAmount,
      missed: noTrips,
      deduction: 0,
      total: salary + extraAmount,
    };
  }
  const extra = perDirection((direction) =>
    Math.max(0, pay.done[direction] - covered),
  );
  const missed = perDirection((direction) =>
    Math.min(Math.max(0, covered - pay.done[direction]), pay.absent[direction]),
  );
  const extraAmount = priced(extra, rates);
  const deduction = priced(missed, rates);
  return {
    salary,
    extra,
    extraAmount,
    missed,
    deduction,
    total: Math.max(0, salary + extraAmount - deduction),
  };
}

export function suggestedPay(pay: DriverPay): number {
  return payBreakdown(pay).total;
}

export function remainingPay(pay: DriverPay): number {
  return Math.max(0, suggestedPay(pay) - pay.recorded);
}

export function suggestedRent(rent: VehiclePay): number {
  if (rent.rentType === 'monthly') {
    return rent.monthlyRent ?? 0;
  }
  return rent.tripRent ? priced(rent.done, rent.tripRent) : 0;
}

export function remainingRent(rent: VehiclePay): number {
  return Math.max(0, suggestedRent(rent) - rent.recorded);
}

const noTrips: PerDirection = { outbound: 0, return: 0 };

function perDirection(
  count: (direction: TripDirection) => number,
): PerDirection {
  return { outbound: count('outbound'), return: count('return') };
}

function priced(trips: PerDirection, rates: PerDirection): number {
  return trips.outbound * rates.outbound + trips.return * rates.return;
}
