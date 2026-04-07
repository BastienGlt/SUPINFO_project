import {
  FlatList, View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Heart, MessageCircle, Rss, SendHorizonal } from 'lucide-react-native';

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

export default function FeedScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { token } = useAuth();
  const router = useRouter();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Like : set d'IDs likés localement (API ne renvoie pas de champ `liked`)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  // Commentaire inline : un seul input ouvert à la fois
  const [openCommentId, setOpenCommentId] = useState<number | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [sendingIds, setSendingIds] = useState<Set<number>>(new Set());

  // Charge le feed au montage et à chaque retour sur l'écran (pour actualiser les compteurs)
  useFocusEffect(
    useCallback(() => {
      if (!token) { setLoading(false); return; }
      apiFetch<{ feed: FeedItem[] }>('/feed', { token })
        .then(async (data) => {
          const items = data.feed ?? [];
          const critiques = items.filter((f) => f.type === 'critique');
          const perCritique = await Promise.all(
            critiques.map((f) =>
              Promise.all([
                apiFetch<{ count: number }>(`/commentaires/critiques/${f.id}/count`)
                  .then((r) => Number(r?.count) || 0)
                  .catch(() => 0),
                apiFetch<{ likeCount: number }>(`/critiques/${f.id}/likes`)
                  .then((r) => Number(r?.likeCount) || 0)
                  .catch(() => 0),
                // Détecter si l'utilisateur a déjà liké : 409 = oui, 201 = non (on annule)
                apiFetch(`/critiques/${f.id}/like`, { method: 'POST', token })
                  .then(() => {
                    apiFetch(`/critiques/${f.id}/like`, { method: 'DELETE', token }).catch(() => {});
                    return false;
                  })
                  .catch((err: unknown) => (err as { status?: number })?.status === 409),
              ]).then(([commentsCount, likesCount, isLiked]) => ({ id: f.id, commentsCount, likesCount, isLiked }))
            )
          );
          const dataMap = Object.fromEntries(perCritique.map((c) => [c.id, c]));
          setLikedIds(new Set(perCritique.filter((c) => c.isLiked).map((c) => c.id)));
          setFeed(items.map((f) =>
            f.type === 'critique'
              ? { ...f, comments_count: dataMap[f.id]?.commentsCount ?? f.comments_count, likes_count: dataMap[f.id]?.likesCount ?? f.likes_count }
              : f
          ));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [token])
  );

  // POST /critiques/{id}/like — liker
  // DELETE /critiques/{id}/like — unliker
  const handleLike = useCallback(
    (item: FeedItem) => {
      if (!token || item.type !== 'critique') return;
      const isLiked = likedIds.has(item.id);
      setLikedIds((prev) => { const s = new Set(prev); isLiked ? s.delete(item.id) : s.add(item.id); return s; });
      setFeed((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, likes_count: (Number(f.likes_count) || 0) + (isLiked ? -1 : 1) } : f)
      );
      apiFetch(`/critiques/${item.id}/like`, { method: isLiked ? 'DELETE' : 'POST', token }).catch(() => {});
    },
    [token, likedIds]
  );

  /** Ouvre ou ferme l'input de commentaire pour un item */
  const toggleComment = useCallback((itemId: number) => {
    setOpenCommentId((prev) => (prev === itemId ? null : itemId));
  }, []);

  /**
   * POST /commentaires/critiques/{id} — publier un commentaire sur une critique.
   * `id` ici est le critique_id (= item.id du feed pour type === 'critique').
   */
  const handleSendComment = useCallback(
    async (item: FeedItem) => {
      if (!token) return;
      const text = commentTexts[item.id]?.trim();
      if (!text) return;

      setSendingIds((prev) => new Set(prev).add(item.id));
      try {
        await apiFetch(`/commentaires/critiques/${item.id}`, {
          method: 'POST',
          token,
          body: JSON.stringify({ contenu: text }),
        });
        // Mise à jour optimiste du compteur de commentaires
        setFeed((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, comments_count: (Number(f.comments_count) || 0) + 1 } : f)
        );
        // Fermer l'input et vider le texte
        setCommentTexts((prev) => ({ ...prev, [item.id]: '' }));
        setOpenCommentId(null);
      } catch {
        // Pas de rollback — le champ reste ouvert pour permettre de réessayer
      } finally {
        setSendingIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
      }
    },
    [token, commentTexts]
  );

  const handleOpenCritique = useCallback(
    (item: FeedItem) => {
      if (item.type !== 'critique') return;
      router.push({
        pathname: '/(public)/critique/[id]',
        params: {
          id: item.id,
          author_pseudo: item.author_pseudo,
          author_photo: item.author_photo ?? '',
          oeuvre_titre: item.oeuvre_titre ?? '',
          note: item.note !== undefined && item.note !== null ? String(item.note) : '',
          contenu: item.contenu ?? '',
          likes_count: String(Number(item.likes_count) || 0),
        },
      });
    },
    [router]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={feed}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
        style={{ backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <Rss size={22} color={colors.tint} strokeWidth={2} />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Dernières critiques</Text>
            </View>
            <Text style={[styles.heroSub, { color: colors.icon }]}>Les avis récents de la communauté</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 40 }}>
            {token ? "Aucune activité pour l'instant." : "Connectez-vous pour voir le fil d'actualité."}
          </Text>
        }
        renderItem={({ item }) => {
          const isLiked = likedIds.has(item.id);
          const isCommentOpen = openCommentId === item.id;
          const isSending = sendingIds.has(item.id);
          const commentText = commentTexts[item.id] ?? '';
          const canComment = token && item.type === 'critique';

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* En-tête + contenu — cliquable pour ouvrir les commentaires */}
              <TouchableOpacity
                onPress={() => handleOpenCritique(item)}
                activeOpacity={0.85}
              >
                {/* En-tête : avatar + titre + note */}
                <View style={styles.cardHeader}>
                <View style={styles.authorRow}>
                  <TouchableOpacity
                    style={styles.authorPressable}
                    onPress={() => router.push({ pathname: '/(public)/user/[id]', params: { id: item.author_id } })}
                    activeOpacity={0.7}
                  >
                  {item.author_photo ? (
                    <Image source={{ uri: item.author_photo }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '25' }]}>
                      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 16 }}>
                        {item.author_pseudo?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gameTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.oeuvre_titre}
                    </Text>
                    <Text style={[styles.authorName, { color: colors.icon }]}>par @{item.author_pseudo}</Text>
                  </View>
                  </TouchableOpacity>
                </View>
                {item.note !== undefined && item.note !== null && (
                  <View style={[styles.noteBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
                    <Text style={[styles.noteText, { color: colors.tint }]}>{item.note}/5</Text>
                  </View>
                )}
              </View>

              {item.contenu ? (
                <Text style={[styles.content, { color: colors.icon }]} numberOfLines={3}>
                  "{item.contenu}"
                </Text>
              ) : null}
              </TouchableOpacity>

              {/* Footer : like + commentaire */}
              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                {/* Like — POST/DELETE /critiques/{id}/like */}
                <TouchableOpacity
                  style={styles.footerAction}
                  onPress={() => handleLike(item)}
                  activeOpacity={0.7}
                >
                  <Heart size={15} color={isLiked ? '#ef4444' : colors.icon} fill={isLiked ? '#ef4444' : 'transparent'} strokeWidth={2} />
                  <Text style={[styles.footerCount, { color: isLiked ? '#ef4444' : colors.icon }]}>{Number(item.likes_count) || 0}</Text>
                </TouchableOpacity>

                {/* Commentaire — ouvre l'input inline */}
                <TouchableOpacity
                  style={styles.footerAction}
                  onPress={() => canComment && toggleComment(item.id)}
                  activeOpacity={canComment ? 0.7 : 1}
                >
                  <MessageCircle
                    size={15}
                    color={isCommentOpen ? colors.tint : colors.icon}
                    fill={isCommentOpen ? colors.tint + '30' : 'transparent'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.footerCount, { color: isCommentOpen ? colors.tint : colors.icon }]}>
                    {Number(item.comments_count) || 0}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Zone de saisie du commentaire — POST /commentaires/critiques/{id} */}
              {isCommentOpen && (
                <View style={[styles.commentInputRow, { borderTopColor: colors.border }]}>
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
                    style={[
                      styles.sendBtn,
                      { backgroundColor: colors.tint },
                      (!commentText.trim() || isSending) && { opacity: 0.4 },
                    ]}
                    onPress={() => handleSendComment(item)}
                    disabled={!commentText.trim() || isSending}
                    activeOpacity={0.8}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <SendHorizonal size={16} color="white" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { marginBottom: 12, gap: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSub: { fontSize: 13 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: 16, paddingBottom: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  authorPressable: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  gameTitle: { fontSize: 15, fontWeight: '700' },
  authorName: { fontSize: 12, marginTop: 1 },
  noteBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  noteText: { fontWeight: '800', fontSize: 13 },
  content: { fontSize: 14, lineHeight: 21, fontStyle: 'italic', paddingHorizontal: 16, paddingTop: 10 },
  cardFooter: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    marginTop: 10,
  },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCount: { fontSize: 13, fontWeight: '500' },
  // Zone commentaire inline
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
