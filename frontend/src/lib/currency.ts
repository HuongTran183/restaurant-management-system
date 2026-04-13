const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatCurrencyVnd(value: number): string {
  return vndFormatter.format(value);
}

/** Chuỗi số thuần cho ô nhập tiền (không ký tự định dạng). */
export function formatEditableMoney(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }
  return String(Math.round(amount));
}
