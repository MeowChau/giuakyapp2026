import React, { forwardRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import type { FieldStatus } from '../types';
import { Icon } from './Icon';
import type { IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'outline';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: Boolean(unavailable),
        busy: Boolean(loading),
      }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        style,
        unavailable && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.primary : colors.secondary}
        />
      ) : icon ? (
        <Icon
          name={icon}
          size={18}
          color={
            unavailable
              ? colors.disabledText
              : variant === 'primary'
              ? colors.white
              : variant === 'danger'
              ? colors.danger
              : colors.secondary
          }
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          variant !== 'primary' && styles.buttonLabelSecondary,
          variant === 'danger' && styles.buttonLabelDanger,
          variant === 'outline' && styles.buttonLabelOutline,
          unavailable && styles.buttonLabelDisabled,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: IconName;
  suffix?: string;
  required?: boolean;
  labelHint?: string;
}

export const FormInput = forwardRef<
  React.ComponentRef<typeof TextInput>,
  InputProps
>(function InputField(
  {
    label,
    error,
    hint,
    leadingIcon,
    suffix,
    required,
    labelHint,
    onBlur,
    onFocus,
    style,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (error && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${label}: ${error}`);
    }
  }, [error, label]);
  const adorned = Boolean(leadingIcon || suffix);
  const input = (
    <TextInput
      ref={ref}
      {...props}
      accessibilityLabel={label}
      accessibilityHint={error ?? hint}
      placeholderTextColor={colors.muted}
      selectionColor={colors.primary}
      onFocus={event => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={event => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.input,
        !adorned && focused && styles.inputFocused,
        !adorned && Boolean(error) && styles.inputError,
        adorned && styles.inputPlain,
        style,
      ]}
    />
  );
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        {labelHint ? <Text style={styles.labelHint}>{labelHint}</Text> : null}
      </View>
      {adorned ? (
        <View
          style={[
            styles.adornedInput,
            focused && styles.inputFocused,
            Boolean(error) && styles.inputError,
          ]}
        >
          {leadingIcon ? (
            <Icon name={leadingIcon} size={19} color={colors.secondary} />
          ) : null}
          {input}
          {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
          {error ? <Icon name="alert" size={18} color={colors.danger} /> : null}
        </View>
      ) : (
        input
      )}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={styles.choiceRow}
      >
        {options.map(option => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={option}
            accessibilityState={{ checked: value === option, disabled }}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.choice,
              value === option && styles.choiceSelected,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[styles.radio, value === option && styles.radioSelected]}
            >
              {value === option ? <View style={styles.radioDot} /> : null}
            </View>
            <Text
              style={[
                styles.choiceLabel,
                value === option && styles.choiceLabelSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function StatusBadge({ status }: { status: FieldStatus }) {
  const active = status === 'Hoạt động';
  return (
    <View style={[styles.badge, !active && styles.badgeWarning]}>
      <View style={[styles.statusDot, !active && styles.statusDotWarning]} />
      <Text style={[styles.badgeLabel, !active && styles.badgeLabelWarning]}>
        {status}
      </Text>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="arrow-left" size={20} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.headerTitles}>
        {subtitle ? <Text style={styles.overline}>{subtitle}</Text> : null}
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <PitchGraphic />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export function PitchGraphic({ large = false }: { large?: boolean }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.pitch, large && styles.pitchLarge]}
    >
      <View style={styles.pitchStripe} />
      <View style={styles.pitchOutline}>
        <View style={styles.pitchLine} />
        <View style={styles.pitchCircle} />
        <View style={styles.pitchGoalTop} />
        <View style={styles.pitchGoalBottom} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  quiet: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerSoft },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.65 },
  buttonLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  buttonLabelSecondary: { color: colors.primary },
  buttonLabelDanger: { color: colors.danger },
  buttonLabelOutline: { color: colors.secondary },
  buttonLabelDisabled: { color: colors.disabledText },
  inputGroup: { marginBottom: spacing.xxl, gap: spacing.sm },
  inputLabel: { ...typography.label, color: colors.text },
  inputLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  required: { color: colors.danger },
  labelHint: { ...typography.caption, color: colors.muted, fontSize: 11 },
  adornedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputPlain: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  inputSuffix: { ...typography.caption, color: colors.secondary },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.input,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  error: { ...typography.caption, color: colors.danger },
  hint: { ...typography.caption, color: colors.secondary },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  choice: {
    flex: 1,
    minWidth: 120,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choiceLabel: { ...typography.label, color: colors.secondary, flexShrink: 1 },
  choiceLabelSelected: { color: colors.primary },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  badgeWarning: { backgroundColor: colors.warningSoft },
  badgeLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.success,
    flexShrink: 1,
  },
  badgeLabelWarning: { color: colors.warning },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusDotWarning: { backgroundColor: colors.warning },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 48,
    height: 48,
    padding: 0,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitles: { flex: 1 },
  overline: {
    ...typography.overline,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  headerTitle: { ...typography.title, color: colors.text },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
  },
  pitch: {
    width: 58,
    height: 76,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  pitchLarge: { width: 90, height: 118 },
  pitchStripe: {
    position: 'absolute',
    width: '34%',
    height: '100%',
    left: '33%',
    backgroundColor: colors.pitchStripe,
  },
  pitchOutline: {
    position: 'absolute',
    top: 7,
    bottom: 7,
    left: 6,
    right: 6,
    borderWidth: 1,
    borderColor: colors.pitchLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.pitchLine,
  },
  pitchCircle: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.pitchLine,
    borderRadius: 9,
  },
  pitchGoalTop: {
    position: 'absolute',
    top: -1,
    width: '50%',
    height: 12,
    borderWidth: 1,
    borderColor: colors.pitchLine,
  },
  pitchGoalBottom: {
    position: 'absolute',
    bottom: -1,
    width: '50%',
    height: 12,
    borderWidth: 1,
    borderColor: colors.pitchLine,
  },
});
