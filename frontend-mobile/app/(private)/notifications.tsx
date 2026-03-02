import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';

const NOTIF_ICONS: Record<string, string> = {
  like: '❤️',
  follow: '👤',
  commentaire: '💬',
  feature: '⭐',
};

interface Notification {
  id: number;
  user_id: number;
  type: string;
  content: string;
  lu: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    apiFetch<{ notifications: Notification[] }>('/notifications', { token })
      .then((data) => setNotifications(data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAllRead = () => {
    if (!token) return;
    apiFetch('/notifications/read-all', { method: 'PUT', token }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const markRead = (id: number) => {
    if (!token) return;
    apiFetch(`/notifications/${id}/read`, { method: 'PUT', token }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
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
        <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '30' }]}>
          <Text style={[styles.headerText, { color: colors.icon }]}>{unreadCount} non lue(s)</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.tint }]}>Tout marquer lu</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.icon }]}>Aucune notification pour l'instant.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markRead(item.id)}
            style={[
              styles.notifCard,
              {
                backgroundColor: item.lu ? colors.tabIconDefault + '10' : colors.tint + '18',
                borderColor: item.lu ? colors.tabIconDefault + '30' : colors.tint + '50',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>{NOTIF_ICONS[item.type] ?? '🔔'}</Text>
            <View style={styles.notifContent}>
              <Text style={[styles.notifText, { color: colors.text }]}>{item.content}</Text>
              <Text style={[styles.notifDate, { color: colors.icon }]}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {!item.lu && <View style={[styles.dot, { backgroundColor: colors.tint }]} />}
          </TouchableOpacity>
        )}
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
  markAll: { fontSize: 13, fontWeight: '600' },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  notifIcon: { fontSize: 24 },
  notifContent: { flex: 1, gap: 4 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifDate: { fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
