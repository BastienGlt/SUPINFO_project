import {
  FlatList, View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Search, Gamepad2, Star, X } from 'lucide-react-native';
import { rawgFetch } from '@/services/rawgService';

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  genres: { id: number; name: string }[];
  released: string | null;
}

interface RawgGamesResponse {
  count: number;
  next: string | null;
  results: RawgGame[];
}

function metacriticColor(score: number) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [games, setGames] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef('');

  const loadGames = useCallback((search: string, pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const params: Record<string, string | number> = { page_size: 20, page: pageNum };
    if (search.trim()) {
      params.search = search.trim();
    } else {
      params.ordering = '-rating';
    }

    rawgFetch<RawgGamesResponse>('/games', params)
      .then((data) => {
        const results = data.results ?? [];
        setGames((prev) => (append ? [...prev, ...results] : results));
        setHasMore(!!data.next);
        setPage(pageNum);
      })
      .catch(() => { if (!append) setGames([]); })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, []);

  useEffect(() => { loadGames('', 1, false); }, [loadGames]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    queryRef.current = text;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { loadGames(text, 1, false); }, 400);
  }, [loadGames]);

  const handleClear = useCallback(() => {
    setQuery('');
    queryRef.current = '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadGames('', 1, false);
  }, [loadGames]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    loadGames(queryRef.current, page + 1, true);
  }, [hasMore, loadingMore, loading, page, loadGames]);

  const renderGame = useCallback(({ item }: { item: RawgGame }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: '/(public)/game/[id]', params: { id: item.id } })}
      activeOpacity={0.85}
    >
      {item.background_image ? (
        <Image source={item.background_image} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImageFallback, { backgroundColor: colors.tint + '18' }]}>
          <Gamepad2 size={28} color={colors.tint} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardMeta}>
          {item.metacritic != null && (
            <View style={[styles.metacriticBadge, { backgroundColor: metacriticColor(item.metacritic) + '20' }]}>
              <Text style={[styles.metacriticText, { color: metacriticColor(item.metacritic) }]}>
                {item.metacritic}
              </Text>
            </View>
          )}
          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Star size={10} color={colors.tint} fill={colors.tint} strokeWidth={0} />
              <Text style={[styles.ratingText, { color: colors.icon }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        {item.genres.length > 0 && (
          <Text style={[styles.genres, { color: colors.icon }]} numberOfLines={1}>
            {item.genres.slice(0, 2).map((g) => g.name).join(' · ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ), [colors, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Barre de recherche */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.icon} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Rechercher un jeu…"
          placeholderTextColor={colors.tabIconDefault}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7} hitSlop={8}>
            <X size={16} color={colors.icon} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGame}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Gamepad2 size={44} color={colors.icon} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                Aucun jeu trouvé
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  row: { gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 110 },
  cardImageFallback: { width: '100%', height: 110, justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metacriticBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  metacriticText: { fontWeight: '800', fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '500' },
  genres: { fontSize: 11, marginTop: 2 },
  footer: { paddingVertical: 20, alignItems: 'center' },
});
