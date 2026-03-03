import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect } from 'react';

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
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.tint }]}>🎮</Text>
        <Text style={[styles.title, { color: colors.text }]}>GameCritique</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Partagez vos avis sur les jeux vidéo
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureItem icon="⭐" text="Notez et critiquez vos jeux" colorScheme={colorScheme} />
        <FeatureItem icon="👥" text="Suivez la communauté" colorScheme={colorScheme} />
        <FeatureItem icon="📚" text="Gérez votre bibliothèque" colorScheme={colorScheme} />
      </View>

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={colors.tint} size="large" />
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.tint }]}
            onPress={login}
            activeOpacity={0.8}
          >
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

function FeatureItem({ icon, text, colorScheme }: { icon: string; text: string; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    gap: 16,
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
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
