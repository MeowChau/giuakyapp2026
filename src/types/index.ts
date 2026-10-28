export type FieldType = '5 người' | '7 người';
export type FieldStatus = 'Hoạt động' | 'Bảo trì';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  pricePerHour: number;
  status: FieldStatus;
}

export interface Booking {
  id: string;
  fieldId: string;
  customerName: string;
  phone: string;
  date: string;
  startHour: number;
  hours: number;
}

export interface AppData {
  version: 1;
  fields: Field[];
  bookings: Booking[];
}

export interface FieldDraft {
  name: string;
  type: FieldType;
  pricePerHour: string;
  status: FieldStatus;
}

export interface BookingDraft {
  customerName: string;
  phone: string;
  date: string;
  startHour: string;
  hours: string;
}

export type FieldErrors = Partial<Record<keyof FieldDraft, string>>;
export type BookingErrors = Partial<
  Record<keyof BookingDraft | 'schedule', string>
>;

export type RootStackParamList = {
  FieldList: undefined;
  FieldForm: { fieldId?: string } | undefined;
  FieldDetail: { fieldId: string };
};
