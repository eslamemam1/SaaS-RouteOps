// Amounts are whole numbers of the currency's smallest unit, such as piasters
// for the Egyptian pound, so that adding them up never loses a fraction.
// Each organization works in one currency, chosen when it is created.

export const currencies = [
  'EGP',
  'SAR',
  'AED',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'JOD',
] as const;

export type Currency = (typeof currencies)[number];

export const defaultCurrency: Currency = 'EGP';

// How many smallest units make one whole unit, as a power of ten.
export const currencyDecimals: Readonly<Record<Currency, number>> = {
  EGP: 2,
  SAR: 2,
  AED: 2,
  QAR: 2,
  KWD: 3,
  BHD: 3,
  OMR: 3,
  JOD: 3,
};

export const maxWholeDigits = 9;

export type AmountProblem = 'amount';

export function isCurrency(value: string): value is Currency {
  return (currencies as readonly string[]).includes(value);
}

// Accepts Arabic and Latin digits, with "." or "٫" before the fraction.
// Returns null for a blank text, and undefined for a text that is not an
// amount in this currency, including one with more decimals than it has.
export function toMinorUnits(
  text: string,
  currency: Currency,
): number | null | undefined {
  const normalized = normalizeDigits(text.trim());
  if (normalized.length === 0) {
    return null;
  }
  const decimals = currencyDecimals[currency];
  const pattern = new RegExp(
    `^(\\d{1,${maxWholeDigits}})(?:\\.(\\d{1,${decimals}}))?$`,
  );
  const match = pattern.exec(normalized);
  if (!match) {
    return undefined;
  }
  const fraction = (match[2] ?? '').padEnd(decimals, '0');
  return Number(match[1]) * 10 ** decimals + Number(fraction);
}

export function amountError(
  text: string,
  currency: Currency,
): AmountProblem | null {
  return toMinorUnits(text, currency) === undefined ? 'amount' : null;
}

// The text a form shows for a stored amount, such as "150.50".
export function toAmountText(minor: number | null, currency: Currency): string {
  if (minor === null) {
    return '';
  }
  const decimals = currencyDecimals[currency];
  const whole = Math.trunc(minor / 10 ** decimals);
  const fraction = String(minor % 10 ** decimals).padStart(decimals, '0');
  return decimals === 0 ? String(whole) : `${whole}.${fraction}`;
}

// Latin digits in both languages, as the rest of the interface uses.
export function formatMoney(
  minor: number,
  currency: Currency,
  language: 'ar' | 'en',
): string {
  const decimals = currencyDecimals[currency];
  return new Intl.NumberFormat(
    language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    },
  ).format(minor / 10 ** decimals);
}

function normalizeDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    )
    .replace(/[\u06f0-\u06f9]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x06f0),
    )
    .replace(/\u066b/g, '.');
}
