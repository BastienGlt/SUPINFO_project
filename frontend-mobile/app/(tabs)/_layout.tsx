import { Tabs, router } from 'expo-router';
import React from 'react';
import { User, Telescope, House} from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { TouchableOpacity, Text } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerRight: () =>
          !user ? (
            <TouchableOpacity
              onPress={() => router.push('/(public)/auth/login')}
              style={{ marginRight: 16, backgroundColor: colors.tint + '20', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}
            >
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 14 }}>Connexion</Text>
            </TouchableOpacity>
          ) : null,
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Fil d\'actualité',
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <House size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarLabel: 'Explorer',
          tabBarIcon: ({ color }) => <Telescope size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: user ? 'Mon Profil' : 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <User size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
