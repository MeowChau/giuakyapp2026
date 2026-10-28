import React, { useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingModal } from '../components/BookingModal';
import { BookingListSkeleton } from '../components/Skeleton';
import { Icon, IconButton } from '../components/Icon';
import { Button, EmptyState, ScreenHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { cardShadow, colors, radius, spacing, typography } from '../theme';
import type { Booking, RootStackParamList } from '../types';
import {
  dateLabel,
  errorMessage,
  formatDate,
  formatHour,
  formatMoney,
  parseDate,
} from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'FieldDetail'>;
const coverImage = require('../../assets/fields/mini-football.png');

export function FieldDetailScreen({ navigation, route }: Props) {
  const { data, cancelBooking, refreshing, refresh } = useApp();
  const field = data.fields.find(item => item.id === route.params.fieldId);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDate());
  const [rangeStart, setRangeStart] = useState(() => formatDate());
  const [showAll, setShowAll] = useState(false);
  const allBookings = data.bookings
    .filter(booking => booking.fieldId === route.params.fieldId)
    .sort(
      (a, b) =>
        (parseDate(a.date)?.getTime() ?? 0) -
          (parseDate(b.date)?.getTime() ?? 0) || a.startHour - b.startHour,
    );
  const bookings = showAll
    ? allBookings
    : allBookings.filter(booking => booking.date === selectedDate);
  const days = Array.from({ length: 5 }, (_, offset) => {
    const date = parseDate(rangeStart) ?? new Date();
    date.setDate(date.getDate() + offset);
    const value = formatDate(date);
    return {
      value,
      label:
        value === formatDate()
          ? 'Hôm nay'
          : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date),
      day: String(date.getDate()).padStart(2, '0'),
      count: allBookings.filter(booking => booking.date === value).length,
    };
  });

  function reload() {
    return refresh().catch(error =>
      Alert.alert('Không thể tải lại lịch đặt sân', errorMessage(error)),
    );
  }

  function askCancel(booking: Booking) {
    Alert.alert(
      'Huỷ lượt đặt sân?',
      booking.customerName +
        '\n' +
        booking.date +
        ' · ' +
        formatHour(booking.startHour) +
        '–' +
        formatHour(booking.startHour + booking.hours) +
        '\nLượt đặt sẽ được xoá khỏi lịch.',
      [
        { text: 'Giữ lượt đặt', style: 'cancel' },
        {
          text: 'Xoá lượt đặt',
          style: 'destructive',
          onPress: () => {
            setCancellingId(booking.id);
            cancelBooking(booking.id)
              .then(() => {
                const message = 'Đã huỷ lượt đặt. Khung giờ này đã trống.';
                setNotice(message);
                AccessibilityInfo.announceForAccessibility(message);
              })
              .catch(error =>
                Alert.alert('Chưa huỷ được lượt đặt', errorMessage(error)),
              )
              .finally(() => setCancellingId(null));
          },
        },
      ],
      { cancelable: true },
    );
  }

  function toggleAllDates() {
    if (showAll) {
      const today = formatDate();
      setSelectedDate(today);
      setRangeStart(today);
    }
    setShowAll(!showAll);
  }

  if (!field) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title="Chi tiết sân" onBack={() => navigation.goBack()} />
        <EmptyState
          title="Sân không còn tồn tại"
          message="Quay lại danh sách để chọn sân khác."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title="Chi tiết sân"
        onBack={() => navigation.goBack()}
        action={
          <IconButton
            name="edit"
            label={'Sửa ' + field.name}
            disabled={refreshing}
            onPress={() =>
              navigation.navigate('FieldForm', { fieldId: field.id })
            }
          />
        }
      />
      <FlatList
        data={refreshing ? [] : bookings}
        refreshing={refreshing}
        onRefresh={reload}
        alwaysBounceVertical
        keyExtractor={booking => booking.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Image
                source={coverImage}
                resizeMode="cover"
                style={styles.heroImage}
                accessible={false}
              />
              <View style={styles.heroCaption}>
                <View style={styles.heroNameBlock}>
                  <View style={styles.typeTag}>
                    <View style={styles.typeDot} />
                    <Text style={styles.typeTagText}>
                      {'Sân ' + field.type}
                    </Text>
                  </View>
                  <Text accessibilityRole="header" style={styles.fieldName}>
                    {field.name}
                  </Text>
                </View>
                <View style={styles.heroPriceBlock}>
                  <Text style={styles.heroPriceLabel}>Giá thuê</Text>
                  <Text style={styles.heroPrice}>
                    {formatMoney(field.pricePerHour)}
                    <Text style={styles.perHour}>/giờ</Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.photoNote}>Ảnh minh hoạ</Text>
            </View>
            <View style={styles.facts}>
              <View style={styles.fact}>
                <Icon name="field" size={18} color={colors.primary} />
                <Text style={styles.factLabel}>Loại sân</Text>
                <Text style={styles.factValue}>{field.type}</Text>
              </View>
              <View style={styles.fact}>
                <Icon name="banknote" size={18} color={colors.primary} />
                <Text style={styles.factLabel}>Đơn giá</Text>
                <Text style={styles.factPrice}>
                  {formatMoney(field.pricePerHour)}/giờ
                </Text>
              </View>
              <View style={styles.fact}>
                <Icon
                  name={field.status === 'Hoạt động' ? 'check' : 'alert'}
                  size={18}
                  color={
                    field.status === 'Hoạt động'
                      ? colors.primary
                      : colors.warning
                  }
                />
                <Text style={styles.factLabel}>Trạng thái</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      field.status === 'Bảo trì' && styles.warningDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.factValue,
                      field.status === 'Bảo trì' && styles.warningText,
                    ]}
                  >
                    {field.status}
                  </Text>
                </View>
              </View>
            </View>
            {notice ? (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="calendar" size={18} color={colors.primary} />
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Lịch đặt theo khung giờ
                </Text>
              </View>
              <Text style={styles.monthLabel}>
                {showAll
                  ? 'Tất cả ngày'
                  : 'Tháng ' +
                    selectedDate.slice(3, 5) +
                    '/' +
                    selectedDate.slice(6)}
              </Text>
            </View>
            <View style={styles.days}>
              {days.map(day => (
                <Pressable
                  key={day.value}
                  accessibilityRole="button"
                  accessibilityLabel={'Xem lịch ngày ' + day.value}
                  accessibilityState={{
                    selected: !showAll && selectedDate === day.value,
                  }}
                  onPress={() => {
                    setSelectedDate(day.value);
                    setShowAll(false);
                  }}
                  style={({ pressed }) => [
                    styles.day,
                    !showAll &&
                      selectedDate === day.value &&
                      styles.daySelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      !showAll &&
                        selectedDate === day.value &&
                        styles.selectedText,
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      !showAll &&
                        selectedDate === day.value &&
                        styles.selectedText,
                    ]}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayCount,
                      !showAll &&
                        selectedDate === day.value &&
                        styles.selectedText,
                    ]}
                  >
                    {day.count ? day.count + ' lượt' : 'Trống lịch'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.dateSummary}>
              <Text style={styles.dateDescription}>
                {showAll
                  ? allBookings.length + ' lượt đặt của sân'
                  : dateLabel(selectedDate) + ' · ' + bookings.length + ' lượt'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  showAll ? 'Xem lịch hôm nay' : 'Xem tất cả lịch đặt'
                }
                onPress={toggleAllDates}
                style={({ pressed }) => [
                  styles.allDatesButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.allDatesText}>
                  {showAll ? 'Hôm nay' : 'Tất cả (' + allBookings.length + ')'}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            {showAll ? (
              <Text style={styles.bookingDate}>{dateLabel(item.date)}</Text>
            ) : null}
            <View style={styles.bookingTop}>
              <View style={styles.timeRow}>
                <Text style={styles.timeTag}>
                  {formatHour(item.startHour)}–
                  {formatHour(item.startHour + item.hours)}
                </Text>
                <Text style={styles.duration}>
                  {'(' + item.hours + ' giờ)'}
                </Text>
              </View>
              <Text style={styles.bookedLabel}>Đã đặt</Text>
            </View>
            <View style={styles.bookingBody}>
              <View style={styles.customerBlock}>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
              <View style={styles.bookingActions}>
                <Text style={styles.amount}>
                  {formatMoney(field.pricePerHour * item.hours)}
                </Text>
                <Button
                  title="Huỷ đặt"
                  icon="close"
                  accessibilityLabel={
                    'Huỷ lượt đặt của ' +
                    item.customerName +
                    ', ' +
                    item.date +
                    ', ' +
                    formatHour(item.startHour)
                  }
                  variant="danger"
                  onPress={() => askCancel(item)}
                  loading={cancellingId === item.id}
                  style={styles.cancelButton}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          refreshing ? (
            <BookingListSkeleton />
          ) : (
            <EmptyState
              title={
                allBookings.length && !showAll
                  ? 'Ngày này chưa có lịch đặt'
                  : 'Lịch sân đang trống'
              }
              message={
                field.status === 'Bảo trì'
                  ? 'Sân đang bảo trì. Chuyển sang Hoạt động để nhận lịch đặt.'
                  : 'Chọn Đặt sân để thêm lịch mới hoặc xem Tất cả để tìm các ngày khác.'
              }
            />
          )
        }
      />
      <View style={styles.footer}>
        {field.status === 'Bảo trì' ? (
          <Text style={styles.maintenanceNote}>
            Sân đang bảo trì, tạm ngừng nhận lịch đặt.
          </Text>
        ) : null}
        <Button
          title={
            field.status === 'Bảo trì' ? 'Đặt sân · Đang bảo trì' : '+ Đặt sân'
          }
          disabled={field.status === 'Bảo trì' || refreshing}
          onPress={() => setBookingOpen(true)}
        />
      </View>
      {bookingOpen ? (
        <BookingModal
          field={field}
          initialDate={showAll ? formatDate() : selectedDate}
          onClose={() => setBookingOpen(false)}
          onCreated={(message, date) => {
            setBookingOpen(false);
            setSelectedDate(date);
            if (!days.some(day => day.value === date)) {
              setRangeStart(date);
            }
            setShowAll(false);
            setNotice(message);
            AccessibilityInfo.announceForAccessibility(message);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  hero: {
    aspectRatio: 2.1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  heroCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.detailCaption,
  },
  heroNameBlock: { flex: 1, minWidth: 110, gap: spacing.xs },
  typeTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  typeTagText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 15,
    color: colors.white,
  },
  fieldName: { ...typography.heading, color: colors.white },
  heroPriceBlock: { alignItems: 'flex-end', gap: spacing.xs },
  heroPriceLabel: { ...typography.caption, color: colors.white },
  heroPrice: { ...typography.heading, color: colors.selectedMint },
  perHour: { ...typography.caption, color: colors.white, fontWeight: '400' },
  photoNote: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    ...typography.caption,
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.imageOverlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  fact: {
    flex: 1,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  factLabel: { ...typography.caption, fontSize: 11, color: colors.secondary },
  factValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  factPrice: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  warningDot: { backgroundColor: colors.warning },
  warningText: { color: colors.warning },
  notice: {
    ...typography.label,
    color: colors.success,
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { ...typography.body, fontWeight: '700', color: colors.text },
  monthLabel: { ...typography.caption, fontSize: 11, color: colors.primary },
  days: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  day: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 82,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  daySelected: { backgroundColor: colors.primary },
  dayLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.secondary,
    textAlign: 'center',
    width: '100%',
  },
  dayNumber: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  dayCount: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondary,
    textAlign: 'center',
    width: '100%',
  },
  selectedText: { color: colors.white },
  dateSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateDescription: { ...typography.caption, color: colors.secondary },
  allDatesButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  allDatesText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingCard: {
    ...cardShadow,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  bookingDate: { ...typography.caption, color: colors.secondary },
  bookingTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  duration: { ...typography.caption, color: colors.secondary },
  bookedLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bookingBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  customerBlock: { flex: 1, minWidth: 120, gap: spacing.xs },
  customerName: { ...typography.body, fontWeight: '600', color: colors.text },
  phone: { ...typography.caption, color: colors.secondary },
  bookingActions: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.body, fontWeight: '700', color: colors.primary },
  cancelButton: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  maintenanceNote: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
  },
  pressed: { opacity: 0.65 },
});
