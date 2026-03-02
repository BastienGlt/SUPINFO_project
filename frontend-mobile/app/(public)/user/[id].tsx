import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { authService, type AppUser } from '@/services/authService';
import { apiFetch } from '@/services/apiService';

const ROLE_LABELS: Record<number, string> = { 1: 'Membre', 2: 'Modérateur', 3: 'Admin' };

interface Rating {
  id: number;
  oeuvre_id: number;
  note: number;
  contenu?: string;
  oeuvre_titre?: string;
}

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) { setNotFound(true); setLoading(false); return; }

    Promise.all([
      authService.getUserById(userId),
      apiFetch<{ followers: number; following: number }>(`/users/${userId}/follow-stats`),
      apiFetch<Rating[]>(`/users/${userId}/ratings`),
    ])
      .then(([user, stats, userRatings]) => {
        setProfileUser(user as AppUser);
        setFollowStats(stats);
        setRatings(userRatings);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (notFound || !profileUser) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Utilisateur introuvable.</Text>
      </View>
    );
  }

  const role = ROLE_LABELS[profileUser.role_id] ?? 'Membre';

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={styles.profileHeader}>
        {profileUser.photo ? (
          <Image source={{ uri: profileUser.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '30' }]}>
            <Text style={{ color: colors.tint, fontSize: 36, fontWeight: '700' }}>
              {profileUser.prenom?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>
          {profileUser.prenom} {profileUser.nom}
        </Text>
        <Text style={[styles.pseudo, { color: colors.tint }]}>@{profileUser.pseudo}</Text>
        <Text style={[styles.role, { color: colors.icon }]}>{role}</Text>
      </View>

      <View style={[styles.statsRow, { borderColor: colors.tabIconDefault }]}>
        <StatItem label="Abonnés" value={followStats.followers} colors={colors} />
        <StatItem label="Abonnements" value={followStats.following} colors={colors} />
        <StatItem label="Critiques" value={ratings.length} colors={colors} />
      </View>

      {profileUser.bio ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
          <Text style={[styles.bio, { color: colors.icon }]}>{profileUser.bio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Critiques récentes</Text>
        {ratings.length === 0 ? (
          <Text style={{ color: colors.icon }}>Aucune critique pour l'instant.</Text>
        ) : (
          ratings.map((r) => (
            <View key={r.id} style={[styles.critiqueCard, { backgroundColor: colors.tabIconDefault + '20', borderColor: colors.tabIconDefault }]}>
              <Text style={[styles.critiqueGame, { color: colors.text }]}>{r.oeuvre_titre ?? `Jeu #${r.oeuvre_id}`}</Text>
              <Text style={[styles.critiqueNote, { color: colors.tint }]}>{r.note}/20</Text>
              {r.contenu ? (
                <Text style={[styles.critiqueContent, { color: colors.icon }]} numberOfLines={2}>
                  "{r.contenu}"
                </Text>
              ) : null}
            </View>
          ))
        )}
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

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 8 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '700' },
  pseudo: { fontSize: 15, fontWeight: '600' },
  role: { fontSize: 13 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginHorizontal: 16, marginBottom: 8 },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  section: { paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  bio: { fontSize: 14, lineHeight: 21 },
  critiqueCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10, gap: 4 },
  critiqueGame: { fontWeight: '700', fontSize: 15 },
  critiqueNote: { fontWeight: '600', fontSize: 14 },
  critiqueContent: { fontSize: 13, fontStyle: 'italic' },
});
