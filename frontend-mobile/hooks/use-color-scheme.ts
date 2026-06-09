import { useTheme } from '@/context/ThemeContext';

export function useColorScheme() {
  return useTheme().colorScheme;
}

