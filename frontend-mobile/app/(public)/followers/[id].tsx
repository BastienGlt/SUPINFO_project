import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { ArrowLeft, User, Lock } from 'lucide-react-native';

interface FollowUser {
  id: number;
  pseudo: string;
  prenom: string;
  nom: string;
  photo?: string;
}

export default function PublicFollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuth();

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) { setLoading(false); return; }
    apiFetch<Record<string, unknown>[]>(`/users/${userId}/followers`, { token })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFollowers(list.map((item) => ({
          id: (item.follower_id ?? item.id) as number,
          pseudo: (item.follower_pseudo ?? item.pseudo ?? '') as string,
          prenom: (item.follower_prenom ?? item.prenom ?? '') as string,
          nom: (item.follower_nom ?? item.nom ?? '') as string,
          photo: (item.follower_photo ?? item.photo) as string | undefined,
        })));
      })
      .catch((err: { status?: number; is_private?: boolean }) => {
        if (err.status === 403 && err.is_private) setIsPrivate(true);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Abonnés</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : isPrivate ? (
        <View style={styles.centered}>
          <Lock size={28} color={colors.icon} strokeWidth={1.5} />
          <Text style={[styles.privateText, { color: colors.icon }]}>Ce compte est privé</Text>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.icon, fontSize: 15 }}>Aucun abonné pour l'instant.</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/(public)/user/[id]', params: { id: item.id } })}
              activeOpacity={0.8}
            >
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '25' }]}>
                  <User size={20} color={colors.tint} strokeWidth={2} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.prenom} {item.nom}</Text>
                <Text style={[styles.userPseudo, { color: colors.tint }]}>@{item.pseudo}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36 },
  title: { fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  privateText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userPseudo: { fontSize: 13, fontWeight: '500', marginTop: 1 },
});
