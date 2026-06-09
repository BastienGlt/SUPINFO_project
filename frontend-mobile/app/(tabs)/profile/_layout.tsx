import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ProfileLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      headerBackVisible: false,
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
