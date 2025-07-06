import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AnalysisResultContext } from './index';

const HomeIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="house.fill" color={color} />
);

const MeasureIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="camera.fill" color={color} />
);

const StoreIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="cart.fill" color={color} />
);

const ScanIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="barcode.viewfinder" color={color} />
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [result, setResult] = React.useState(null);

  return (
    <AnalysisResultContext.Provider value={{ result, setResult }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].muted,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderTopWidth: 0,
              elevation: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            default: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: Colors[colorScheme ?? 'light'].border,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: HomeIcon,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="image-upload"
          options={{
            title: 'Image',
            tabBarIcon: MeasureIcon,
          }}
        />
        <Tabs.Screen
          name="qr-scan"
          options={{
            title: 'QR Scan',
            tabBarIcon: ScanIcon,
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
            title: 'Store',
            tabBarIcon: StoreIcon,
          }}
        />
      </Tabs>
    </AnalysisResultContext.Provider>
  );
}
