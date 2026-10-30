import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
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
    <ToolkitProvider>
      <StatusBar style="light" />
      <Shell />
      <Analytics />
    </ToolkitProvider>
  );
}