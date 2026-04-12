/**
 * Format a number as Vietnamese Dong (VND) currency
 * Example: 1000000 => "1.000.000 ₫"
 */
export function formatCurrencyVnd(value: number): string {
  if (!value || isNaN(value)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as money for editable fields (without currency symbol)
 * Example: 1000000 => "1.000.000"
 */
export function formatEditableMoney(value: number): string {
  if (!value || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
