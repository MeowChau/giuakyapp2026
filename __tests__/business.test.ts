import {
  addBooking,
  cancelBooking,
  deleteField,
  saveField,
} from '../src/data/operations';
import { createSeedData } from '../src/data/seed';
import type { BookingDraft, FieldDraft } from '../src/types';
import { formatHour, formatMoney, parseDate } from '../src/utils/format';
import { validateBooking, validateField } from '../src/utils/validation';

function fixture() {
  return createSeedData(new Date(2026, 9, 28));
}
const validBooking: BookingDraft = {
  customerName: 'Phạm Văn An',
  phone: '0909876543',
  date: '28/10/2026',
  startHour: '19',
  hours: '1',
};
const validField: FieldDraft = {
  name: 'Sân C1',
  type: '5 người',
  pricePerHour: '300000',
  status: 'Hoạt động',
};

describe('field management', () => {
  test('seeds four fields, three linked bookings, and unique generated IDs', () => {
    const data = fixture();
    expect(data.fields).toHaveLength(4);
    expect(data.bookings).toHaveLength(3);
    expect(
      data.fields.filter(field => field.status === 'Hoạt động'),
    ).toHaveLength(3);
    const ids = [...data.fields, ...data.bookings].map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      data.bookings.every(booking =>
        data.fields.some(field => field.id === booking.fieldId),
      ),
    ).toBe(true);
  });

  test.each(['', '   '])('rejects empty name %p', name => {
    expect(
      validateField({ ...validField, name }, fixture().fields).name,
    ).toBeDefined();
  });

  test.each(['sân a1', '  SÂN   A1  ', 'Sa\u0302n A1'])(
    'detects normalized duplicate name %p',
    name => {
      expect(
        validateField({ ...validField, name }, fixture().fields).name,
      ).toBeDefined();
    },
  );

  test('editing keeps its own name but cannot take another field name', () => {
    const data = fixture();
    expect(
      validateField(
        { ...validField, name: 'Sân A1' },
        data.fields,
        data.fields[0].id,
      ),
    ).toEqual({});
    expect(
      validateField(
        { ...validField, name: 'Sân A2' },
        data.fields,
        data.fields[0].id,
      ).name,
    ).toBeDefined();
  });

  test.each(['', '0', '-1', 'abc', 'Infinity', '1e9'])(
    'rejects invalid price %p',
    pricePerHour => {
      expect(
        validateField({ ...validField, pricePerHour }, []).pricePerHour,
      ).toBeDefined();
    },
  );

  test('adding and editing leave the original data unchanged', () => {
    const data = fixture();
    const added = saveField(data, validField);
    const created = added.fields[4];
    const updated = saveField(
      added,
      { ...validField, name: 'Sân C2', status: 'Bảo trì' },
      created.id,
    );
    expect(data.fields).toHaveLength(4);
    expect(updated.fields).toHaveLength(5);
    expect(updated.fields[4]).toMatchObject({
      id: created.id,
      name: 'Sân C2',
      pricePerHour: 300000,
      status: 'Bảo trì',
    });
  });

  test('blocks deleting a field with bookings, then allows it after cancellation', () => {
    const data = fixture();
    const fieldId = data.fields[0].id;
    expect(() => deleteField(data, fieldId)).toThrow('Sân đang có lượt đặt');
    const cancelled = cancelBooking(data, data.bookings[0].id);
    expect(
      deleteField(cancelled, fieldId).fields.some(
        field => field.id === fieldId,
      ),
    ).toBe(false);
    expect(data.bookings).toHaveLength(3);
  });
});

describe('booking validation', () => {
  test.each(['16', '17', '18'])(
    'rejects a two-hour booking at %s intersecting 17–19',
    startHour => {
      const data = fixture();
      expect(
        validateBooking(
          { ...validBooking, startHour, hours: '2' },
          data.fields[0],
          data.bookings,
        ).schedule,
      ).toContain('Trùng lịch');
    },
  );

  test.each([
    ['15', '2'],
    ['19', '1'],
  ])('accepts adjacent slot %s + %s hours', (startHour, hours) => {
    const data = fixture();
    expect(
      validateBooking(
        { ...validBooking, startHour, hours },
        data.fields[0],
        data.bookings,
      ),
    ).toEqual({});
  });

  test('same time is allowed on a different field or date', () => {
    const data = fixture();
    expect(
      validateBooking(
        { ...validBooking, startHour: '17', hours: '2' },
        data.fields[2],
        data.bookings,
      ),
    ).toEqual({});
    expect(
      validateBooking(
        { ...validBooking, date: '29/10/2026', startHour: '17' },
        data.fields[0],
        data.bookings,
      ),
    ).toEqual({});
  });

  test.each([
    '9012345678',
    '090123456',
    '09012345678',
    '09abcdefgh',
    '+84901234567',
  ])('rejects invalid phone %p', phone => {
    const data = fixture();
    expect(
      validateBooking({ ...validBooking, phone }, data.fields[0], data.bookings)
        .phone,
    ).toBeDefined();
  });

  test.each([
    '31/02/2026',
    '29/02/2026',
    '1/1/2026',
    '2026-10-28',
    '00/10/2026',
    '28/13/2026',
  ])('rejects invalid date %p', date => {
    expect(parseDate(date)).toBeNull();
  });

  test('accepts a real leap day', () => {
    expect(parseDate('29/02/2028')).not.toBeNull();
  });

  test.each([
    ['5', '1', 'startHour'],
    ['23', '1', 'startHour'],
    ['22', '2', 'hours'],
    ['20', '4', 'hours'],
    ['20', '0', 'hours'],
    ['', '1', 'startHour'],
  ])('rejects time %s + %s', (startHour, hours, errorKey) => {
    const data = fixture();
    const errors = validateBooking(
      { ...validBooking, startHour, hours },
      data.fields[0],
      [],
    );
    expect(errors[errorKey as 'startHour' | 'hours']).toBeDefined();
  });

  test('accepts the boundary 22–23 and rejects a missing customer', () => {
    const data = fixture();
    expect(
      validateBooking({ ...validBooking, startHour: '22' }, data.fields[0], []),
    ).toEqual({});
    expect(
      validateBooking(
        { ...validBooking, customerName: '   ' },
        data.fields[0],
        [],
      ).customerName,
    ).toBeDefined();
  });

  test('blocks bookings on maintenance fields and missing fields', () => {
    const data = fixture();
    expect(() => addBooking(data, data.fields[3].id, validBooking)).toThrow(
      'bảo trì',
    );
    expect(() => addBooking(data, 'missing', validBooking)).toThrow(
      'không còn tồn tại',
    );
  });

  test('rechecks conflict at commit and releases the slot after cancellation', () => {
    const data = fixture();
    const booked = addBooking(data, data.fields[0].id, validBooking);
    expect(() => addBooking(booked, data.fields[0].id, validBooking)).toThrow(
      'Trùng lịch',
    );
    const cancelled = cancelBooking(booked, booked.bookings[3].id);
    expect(
      addBooking(cancelled, data.fields[0].id, validBooking).bookings,
    ).toHaveLength(4);
  });

  test('formats money and end time for the receipt', () => {
    expect(formatMoney(300000 * 2)).toBe('600.000 đ');
    expect(formatHour(17 + 2)).toBe('19:00');
    expect(formatHour(17.5)).toBe('17:30');
  });
});
