import {
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { SendHorizonal } from 'lucide-react-native';

interface Comment {
  id: number;
  user_id: number;
  critique_id: number;
  contenu: string;
  created_at: string;
  // Champs enrichis optionnels (JOIN côté serveur, absents du schéma swagger)
  auteur_pseudo?: string;
  auteur_photo?: string;
  pseudo?: string;
  photo?: string;
}

/** Normalise une entrée commentaire quelle que soit la forme retournée par l'API */
function normalizeComment(c: Comment): Comment {
  return {
    ...c,
    auteur_pseudo: c.auteur_pseudo ?? c.pseudo ?? `user_${c.user_id}`,
    auteur_photo: c.auteur_photo ?? c.photo,
  };
}

/** Extrait le tableau de commentaires depuis la réponse API (array ou objet wrappé) */
function extractComments(raw: unknown): Comment[] {
  if (Array.isArray(raw)) return (raw as Comment[]).map(normalizeComment);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const list = obj.commentaires ?? obj.comments ?? obj.data ?? [];
    if (Array.isArray(list)) return (list as Comment[]).map(normalizeComment);
  }
  return [];
}

export default function CritiqueDetailScreen() {
  const { id, author_pseudo, author_photo, oeuvre_titre, note, contenu } =
    useLocalSearchParams<{
      id: string;
      author_pseudo?: string;
      author_photo?: string;
      oeuvre_titre?: string;
      note?: string;
      contenu?: string;
    }>();

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { token } = useAuth();
  const navigation = useNavigation();

  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: oeuvre_titre ?? 'Critique' });
  }, [oeuvre_titre, navigation]);

  const fetchComments = useCallback(() => {
    if (!id) return;
    // GET /commentaires/critiques/{id} et /count en parallèle
    Promise.all([
      apiFetch<unknown>(`/commentaires/critiques/${id}`),
      apiFetch<{ count: number }>(`/commentaires/critiques/${id}/count`),
    ])
      .then(([rawComments, countData]) => {
        setComments(extractComments(rawComments));
        setCount(Number(countData?.count) || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // POST /commentaires/critiques/{id} — ajouter, puis re-fetch pour avoir auteur_pseudo enrichi
  const handleSend = useCallback(async () => {
    if (!token || !commentText.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/commentaires/critiques/${id}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ contenu: commentText.trim() }),
      });
      setCommentText('');
      fetchComments();
    } catch {
      // champ conservé pour permettre de réessayer
    } finally {
      setSending(false);
    }
  }, [token, id, commentText, fetchComments]);

  const renderHeader = () => (
    <View style={[styles.critiqueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.authorRow}>
        {author_photo ? (
          <Image source={{ uri: author_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '25' }]}>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 16 }}>
              {author_pseudo?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.gameTitle, { color: colors.text }]} numberOfLines={1}>
            {oeuvre_titre}
          </Text>
          <Text style={[styles.authorName, { color: colors.icon }]}>par @{author_pseudo}</Text>
        </View>
        {note ? (
          <View style={[styles.noteBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
            <Text style={[styles.noteText, { color: colors.tint }]}>{note}/20</Text>
          </View>
        ) : null}
      </View>

      {contenu ? (
        <Text style={[styles.critiqueContent, { color: colors.icon }]}>"{contenu}"</Text>
      ) : null}

      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Commentaires{count > 0 ? ` (${count})` : ''}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
          style={{ backgroundColor: colors.background }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              Aucun commentaire pour l'instant.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.commentHeader}>
                {item.auteur_photo ? (
                  <Image source={{ uri: item.auteur_photo }} style={styles.commentAvatar} />
                ) : (
                  <View style={[styles.commentAvatarFallback, { backgroundColor: colors.tint + '25' }]}>
                    <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>
                      {item.auteur_pseudo?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.commentAuthor, { color: colors.tint }]}>@{item.auteur_pseudo}</Text>
                <Text style={[styles.commentDate, { color: colors.icon }]}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[styles.commentContent, { color: colors.text }]}>{item.contenu}</Text>
            </View>
          )}
        />
      )}

      {/* Zone de saisie — uniquement si connecté */}
      {token && (
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Écrire un commentaire…"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.tint },
              (!commentText.trim() || sending) && { opacity: 0.4 },
            ]}
            onPress={handleSend}
            disabled={!commentText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <SendHorizonal size={16} color="white" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  critiqueCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  gameTitle: { fontSize: 15, fontWeight: '700' },
  authorName: { fontSize: 12, marginTop: 1 },
  noteBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  noteText: { fontWeight: '800', fontSize: 13 },
  critiqueContent: { fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  separator: { height: 1, marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 16 },
  commentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14 },
  commentAvatarFallback: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  commentAuthor: { fontWeight: '600', fontSize: 13, flex: 1 },
  commentDate: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
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
