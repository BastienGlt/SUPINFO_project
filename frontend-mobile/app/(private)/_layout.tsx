import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivateLayout() {
  const { user, isNewUser, loading } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (loading) return;
    if (!user && !isNewUser) {
      router.replace('/(public)/auth/login');
    } else if (isNewUser) {
      router.replace('/(private)/onboarding/complete-profile');
    }
  }, [user, isNewUser, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme].background }}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  const commonHeaderOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerLeft: () => (
      <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
        <ChevronLeft size={24} color={colors.tint} strokeWidth={2.5} />
      </TouchableOpacity>
    ),
  };

  return (
    <Stack>
      <Stack.Screen name="onboarding/complete-profile" options={{ title: 'Créer mon profil', headerBackVisible: false }} />
      <Stack.Screen name="library/index" options={{ ...commonHeaderOptions, title: 'Ma Collection' }} />
      <Stack.Screen name="notifications/index" options={{ ...commonHeaderOptions, title: 'Notifications' }} />
      <Stack.Screen name="settings/index" options={{ ...commonHeaderOptions, title: 'Mon Profil' }} />
      <Stack.Screen name="admin/index" options={{ ...commonHeaderOptions, title: 'Administration' }} />
      <Stack.Screen name="admin/users" options={{ ...commonHeaderOptions, title: 'Utilisateurs' }} />
      <Stack.Screen name="admin/critiques" options={{ ...commonHeaderOptions, title: 'Modération — Critiques' }} />
      <Stack.Screen name="admin/statuts" options={{ ...commonHeaderOptions, title: 'Statuts bibliothèque' }} />
      <Stack.Screen name="follow-requests/index" options={{ ...commonHeaderOptions, title: 'Demandes d\'abonnement' }} />
      <Stack.Screen name="liste/[id]" options={{ ...commonHeaderOptions, title: 'Liste' }} />
    </Stack>
  );
}
