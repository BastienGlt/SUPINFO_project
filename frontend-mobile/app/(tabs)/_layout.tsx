import { Tabs, router } from 'expo-router';
import React from 'react';
import { House, Telescope, User, LogIn } from 'lucide-react-native';
import { TouchableOpacity, Text, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
        },
        headerShown:       true,
        tabBarButton:      HapticTab,
        headerStyle:       { backgroundColor: colors.background },
        headerTintColor:   colors.text,
        headerShadowVisible: false,
        headerLeft: () => (
          <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.tint,  fontWeight: '900', fontSize: 17, letterSpacing: 0.4 }}>PROJET</Text>
            <Text style={{ color: colors.text,  fontWeight: '900', fontSize: 17, letterSpacing: 0.4 }}>SUPINFO</Text>
          </View>
        ),
        headerRight: () =>
          !user ? (
            <TouchableOpacity
              onPress={() => router.push('/(public)/auth/login')}
              style={{
                marginRight: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.tintDim,
                borderWidth: 1,
                borderColor: colors.tintBorder,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
              }}
              activeOpacity={0.8}
            >
              <LogIn size={15} color={colors.tint} strokeWidth={2.5} />
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Connexion</Text>
            </TouchableOpacity>
          ) : null,
        headerTitle: '',
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <House size={24} color={color} />,
          headerBackVisible: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Explorer',
          tabBarIcon: ({ color }) => <Telescope size={24} color={color} />,
          headerBackVisible: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerBackVisible: false,
        }}
      />
    </Tabs>
  );
}
