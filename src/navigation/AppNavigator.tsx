import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, PitchGraphic, ScreenHeader } from '../components/ui';
import { FieldListSkeleton } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { FieldDetailScreen } from '../screens/FieldDetailScreen';
import { FieldFormScreen } from '../screens/FieldFormScreen';
import { MainTabs } from '../screens/MainTabs';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export function AppNavigator() {
  const { status, loadError, retry } = useApp();
  const reducedMotion = useReducedMotion();

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ScreenHeader title="Sân bóng" subtitle="Đang tải danh sách sân…" />
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <FieldListSkeleton initial />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.startup}>
        <PitchGraphic large />
        <Text style={styles.title}>FootballFieldApp</Text>
        <>
          <Text style={styles.errorTitle}>Chưa mở được dữ liệu</Text>
          <Text style={styles.message}>{loadError}</Text>
          <View style={styles.retry}>
            <Button title="Thử lại" onPress={retry} />
          </View>
        </>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="FieldList"
        screenOptions={{
          headerShown: false,
          animation: reducedMotion ? 'none' : 'default',
          contentStyle: styles.content,
        }}
      >
        <Stack.Screen name="FieldList" component={MainTabs} />
        <Stack.Screen name="FieldForm" component={FieldFormScreen} />
        <Stack.Screen name="FieldDetail" component={FieldDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: colors.background },
  loadingContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  content: { backgroundColor: colors.background },
  startup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  title: { ...typography.title, color: colors.primary, textAlign: 'center' },
  message: { ...typography.body, color: colors.secondary, textAlign: 'center' },
  errorTitle: {
    ...typography.heading,
    color: colors.danger,
    textAlign: 'center',
  },
  retry: { alignSelf: 'stretch', marginTop: spacing.lg },
});
