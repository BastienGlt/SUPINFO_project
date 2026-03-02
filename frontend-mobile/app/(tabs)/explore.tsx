import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Explorer</Text>
      <Text style={[styles.heroSub, { color: colors.icon }]}>Découvrez des jeux et leurs critiques</Text>
      <Text style={[styles.placeholder, { color: colors.icon }]}>
        La liste des jeux sera disponible prochainement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  heroTitle: { fontSize: 26, fontWeight: '800' },
  heroSub: { fontSize: 14 },
  placeholder: { fontSize: 14, marginTop: 32, textAlign: 'center' },
});
