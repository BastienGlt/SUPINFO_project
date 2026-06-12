import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
// Remplacement des emojis par des icônes lucide
import { Heart, UserPlus, MessageCircle, Star, Bell, CheckCheck, Trash2 } from 'lucide-react-native';

// Icônes lucide par type de notification (cf. Swagger: type = like | follow | commentaire | feature)
function NotifIcon({ type, color }: { type: string; color: string }) {
  const props = { size: 20, color, strokeWidth: 2 };
  switch (type) {
    case 'like': return <Heart {...props} />;
    case 'follow': return <UserPlus {...props} />;
    case 'commentaire': return <MessageCircle {...props} />;
    case 'feature': return <Star {...props} />;
    default: return <Bell {...props} />;
  }
}

// Couleurs de fond par type
const NOTIF_COLORS: Record<string, string> = {
  like: '#ef4444',
  follow: '#6366f1',
  commentaire: '#3b82f6',
  feature: '#f59e0b',
};

// Selon le Swagger, Notification contient from_user (pseudo + photo) + type + source_id.
// Le champ `content` n'est pas dans le schéma officiel : on génère le texte depuis from_user + type.
interface FromUser {
  id: number;
  pseudo: string;
  photo?: string;
}

interface Notification {
  id: number;
  user_id: number;
  type: string;
  // `content` peut exister si le backend l'ajoute, sinon on génère depuis from_user
  content?: string;
  source_id?: number;
  lu: boolean;
  from_user?: FromUser;
  oeuvre_id?: number;
  created_at: string;
}

/** Génère un texte lisible à partir des données de la notification */
function buildNotifText(n: Notification): string {
  if (n.content) return n.content;
  const who = n.from_user ? `@${n.from_user.pseudo}` : 'Quelqu\'un';
  switch (n.type) {
    case 'like': return `${who} a aimé votre critique`;
    case 'follow': return `${who} vous suit maintenant`;
    case 'commentaire': return `${who} a commenté votre critique`;
    case 'feature': return `Votre critique a été mise en avant`;
    default: return `${who} a interagi avec vous`;
  }
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { token } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(() => {
    if (!token) { setLoading(false); return Promise.resolve(); }
    return apiFetch<{ notifications: Notification[] }>('/notifications', { token })
      .then((data) => setNotifications(data.notifications))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchNotifs().finally(() => setLoading(false));
  }, [fetchNotifs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifs().finally(() => setRefreshing(false));
  }, [fetchNotifs]);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  // PUT /notifications/read-all — marquer toutes comme lues
  const markAllRead = () => {
    if (!token) return;
    apiFetch('/notifications/read-all', { method: 'PUT', token }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  // DELETE /notifications/{id} — supprimer une notification
  const handleDelete = (id: number) => {
    if (!token) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiFetch(`/notifications/${id}`, { method: 'DELETE', token }).catch(() => {
      // Restaure en cas d'erreur
      apiFetch<{ notifications: Notification[] }>('/notifications', { token })
        .then((data) => setNotifications(data.notifications))
        .catch(() => {});
    });
  };

  // PUT /notifications/{id}/read — marquer comme lue + naviguer vers la source
  const handleNotifPress = (item: Notification) => {
    if (!token) return;
    apiFetch(`/notifications/${item.id}/read`, { method: 'PUT', token }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, lu: true } : n)));

    if ((item.type === 'like' || item.type === 'commentaire') && item.source_id) {
      router.push({ pathname: '/(public)/critique/[id]', params: { id: item.source_id } });
    } else if (item.type === 'follow' && item.from_user?.id) {
      router.push({ pathname: '/(public)/user/[id]', params: { id: item.from_user.id } });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {unreadCount > 0 && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerText, { color: colors.icon }]}>
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.7}>
            <CheckCheck size={15} color={colors.tint} strokeWidth={2.5} />
            <Text style={[styles.markAll, { color: colors.tint }]}>Tout marquer lu</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Bell size={40} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.empty, { color: colors.icon }]}>Aucune notification pour l'instant.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const typeColor = NOTIF_COLORS[item.type] ?? colors.tint;
          return (
            <TouchableOpacity
              onPress={() => handleNotifPress(item)}
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.lu ? colors.surface : colors.tintDim,
                  borderColor: item.lu ? colors.border : colors.tintBorder,
                },
              ]}
              activeOpacity={0.7}
            >
              {/* Icône dans un carré coloré par type */}
              <View style={[styles.notifIconWrap, { backgroundColor: typeColor + '18' }]}>
                <NotifIcon type={item.type} color={typeColor} />
                {!item.lu && <View style={[styles.dot, { backgroundColor: colors.tint }]} />}
              </View>

              <View style={styles.notifContent}>
                <Text style={[styles.notifText, { color: colors.text }]}>
                  {buildNotifText(item)}
                </Text>
                <Text style={[styles.notifDate, { color: colors.icon }]}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
              >
                <Trash2 size={16} color={colors.icon} strokeWidth={2} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: { fontSize: 13 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  markAll: { fontSize: 13, fontWeight: '600' },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: { flex: 1, gap: 4 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifDate: { fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 4, right: 4 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { fontSize: 14 },
});
