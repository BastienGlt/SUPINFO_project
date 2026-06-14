import {
  FlatList, View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import {
  Heart, MessageSquare, TrendingUp, Search, X,
  Gamepad2, SendHorizonal, Rss, ChevronDown,
} from 'lucide-react-native';

const FEED_PAGE_SIZE = 10;

interface SearchUser {
  id: number;
  pseudo: string;
  prenom: string;
  nom: string;
  photo?: string;
}

interface FeedItem {
  id: number;
  type: string;
  author_id: number;
  author_pseudo: string;
  author_photo?: string;
  oeuvre_titre?: string;
  note?: number;
  contenu?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return iso; }
}

export default function FeedScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { token, user } = useAuth();
  const router = useRouter();

  const [latestReviews, setLatestReviews] = useState<FeedItem[]>([]);
  const [feed, setFeed]             = useState<FeedItem[]>([]);
  const [feedTotal, setFeedTotal]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedIds, setLikedIds]     = useState<Set<number>>(new Set());
  const [openCommentId, setOpenCommentId]   = useState<number | null>(null);
  const [commentTexts, setCommentTexts]     = useState<Record<number, string>>({});
  const [sendingIds, setSendingIds]         = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [searchFocused, setSearchFocused]   = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!text.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(() => {
      apiFetch<SearchUser[]>(`/users?search=${encodeURIComponent(text.trim())}`, token ? { token } : undefined)
        .then((d) => setSearchResults(Array.isArray(d) ? d : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 400);
  }, [token]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchFocused(false);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
  }, []);

  // Enrichit une liste de critiques (compte de commentaires, de likes, et si l'utilisateur a liké).
  // Chaque critique ne doit être traitée qu'une seule fois par cycle de fetch : le détecteur
  // "isLiked" fait un POST puis un DELETE, et le traiter en double pour le même id (ex: une
  // critique présente à la fois dans "Derniers avis" et "Fil d'actualité") crée une course qui
  // désynchronise likes_count et likedIds.
  const enrichCritiques = useCallback(async (critiques: FeedItem[]) => {
    const perCritique = await Promise.all(
      critiques.map((f) =>
        Promise.all([
          apiFetch<{ count: number }>(`/commentaires/critiques/${f.id}/count`).then((r) => Number(r?.count) || 0).catch(() => 0),
          apiFetch<{ likeCount: number }>(`/critiques/${f.id}/likes`).then((r) => Number(r?.likeCount) || 0).catch(() => 0),
          token
            ? apiFetch(`/critiques/${f.id}/like`, { method: 'POST', token })
                .then(() => { apiFetch(`/critiques/${f.id}/like`, { method: 'DELETE', token }).catch(() => {}); return false; })
                .catch((err: unknown) => (err as { status?: number })?.status === 409)
            : Promise.resolve(false),
        ]).then(([commentsCount, likesCount, isLiked]) => ({ id: f.id, commentsCount, likesCount, isLiked }))
      )
    );
    const dataMap = Object.fromEntries(perCritique.map((c) => [c.id, c]));
    const likedSet = new Set(perCritique.filter((c) => c.isLiked).map((c) => c.id));
    return { dataMap, likedSet };
  }, [token]);

  const applyEnrichment = useCallback((items: FeedItem[], dataMap: Record<number, { commentsCount: number; likesCount: number }>) =>
    items.map((f) =>
      f.type === 'critique'
        ? { ...f, comments_count: dataMap[f.id]?.commentsCount ?? f.comments_count, likes_count: dataMap[f.id]?.likesCount ?? f.likes_count }
        : f
    ), []);

  const fetchFeedPage = useCallback(async (offset: number) => {
    if (!token) return { items: [] as FeedItem[], total: 0 };
    const data = await apiFetch<{ feed: FeedItem[]; pagination: { total: number } }>(`/feed?limit=${FEED_PAGE_SIZE}&offset=${offset}`, { token });
    return { items: data.feed ?? [], total: data.pagination?.total ?? 0 };
  }, [token]);

  const doFetch = useCallback(async () => {
    const [latestData, feedPage] = await Promise.all([
      apiFetch<{ feed: FeedItem[] }>('/feed/latest-reviews'),
      fetchFeedPage(0),
    ]);
    const latestItems = latestData.feed ?? [];
    const feedItems = feedPage.items;

    const uniqueCritiques = Array.from(
      new Map([...latestItems, ...feedItems].filter((f) => f.type === 'critique').map((f) => [f.id, f])).values()
    );
    const { dataMap, likedSet } = await enrichCritiques(uniqueCritiques);

    setLatestReviews(applyEnrichment(latestItems, dataMap));
    setFeed(applyEnrichment(feedItems, dataMap));
    setFeedTotal(feedPage.total);
    setLikedIds(likedSet);
  }, [fetchFeedPage, enrichCritiques, applyEnrichment]);

  useFocusEffect(
    useCallback(() => {
      doFetch().catch(() => {}).finally(() => setLoading(false));
    }, [doFetch])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    doFetch().catch(() => {}).finally(() => setRefreshing(false));
  }, [doFetch]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || feed.length >= feedTotal) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage(feed.length);
      const newCritiques = page.items.filter((f) => f.type === 'critique');
      const { dataMap, likedSet } = await enrichCritiques(newCritiques);
      setFeed((prev) => [...prev, ...applyEnrichment(page.items, dataMap)]);
      setLikedIds((prev) => new Set([...prev, ...likedSet]));
    } catch {
      // ignore, l'utilisateur pourra réessayer via le bouton
    } finally {
      setLoadingMore(false);
    }
  }, [feed.length, feedTotal, loadingMore, fetchFeedPage, enrichCritiques, applyEnrichment]);

  const handleLike = useCallback((item: FeedItem) => {
    if (!token || item.type !== 'critique') return;
    const isLiked = likedIds.has(item.id);
    setLikedIds((prev) => { const s = new Set(prev); isLiked ? s.delete(item.id) : s.add(item.id); return s; });
    const updateCount = (f: FeedItem) => f.id === item.id ? { ...f, likes_count: (Number(f.likes_count) || 0) + (isLiked ? -1 : 1) } : f;
    setLatestReviews((prev) => prev.map(updateCount));
    setFeed((prev) => prev.map(updateCount));
    apiFetch(`/critiques/${item.id}/like`, { method: isLiked ? 'DELETE' : 'POST', token }).catch(() => {});
  }, [token, likedIds]);

  const handleSendComment = useCallback(async (item: FeedItem) => {
    if (!token) return;
    const text = commentTexts[item.id]?.trim();
    if (!text) return;
    setSendingIds((prev) => new Set(prev).add(item.id));
    try {
      await apiFetch(`/commentaires/critiques/${item.id}`, { method: 'POST', token, body: JSON.stringify({ contenu: text }) });
      const updateCount = (f: FeedItem) => f.id === item.id ? { ...f, comments_count: (Number(f.comments_count) || 0) + 1 } : f;
      setLatestReviews((prev) => prev.map(updateCount));
      setFeed((prev) => prev.map(updateCount));
      setCommentTexts((prev) => ({ ...prev, [item.id]: '' }));
      setOpenCommentId(null);
    } finally {
      setSendingIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [token, commentTexts]);

  const handleOpenCritique = useCallback((item: FeedItem) => {
    if (item.type !== 'critique') return;
    router.push({
      pathname: '/(public)/critique/[id]',
      params: {
        id: item.id,
        author_pseudo: item.author_pseudo,
        author_photo: item.author_photo ?? '',
        oeuvre_titre: item.oeuvre_titre ?? '',
        note: item.note !== undefined ? String(item.note) : '',
        contenu: item.contenu ?? '',
        likes_count: String(Number(item.likes_count) || 0),
      },
    });
  }, [router]);

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.tint} size="large" /></View>;
  }

  const showDrop = searchFocused || searchQuery.length > 0;

  const renderCard = (item: FeedItem) => {
    const isLiked        = likedIds.has(item.id);
    const isCommentOpen  = openCommentId === item.id;
    const isSending      = sendingIds.has(item.id);
    const commentText    = commentTexts[item.id] ?? '';
    const canComment     = !!token && item.type === 'critique';

    return (
      <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => handleOpenCritique(item)} activeOpacity={0.85}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.oeuvre_titre}
            </Text>
            {item.note != null && (
              <View style={[styles.noteBadge, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}>
                <Text style={[styles.noteText, { color: colors.tint }]}>{item.note}/5</Text>
              </View>
            )}
          </View>
          {/* Metadata */}
          <Text style={[styles.meta, { color: colors.icon }]}>
            par <Text style={{ color: colors.tint }}>@{item.author_pseudo}</Text>
            {' · '}{formatDate(item.created_at)}
          </Text>
          {/* Content */}
          {!!item.contenu && (
            <Text style={[styles.content, { color: colors.icon }]} numberOfLines={3}>
              "{item.contenu}"
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.footerAction} onPress={() => handleLike(item)} activeOpacity={0.7}>
            <Heart size={14} color={isLiked ? colors.red : colors.icon} fill={isLiked ? colors.red : 'transparent'} strokeWidth={2} />
            <Text style={[styles.footerCount, { color: isLiked ? colors.red : colors.icon }]}>{Number(item.likes_count) || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction} onPress={() => canComment && setOpenCommentId((p) => p === item.id ? null : item.id)} activeOpacity={canComment ? 0.7 : 1}>
            <MessageSquare size={14} color={isCommentOpen ? colors.tint : colors.icon} strokeWidth={2} />
            <Text style={[styles.footerCount, { color: isCommentOpen ? colors.tint : colors.icon }]}>{Number(item.comments_count) || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Inline comment input */}
        {isCommentOpen && (
          <View style={[styles.commentRow, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              value={commentText}
              onChangeText={(v) => setCommentTexts((prev) => ({ ...prev, [item.id]: v }))}
              placeholder="Écrire un commentaire…"
              placeholderTextColor={colors.tabIconDefault}
              multiline
              maxLength={2000}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.tint }, (!commentText.trim() || isSending) && { opacity: 0.4 }]}
              onPress={() => handleSendComment(item)}
              disabled={!commentText.trim() || isSending}
              activeOpacity={0.8}
            >
              {isSending ? <ActivityIndicator size="small" color="white" /> : <SendHorizonal size={16} color="white" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        data={feed}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
        style={{ backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}
        ListHeaderComponent={
          <View>
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: searchFocused ? colors.tintBorder : colors.border }]}>
              <Search size={16} color={searchFocused ? colors.tint : colors.icon} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => { if (!searchQuery) setSearchFocused(false); }}
                placeholder="Rechercher un utilisateur…"
                placeholderTextColor={colors.tabIconDefault}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} activeOpacity={0.7} hitSlop={8}>
                  <X size={16} color={colors.icon} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search results dropdown */}
            {showDrop && (
              <View style={[styles.searchDrop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {searchLoading ? (
                  <ActivityIndicator size="small" color={colors.tint} style={{ padding: 16 }} />
                ) : searchQuery.trim() && searchResults.length === 0 ? (
                  <Text style={[styles.searchEmpty, { color: colors.icon }]}>Aucun utilisateur trouvé</Text>
                ) : (
                  searchResults.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.searchRow, { borderBottomColor: colors.border }]}
                      onPress={() => { clearSearch(); router.push({ pathname: '/(public)/user/[id]', params: { id: u.id } }); }}
                      activeOpacity={0.75}
                    >
                      {u.photo ? (
                        <Image source={{ uri: u.photo }} style={styles.searchAvatar} />
                      ) : (
                        <View style={[styles.searchAvatarFallback, { backgroundColor: colors.tintDim }]}>
                          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 14 }}>{u.pseudo?.[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.searchPseudo, { color: colors.text }]}>@{u.pseudo}</Text>
                        <Text style={[styles.searchName, { color: colors.icon }]}>{u.prenom} {u.nom}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Hero banner — guests only */}
            {!token && (
              <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.heroBg, { backgroundColor: '#ea580c' }]}>
                  <View style={styles.heroOverlay}>
                    <View style={styles.heroTopRow}>
                      <Gamepad2 size={26} color="white" strokeWidth={2} />
                      <Text style={styles.heroTitle}>Bienvenue sur SUPCONTENT</Text>
                    </View>
                    <Text style={styles.heroDesc}>
                      Découvrez les derniers avis de la communauté gaming. Connectez-vous pour participer !
                    </Text>
                    <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(public)/auth/login')} activeOpacity={0.85}>
                      <Text style={styles.heroBtnText}>Rejoindre la communauté</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Derniers avis */}
            <View style={styles.sectionRow}>
              <TrendingUp size={18} color={colors.tint} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Derniers avis</Text>
            </View>
            {latestReviews.length > 0 ? (
              <View style={styles.section}>
                {latestReviews.map(renderCard)}
              </View>
            ) : (
              <Text style={[styles.emptySectionText, { color: colors.icon }]}>Aucun avis pour l'instant.</Text>
            )}

            {/* Fil d'actualité */}
            <View style={[styles.sectionRow, styles.sectionRowSpaced]}>
              <Rss size={18} color={colors.tint} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Fil d'actualité</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Gamepad2 size={44} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {token ? "Aucune activité pour l'instant." : "Connectez-vous pour voir le fil d'actualité."}
            </Text>
          </View>
        }
        renderItem={({ item }) => renderCard(item)}
        ListFooterComponent={
          token && feed.length < feedTotal ? (
            <TouchableOpacity
              style={[styles.loadMoreBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleLoadMore}
              disabled={loadingMore}
              activeOpacity={0.8}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <>
                  <Text style={[styles.loadMoreText, { color: colors.tint }]}>Afficher plus</Text>
                  <ChevronDown size={16} color={colors.tint} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list:        { padding: 16, gap: 12, paddingBottom: 48 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 8,
  },
  searchInput:  { flex: 1, fontSize: 14, paddingVertical: 0 },
  searchDrop: {
    borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchAvatar: { width: 36, height: 36, borderRadius: 18 },
  searchAvatarFallback: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  searchPseudo: { fontSize: 14, fontWeight: '700' },
  searchName:   { fontSize: 12, marginTop: 1 },
  searchEmpty:  { fontSize: 13, textAlign: 'center', padding: 16 },
  hero: { borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1 },
  heroBg: { width: '100%' },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.22)', padding: 22, gap: 10 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', flex: 1, flexWrap: 'wrap' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  heroBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.32)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionRowSpaced: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  section: { gap: 12, marginBottom: 4 },
  emptySectionText: { fontSize: 13, marginBottom: 4 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 10, padding: 14, paddingBottom: 4,
  },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '800' },
  noteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  noteText:   { fontSize: 12, fontWeight: '700' },
  meta:       { fontSize: 12, paddingHorizontal: 14, paddingBottom: 6 },
  content:    { fontSize: 14, lineHeight: 21, fontStyle: 'italic', paddingHorizontal: 14, paddingBottom: 10 },
  cardFooter: {
    flexDirection: 'row', gap: 18,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
    borderTopWidth: 1, marginTop: 4,
  },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCount:  { fontSize: 13, fontWeight: '500' },
  commentRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8, borderTopWidth: 1,
  },
  commentInput: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, marginTop: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { fontSize: 15, textAlign: 'center' },
});
