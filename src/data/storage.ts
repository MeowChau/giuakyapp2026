import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import type { AppData, Booking, Field } from '../types';
import { parseDate } from '../utils/format';
import { createSeedData } from './seed';

export const storage = createAsyncStorage('FootballFieldApp');
export const STORAGE_KEY = 'app-data-v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isField(value: unknown): value is Field {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    (value.type === '5 người' || value.type === '7 người') &&
    (value.status === 'Hoạt động' || value.status === 'Bảo trì') &&
    typeof value.pricePerHour === 'number' &&
    Number.isFinite(value.pricePerHour) &&
    value.pricePerHour > 0
  );
}

function isBooking(value: unknown): value is Booking {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fieldId === 'string' &&
    typeof value.customerName === 'string' &&
    value.customerName.trim().length > 0 &&
    typeof value.phone === 'string' &&
    /^0\d{9}$/.test(value.phone) &&
    typeof value.date === 'string' &&
    parseDate(value.date) !== null &&
    typeof value.startHour === 'number' &&
    Number.isFinite(value.startHour) &&
    value.startHour >= 6 &&
    value.startHour <= 22 &&
    typeof value.hours === 'number' &&
    Number.isFinite(value.hours) &&
    value.hours >= 1 &&
    value.hours <= 3 &&
    value.startHour + value.hours <= 23
  );
}

function isAppData(value: unknown): value is AppData {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.fields) ||
    !Array.isArray(value.bookings) ||
    !value.fields.every(isField) ||
    !value.bookings.every(isBooking)
  ) {
    return false;
  }
  const fields: Field[] = value.fields;
  const bookings: Booking[] = value.bookings;
  return (
    new Set(fields.map(field => field.id)).size === fields.length &&
    new Set(bookings.map(booking => booking.id)).size === bookings.length &&
    bookings.every(booking =>
      fields.some(field => field.id === booking.fieldId),
    )
  );
}

export async function persistData(data: AppData): Promise<void> {
  // One snapshot keeps fields and their bookings consistent across restarts.
  await storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function loadData(): Promise<AppData> {
  const saved = await storage.getItem(STORAGE_KEY);
  if (saved === null) {
    const seed = createSeedData();
    await persistData(seed);
    return seed;
  }
  const parsed: unknown = JSON.parse(saved);
  if (!isAppData(parsed)) {
    throw new Error(
      'Dữ liệu trên thiết bị không hợp lệ. Dữ liệu cũ vẫn được giữ nguyên.',
    );
  }
  return parsed;
}
