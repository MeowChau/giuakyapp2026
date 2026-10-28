import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Field } from '../types';
import { cardShadow, colors, radius, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';
import { StatusBadge } from './ui';
import { Icon, IconButton } from './Icon';

const fieldImage = require('../../assets/fields/mini-football.png');

export function FieldCard({
  field,
  bookingCount,
  onOpen,
  onEdit,
  onDelete,
  deleting,
}: {
  field: Field;
  bookingCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${field.name}, sân ${
          field.type
        }, ${formatMoney(field.pricePerHour)} mỗi giờ, ${field.status}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.media}>
          <Image
            source={fieldImage}
            resizeMode="cover"
            style={styles.photo}
            accessible={false}
          />
          <View style={styles.photoBadges}>
            <StatusBadge status={field.status} />
            <View style={styles.typeTag}>
              <Text style={styles.typeLabel}>Sân {field.type}</Text>
            </View>
          </View>
          <View style={styles.photoCaption}>
            <Icon name="field" size={13} color={colors.primary} />
            <Text style={styles.captionLabel}>Ảnh minh hoạ</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{field.name}</Text>
            <View style={styles.bookingCount}>
              <Icon name="clock" size={14} color={colors.primary} />
              <Text style={styles.bookingLabel}>{bookingCount} lượt đặt</Text>
            </View>
          </View>
          <Text style={styles.price}>
            {formatMoney(field.pricePerHour)}
            <Text style={styles.perHour}>/giờ</Text>
          </Text>
        </View>
      </Pressable>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chi tiết ${field.name}`}
          onPress={onOpen}
          style={({ pressed }) => [
            styles.detailLink,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.detailLabel}>Chi tiết</Text>
          <Icon name="chevron" size={16} />
        </Pressable>
        <View style={styles.actions}>
          <IconButton
            name="edit"
            label={`Sửa ${field.name}`}
            onPress={onEdit}
            disabled={deleting}
          />
          <IconButton
            name="trash"
            label={`Xoá ${field.name}`}
            danger
            onPress={onDelete}
            loading={deleting}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardShadow,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  main: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  pressed: { opacity: 0.7 },
  media: {
    aspectRatio: 2.4,
    overflow: 'hidden',
    borderTopLeftRadius: radius.lg - 1,
    borderTopRightRadius: radius.lg - 1,
    backgroundColor: colors.skeleton,
  },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  photoBadges: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeTag: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.imageOverlay,
  },
  typeLabel: { ...typography.caption, fontWeight: '600', color: colors.white },
  photoCaption: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.imageTag,
  },
  captionLabel: { ...typography.caption, fontSize: 11, color: colors.text },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { ...typography.heading, color: colors.text, flex: 1 },
  price: { ...typography.title, fontWeight: '700', color: colors.primary },
  perHour: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookingCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: colors.input,
    maxWidth: '44%',
  },
  bookingLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  actions: { flexDirection: 'row' },
  detailLink: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  detailLabel: { ...typography.label, color: colors.secondary },
});
