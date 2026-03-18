import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { CheckCircle2, Gamepad2, Bookmark, Library, Trash2, RefreshCw } from 'lucide-react-native';

const STATUS_CONFIG = {
  termine:  { label: 'Terminé',  color: '#22c55e', bg: '#f0fdf4', darkBg: '#14532d22' },
  en_cours: { label: 'En cours', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f22' },
  envie:    { label: 'Envie',    color: '#f59e0b', bg: '#fffbeb', darkBg: '#78350f22' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// Cycle : en_cours → termine → envie → en_cours
const STATUS_CYCLE: StatusKey[] = ['en_cours', 'termine', 'envie'];
function nextStatus(current: string): StatusKey {
  const idx = STATUS_CYCLE.indexOf(current as StatusKey);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function StatusIcon({ statut, color, size = 14 }: { statut: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2.5 };
  switch (statut) {
    case 'termine':  return <CheckCircle2 {...props} />;
    case 'en_cours': return <Gamepad2 {...props} />;
    case 'envie':    return <Bookmark {...props} />;
    default: return null;
  }
}

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
  // IDs en cours de mise à jour (pour désactiver les boutons)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    // GET /bibliotheque/items — bibliothèque personnelle
    apiFetch<BiblioItem[]>('/bibliotheque/items', { token })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const grouped = {
    en_cours: items.filter((i) => i.statut === 'en_cours'),
    envie:    items.filter((i) => i.statut === 'envie'),
    termine:  items.filter((i) => i.statut === 'termine'),
  };

  /**
   * PUT /bibliotheque/items/{id} — changer le statut d'un jeu.
   * Le statut tourne en cycle : en_cours → terminé → envie → en_cours.
   */
  const handleCycleStatus = useCallback(async (item: BiblioItem) => {
    if (!token || updatingIds.has(item.id)) return;
    const newStatut = nextStatus(item.statut);

    // Mise à jour optimiste
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, statut: newStatut, updated_at: new Date().toISOString() } : i)
    );
    setUpdatingIds((prev) => new Set(prev).add(item.id));

    try {
      await apiFetch(`/bibliotheque/items/${item.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ statut: newStatut }),
      });
    } catch {
      // Rollback en cas d'erreur
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, statut: item.statut } : i)
      );
    } finally {
      setUpdatingIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [token, updatingIds]);

  /**
   * DELETE /bibliotheque/items/{id} — retirer un jeu de la bibliothèque.
   * Demande confirmation avant de supprimer.
   */
  const handleDelete = useCallback((item: BiblioItem) => {
    if (!token) return;
    Alert.alert(
      'Supprimer',
      `Retirer "${item.titre}" de votre bibliothèque ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            // Suppression optimiste
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            try {
              await apiFetch(`/bibliotheque/items/${item.id}`, { method: 'DELETE', token });
            } catch {
              // Rollback : remettre l'item
              setItems((prev) => [...prev, item].sort((a, b) => a.id - b.id));
            }
          },
        },
      ]
    );
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Résumé des compteurs par statut */}
      <View style={styles.summary}>
        {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((statusKey) => {
          const cfg = STATUS_CONFIG[statusKey];
          const list = grouped[statusKey];
          const bgColor = colorScheme === 'dark' ? cfg.darkBg : cfg.bg;
          return (
            <View key={statusKey} style={[styles.summaryBadge, { backgroundColor: bgColor, borderColor: cfg.color + '50' }]}>
              <StatusIcon statut={statusKey} color={cfg.color} />
              <Text style={[styles.summaryCount, { color: cfg.color }]}>{list.length}</Text>
              <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Library size={44} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.empty, { color: colors.icon }]}>
              Votre bibliothèque est vide.{'\n'}Ajoutez des jeux depuis leur fiche !
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.statut as StatusKey];
          const bgColor = cfg
            ? colorScheme === 'dark' ? cfg.darkBg : cfg.bg
            : colors.surface;
          const isUpdating = updatingIds.has(item.id);

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Bande colorée à gauche */}
              {cfg && <View style={[styles.statusStripe, { backgroundColor: cfg.color }]} />}

              <View style={styles.cardContent}>
                <Text style={[styles.gameTitle, { color: colors.text }]}>{item.titre}</Text>
                <Text style={[styles.lastUpdate, { color: colors.icon }]}>
                  Mis à jour le {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              {/* Bouton statut (tappable) — PUT /bibliotheque/items/{id} */}
              {cfg && (
                <TouchableOpacity
                  style={[styles.statusPill, { backgroundColor: bgColor, borderColor: cfg.color + '55' }]}
                  onPress={() => handleCycleStatus(item)}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                >
                  {isUpdating ? (
                    <RefreshCw size={13} color={cfg.color} strokeWidth={2.5} />
                  ) : (
                    <StatusIcon statut={item.statut} color={cfg.color} />
                  )}
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </TouchableOpacity>
              )}

              {/* Bouton supprimer — DELETE /bibliotheque/items/{id} */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#ef4444" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  summaryBadge: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    gap: 4,
  },
  summaryCount: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusStripe: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 3 },
  gameTitle: { fontSize: 15, fontWeight: '700' },
  lastUpdate: { fontSize: 12 },
  // Badge de statut tappable : appui → cycle de statut
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  // Icône poubelle à droite
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 14 },
  empty: { textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
