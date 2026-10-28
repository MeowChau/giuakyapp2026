import type { AppData, BookingDraft, FieldDraft } from '../types';
import { createId, numericValue } from '../utils/format';
import { validateBooking, validateField } from '../utils/validation';

export function saveField(
  data: AppData,
  draft: FieldDraft,
  id?: string,
): AppData {
  if (id && !data.fields.some(field => field.id === id)) {
    throw new Error('Sân này không còn tồn tại.');
  }
  const errors = validateField(draft, data.fields, id);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }
  const field = {
    id: id ?? createId('field'),
    name: draft.name.trim().replace(/\s+/g, ' '),
    type: draft.type,
    pricePerHour: numericValue(draft.pricePerHour),
    status: draft.status,
  };
  return {
    ...data,
    fields: id
      ? data.fields.map(item => (item.id === id ? field : item))
      : [...data.fields, field],
  };
}

export function deleteField(data: AppData, id: string): AppData {
  if (data.bookings.some(booking => booking.fieldId === id)) {
    throw new Error(
      'Sân đang có lượt đặt. Hãy huỷ các lượt đặt trước khi xoá sân.',
    );
  }
  return { ...data, fields: data.fields.filter(field => field.id !== id) };
}

export function addBooking(
  data: AppData,
  fieldId: string,
  draft: BookingDraft,
): AppData {
  const field = data.fields.find(item => item.id === fieldId);
  if (!field) {
    throw new Error('Sân này không còn tồn tại.');
  }
  const errors = validateBooking(draft, field, data.bookings);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }
  return {
    ...data,
    bookings: [
      ...data.bookings,
      {
        id: createId('booking'),
        fieldId,
        customerName: draft.customerName.trim(),
        phone: draft.phone.trim(),
        date: draft.date.trim(),
        startHour: numericValue(draft.startHour),
        hours: numericValue(draft.hours),
      },
    ],
  };
}

export function cancelBooking(data: AppData, id: string): AppData {
  return {
    ...data,
    bookings: data.bookings.filter(booking => booking.id !== id),
  };
}
