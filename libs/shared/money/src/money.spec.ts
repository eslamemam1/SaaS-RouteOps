import {
  amountError,
  formatMoney,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from './money';

describe('toMinorUnits', () => {
  it('stores pounds as piasters', () => {
    expect(toMinorUnits('150', 'EGP')).toBe(15000);
    expect(toMinorUnits('150.5', 'EGP')).toBe(15050);
    expect(toMinorUnits(' 150.05 ', 'EGP')).toBe(15005);
    expect(toMinorUnits('0', 'EGP')).toBe(0);
  });

  it('reads Arabic digits and the Arabic decimal mark', () => {
    expect(toMinorUnits('١٥٠٫٧٥', 'EGP')).toBe(15075);
    expect(toMinorUnits('۲۰', 'SAR')).toBe(2000);
  });

  it('uses three decimals for the Kuwaiti dinar', () => {
    expect(toMinorUnits('1.250', 'KWD')).toBe(1250);
    expect(toMinorUnits('1.2', 'KWD')).toBe(1200);
  });

  it('treats a blank text as no amount', () => {
    expect(toMinorUnits('  ', 'EGP')).toBeNull();
    expect(amountError('', 'EGP')).toBeNull();
  });

  it('refuses text that is not an amount in the currency', () => {
    for (const text of ['abc', '-5', '1,500', '1.234', '1.', '.5', '1234567890']) {
      expect(toMinorUnits(text, 'EGP')).toBeUndefined();
      expect(amountError(text, 'EGP')).toBe('amount');
    }
  });
});

describe('toAmountText', () => {
  it('shows a stored amount with every decimal of its currency', () => {
    expect(toAmountText(15050, 'EGP')).toBe('150.50');
    expect(toAmountText(15000, 'EGP')).toBe('150.00');
    expect(toAmountText(1250, 'KWD')).toBe('1.250');
    expect(toAmountText(null, 'EGP')).toBe('');
  });

  it('reads back what it shows', () => {
    expect(toMinorUnits(toAmountText(123456, 'EGP'), 'EGP')).toBe(123456);
  });
});

describe('formatMoney', () => {
  it('names the currency and keeps Latin digits in both languages', () => {
    expect(formatMoney(1500050, 'EGP', 'en')).toContain('15,000.50');
    expect(formatMoney(1500050, 'EGP', 'ar')).toMatch(/15.000.50/);
    expect(formatMoney(1500050, 'EGP', 'ar')).not.toMatch(/[\u0660-\u0669]/);
  });
});

describe('isCurrency', () => {
  it('knows the supported currencies only', () => {
    expect(isCurrency('EGP')).toBe(true);
    expect(isCurrency('USD')).toBe(false);
  });
});
