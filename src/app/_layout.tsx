import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { PerfOverlayRoot } from '@/components/perf/PerfOverlayRoot';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AppTabs />
          <PerfOverlayRoot />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
