import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';

export default function PublicLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

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
      <Stack.Screen name="auth/login" options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ ...commonHeaderOptions, title: 'Profil' }} />
      <Stack.Screen name="critique/[id]" options={{ ...commonHeaderOptions, title: 'Critique' }} />
      <Stack.Screen name="critiques/[id]" options={{ ...commonHeaderOptions, title: 'Critiques' }} />
      <Stack.Screen name="game/[id]" options={{ ...commonHeaderOptions, title: 'Jeu' }} />
      <Stack.Screen name="followers/[id]" options={{ ...commonHeaderOptions, title: 'Abonnés' }} />
      <Stack.Screen name="following/[id]" options={{ ...commonHeaderOptions, title: 'Abonnements' }} />
    </Stack>
  );
}
