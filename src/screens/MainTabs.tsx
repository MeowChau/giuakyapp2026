import React, { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import type { RootStackParamList } from '../types';
import { colors, spacing, typography } from '../theme';
import { FieldListScreen } from './FieldListScreen';
import {
  BookingsScreen,
  ReportsScreen,
  SettingsScreen,
} from './OverviewScreens';

type Tab = 'fields' | 'bookings' | 'reports' | 'settings';
const tabs: { id: Tab; title: string; icon: IconName }[] = [
  { id: 'fields', title: 'Sân bóng', icon: 'field' },
  { id: 'bookings', title: 'Lịch đặt', icon: 'calendar' },
  { id: 'reports', title: 'Báo cáo', icon: 'chart' },
  { id: 'settings', title: 'Cài đặt', icon: 'settings' },
];

export function MainTabs(
  props: NativeStackScreenProps<RootStackParamList, 'FieldList'>,
) {
  const [active, setActive] = useState<Tab>('fields');
  const [visited, setVisited] = useState<Tab[]>(['fields']);
  function select(tab: Tab) {
    setVisited(previous =>
      previous.includes(tab) ? previous : [...previous, tab],
    );
    setActive(tab);
  }
  useFocusEffect(
    useCallback(() => {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        if (active !== 'fields') {
          setActive('fields');
          return true;
        }
        return false;
      });
      return () => listener.remove();
    }, [active]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {visited.map(tab => (
          <View
            key={tab}
            testID={`main-tab-${tab}`}
            accessibilityElementsHidden={active !== tab}
            importantForAccessibility={
              active === tab ? 'auto' : 'no-hide-descendants'
            }
            style={active === tab ? styles.page : styles.hidden}
          >
            {tab === 'fields' ? (
              <FieldListScreen {...props} />
            ) : tab === 'bookings' ? (
              <BookingsScreen navigation={props.navigation} />
            ) : tab === 'reports' ? (
              <ReportsScreen navigation={props.navigation} />
            ) : (
              <SettingsScreen />
            )}
          </View>
        ))}
      </View>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.tabBar}>
        <View accessibilityRole="tablist" style={styles.tabRow}>
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityLabel={tab.title}
              accessibilityState={{ selected: active === tab.id }}
              onPress={() => select(tab.id)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={active === tab.id ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  active === tab.id && styles.activeLabel,
                ]}
              >
                {tab.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  page: { flex: 1 },
  hidden: { display: 'none' },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabRow: { flexDirection: 'row', paddingTop: spacing.xs },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  activeLabel: { color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
