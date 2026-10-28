import type { AppData, Field } from '../types';
import { createId, formatDate } from '../utils/format';

export function createSeedData(today = new Date()): AppData {
  const fields: Field[] = [
    {
      id: createId('field'),
      name: 'Sân A1',
      type: '5 người',
      pricePerHour: 300000,
      status: 'Hoạt động',
    },
    {
      id: createId('field'),
      name: 'Sân A2',
      type: '5 người',
      pricePerHour: 350000,
      status: 'Hoạt động',
    },
    {
      id: createId('field'),
      name: 'Sân B1',
      type: '7 người',
      pricePerHour: 450000,
      status: 'Hoạt động',
    },
    {
      id: createId('field'),
      name: 'Sân B2',
      type: '7 người',
      pricePerHour: 400000,
      status: 'Bảo trì',
    },
  ];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    version: 1,
    fields,
    bookings: [
      {
        id: createId('booking'),
        fieldId: fields[0].id,
        customerName: 'Nguyễn Minh Tuấn',
        phone: '0901234567',
        date: formatDate(today),
        startHour: 17,
        hours: 2,
      },
      {
        id: createId('booking'),
        fieldId: fields[1].id,
        customerName: 'Trần Hoàng Nam',
        phone: '0912345678',
        date: formatDate(today),
        startHour: 18,
        hours: 1,
      },
      {
        id: createId('booking'),
        fieldId: fields[2].id,
        customerName: 'Lê Anh Khoa',
        phone: '0987654321',
        date: formatDate(tomorrow),
        startHour: 19,
        hours: 2,
      },
    ],
  };
}
