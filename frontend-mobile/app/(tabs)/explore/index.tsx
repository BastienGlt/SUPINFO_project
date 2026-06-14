import {
  FlatList, View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, Platform, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Search, Gamepad2, Star, X, BookOpen, Check, Settings, Minus, Plus } from 'lucide-react-native';
import { rawgFetch } from '@/services/rawgService';
import { apiFetch } from '@/services/apiService';
import { useAuth } from '@/hooks/use-auth';

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

interface BiblioItem {
  id: number;
  oeuvre_id: number;
  statut: string;
  api_reference_id?: string;
}

const STATUTS = [
  { key: 'en_cours', label: 'En cours' },
  { key: 'envie',    label: 'Envie de jouer' },
  { key: 'terminé',  label: 'Terminé' },
] as const;

const POPULAR_GENRES = [
  { id: 4, name: 'Action' },
  { id: 5, name: 'Sports' },
  { id: 10, name: 'Strategy' },
  { id: 3, name: 'Adventure' },
  { id: 83, name: 'Arcade' },
  { id: 1, name: 'Racing' },
  { id: 14, name: 'Simulation' },
  { id: 15, name: 'Sports' },
  { id: 2, name: 'Shooter' },
  { id: 7, name: 'Puzzle' },
  { id: 11, name: 'Casual' },
  { id: 59, name: 'Massively Multiplayer' },
] as const;

function metacriticColor(score: number) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function ExploreScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const router = useRouter();
  const { user, token } = useAuth();

  const [query, setQuery]           = useState('');
  const [games, setGames]           = useState<RawgGame[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [collectionMap, setCollectionMap] = useState<Map<string, BiblioItem>>(new Map());
  const [selectedGame, setSelectedGame]   = useState<RawgGame | null>(null);
  const [statutModal, setStatutModal]     = useState(false);
  const [savingStatut, setSavingStatut]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [minMetacritic, setMinMetacritic] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef    = useRef('');

  const loadGames = useCallback((search: string, pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    const params: Record<string, string | number> = { page_size: 20, page: pageNum };
    if (search.trim()) params.search = search.trim();
    else params.ordering = '-rating';
    if (minRating > 0) params.min_rating = minRating;
    if (minMetacritic > 0) params.metacritic_gte = minMetacritic;
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',');
    rawgFetch<RawgGamesResponse>('/games', params)
      .then((data) => {
        const results = data.results ?? [];
        setGames((prev) => (append ? [...prev, ...results] : results));
        setHasMore(!!data.next);
        setPage(pageNum);
      })
      .catch(() => { if (!append) setGames([]); })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [minRating, minMetacritic, selectedGenres]);

  useEffect(() => { loadGames('', 1, false); }, [loadGames]);

  useFocusEffect(
    useCallback(() => {
      if (!user || !token) return;
      apiFetch<BiblioItem[]>('/bibliotheque/items', { token })
        .then((items) => {
          const map = new Map<string, BiblioItem>();
          for (const item of items) {
            if (item.api_reference_id) map.set(item.api_reference_id, item);
          }
          setCollectionMap(map);
        })
        .catch(() => {});
    }, [user?.id, token])
  );

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

  const toggleGenre = useCallback((genreId: number) => {
    setSelectedGenres((prev) => {
      const next = prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId];
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { loadGames(queryRef.current, 1, false); }, 400);
      return next;
    });
  }, [loadGames]);

  const handleRatingChange = useCallback((value: number) => {
    setMinRating(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { loadGames(queryRef.current, 1, false); }, 400);
  }, [loadGames]);

  const handleMetacriticChange = useCallback((value: number) => {
    setMinMetacritic(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { loadGames(queryRef.current, 1, false); }, 400);
  }, [loadGames]);

  const resetFilters = useCallback(() => {
    setSelectedGenres([]);
    setMinRating(0);
    setMinMetacritic(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { loadGames(queryRef.current, 1, false); }, 400);
  }, [loadGames]);

  const handleSetStatut = useCallback(async (statut: string) => {
    if (!token || !selectedGame) return;
    const gameId = String(selectedGame.id);
    const existing = collectionMap.get(gameId);
    setSavingStatut(true);
    try {
      if (existing) {
        await apiFetch(`/bibliotheque/items/${existing.id}`, { method: 'PUT', token, body: JSON.stringify({ statut }) });
        setCollectionMap((prev) => { const next = new Map(prev); next.set(gameId, { ...existing, statut }); return next; });
      } else {
        const data = await apiFetch<{ item_id: number }>('/bibliotheque/items', {
          method: 'POST', token,
          body: JSON.stringify({ api_reference_id: gameId, titre: selectedGame.name, statut }),
        });
        setCollectionMap((prev) => { const next = new Map(prev); next.set(gameId, { id: data.item_id, oeuvre_id: selectedGame.id, statut, api_reference_id: gameId }); return next; });
      }
      setStatutModal(false);
    } finally {
      setSavingStatut(false);
    }
  }, [token, selectedGame, collectionMap]);

  const renderGame = useCallback(({ item }: { item: RawgGame }) => {
    const inCollection = collectionMap.get(String(item.id));
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/(public)/game/[id]', params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <View>
          {item.background_image ? (
            <Image source={item.background_image} style={styles.cardImage} contentFit="cover" />
          ) : (
            <View style={[styles.cardImageFallback, { backgroundColor: colors.tintDim }]}>
              <Gamepad2 size={28} color={colors.tint} strokeWidth={1.5} />
            </View>
          )}
          {user && token && (
            <TouchableOpacity
              style={[styles.collectionBtn, { backgroundColor: inCollection ? colors.tint : colors.surface + 'cc' }]}
              onPress={(e) => { e.stopPropagation(); setSelectedGame(item); setStatutModal(true); }}
              activeOpacity={0.8}
              hitSlop={4}
            >
              {inCollection
                ? <Check size={12} color="#fff" strokeWidth={2.5} />
                : <BookOpen size={12} color={colors.icon} strokeWidth={2} />
              }
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.cardMeta}>
            {item.metacritic != null && (
              <View style={[styles.metacriticBadge, { backgroundColor: metacriticColor(item.metacritic) + '20' }]}>
                <Text style={[styles.metacriticText, { color: metacriticColor(item.metacritic) }]}>{item.metacritic}</Text>
              </View>
            )}
            {item.rating > 0 && (
              <View style={styles.ratingRow}>
                <Star size={10} color={colors.tint} fill={colors.tint} strokeWidth={0} />
                <Text style={[styles.ratingText, { color: colors.icon }]}>{item.rating.toFixed(1)}</Text>
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
    );
  }, [colors, router, user, token, collectionMap]);

  const currentStatut = selectedGame ? collectionMap.get(String(selectedGame.id))?.statut : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <TouchableOpacity onPress={() => setShowFilters(true)} activeOpacity={0.7} hitSlop={8}>
          <Settings size={18} color={colors.icon} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {(selectedGenres.length > 0 || minRating > 0 || minMetacritic > 0) && (
        <View style={[styles.activeFiltersBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.activeFiltersText, { color: colors.icon }]}>Filtres actifs</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={[styles.resetFiltersBtn, { color: colors.tint }]}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.tint} size="large" /></View>
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
              <Text style={[styles.emptyText, { color: colors.icon }]}>Aucun jeu trouvé</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator color={colors.tint} /></View> : null}
        />
      )}

      <Modal visible={statutModal} transparent animationType="slide" onRequestClose={() => setStatutModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatutModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selectedGame?.name}</Text>
              <TouchableOpacity onPress={() => setStatutModal(false)} hitSlop={8}>
                <X size={20} color={colors.icon} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>Ajouter à ma collection</Text>
            {STATUTS.map((s) => {
              const isSelected = currentStatut === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.statutItem,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.tintDim, borderColor: colors.tintBorder },
                  ]}
                  onPress={() => handleSetStatut(s.key)}
                  disabled={savingStatut}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.statutText, { color: isSelected ? colors.tint : colors.text }]}>{s.label}</Text>
                  {isSelected && (savingStatut
                    ? <ActivityIndicator size="small" color={colors.tint} />
                    : <Check size={16} color={colors.tint} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilters(false)}>
          <View style={[styles.filtersSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.filtersHeader}>
              <Text style={[styles.filtersTitle, { color: colors.text }]}>Filtrer les jeux</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} hitSlop={8}>
                <X size={20} color={colors.icon} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContent} showsVerticalScrollIndicator={false}>
              {/* Genres Filter */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Genres</Text>
                <View style={styles.genresList}>
                  {POPULAR_GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre.id}
                      style={[
                        styles.genreChip,
                        {
                          backgroundColor: selectedGenres.includes(genre.id)
                            ? colors.tint
                            : colors.tintDim,
                          borderColor: selectedGenres.includes(genre.id)
                            ? colors.tint
                            : colors.border,
                        },
                      ]}
                      onPress={() => toggleGenre(genre.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genreChipText,
                          {
                            color: selectedGenres.includes(genre.id)
                              ? '#fff'
                              : colors.text,
                          },
                        ]}
                      >
                        {genre.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Min Rating Filter */}
              <View style={styles.filterGroup}>
                <View style={styles.filterLabelRow}>
                  <Text style={[styles.filterLabel, { color: colors.text }]}>Note minimale</Text>
                  <Text style={[styles.filterValue, { color: colors.tint }]}>{minRating.toFixed(1)}</Text>
                </View>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: colors.tintDim }]}
                    onPress={() => handleRatingChange(Math.max(0, minRating - 0.5))}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color={colors.tint} strokeWidth={2} />
                  </TouchableOpacity>
                  <View style={[styles.valueDisplay, { backgroundColor: colors.tintDim, borderColor: colors.border }]}>
                    <Text style={[styles.valueDisplayText, { color: colors.text }]}>{minRating.toFixed(1)} ⭐</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: colors.tintDim }]}
                    onPress={() => handleRatingChange(Math.min(5, minRating + 0.5))}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.tint} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Min Metacritic Filter */}
              <View style={styles.filterGroup}>
                <View style={styles.filterLabelRow}>
                  <Text style={[styles.filterLabel, { color: colors.text }]}>Score Metacritic minimum</Text>
                  <Text style={[styles.filterValue, { color: colors.tint }]}>{Math.round(minMetacritic)}</Text>
                </View>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: colors.tintDim }]}
                    onPress={() => handleMetacriticChange(Math.max(0, minMetacritic - 10))}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color={colors.tint} strokeWidth={2} />
                  </TouchableOpacity>
                  <View style={[styles.valueDisplay, { backgroundColor: colors.tintDim, borderColor: colors.border }]}>
                    <Text style={[styles.valueDisplayText, { color: colors.text }]}>{Math.round(minMetacritic)} / 100</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: colors.tintDim }]}
                    onPress={() => handleMetacriticChange(Math.min(100, minMetacritic + 10))}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.tint} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  activeFiltersBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
  },
  activeFiltersText: { fontSize: 12, fontWeight: '600' },
  resetFiltersBtn: { fontSize: 12, fontWeight: '600' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:  { fontSize: 15 },
  list:       { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  row:        { gap: 12, marginBottom: 12 },
  card:       { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage:  { width: '100%', height: 110 },
  cardImageFallback: { width: '100%', height: 110, justifyContent: 'center', alignItems: 'center' },
  cardBody:   { padding: 10, gap: 4 },
  cardTitle:  { fontSize: 13, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metacriticBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  metacriticText:  { fontWeight: '800', fontSize: 11 },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '500' },
  genres:     { fontSize: 11, marginTop: 2 },
  footer:     { paddingVertical: 20, alignItems: 'center' },
  collectionBtn: {
    position: 'absolute', bottom: 6, right: 6,
    width: 24, height: 24, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '800', marginRight: 12 },
  modalSubtitle: { fontSize: 13, marginBottom: 4 },
  statutItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  statutText: { fontSize: 15, fontWeight: '600' },
  filtersSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  filtersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  filtersTitle: { fontSize: 16, fontWeight: '800' },
  filtersContent: { paddingHorizontal: 24, gap: 24 },
  filterGroup: { gap: 12, marginBottom: 20 },
  filterLabel: { fontSize: 14, fontWeight: '700' },
  filterLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterValue: { fontSize: 13, fontWeight: '600' },
  genresList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  genreChipText: { fontSize: 12, fontWeight: '600' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  valueDisplay: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  valueDisplayText: { fontSize: 13, fontWeight: '600' },
});
