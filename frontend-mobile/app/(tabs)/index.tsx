import { FlatList, View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';

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

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    apiFetch<{ feed: FeedItem[] }>('/feed', { token })
      .then((data) => setFeed(data.feed))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <FlatList
      data={feed}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Dernières critiques</Text>
          <Text style={[styles.heroSub, { color: colors.icon }]}>Les avis récents de la communauté</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 40 }}>
          {token ? "Aucune activité pour l'instant." : "Connectez-vous pour voir le fil d'actualité."}
        </Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.tabIconDefault + '15', borderColor: colors.tabIconDefault + '30' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              {item.author_photo ? (
                <Image source={{ uri: item.author_photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.tint + '30' }]}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>{item.author_pseudo?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View>
                <Text style={[styles.gameTitle, { color: colors.text }]}>{item.oeuvre_titre}</Text>
                <Text style={[styles.authorName, { color: colors.icon }]}>par @{item.author_pseudo}</Text>
              </View>
            </View>
            {item.note !== undefined && item.note !== null && (
              <View style={[styles.noteBadge, { backgroundColor: colors.tint + '20', borderColor: colors.tint + '40' }]}>
                <Text style={[styles.noteText, { color: colors.tint }]}>{item.note}/20</Text>
              </View>
            )}
          </View>

          {item.contenu ? (
            <Text style={[styles.content, { color: colors.text }]} numberOfLines={3}>
              "{item.contenu}"
            </Text>
          ) : null}

          <View style={[styles.cardFooter, { borderTopColor: colors.tabIconDefault + '30' }]}>
            <TouchableOpacity style={styles.footerAction}>
              <Text style={[styles.footerIcon, { color: colors.icon }]}>❤️ {item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerAction}>
              <Text style={[styles.footerIcon, { color: colors.icon }]}>💬 {item.comments_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { marginBottom: 8, gap: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800' },
  heroSub: { fontSize: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  gameTitle: { fontSize: 15, fontWeight: '700' },
  authorName: { fontSize: 12 },
  noteBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  noteText: { fontWeight: '700', fontSize: 14 },
  content: { fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', gap: 20, paddingTop: 10, borderTopWidth: 1 },
  footerAction: { flexDirection: 'row', alignItems: 'center' },
  footerIcon: { fontSize: 13, fontWeight: '500' },
});
