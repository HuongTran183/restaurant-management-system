import { formatCurrencyVnd, formatEditableMoney } from './currency';

describe('currency helpers', () => {
  it('formats display amounts in VND', () => {
    expect(formatCurrencyVnd(125000)).toBe('125.000 ₫');
    expect(formatCurrencyVnd(12.5)).toBe('12,5 ₫');
  });

  it('keeps editable amounts compact without losing decimals', () => {
    expect(formatEditableMoney(20)).toBe('20');
    expect(formatEditableMoney(18.5)).toBe('18.5');
    expect(formatEditableMoney(18.75)).toBe('18.75');
  });
});
