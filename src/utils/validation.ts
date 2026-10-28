import type {
  Booking,
  BookingDraft,
  BookingErrors,
  Field,
  FieldDraft,
  FieldErrors,
} from '../types';
import { formatHour, numericValue, parseDate } from './format';

export function normalizedName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC')
    .toLocaleLowerCase('vi-VN');
}

export function validateField(
  draft: FieldDraft,
  fields: Field[],
  editingId?: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.name.trim()) {
    errors.name = 'Vui lòng nhập tên sân.';
  } else if (
    fields.some(
      field =>
        field.id !== editingId &&
        normalizedName(field.name) === normalizedName(draft.name),
    )
  ) {
    errors.name = 'Tên sân đã tồn tại. Hãy chọn tên khác.';
  }
  const price = numericValue(draft.pricePerHour);
  if (!Number.isFinite(price) || price <= 0) {
    errors.pricePerHour = 'Giá thuê phải là số lớn hơn 0.';
  }
  if (!['5 người', '7 người'].includes(draft.type)) {
    errors.type = 'Vui lòng chọn loại sân hợp lệ.';
  }
  if (!['Hoạt động', 'Bảo trì'].includes(draft.status)) {
    errors.status = 'Vui lòng chọn trạng thái hợp lệ.';
  }
  return errors;
}

// Half-open intervals let a new booking start exactly when another one ends.
export function overlaps(
  start: number,
  hours: number,
  existing: Pick<Booking, 'startHour' | 'hours'>,
): boolean {
  return (
    start < existing.startHour + existing.hours &&
    start + hours > existing.startHour
  );
}

export function validateBooking(
  draft: BookingDraft,
  field: Field,
  bookings: Booking[],
): BookingErrors {
  const errors: BookingErrors = {};
  if (!draft.customerName.trim()) {
    errors.customerName = 'Vui lòng nhập tên khách hàng.';
  }
  if (!/^0\d{9}$/.test(draft.phone.trim())) {
    errors.phone = 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.';
  }
  const date = draft.date.trim();
  if (!parseDate(date)) {
    errors.date = 'Nhập ngày có thật theo định dạng dd/mm/yyyy.';
  }
  const startHour = numericValue(draft.startHour);
  const hours = numericValue(draft.hours);
  if (!Number.isFinite(startHour) || startHour < 6 || startHour > 22) {
    errors.startHour = 'Giờ bắt đầu phải từ 6 đến 22.';
  }
  if (!Number.isFinite(hours) || hours < 1 || hours > 3) {
    errors.hours = 'Thời gian thuê phải từ 1 đến 3 giờ.';
  } else if (!errors.startHour && startHour + hours > 23) {
    errors.hours = 'Giờ kết thúc không được quá 23:00.';
  }
  if (field.status === 'Bảo trì') {
    errors.schedule = 'Sân đang bảo trì, không thể nhận lượt đặt mới.';
  } else if (!errors.date && !errors.startHour && !errors.hours) {
    const conflict = bookings.find(
      booking =>
        booking.fieldId === field.id &&
        booking.date === date &&
        overlaps(startHour, hours, booking),
    );
    if (conflict) {
      errors.schedule = `Trùng lịch ${formatHour(
        conflict.startHour,
      )}–${formatHour(
        conflict.startHour + conflict.hours,
      )}. Hãy chọn khung giờ khác.`;
    }
  }
  return errors;
}
