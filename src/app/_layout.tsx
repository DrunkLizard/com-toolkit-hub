import { StatusBar } from 'expo-status-bar';
import { Shell } from '@/components/Shell';
import { ToolkitProvider } from '@/components/ToolkitContext';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <ToolkitProvider>
      <StatusBar style="light" />
      <Shell />
      <Analytics />
    </ToolkitProvider>
  );
}