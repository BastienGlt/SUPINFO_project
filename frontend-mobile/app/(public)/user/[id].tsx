import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { authService, type AppUser } from '@/services/authService';
import { apiFetch } from '@/services/apiService';
import { useAuth } from '@/hooks/use-auth';
import { UserPlus, UserMinus, ShieldCheck } from 'lucide-react-native';

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
  const router = useRouter();

  // Contexte auth : token pour les actions follow + user pour savoir si c'est son propre profil
  const { token, user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // État du bouton follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) { setNotFound(true); setLoading(false); return; }

    // Chargement parallèle du profil, des stats et des critiques
    const requests: Promise<unknown>[] = [
      authService.getUserById(userId),
      apiFetch<{ followers: number; following: number }>(`/users/${userId}/follow-stats`),
      apiFetch<Rating[]>(`/users/${userId}/ratings`),
    ];

    // GET /users/{id}/is-following — vérifier si l'utilisateur connecté suit déjà ce profil
    if (token) {
      requests.push(
        apiFetch<Record<string, boolean>>(`/users/${userId}/is-following`, { token })
      );
    }

    Promise.all(requests)
      .then((results) => {
        setProfileUser(results[0] as AppUser);
        setFollowStats(results[1] as { followers: number; following: number });
        setRatings(results[2] as Rating[]);
        if (token && results[3]) {
          const followData = results[3] as Record<string, boolean>;
          setIsFollowing(followData.isFollowing ?? followData.is_following ?? false);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, token]);

  // POST /users/{id}/follow — suivre
  // DELETE /users/{id}/follow — se désabonner
  const handleFollow = useCallback(async () => {
    if (!token || !profileUser) return;
    setFollowLoading(true);
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      await apiFetch(`/users/${profileUser.id}/follow`, { method, token });
      // Mise à jour optimiste des stats et de l'état
      setIsFollowing((prev) => !prev);
      setFollowStats((prev) => ({
        ...prev,
        followers: prev.followers + (isFollowing ? -1 : 1),
      }));
    } catch {
      // Pas de rollback — l'utilisateur peut réessayer
    } finally {
      setFollowLoading(false);
    }
  }, [token, profileUser, isFollowing]);

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
  // Ne pas afficher le bouton si on consulte son propre profil
  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* En-tête profil */}
      <View style={styles.profileHeader}>
        {profileUser.photo ? (
          <Image source={{ uri: profileUser.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '25' }]}>
            <Text style={{ color: colors.tint, fontSize: 36, fontWeight: '700' }}>
              {profileUser.prenom?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>
          {profileUser.prenom} {profileUser.nom}
        </Text>
        <Text style={[styles.pseudo, { color: colors.tint }]}>@{profileUser.pseudo}</Text>

        {/* Badge de rôle */}
        <View style={[styles.roleBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
          <ShieldCheck size={11} color={colors.tint} strokeWidth={2.5} />
          <Text style={[styles.roleText, { color: colors.tint }]}>{role}</Text>
        </View>

        {/* Bouton follow — visible uniquement si connecté et pas son propre profil */}
        {token && !isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing
                ? { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.tint },
            ]}
            onPress={handleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.tint : 'white'} />
            ) : isFollowing ? (
              <>
                <UserMinus size={15} color={colors.icon} strokeWidth={2.5} />
                <Text style={[styles.followBtnText, { color: colors.icon }]}>Se désabonner</Text>
              </>
            ) : (
              <>
                <UserPlus size={15} color="white" strokeWidth={2.5} />
                <Text style={[styles.followBtnText, { color: 'white' }]}>Suivre</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <StatItem label="Abonnés" value={followStats.followers} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Abonnements" value={followStats.following} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Critiques" value={ratings.length} colors={colors} />
      </View>

      {profileUser.bio ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
          <Text style={[styles.bio, { color: colors.icon }]}>{profileUser.bio}</Text>
        </View>
      ) : null}

      {/* Critiques récentes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Critiques récentes</Text>
        {ratings.length === 0 ? (
          <Text style={{ color: colors.icon, fontSize: 14 }}>Aucune critique pour l'instant.</Text>
        ) : (
          ratings.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.critiqueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({
                pathname: '/(public)/critique/[id]',
                params: {
                  id: r.id,
                  author_pseudo: profileUser.pseudo,
                  author_photo: profileUser.photo ?? '',
                  oeuvre_titre: r.oeuvre_titre ?? '',
                  note: String(r.note),
                  contenu: r.contenu ?? '',
                },
              })}
              activeOpacity={0.8}
            >
              <View style={styles.critiqueHeader}>
                <Text style={[styles.critiqueGame, { color: colors.text }]}>
                  {r.oeuvre_titre ?? `Jeu #${r.oeuvre_id}`}
                </Text>
                <View style={[styles.noteBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
                  <Text style={[styles.noteText, { color: colors.tint }]}>{r.note}/20</Text>
                </View>
              </View>
              {r.contenu ? (
                <Text style={[styles.critiqueContent, { color: colors.icon }]} numberOfLines={2}>
                  "{r.contenu}"
                </Text>
              ) : null}
            </TouchableOpacity>
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
  container: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 8 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '800' },
  pseudo: { fontSize: 15, fontWeight: '600' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  roleText: { fontSize: 12, fontWeight: '600' },
  // Bouton follow/unfollow
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
    minWidth: 130,
    justifyContent: 'center',
  },
  followBtnText: { fontSize: 14, fontWeight: '700' },
  // Stats
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  section: { paddingHorizontal: 16, paddingVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  bio: { fontSize: 14, lineHeight: 22 },
  critiqueCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  critiqueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  critiqueGame: { fontWeight: '700', fontSize: 15, flex: 1 },
  noteBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  noteText: { fontWeight: '800', fontSize: 13 },
  critiqueContent: { fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
});
