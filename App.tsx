import React from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="dark-content" />
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
