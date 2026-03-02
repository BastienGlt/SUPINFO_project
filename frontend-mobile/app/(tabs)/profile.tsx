import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';

export default function ProfileTabScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, loading } = useAuth();

  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [critiquesCount, setCritiquesCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ followers: number; following: number }>(`/users/${user.id}/follow-stats`)
      .then(setFollowStats)
      .catch(() => {});
    apiFetch<unknown[]>(`/users/${user.id}/ratings`)
      .then((data) => setCritiquesCount(data.length))
      .catch(() => {});
  }, [user?.id]);

  if (loading) return null;

  // Non connecté : invite à se connecter
  if (!user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.guestEmoji}>🔒</Text>
        <Text style={[styles.guestTitle, { color: colors.text }]}>Connectez-vous</Text>
        <Text style={[styles.guestSub, { color: colors.icon }]}>
          Créez votre profil, gérez votre bibliothèque et suivez la communauté.
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(public)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.profileHeader}
        onPress={() => router.push('/(private)/profile')}
        activeOpacity={0.8}
      >
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '30' }]}>
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>
              {user.prenom?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user.prenom} {user.nom}
          </Text>
          <Text style={[styles.pseudo, { color: colors.tint }]}>@{user.pseudo}</Text>
        </View>
        <Text style={[styles.chevron, { color: colors.icon }]}>›</Text>
      </TouchableOpacity>

      <View style={[styles.statsRow, { borderColor: colors.tabIconDefault + '30' }]}>
        <StatItem label="Abonnés" value={followStats.followers} colors={colors} />
        <StatItem label="Abonnements" value={followStats.following} colors={colors} />
        <StatItem label="Critiques" value={critiquesCount} colors={colors} />
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="🗂️"
          label="Ma Collection"
          description="Gérez vos jeux"
          onPress={() => router.push('/(private)/bibliotheque')}
          colors={colors}
        />
        <MenuItem
          icon="🔔"
          label="Notifications"
          description="Vos alertes récentes"
          onPress={() => router.push('/(private)/notifications')}
          colors={colors}
        />
        <MenuItem
          icon="👤"
          label="Mon Profil"
          description="Modifier mes informations"
          onPress={() => router.push('/(private)/profile')}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, colors }: { label: string; value: number; colors: typeof Colors.light }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon, label, description, onPress, colors,
}: {
  icon: string; label: string; description: string; onPress: () => void; colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.tabIconDefault + '15', borderColor: colors.tabIconDefault + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.menuDesc, { color: colors.icon }]}>{description}</Text>
      </View>
      <Text style={[styles.menuChevron, { color: colors.icon }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  guestEmoji: { fontSize: 56 },
  guestTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  guestSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  loginButton: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginTop: 8 },
  loginButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700' },
  pseudo: { fontSize: 14, fontWeight: '500' },
  chevron: { fontSize: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, marginHorizontal: 16 },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  menuSection: { padding: 16, gap: 10, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  menuIcon: { fontSize: 26 },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDesc: { fontSize: 12 },
  menuChevron: { fontSize: 22 },
});
