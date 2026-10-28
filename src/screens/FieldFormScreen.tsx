import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, EmptyState, FormInput, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography } from '../theme';
import type { FieldDraft, RootStackParamList } from '../types';
import { errorMessage, formatMoney, numericValue } from '../utils/format';
import { validateField } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'FieldForm'>;
const coverImage = require('../../assets/fields/mini-football.png');
const fieldTypes = ['5 người', '7 người'] as const;
const fieldStatuses = ['Hoạt động', 'Bảo trì'] as const;

export function FieldFormScreen({ navigation, route }: Props) {
  const { data, saveField } = useApp();
  const fieldId = route.params?.fieldId;
  const original = data.fields.find(field => field.id === fieldId);
  const [draft, setDraft] = useState<FieldDraft>(() => ({
    name: original?.name ?? '',
    type: original?.type ?? '5 người',
    pricePerHour: original ? String(original.pricePerHour) : '',
    status: original?.status ?? 'Hoạt động',
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof FieldDraft, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingRef = useRef(false);
  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const priceRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const errors = validateField(draft, data.fields, fieldId);
  const price = numericValue(draft.pricePerHour);
  const dirty =
    draft.name !== (original?.name ?? '') ||
    draft.type !== (original?.type ?? '5 người') ||
    draft.pricePerHour !== (original ? String(original.pricePerHour) : '') ||
    draft.status !== (original?.status ?? 'Hoạt động');

  usePreventRemove(dirty && !saved, ({ data: removal }) => {
    if (savingRef.current) {
      return;
    }
    Alert.alert(
      'Bỏ thay đổi chưa lưu?',
      'Thông tin vừa chỉnh sửa sẽ không được lưu.',
      [
        { text: 'Tiếp tục sửa', style: 'cancel' },
        {
          text: 'Bỏ thay đổi',
          style: 'destructive',
          onPress: () => navigation.dispatch(removal.action),
        },
      ],
    );
  });

  useEffect(() => {
    if (saved) {
      Keyboard.dismiss();
      navigation.goBack();
    }
  }, [saved, navigation]);

  function change<K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
  }

  function closeForm() {
    if (!savingRef.current && !saved) {
      navigation.goBack();
    }
  }

  async function submit() {
    if (savingRef.current || saved) {
      return;
    }
    setSubmitted(true);
    if (Object.keys(errors).length) {
      if (errors.name) {
        nameRef.current?.focus();
      } else {
        priceRef.current?.focus();
      }
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await saveField(draft, fieldId);
      setSaved(true);
    } catch (error) {
      Alert.alert('Chưa lưu được sân', errorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (fieldId && !original) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader
          title="Thông tin sân"
          onBack={() => navigation.goBack()}
        />
        <EmptyState
          title="Sân không còn tồn tại"
          message="Quay lại danh sách để chọn sân khác."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader
          title={fieldId ? 'Chỉnh sửa sân' : 'Thêm sân mới'}
          onBack={closeForm}
        />
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cover}>
            <Image
              source={coverImage}
              resizeMode="cover"
              style={styles.coverImage}
              accessible={false}
            />
            <View style={styles.coverShade} />
            <View style={styles.coverCaption}>
              <View style={styles.coverCopy}>
                <Text style={styles.coverEyebrow}>
                  {fieldId ? 'THÔNG TIN SÂN' : 'THÊM SÂN MỚI'}
                </Text>
                <Text style={styles.coverName} numberOfLines={2}>
                  {draft.name.trim() || 'Sân mới'}
                </Text>
              </View>
              <Text style={styles.coverTag}>Ảnh minh hoạ</Text>
            </View>
          </View>
          <FormInput
            ref={nameRef}
            label="Tên sân"
            required
            labelHint="Bắt buộc"
            leadingIcon="field"
            placeholder="Ví dụ: Sân A3"
            value={draft.name}
            onChangeText={value => change('name', value)}
            onBlur={() => setTouched(previous => ({ ...previous, name: true }))}
            error={submitted || touched.name ? errors.name : undefined}
            hint="Gợi ý: dùng tên dễ phân biệt như Sân A1 hoặc Sân B2."
            editable={!saving}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => priceRef.current?.focus()}
          />
          <FormInput
            ref={priceRef}
            label="Giá thuê mỗi giờ (VNĐ)"
            required
            labelHint="Lớn hơn 0"
            leadingIcon="banknote"
            suffix="đ/giờ"
            placeholder="Ví dụ: 300000"
            keyboardType="numeric"
            value={draft.pricePerHour}
            onChangeText={value => change('pricePerHour', value)}
            onBlur={() =>
              setTouched(previous => ({ ...previous, pricePerHour: true }))
            }
            error={
              submitted || touched.pricePerHour
                ? errors.pricePerHour
                : undefined
            }
            hint={
              Number.isFinite(price) && price > 0
                ? `${formatMoney(price)}/giờ`
                : 'Nhập số tiền, không dùng dấu phân cách hàng nghìn.'
            }
            editable={!saving}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <View style={styles.optionGroup}>
            <View style={styles.groupHeading}>
              <Text style={styles.groupLabel}>Quy cách sân</Text>
              <Text style={styles.groupHint}>Chọn một loại sân</Text>
            </View>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Loại sân"
              style={styles.options}
            >
              {fieldTypes.map(type => (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityLabel={`Sân ${type}`}
                  accessibilityState={{
                    checked: draft.type === type,
                    disabled: saving,
                  }}
                  disabled={saving}
                  onPress={() => change('type', type)}
                  style={({ pressed }) => [
                    styles.typeOption,
                    draft.type === type && styles.typeSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    name="field"
                    size={19}
                    color={
                      draft.type === type ? colors.white : colors.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      draft.type === type && styles.typeLabelSelected,
                    ]}
                  >
                    Sân {type}
                  </Text>
                  {draft.type === type ? (
                    <View style={styles.selectedCheck}>
                      <Icon name="check" size={12} color={colors.white} />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.optionGroup}>
            <View style={styles.groupHeading}>
              <Text style={styles.groupLabel}>Trạng thái vận hành</Text>
              <Text style={styles.groupHint}>Chọn một trạng thái</Text>
            </View>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Trạng thái sân"
              style={styles.options}
            >
              {fieldStatuses.map(status => (
                <Pressable
                  key={status}
                  accessibilityRole="radio"
                  accessibilityLabel={status}
                  accessibilityState={{
                    checked: draft.status === status,
                    disabled: saving,
                  }}
                  disabled={saving}
                  onPress={() => change('status', status)}
                  style={({ pressed }) => [
                    styles.statusOption,
                    draft.status === status &&
                      (status === 'Hoạt động'
                        ? styles.statusActive
                        : styles.statusMaintenance),
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      status === 'Bảo trì' && styles.maintenanceDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusLabel,
                      draft.status === status && styles.statusLabelSelected,
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={styles.note}>
            Chọn Bảo trì để tạm dừng nhận lượt đặt mới cho sân.
          </Text>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title={
              saving ? 'Đang lưu sân…' : fieldId ? 'Lưu thay đổi' : 'Thêm sân'
            }
            onPress={submit}
            icon="save"
            loading={saving || saved}
          />
          <Button
            title="Huỷ bỏ"
            icon="close"
            variant="outline"
            onPress={closeForm}
            disabled={saving || saved}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  cover: {
    height: 132,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
    marginBottom: spacing.xl,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  coverShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.coverShade,
  },
  coverCaption: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  coverCopy: { flex: 1, gap: spacing.xs },
  coverEyebrow: {
    ...typography.overline,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.8,
  },
  coverName: { ...typography.heading, color: colors.white },
  coverTag: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 16,
    color: colors.text,
    backgroundColor: colors.imageTag,
    borderRadius: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionGroup: { marginBottom: spacing.xxl, gap: spacing.sm },
  groupHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  groupLabel: { ...typography.label, color: colors.text },
  groupHint: { ...typography.caption, fontSize: 11, color: colors.muted },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeOption: {
    flex: 1,
    minWidth: 120,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeLabel: { ...typography.label, color: colors.secondary, flex: 1 },
  typeLabelSelected: { color: colors.white },
  selectedCheck: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOption: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusActive: {
    backgroundColor: colors.selectedMint,
    borderColor: colors.selectedMintBorder,
  },
  statusMaintenance: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  maintenanceDot: { backgroundColor: colors.warning },
  statusLabel: { ...typography.label, color: colors.secondary, flexShrink: 1 },
  statusLabelSelected: { color: colors.text },
  pressed: { opacity: 0.65 },
  note: { ...typography.caption, color: colors.secondary, lineHeight: 20 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
});
