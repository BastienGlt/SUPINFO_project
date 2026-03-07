import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
// Lucide uniquement — emojis supprimés
import { Gamepad2, Star, Users, BookOpen, LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { login, loading, user, isNewUser } = useAuth();

  // Si déjà connecté, revenir aux tabs ; si nouvel utilisateur, compléter le profil
  useEffect(() => {
    if (user) router.replace('/(tabs)/');
    else if (isNewUser) router.replace('/(private)/complete-profile');
  }, [user, isNewUser]);

  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Zone logo */}
      <View style={styles.header}>
        <View style={[styles.logoWrap, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '40' }]}>
          <Gamepad2 size={48} color={colors.tint} strokeWidth={1.5} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>GameCritique</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          La communauté des passionnés de jeux vidéo
        </Text>
      </View>

      {/* Fonctionnalités groupées dans une carte */}
      <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FeatureItem icon={<Star size={20} color={colors.tint} />} text="Notez et critiquez vos jeux" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <FeatureItem icon={<Users size={20} color={colors.tint} />} text="Suivez la communauté" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <FeatureItem icon={<BookOpen size={20} color={colors.tint} />} text="Gérez votre bibliothèque" colors={colors} />
      </View>

      {/* Bouton connexion */}
      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={colors.tint} size="large" />
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.tint }]}
            onPress={login}
            activeOpacity={0.85}
          >
            <LogIn size={18} color="white" strokeWidth={2.5} />
            <Text style={styles.loginButtonText}>Se connecter avec Auth0</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.disclaimer, { color: colors.icon }]}>
          En continuant, vous acceptez nos conditions d'utilisation
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({
  icon,
  text,
  colors,
}: {
  icon: React.ReactNode;
  text: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconWrap, { backgroundColor: colors.tint + '14' }]}>{icon}</View>
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 72,
  },
  header: {
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Les features sont maintenant dans une carte avec séparateurs
  featuresCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  actions: {
    gap: 14,
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
  },
});
