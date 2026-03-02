import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ActivityIndicator, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function PrivateLayout() {
  const { user, isNewUser, loading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (loading) return;
    if (!user && !isNewUser) {
      router.replace('/(public)/login');
    } else if (isNewUser) {
      router.replace('/(private)/complete-profile');
    }
  }, [user, isNewUser, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme].background }}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="complete-profile" options={{ title: 'Créer mon profil', headerBackVisible: false }} />
      <Stack.Screen name="bibliotheque" options={{ title: 'Ma Collection' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ title: 'Mon Profil' }} />
    </Stack>
  );
}
