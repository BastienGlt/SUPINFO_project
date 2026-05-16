import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { authService, type AppUser } from '@/services/authService';
import { apiFetch } from '@/services/apiService';
import { useAuth } from '@/hooks/use-auth';
import { UserPlus, UserMinus, ShieldCheck, Lock, Clock } from 'lucide-react-native';

const ROLE_LABELS: Record<number, string> = { 1: 'Membre', 2: 'Modérateur', 3: 'Admin' };

interface Rating {
  id: number;
  user_id?: number;
  oeuvre_id: number;
  note: number;
  contenu?: string;
  oeuvre_titre?: string;
  created_at?: string;
}

interface RatingsResponse {
  critiques: Rating[];
  pagination: { limit: number; offset: number; total: number };
}

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Contexte auth : token pour les actions follow + user pour savoir si c'est son propre profil
  const { token, user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsTotal, setRatingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // État du bouton follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) { setNotFound(true); setLoading(false); return; }

    authService.getUserById(userId)
      .then((u) => {
        setProfileUser(u);
        // Compte privé : l'API renvoie is_private=true et les stats retournent 403
        if (u.is_private) {
          setIsPrivate(true);
        } else {
          Promise.allSettled([
            apiFetch<{ followers: number; following: number }>(`/users/${userId}/follow-stats`),
            apiFetch<RatingsResponse>(`/users/${userId}/ratings`),
          ]).then(([statsResult, ratingsResult]) => {
            if (statsResult.status === 'fulfilled') {
              setFollowStats(statsResult.value);
            }
            if (ratingsResult.status === 'fulfilled') {
              const data = ratingsResult.value;
              setRatings(Array.isArray(data.critiques) ? data.critiques : []);
              setRatingsTotal(data.pagination?.total ?? data.critiques?.length ?? 0);
            }
          });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Rafraîchit le statut follow à chaque fois que l'écran prend le focus
  useFocusEffect(
    useCallback(() => {
      const userId = parseInt(id ?? '0', 10);
      if (!token || !userId) return;
      apiFetch<{ isFollowing: boolean }>(`/users/${userId}/is-following`, { token })
        .then((data) => {
          const following = data.isFollowing ?? false;
          setIsFollowing(following);
          if (following) setIsPending(false);
        })
        .catch(() => {});
    }, [id, token])
  );

  // POST /users/{id}/follow — suivre (201 public, 202 privé = demande en attente)
  // DELETE /users/{id}/follow — se désabonner ou annuler une demande
  const handleFollow = useCallback(async () => {
    if (!token || !profileUser) return;
    setFollowLoading(true);

    if (isPending) {
      try {
        await apiFetch(`/users/${profileUser.id}/follow`, { method: 'DELETE', token });
        setIsPending(false);
      } catch {
        // ignore
      } finally {
        setFollowLoading(false);
      }
      return;
    }

    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      const res = await apiFetch<{ success?: boolean; status?: string; request_id?: number }>(
        `/users/${profileUser.id}/follow`, { method, token }
      );
      if (method === 'POST' && res && 'status' in res && res.status === 'pending') {
        setIsPending(true);
      } else if (method === 'POST') {
        setIsFollowing(true);
        setFollowStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      } else {
        setIsFollowing(false);
        setFollowStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      }
    } catch (err) {
      if ((err as { status?: number })?.status === 409) {
        setIsFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  }, [token, profileUser, isFollowing, isPending]);

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
                : isPending
                ? { backgroundColor: 'transparent', borderColor: colors.tint, borderWidth: 1 }
                : { backgroundColor: colors.tint },
            ]}
            onPress={handleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.icon : colors.tint} />
            ) : isFollowing ? (
              <>
                <UserMinus size={15} color={colors.icon} strokeWidth={2.5} />
                <Text style={[styles.followBtnText, { color: colors.icon }]}>Se désabonner</Text>
              </>
            ) : isPending ? (
              <>
                <Clock size={15} color={colors.tint} strokeWidth={2.5} />
                <Text style={[styles.followBtnText, { color: colors.tint }]}>Demande envoyée</Text>
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

      {/* Stats + contenu : masqués si compte privé */}
      {isPrivate ? (
        <View style={[styles.privateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Lock size={28} color={colors.icon} strokeWidth={1.5} />
          <Text style={[styles.privateTitle, { color: colors.text }]}>Ce compte est privé</Text>
          <Text style={[styles.privateDesc, { color: colors.icon }]}>
            Abonnez-vous pour voir les critiques et les statistiques de ce profil.
          </Text>
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(public)/followers/[id]', params: { id } })}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{followStats.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Abonnés</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(public)/following/[id]', params: { id } })}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{followStats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Abonnements</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(public)/critiques/[id]', params: { id, pseudo: profileUser.pseudo, photo: profileUser.photo ?? '' } })}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{ratingsTotal}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Critiques</Text>
            </TouchableOpacity>
          </View>

          {profileUser.bio ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
              <Text style={[styles.bio, { color: colors.icon }]}>{profileUser.bio}</Text>
            </View>
          ) : null}

          {/* Critiques récentes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Critiques récentes</Text>
              {ratingsTotal > 0 && (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(public)/critiques/[id]', params: { id, pseudo: profileUser.pseudo, photo: profileUser.photo ?? '' } })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAll, { color: colors.tint }]}>Voir toutes ({ratingsTotal})</Text>
                </TouchableOpacity>
              )}
            </View>
            {ratings.length === 0 ? (
              <Text style={{ color: colors.icon, fontSize: 14 }}>Aucune critique pour l'instant.</Text>
            ) : (
              ratings.slice(0, 3).map((r) => (
                <TouchableOpacity
                  key={`${r.id}-${r.oeuvre_id}`}
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
        </>
      )}
    </ScrollView>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
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
  privateBox: {
    margin: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  privateTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  privateDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
