import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AnalysisResultContext } from './index';

const HomeIcon = ({ color }: { color: string }) => (
  <Ionicons name="home" size={24} color={color} />
);

const StoreIcon = ({ color }: { color: string }) => (
  <Ionicons name="bag" size={24} color={color} />
);

const TryOnIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="tshirt-crew" size={24} color={color} />
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Ionicons name="person-circle" size={24} color={color} />
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [result, setResult] = React.useState(null);

  const contextValue = React.useMemo(() => ({ result, setResult }), [result, setResult]);

  return (
    <AnalysisResultContext.Provider value={contextValue}>
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
              bottom: 25,
              left: 20,
              right: 20,
              height: 70,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 25,
              borderTopWidth: 0,
              elevation: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              paddingBottom: 10,
              paddingTop: 10,
            },
            default: {
              position: 'absolute',
              bottom: 25,
              left: 20,
              right: 20,
              height: 70,
              backgroundColor: '#FFFFFF',
              borderRadius: 25,
              borderTopWidth: 0,
              elevation: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              paddingBottom: 10,
              paddingTop: 10,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
            textAlign: 'center',
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
          name="tryon"
          options={{
        title: 'Try On',
        tabBarIcon: TryOnIcon,
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
        title: 'Store',
        tabBarIcon: StoreIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
        title: 'Profile',
        tabBarIcon: ProfileIcon,
          }}
        />
      </Tabs>
    </AnalysisResultContext.Provider>
  );
}
