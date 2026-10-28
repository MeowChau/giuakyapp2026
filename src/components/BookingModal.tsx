import React, { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../theme';
import type { BookingDraft, Field } from '../types';
import {
  errorMessage,
  formatDate,
  formatHour,
  formatMoney,
  numericValue,
} from '../utils/format';
import { validateBooking } from '../utils/validation';
import { Button, FormInput, ScreenHeader } from './ui';

export function BookingModal({
  field,
  initialDate,
  onClose,
  onCreated,
}: {
  field: Field;
  initialDate?: string;
  onClose: () => void;
  onCreated: (message: string, date: string) => void;
}) {
  const { data, addBooking } = useApp();
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState<BookingDraft>({
    customerName: '',
    phone: '',
    date: initialDate ?? formatDate(),
    startHour: '17',
    hours: '1',
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof BookingDraft, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const dateRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const startRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const hoursRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const errors = validateBooking(draft, field, data.bookings);
  const hours = numericValue(draft.hours);
  const start = numericValue(draft.startHour);
  const validHours = Number.isFinite(hours) && hours >= 1 && hours <= 3;
  const validTime =
    validHours &&
    Number.isFinite(start) &&
    start >= 6 &&
    start <= 22 &&
    start + hours <= 23;
  const reserved = data.bookings
    .filter(
      booking =>
        booking.fieldId === field.id && booking.date === draft.date.trim(),
    )
    .sort((a, b) => a.startHour - b.startHour);
  const showSchedule = Boolean(
    submitted || touched.date || touched.startHour || touched.hours,
  );

  function change(key: keyof BookingDraft, value: string) {
    setDraft(previous => ({ ...previous, [key]: value }));
  }
  function blur(key: keyof BookingDraft) {
    setTouched(previous => ({ ...previous, [key]: true }));
  }
  function fieldError(key: keyof BookingDraft) {
    return submitted || touched[key] ? errors[key] : undefined;
  }
  function changeDate(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted =
      digits.length > 4
        ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
        : digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    change('date', formatted);
  }
  function requestClose() {
    if (savingRef.current) {
      return;
    }
    if (
      draft.customerName ||
      draft.phone ||
      draft.date !== (initialDate ?? formatDate()) ||
      draft.startHour !== '17' ||
      draft.hours !== '1'
    ) {
      Alert.alert('Đóng phiếu đặt sân?', 'Thông tin vừa nhập chưa được lưu.', [
        { text: 'Tiếp tục nhập', style: 'cancel' },
        { text: 'Đóng', style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  }
  async function submit() {
    if (savingRef.current) {
      return;
    }
    setSubmitted(true);
    if (Object.keys(errors).length) {
      if (errors.customerName) {
        nameRef.current?.focus();
      } else if (errors.phone) {
        phoneRef.current?.focus();
      } else if (errors.date) {
        dateRef.current?.focus();
      } else if (errors.startHour) {
        startRef.current?.focus();
      } else if (errors.hours) {
        hoursRef.current?.focus();
      } else {
        startRef.current?.focus();
      }
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await addBooking(field.id, draft);
      Keyboard.dismiss();
      onCreated(
        `Đã đặt ${field.name} lúc ${formatHour(start)}–${formatHour(
          start + hours,
        )}, ngày ${draft.date}.`,
        draft.date.trim(),
      );
    } catch (error) {
      Alert.alert('Chưa đặt được sân', errorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={requestClose}
      onShow={() => nameRef.current?.focus()}
    >
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScreenHeader
            title="Đặt sân"
            subtitle={field.name.toLocaleUpperCase('vi-VN')}
            action={
              <Button
                title="Đóng"
                variant="quiet"
                onPress={requestClose}
                disabled={saving}
                style={styles.close}
              />
            }
          />
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              {field.type} · {formatMoney(field.pricePerHour)}/giờ
            </Text>
            <Text style={styles.sectionLabel}>01 / KHÁCH HÀNG</Text>
            <FormInput
              ref={nameRef}
              label="Tên khách hàng"
              placeholder="Ví dụ: Nguyễn Minh Tuấn"
              value={draft.customerName}
              autoComplete="name"
              onChangeText={value => change('customerName', value)}
              onBlur={() => blur('customerName')}
              error={fieldError('customerName')}
              editable={!saving}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <FormInput
              ref={phoneRef}
              label="Số điện thoại"
              placeholder="Ví dụ: 0901234567"
              value={draft.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              onChangeText={value => change('phone', value)}
              onBlur={() => blur('phone')}
              error={fieldError('phone')}
              hint="10 chữ số, bắt đầu bằng 0."
              editable={!saving}
            />
            <Text style={styles.sectionLabel}>02 / THỜI GIAN ĐẶT</Text>
            <FormInput
              ref={dateRef}
              label="Ngày đặt sân"
              placeholder="dd/mm/yyyy"
              value={draft.date}
              keyboardType="numeric"
              maxLength={10}
              onChangeText={changeDate}
              onBlur={() => blur('date')}
              error={fieldError('date')}
              hint="Gõ ngày, tháng, năm; dấu / được điền tự động."
              editable={!saving}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => startRef.current?.focus()}
            />
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <FormInput
                  ref={startRef}
                  label="Giờ bắt đầu"
                  placeholder="17"
                  value={draft.startHour}
                  keyboardType="numeric"
                  onChangeText={value => change('startHour', value)}
                  onBlur={() => blur('startHour')}
                  error={fieldError('startHour')}
                  hint="Từ 6 đến 22 giờ."
                  editable={!saving}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => hoursRef.current?.focus()}
                  style={
                    showSchedule && errors.schedule
                      ? styles.conflictInput
                      : undefined
                  }
                />
              </View>
              <View style={styles.timeColumn}>
                <FormInput
                  ref={hoursRef}
                  label="Số giờ thuê"
                  placeholder="1"
                  value={draft.hours}
                  keyboardType="numeric"
                  onChangeText={value => change('hours', value)}
                  onBlur={() => blur('hours')}
                  error={fieldError('hours')}
                  hint="Từ 1 đến 3 giờ."
                  editable={!saving}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>
            {showSchedule && errors.schedule ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.scheduleError}
              >
                {errors.schedule}
              </Text>
            ) : null}
            {reserved.length ? (
              <View style={styles.reserved}>
                <Text style={styles.reservedTitle}>
                  ĐÃ CÓ LỊCH NGÀY {draft.date}
                </Text>
                <View style={styles.reservedTimes}>
                  {reserved.map(booking => (
                    <Text key={booking.id} style={styles.reservedTime}>
                      {formatHour(booking.startHour)}–
                      {formatHour(booking.startHour + booking.hours)}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.receipt}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Giờ kết thúc</Text>
                <Text style={styles.receiptValue}>
                  {validTime ? formatHour(start + hours) : '—'}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Đơn giá × thời gian</Text>
                <Text style={styles.receiptValue}>
                  {formatMoney(field.pricePerHour)} × {validHours ? hours : '—'}
                  h
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Thành tiền</Text>
                <Text accessibilityLiveRegion="polite" style={styles.total}>
                  {validHours ? formatMoney(field.pricePerHour * hours) : '—'}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Button
              title={saving ? 'Đang lưu lịch…' : 'Xác nhận đặt sân'}
              onPress={submit}
              loading={saving}
              disabled={field.status === 'Bảo trì'}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  fill: { flex: 1 },
  close: { paddingHorizontal: spacing.md, minHeight: 48 },
  form: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  intro: {
    ...typography.body,
    color: colors.secondary,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  timeColumn: { flex: 1, minWidth: 120 },
  conflictInput: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  scheduleError: {
    ...typography.label,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reserved: { gap: spacing.sm, marginBottom: spacing.xxl },
  reservedTitle: {
    ...typography.overline,
    color: colors.secondary,
    letterSpacing: 0.6,
  },
  reservedTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reservedTime: {
    ...typography.caption,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  receipt: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  receiptLabel: { ...typography.label, color: colors.secondary },
  receiptValue: { ...typography.label, color: colors.text },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  totalLabel: { ...typography.label, color: colors.primary },
  total: { ...typography.title, color: colors.primary },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
