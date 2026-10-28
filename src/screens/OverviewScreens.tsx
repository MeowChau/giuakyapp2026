import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingListSkeleton } from '../components/Skeleton';
import { Icon } from '../components/Icon';
import { Button, EmptyState, ScreenHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types';
import {
  dateLabel,
  errorMessage,
  formatDate,
  formatHour,
  formatMoney,
  parseDate,
} from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'FieldList'>;

export function BookingsScreen({ navigation }: { navigation: Navigation }) {
  const { data, refresh, refreshing } = useApp();
  const [todayOnly, setTodayOnly] = useState(false);
  const bookings = data.bookings
    .filter(booking => !todayOnly || booking.date === formatDate())
    .sort(
      (a, b) =>
        (parseDate(a.date)?.getTime() ?? 0) -
          (parseDate(b.date)?.getTime() ?? 0) || a.startHour - b.startHour,
    );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader
        title="Lịch đặt"
        subtitle={`${data.bookings.length} lượt đặt trong cụm sân`}
      />
      <View style={styles.periodRow}>
        {[false, true].map(today => (
          <Pressable
            key={String(today)}
            accessibilityRole="button"
            accessibilityState={{ selected: todayOnly === today }}
            onPress={() => setTodayOnly(today)}
            style={({ pressed }) => [
              styles.period,
              todayOnly === today && styles.periodActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.periodLabel,
                todayOnly === today && styles.periodActiveLabel,
              ]}
            >
              {today ? 'Hôm nay' : 'Tất cả'}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={refreshing ? [] : bookings}
        keyExtractor={booking => booking.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        alwaysBounceVertical
        onRefresh={() =>
          refresh().catch(error =>
            Alert.alert('Không thể tải lại lịch đặt sân', errorMessage(error)),
          )
        }
        ListEmptyComponent={
          refreshing ? (
            <BookingListSkeleton />
          ) : (
            <EmptyState
              title="Chưa có lịch đặt"
              message="Chọn một sân trong tab Sân bóng để thêm lượt đặt."
            />
          )
        }
        renderItem={({ item }) => {
          const field = data.fields.find(value => value.id === item.fieldId);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Lịch ${field?.name}, ${item.customerName}, ${item.date}`}
              onPress={() =>
                navigation.navigate('FieldDetail', { fieldId: item.fieldId })
              }
              style={({ pressed }) => [
                styles.bookingCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.row}>
                <Text style={styles.fieldName}>{field?.name}</Text>
                <Text style={styles.small}>{dateLabel(item.date)}</Text>
              </View>
              <Text style={styles.time}>
                {formatHour(item.startHour)}–
                {formatHour(item.startHour + item.hours)}
              </Text>
              <Text style={styles.customer}>{item.customerName}</Text>
              <View style={styles.row}>
                <Text style={styles.small}>{item.phone}</Text>
                <Icon name="chevron" size={18} />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

export function ReportsScreen({ navigation }: { navigation: Navigation }) {
  const { data } = useApp();
  const total = data.bookings.reduce(
    (sum, booking) =>
      sum +
      (data.fields.find(field => field.id === booking.fieldId)?.pricePerHour ??
        0) *
        booking.hours,
    0,
  );
  const active = data.fields.filter(
    field => field.status === 'Hoạt động',
  ).length;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader title="Báo cáo" subtitle="Tổng quan các lịch đặt đã lưu" />
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.totalCard}>
          <Text style={styles.small}>Giá trị lịch đặt</Text>
          <Text style={styles.total}>{formatMoney(total)}</Text>
          <Text style={styles.note}>
            Tính theo giá thuê hiện tại; chưa phải doanh thu đã thu.
          </Text>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>
              {active}/{data.fields.length}
            </Text>
            <Text style={styles.small}>Sân hoạt động</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>{data.bookings.length}</Text>
            <Text style={styles.small}>Lượt đặt sân</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Theo từng sân</Text>
        <View style={styles.group}>
          {data.fields.map(field => {
            const bookings = data.bookings.filter(
              booking => booking.fieldId === field.id,
            );
            const amount = bookings.reduce(
              (sum, booking) => sum + booking.hours * field.pricePerHour,
              0,
            );
            return (
              <Pressable
                key={field.id}
                accessibilityRole="button"
                accessibilityLabel={`Xem báo cáo ${field.name}`}
                onPress={() =>
                  navigation.navigate('FieldDetail', { fieldId: field.id })
                }
                style={({ pressed }) => [
                  styles.reportRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.grow}>
                  <Text style={styles.customer}>{field.name}</Text>
                  <Text style={styles.small}>{bookings.length} lượt đặt</Text>
                </View>
                <Text style={styles.reportAmount}>{formatMoney(amount)}</Text>
                <Icon name="chevron" size={16} />
              </Pressable>
            );
          })}
          {!data.fields.length ? (
            <Text style={styles.emptyNote}>Chưa có sân để thống kê.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsScreen() {
  const { data, refresh, refreshing } = useApp();
  const reducedMotion = useReducedMotion();
  const [notice, setNotice] = useState('');
  async function reload() {
    try {
      await refresh();
      setNotice('Đã tải lại dữ liệu trên thiết bị.');
    } catch (error) {
      Alert.alert('Không thể tải lại dữ liệu', errorMessage(error));
    }
  }
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader title="Cài đặt" subtitle="FootballFieldApp" />
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>Dữ liệu ứng dụng</Text>
        <View style={styles.group}>
          <View style={styles.settingRow}>
            <Text style={styles.customer}>Lưu trữ</Text>
            <Text style={styles.small}>Trên thiết bị</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.customer}>Hiện có</Text>
            <Text style={styles.small}>
              {data.fields.length} sân · {data.bookings.length} lượt đặt
            </Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.customer}>Giảm chuyển động</Text>
            <Text style={styles.small}>
              {reducedMotion ? 'Đang bật' : 'Đang tắt'}
            </Text>
          </View>
        </View>
        <Text style={styles.note}>
          Cài đặt chuyển động theo tuỳ chọn trợ năng của điện thoại. Dữ liệu sân
          và lịch đặt được giữ khi đóng ứng dụng.
        </Text>
        <Button
          title="Tải lại dữ liệu"
          variant="secondary"
          onPress={reload}
          loading={refreshing}
        />
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
        <Text style={styles.sectionTitle}>Sử dụng ứng dụng</Text>
        <View style={styles.group}>
          <Button
            title="Hướng dẫn đặt và quản lý sân"
            variant="quiet"
            onPress={() =>
              Alert.alert(
                'Hướng dẫn sử dụng',
                'Chọn sân để xem lịch và đặt sân. Dùng nút sửa để cập nhật thông tin. Kéo xuống để tải lại dữ liệu. Xoá sân hoặc huỷ lịch luôn cần xác nhận.',
              )
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  period: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  periodActive: { backgroundColor: colors.text },
  periodLabel: { ...typography.label, color: colors.secondary },
  periodActiveLabel: { color: colors.white },
  bookingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldName: { ...typography.label, color: colors.primary },
  time: { ...typography.heading, color: colors.text },
  customer: { ...typography.body, color: colors.text },
  small: { ...typography.caption, color: colors.secondary },
  totalCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  total: { ...typography.title, color: colors.primary },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  metric: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  metricNumber: { ...typography.title, color: colors.text },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  group: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  grow: { flex: 1, minWidth: 100, gap: spacing.xs },
  reportAmount: { ...typography.label, color: colors.text },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  note: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  notice: {
    ...typography.label,
    color: colors.success,
    marginVertical: spacing.lg,
  },
  emptyNote: {
    ...typography.body,
    color: colors.secondary,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.6 },
});
