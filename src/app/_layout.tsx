import { StatusBar } from 'expo-status-bar';
import { Shell } from '@/components/Shell';
import { ToolkitProvider } from '@/components/ToolkitContext';
import { Analytics } from '@vercel/analytics/react';
import { View } from 'react-native';

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