import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { ChevronLeft, User, ArrowLeft } from 'lucide-react-native';

interface FollowUser {
  id: number;
  pseudo: string;
  prenom: string;
  nom: string;
  photo?: string;
}

export default function FollowingScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, token } = useAuth();

  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<Record<string, unknown>[]>(`/users/${user.id}/following`, { token })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFollowing(list.map((item) => ({
          id: (item.followed_id ?? item.id) as number,
          pseudo: (item.followed_pseudo ?? item.pseudo ?? '') as string,
          prenom: (item.followed_prenom ?? item.prenom ?? '') as string,
          nom: (item.followed_nom ?? item.nom ?? '') as string,
          photo: (item.followed_photo ?? item.photo) as string | undefined,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <>
      <Stack.Screen options={{
        title: 'Abonnements',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={24} color={colors.tint} strokeWidth={2.5} />
          </TouchableOpacity>
        ),
      }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.icon, fontSize: 15 }}>Aucun abonnement pour l'instant.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
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
                <View style={[styles.avatarFallback, { backgroundColor: colors.tintDim }]}>
                  <User size={20} color={colors.tint} strokeWidth={2} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {item.prenom} {item.nom}
                </Text>
                <Text style={[styles.userPseudo, { color: colors.tint }]}>@{item.pseudo}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
