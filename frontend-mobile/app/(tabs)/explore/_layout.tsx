import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';

export default function ExploreLayout() {
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

  return <Stack screenOptions={commonHeaderOptions} />;
}
