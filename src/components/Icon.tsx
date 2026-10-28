import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

export type IconName =
  | 'search'
  | 'filter'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'clock'
  | 'field'
  | 'calendar'
  | 'chart'
  | 'settings'
  | 'save'
  | 'close'
  | 'banknote'
  | 'check'
  | 'alert'
  | 'arrow-left'
  | 'chevron';

export function Icon({
  name,
  color = colors.secondary,
  size = 22,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const stroke = { borderColor: color };
  const fill = { backgroundColor: color };
  let drawing: React.ReactNode;
  switch (name) {
    case 'search':
      drawing = (
        <>
          <View style={[styles.searchRing, stroke]} />
          <View style={[styles.searchHandle, fill]} />
        </>
      );
      break;
    case 'filter':
      drawing = (
        <>
          {[5, 12, 19].map((top, index) => (
            <React.Fragment key={top}>
              <View style={[styles.filterLine, fill, { top }]} />
              <View
                style={[
                  styles.filterKnob,
                  fill,
                  { top: top - 3, left: [7, 16, 10][index] },
                ]}
              />
            </React.Fragment>
          ))}
        </>
      );
      break;
    case 'plus':
      drawing = (
        <>
          <View style={[styles.plusHorizontal, fill]} />
          <View style={[styles.plusVertical, fill]} />
        </>
      );
      break;
    case 'edit':
      drawing = (
        <View style={styles.pencilGroup}>
          <View style={[styles.pencilBody, stroke]} />
          <View style={[styles.pencilBand, fill]} />
          <View style={[styles.pencilNib, { borderTopColor: color }]} />
        </View>
      );
      break;
    case 'trash':
      drawing = (
        <>
          <View style={[styles.trashHandle, stroke]} />
          <View style={[styles.trashLid, fill]} />
          <View style={[styles.trashBody, stroke]} />
          <View style={[styles.trashLineLeft, fill]} />
          <View style={[styles.trashLineRight, fill]} />
        </>
      );
      break;
    case 'clock':
      drawing = (
        <>
          <View style={[styles.clockRing, stroke]} />
          <View style={[styles.clockMinute, fill]} />
          <View style={[styles.clockHour, fill]} />
        </>
      );
      break;
    case 'field':
      drawing = (
        <>
          <View style={[styles.fieldBorder, stroke]} />
          <View style={[styles.fieldMiddle, fill]} />
          <View style={[styles.fieldCircle, stroke]} />
        </>
      );
      break;
    case 'calendar':
      drawing = (
        <>
          <View style={[styles.calendarBorder, stroke]} />
          <View style={[styles.calendarTop, fill]} />
          <View style={[styles.bindingLeft, fill]} />
          <View style={[styles.bindingRight, fill]} />
          <View style={[styles.calendarDay, fill]} />
        </>
      );
      break;
    case 'chart':
      drawing = (
        <>
          <View style={[styles.chartBorder, stroke]} />
          {[5, 9, 13].map((height, index) => (
            <View
              key={height}
              style={[styles.chartBar, fill, { height, left: 6 + index * 5 }]}
            />
          ))}
        </>
      );
      break;
    case 'settings':
      drawing = (
        <>
          <View style={[styles.gearRing, stroke]} />
          {Array.from({ length: 8 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.gearTooth,
                fill,
                {
                  transform: [
                    { rotate: `${index * 45}deg` },
                    { translateY: -8 },
                  ],
                },
              ]}
            />
          ))}
          <View style={[styles.gearCenter, stroke]} />
        </>
      );
      break;
    case 'save':
      drawing = (
        <>
          <View style={[styles.saveOutline, stroke]} />
          <View style={[styles.saveSlot, stroke]} />
          <View style={[styles.saveLabel, stroke]} />
        </>
      );
      break;
    case 'close':
      drawing = (
        <>
          <View style={[styles.closeLine, fill, styles.closeForward]} />
          <View style={[styles.closeLine, fill, styles.closeBackward]} />
        </>
      );
      break;
    case 'banknote':
      drawing = (
        <>
          <View style={[styles.moneyOutline, stroke]} />
          <View style={[styles.moneyCircle, stroke]} />
          <View style={[styles.moneyLeft, fill]} />
          <View style={[styles.moneyRight, fill]} />
        </>
      );
      break;
    case 'check':
      drawing = (
        <>
          <View style={[styles.checkShort, fill]} />
          <View style={[styles.checkLong, fill]} />
        </>
      );
      break;
    case 'alert':
      drawing = (
        <>
          <View style={[styles.clockRing, stroke]} />
          <View style={[styles.alertLine, fill]} />
          <View style={[styles.alertDot, fill]} />
        </>
      );
      break;
    case 'arrow-left':
      drawing = (
        <>
          <View style={[styles.arrowStem, fill]} />
          <View style={[styles.arrowHead, stroke]} />
        </>
      );
      break;
    case 'chevron':
      drawing = <View style={[styles.chevron, stroke]} />;
      break;
  }
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <View
        style={[
          styles.canvas,
          {
            left: (size - 24) / 2,
            top: (size - 24) / 2,
            transform: [{ scale: size / 24 }],
          },
        ]}
      >
        {drawing}
      </View>
    </View>
  );
}

export function IconButton({
  name,
  label,
  onPress,
  danger = false,
  disabled = false,
  loading = false,
  style,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.iconTile, danger && styles.dangerTile]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Icon
            name={name}
            color={danger ? colors.danger : colors.secondary}
            size={20}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  saveOutline: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 18,
    height: 20,
    borderWidth: 1.6,
    borderRadius: 2,
  },
  saveSlot: {
    position: 'absolute',
    top: 2,
    left: 7,
    width: 10,
    height: 7,
    borderWidth: 1.5,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  saveLabel: {
    position: 'absolute',
    top: 13,
    left: 7,
    width: 10,
    height: 8,
    borderWidth: 1.5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  closeLine: { position: 'absolute', top: 11, left: 4, width: 16, height: 1.6 },
  closeForward: { transform: [{ rotate: '45deg' }] },
  closeBackward: { transform: [{ rotate: '-45deg' }] },
  moneyOutline: {
    position: 'absolute',
    top: 5,
    left: 2,
    width: 20,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  moneyCircle: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  moneyLeft: { position: 'absolute', top: 10, left: 5, width: 1.4, height: 4 },
  moneyRight: {
    position: 'absolute',
    top: 10,
    left: 18,
    width: 1.4,
    height: 4,
  },
  checkShort: {
    position: 'absolute',
    top: 13,
    left: 5,
    width: 7,
    height: 1.8,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    top: 10.5,
    left: 9,
    width: 12,
    height: 1.8,
    transform: [{ rotate: '-45deg' }],
  },
  alertLine: { position: 'absolute', top: 6, left: 11, width: 1.7, height: 7 },
  alertDot: {
    position: 'absolute',
    top: 15,
    left: 10.8,
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  canvas: { position: 'absolute', width: 24, height: 24 },
  searchRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderWidth: 1.8,
    borderRadius: 7,
  },
  searchHandle: {
    position: 'absolute',
    top: 17,
    left: 14,
    width: 9,
    height: 1.8,
    transform: [{ rotate: '45deg' }],
  },
  filterLine: { position: 'absolute', left: 3, width: 18, height: 1.5 },
  filterKnob: { position: 'absolute', width: 3, height: 7, borderRadius: 1 },
  plusHorizontal: {
    position: 'absolute',
    width: 16,
    height: 1.8,
    left: 4,
    top: 11,
  },
  plusVertical: {
    position: 'absolute',
    width: 1.8,
    height: 16,
    left: 11,
    top: 4,
  },
  pencilGroup: {
    position: 'absolute',
    width: 6,
    height: 18,
    left: 9,
    top: 3,
    transform: [{ rotate: '45deg' }],
  },
  pencilBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: 14,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  pencilBand: {
    position: 'absolute',
    top: 3,
    left: 1.4,
    width: 3.2,
    height: 1.3,
  },
  pencilNib: {
    position: 'absolute',
    left: 0,
    top: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowStem: {
    position: 'absolute',
    top: 11.2,
    left: 5,
    width: 15,
    height: 1.6,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    top: 8.5,
    left: 6,
    width: 7,
    height: 7,
    borderLeftWidth: 1.6,
    borderBottomWidth: 1.6,
    transform: [{ rotate: '45deg' }],
  },
  trashHandle: {
    position: 'absolute',
    top: 2,
    left: 8,
    width: 8,
    height: 4,
    borderWidth: 1.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  trashLid: { position: 'absolute', top: 6, left: 4, width: 16, height: 1.6 },
  trashBody: {
    position: 'absolute',
    top: 7,
    left: 6,
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  trashLineLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 1.4,
    height: 7,
  },
  trashLineRight: {
    position: 'absolute',
    top: 10,
    left: 14,
    width: 1.4,
    height: 7,
  },
  clockRing: {
    position: 'absolute',
    width: 19,
    height: 19,
    top: 2.5,
    left: 2.5,
    borderWidth: 1.7,
    borderRadius: 10,
  },
  clockMinute: {
    position: 'absolute',
    top: 6,
    left: 11,
    width: 1.6,
    height: 7,
  },
  clockHour: {
    position: 'absolute',
    top: 11.5,
    left: 11,
    width: 6,
    height: 1.6,
  },
  fieldBorder: {
    position: 'absolute',
    top: 5,
    left: 2,
    width: 20,
    height: 15,
    borderWidth: 1.6,
    borderRadius: 2,
  },
  fieldMiddle: {
    position: 'absolute',
    left: 11.3,
    top: 5,
    height: 15,
    width: 1.4,
  },
  fieldCircle: {
    position: 'absolute',
    left: 8,
    top: 8.5,
    width: 8,
    height: 8,
    borderWidth: 1.4,
    borderRadius: 4,
  },
  calendarBorder: {
    position: 'absolute',
    top: 4,
    left: 2,
    width: 20,
    height: 18,
    borderWidth: 1.6,
    borderRadius: 2,
  },
  calendarTop: {
    position: 'absolute',
    top: 9,
    left: 3,
    width: 18,
    height: 1.4,
  },
  bindingLeft: { position: 'absolute', top: 1, left: 7, height: 6, width: 1.6 },
  bindingRight: {
    position: 'absolute',
    top: 1,
    left: 16,
    height: 6,
    width: 1.6,
  },
  calendarDay: {
    position: 'absolute',
    left: 7,
    top: 13,
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  chartBorder: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderWidth: 1.6,
    borderRadius: 2,
  },
  chartBar: { position: 'absolute', bottom: 5, width: 2, borderRadius: 1 },
  gearRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    top: 4,
    left: 4,
    borderWidth: 1.7,
    borderRadius: 8,
  },
  gearTooth: {
    position: 'absolute',
    width: 3,
    height: 5,
    top: 9.5,
    left: 10.5,
    borderRadius: 1,
  },
  gearCenter: {
    position: 'absolute',
    width: 6,
    height: 6,
    top: 9,
    left: 9,
    borderWidth: 1.6,
    borderRadius: 3,
  },
  chevron: {
    position: 'absolute',
    top: 8,
    left: 7,
    width: 8,
    height: 8,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    transform: [{ rotate: '45deg' }],
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTile: { backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.55 },
  disabled: { opacity: 0.4 },
});
