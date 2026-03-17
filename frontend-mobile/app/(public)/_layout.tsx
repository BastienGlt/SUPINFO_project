import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ title: 'Profil' }} />
      <Stack.Screen name="critique/[id]" options={{ title: 'Critique' }} />
      <Stack.Screen name="game/[id]" options={{ title: 'Jeu' }} />
    </Stack>
  );
}
