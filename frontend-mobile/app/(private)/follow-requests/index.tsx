import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Check, X, UserRound, ArrowLeft } from 'lucide-react-native';

interface FollowRequest {
  id: number;
  requester_id: number;
  pseudo: string;
  prenom: string;
  nom: string;
  photo: string | null;
  created_at: string;
}

export default function FollowRequestsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuth();

  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      apiFetch<FollowRequest[]>('/follow-requests', { token })
        .then((data) => setRequests(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [token])
  );

  const handleAction = async (id: number, action: 'accept' | 'reject') => {
    if (!token) return;
    setActionLoading(id);
    try {
      await apiFetch(`/follow-requests/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ action }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centered}>
          <UserRound size={40} color={colors.icon} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>Aucune demande en attente</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(public)/user/[id]', params: { id: item.requester_id } })}
                style={styles.userRow}
                activeOpacity={0.7}
              >
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.tintDim }]}>
                    <Text style={{ color: colors.tint, fontSize: 18, fontWeight: '700' }}>
                      {item.prenom?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.prenom} {item.nom}</Text>
                  <Text style={[styles.pseudo, { color: colors.tint }]}>@{item.pseudo}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actions}>
                {actionLoading === item.id ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                      onPress={() => handleAction(item.id, 'accept')}
                      activeOpacity={0.8}
                    >
                      <Check size={18} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }]}
                      onPress={() => handleAction(item.id, 'reject')}
                      activeOpacity={0.8}
                    >
                      <X size={18} color={colors.icon} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  pseudo: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
