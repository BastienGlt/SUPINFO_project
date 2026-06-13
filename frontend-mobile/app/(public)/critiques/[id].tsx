import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { apiFetch } from '@/services/apiService';
import { ArrowLeft } from 'lucide-react-native';

interface Rating {
  id: number;
  oeuvre_id: number;
  note: number;
  contenu?: string;
  oeuvre_titre?: string;
  created_at?: string;
}

interface RatingsResponse {
  critiques: Rating[];
  pagination: { limit: number; offset: number; total: number };
  user?: { pseudo?: string; photo?: string };
}

export default function PublicCritiquesScreen() {
  const { id, pseudo, photo } = useLocalSearchParams<{ id: string; pseudo?: string; photo?: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRatings = useCallback(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) return Promise.resolve();
    return apiFetch<RatingsResponse>(`/users/${userId}/ratings`)
      .then((data) => setRatings(Array.isArray(data.critiques) ? data.critiques : []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const userId = parseInt(id ?? '0', 10);
    if (!userId) { setLoading(false); return; }
    fetchRatings().finally(() => setLoading(false));
  }, [fetchRatings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRatings().finally(() => setRefreshing(false));
  }, [fetchRatings]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {pseudo ? `Critiques de @${pseudo}` : 'Critiques'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : ratings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.icon, fontSize: 15 }}>Aucune critique pour l\'instant.</Text>
        </View>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.critiqueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() =>
                router.push({
                  pathname: '/(public)/critique/[id]',
                  params: {
                    id: item.id,
                    author_pseudo: pseudo ?? '',
                    author_photo: photo ?? '',
                    oeuvre_titre: item.oeuvre_titre ?? '',
                    note: String(item.note),
                    contenu: item.contenu ?? '',
                  },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.critiqueHeader}>
                <Text style={[styles.critiqueGame, { color: colors.text }]} numberOfLines={1}>
                  {item.oeuvre_titre ?? `Jeu #${item.oeuvre_id}`}
                </Text>
                <View style={[styles.noteBadge, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}>
                  <Text style={[styles.noteText, { color: colors.tint }]}>{item.note}/5</Text>
                </View>
              </View>
              {item.contenu ? (
                <Text style={[styles.critiqueContent, { color: colors.icon }]} numberOfLines={2}>
                  "{item.contenu}"
                </Text>
              ) : null}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  critiqueCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  critiqueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  critiqueGame: { fontWeight: '700', fontSize: 15, flex: 1 },
  noteBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  noteText: { fontWeight: '800', fontSize: 13 },
  critiqueContent: { fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
});
