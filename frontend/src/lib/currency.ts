const VND_CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyVnd(value: number) {
  return VND_CURRENCY_FORMATTER.format(Number(value));
}

export function formatEditableMoney(value: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '';
  }

  return amount.toFixed(2).replace(/\.?0+$/, '');
}
