import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { Shell } from '@/components/Shell';
import { ToolkitProvider } from '@/components/ToolkitContext';

// Dynamically import or conditionally render Analytics to prevent SSR compilation failures
let Analytics: any = () => null;
if (Platform.OS === 'web') {
  try {
    Analytics = require('@vercel/analytics/react').Analytics;
  } catch (e) {
    // Fallback if unavailable
  }
}

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
