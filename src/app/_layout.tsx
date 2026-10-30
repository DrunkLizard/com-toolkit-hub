import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { Shell } from '@/components/Shell';
import { ToolkitProvider } from '@/components/ToolkitContext';
<<<<<<< HEAD

// Dynamically import or conditionally render Analytics to prevent SSR compilation failures
let Analytics: any = () => null;
if (Platform.OS === 'web') {
  try {
    Analytics = require('@vercel/analytics/react').Analytics;
  } catch (e) {
    // Fallback if unavailable
  }
}
=======
import { Analytics } from '@vercel/analytics/react';
import { View } from 'react-native';
>>>>>>> aecf40d (Add full-height View wrapper to root layout for web rendering)

export default function RootLayout() {
  return (
    <View style={{ flex: 1, width: '100%', minHeight: '100vh' }}>
      <ToolkitProvider>
        <StatusBar style="light" />
        <Shell />
        <Analytics />
      </ToolkitProvider>
    </View>
  );
}