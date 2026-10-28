import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  Field,
  FieldStatus,
  FieldType,
  RootStackParamList,
} from '../types';
import { useApp } from '../context/AppContext';
import { FieldCard } from '../components/FieldCard';
import { FieldListSkeleton } from '../components/Skeleton';
import { Icon } from '../components/Icon';
import {
  Button,
  ChoiceGroup,
  EmptyState,
  ScreenHeader,
} from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { errorMessage } from '../utils/format';
import { normalizedName } from '../utils/validation';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Props = NativeStackScreenProps<RootStackParamList, 'FieldList'>;
type Filter = 'Tất cả' | FieldType;
const filters: Filter[] = ['Tất cả', '5 người', '7 người'];
const statuses = ['Tất cả', 'Hoạt động', 'Bảo trì'] as const;

export function FieldListScreen({ navigation }: Props) {
  const { data, deleteField, refreshing, refresh } = useApp();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Tất cả');
  const [status, setStatus] = useState<'Tất cả' | FieldStatus>('Tất cả');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const active = data.fields.filter(
    field => field.status === 'Hoạt động',
  ).length;
  const visible = useMemo(
    () =>
      data.fields.filter(
        field =>
          (filter === 'Tất cả' || field.type === filter) &&
          (status === 'Tất cả' || field.status === status) &&
          normalizedName(`${field.name} ${field.type}`).includes(
            normalizedName(query),
          ),
      ),
    [data.fields, filter, status, query],
  );

  function reload() {
    return refresh().catch(error =>
      Alert.alert('Không thể tải lại danh sách sân', errorMessage(error)),
    );
  }

  function askDelete(field: Field) {
    if (data.bookings.some(booking => booking.fieldId === field.id)) {
      Alert.alert(
        'Không thể xoá sân',
        `${field.name} đang có lượt đặt. Hãy huỷ các lượt đặt trước khi xoá sân.`,
      );
      return;
    }
    Alert.alert(
      `Xoá ${field.name}?`,
      'Sân sẽ được xoá khỏi danh sách. Thao tác này không thể hoàn tác.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => {
            setDeletingId(field.id);
            deleteField(field.id)
              .catch(error =>
                Alert.alert('Không thể xoá sân', errorMessage(error)),
              )
              .finally(() => setDeletingId(null));
          },
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader
        title="Sân bóng"
        subtitle={`${active}/${data.fields.length} sân hoạt động`}
      />
      <FlatList
        data={refreshing ? [] : visible}
        refreshing={refreshing}
        onRefresh={reload}
        alwaysBounceVertical
        keyExtractor={field => field.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.toolbar}>
              <View style={styles.search}>
                <View style={styles.searchIcon}>
                  <Icon name="search" size={20} />
                </View>
                <TextInput
                  accessibilityLabel="Tìm sân theo tên hoặc loại sân"
                  placeholder="Tìm theo tên sân, loại sân..."
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lọc trạng thái sân"
                  accessibilityState={{ expanded: filterOpen }}
                  onPress={() => {
                    Keyboard.dismiss();
                    setFilterOpen(true);
                  }}
                  style={({ pressed }) => [
                    styles.filterButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    name="filter"
                    size={19}
                    color={
                      status === 'Tất cả' ? colors.secondary : colors.primary
                    }
                  />
                </Pressable>
              </View>
              <Button
                title="+ Thêm sân"
                disabled={refreshing}
                onPress={() => navigation.navigate('FieldForm')}
                style={styles.addButton}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filters.map(item => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item === 'Tất cả' ? 'Tất cả sân' : `Sân ${item}`
                  }
                  accessibilityState={{ selected: item === filter }}
                  onPress={() => setFilter(item)}
                  style={({ pressed }) => [
                    styles.filter,
                    item === filter && styles.filterActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      item === filter && styles.filterLabelActive,
                    ]}
                  >
                    {item === 'Tất cả'
                      ? `Tất cả (${data.fields.length})`
                      : `Sân ${item}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {status !== 'Tất cả' ? (
              <Text style={styles.appliedFilter}>Trạng thái: {status}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <FieldCard
            field={item}
            bookingCount={
              data.bookings.filter(booking => booking.fieldId === item.id)
                .length
            }
            deleting={deletingId === item.id}
            onOpen={() =>
              navigation.navigate('FieldDetail', { fieldId: item.id })
            }
            onEdit={() =>
              navigation.navigate('FieldForm', { fieldId: item.id })
            }
            onDelete={() => askDelete(item)}
          />
        )}
        ListEmptyComponent={
          refreshing ? (
            <FieldListSkeleton />
          ) : (
            <EmptyState
              title={
                data.fields.length ? 'Chưa tìm thấy sân' : 'Chưa có sân nào'
              }
              message={
                data.fields.length
                  ? 'Thử tên sân khác hoặc chọn bộ lọc Tất cả.'
                  : 'Thêm sân đầu tiên để bắt đầu quản lý lịch đặt.'
              }
            />
          )
        }
      />
      <Modal
        visible={filterOpen}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setFilterOpen(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.filterDialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>
              Lọc sân
            </Text>
            <ChoiceGroup
              label="Trạng thái sân"
              options={statuses}
              value={status}
              onChange={setStatus}
            />
            <Button title="Xong" onPress={() => setFilterOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  search: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  searchIcon: { paddingLeft: spacing.md, paddingRight: spacing.sm },
  searchInput: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
  },
  filterButton: {
    minWidth: 40,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: { paddingHorizontal: spacing.md, borderRadius: radius.md },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.lg,
  },
  filter: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.chip,
  },
  filterActive: { backgroundColor: colors.text },
  filterLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.secondary,
  },
  filterLabelActive: { color: colors.white },
  appliedFilter: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.65 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.modalBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  filterDialog: {
    width: '100%',
    maxWidth: 440,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xl,
  },
});
