import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';

const STATUS_CONFIG = {
  termine: { label: 'Terminé', color: '#22c55e', bg: '#14532d22' },
  en_cours: { label: 'En cours', color: '#3b82f6', bg: '#1e3a5f22' },
  envie: { label: 'Envie', color: '#f59e0b', bg: '#78350f22' },
} as const;

interface BiblioItem {
  id: number;
  user_id: number;
  oeuvre_id: number;
  statut: string;
  updated_at: string;
  titre: string;
  description: string;
  api_reference_id?: string;
}

export default function BibliothequeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { token } = useAuth();

  const [items, setItems] = useState<BiblioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    apiFetch<BiblioItem[]>('/bibliotheque/items', { token })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const grouped = {
    en_cours: items.filter((i) => i.statut === 'en_cours'),
    envie: items.filter((i) => i.statut === 'envie'),
    termine: items.filter((i) => i.statut === 'termine'),
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
      <View style={styles.summary}>
        {Object.entries(grouped).map(([status, list]) => {
          const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          return (
            <View key={status} style={[styles.summaryBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
              <Text style={[styles.summaryCount, { color: cfg.color }]}>{list.length}</Text>
              <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.icon }]}>
            Votre bibliothèque est vide. Ajoutez des jeux depuis leur fiche !
          </Text>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.statut as keyof typeof STATUS_CONFIG];
          return (
            <View style={[styles.card, { backgroundColor: colors.tabIconDefault + '15', borderColor: colors.tabIconDefault + '30' }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.gameTitle, { color: colors.text }]}>{item.titre}</Text>
                <Text style={[styles.lastUpdate, { color: colors.icon }]}>
                  Mis à jour le {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              {cfg && (
                <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 4,
  },
  summaryBadge: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  summaryCount: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardContent: { flex: 1, gap: 3 },
  gameTitle: { fontSize: 15, fontWeight: '700' },
  lastUpdate: { fontSize: 12 },
  statusPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
