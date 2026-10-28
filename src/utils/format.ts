export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(
    value,
  )} đ`;
}

export function formatHour(hour: number): string {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(
    minutes % 60,
  ).padStart(2, '0')}`;
}

export function formatDate(date: Date = new Date()): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;
}

export function parseDate(value: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 1000 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export function numericValue(value: string): number {
  const text = value.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

export function dateLabel(value: string): string {
  const date = parseDate(value);
  if (!date) {
    return value;
  }
  return `${new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(
    date,
  )}, ${value}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Không thể hoàn tất thao tác. Vui lòng thử lại.';
}

let sequence = 0;
export function createId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(
    36,
  )}-${Math.random().toString(36).slice(2, 8)}`;
}
