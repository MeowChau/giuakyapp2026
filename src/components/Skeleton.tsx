import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cardShadow, colors, radius, spacing } from '../theme';

function Skeleton({
  children,
  label,
  testID,
}: {
  children: React.ReactNode;
  label: string;
  testID: string;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    // One native animation drives all placeholders in this group.
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      opacity.stopAnimation();
    };
  }, [opacity, reducedMotion]);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ opacity }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export function FieldListSkeleton({ initial = false }: { initial?: boolean }) {
  return (
    <Skeleton label="Đang tải danh sách sân" testID="field-list-skeleton">
      {initial ? (
        <View>
          <View style={styles.toolbar}>
            <View style={[styles.block, styles.search]} />
            <View style={[styles.block, styles.addButton]} />
          </View>
          <View style={styles.filters}>
            <View style={[styles.block, styles.filter]} />
            <View style={[styles.block, styles.filter]} />
            <View style={[styles.block, styles.filter]} />
          </View>
        </View>
      ) : null}
      {[0, 1, 2].map(index => (
        <View key={index} style={styles.card}>
          <View style={[styles.block, styles.photo]} />
          <View style={styles.fieldBody}>
            <View style={styles.row}>
              <View style={[styles.block, styles.fieldName]} />
              <View style={[styles.block, styles.badge]} />
            </View>
            <View style={[styles.block, styles.price]} />
          </View>
          <View style={styles.fieldFooter}>
            <View style={[styles.block, styles.count]} />
            <View style={styles.actions}>
              <View style={[styles.block, styles.action]} />
              <View style={[styles.block, styles.action]} />
            </View>
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

export function BookingListSkeleton() {
  return (
    <Skeleton label="Đang tải lịch đặt sân" testID="booking-list-skeleton">
      {[0, 1].map(index => (
        <View key={index} style={[styles.card, styles.bookingBody]}>
          <View style={[styles.block, styles.date]} />
          <View style={[styles.block, styles.time]} />
          <View style={[styles.block, styles.customer]} />
          <View style={[styles.block, styles.phone]} />
          <View style={styles.bookingFooter}>
            <View style={[styles.block, styles.price]} />
            <View style={[styles.block, styles.action]} />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
  toolbar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  search: { flex: 1, height: 52, borderRadius: radius.md },
  addButton: { width: 106, height: 52, borderRadius: radius.md },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  filter: { height: 48, flex: 1, borderRadius: radius.md },
  card: {
    ...cardShadow,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  photo: {
    aspectRatio: 2.4,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  fieldBody: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: { height: 22, width: '26%' },
  fieldName: { height: 26, width: '52%' },
  price: { height: 26, width: '45%' },
  fieldFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: { height: 14, width: '24%' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { width: 36, height: 36, borderRadius: radius.md },
  bookingBody: { padding: spacing.xl, gap: spacing.sm },
  date: { width: '52%', height: 20 },
  time: { width: '65%', height: 28 },
  customer: { width: '60%', height: 24, marginTop: spacing.lg },
  phone: { width: '42%', height: 24 },
  bookingFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
