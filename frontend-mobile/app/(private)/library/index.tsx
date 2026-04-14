import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { CheckCircle2, Gamepad2, Bookmark, Library, Trash2, RefreshCw, Search, X } from 'lucide-react-native';

const STATUS_CONFIG = {
  'terminé':  { label: 'Terminé',  color: '#22c55e', bg: '#f0fdf4', darkBg: '#14532d22' },
  en_cours: { label: 'En cours', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f22' },
  envie:    { label: 'Envie',    color: '#f59e0b', bg: '#fffbeb', darkBg: '#78350f22' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// Cycle : en_cours → terminé → envie → en_cours
const STATUS_CYCLE: StatusKey[] = ['en_cours', 'terminé', 'envie'];
function nextStatus(current: string): StatusKey {
  const idx = STATUS_CYCLE.indexOf(current as StatusKey);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function StatusIcon({ statut, color, size = 14 }: { statut: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2.5 };
  switch (statut) {
    case 'terminé':  return <CheckCircle2 {...props} />;
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
  const router = useRouter();

  const [items, setItems] = useState<BiblioItem[]>([]);
  const [loading, setLoading] = useState(true);
  // IDs en cours de mise à jour (pour désactiver les boutons)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<StatusKey>>(new Set(['en_cours', 'terminé', 'envie']));
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

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
    'terminé':  items.filter((i) => i.statut === 'terminé'),
  };

  // Filtrer les items selon la recherche et les statuts sélectionnés
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.titre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatuses.has(item.statut as StatusKey);
      // Les catégories sont vides pour l'instant (pas dans BiblioItem)
      const matchesCategory = selectedCategories.size === 0 || true; // TODO: ajouter les catégories
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, selectedStatuses, selectedCategories]);

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
      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Chercher un jeu..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres par statut */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((statusKey) => {
            const cfg = STATUS_CONFIG[statusKey];
            const isSelected = selectedStatuses.has(statusKey);
            return (
              <TouchableOpacity
                key={statusKey}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: isSelected ? cfg.color : colors.surface,
                    borderColor: cfg.color,
                  },
                ]}
                onPress={() => {
                  setSelectedStatuses((prev) => {
                    const s = new Set(prev);
                    if (s.has(statusKey)) {
                      s.delete(statusKey);
                    } else {
                      s.add(statusKey);
                    }
                    return s;
                  });
                }}
              >
                <StatusIcon statut={statusKey} color={isSelected ? '#fff' : cfg.color} size={14} />
                <Text style={[styles.filterBtnText, { color: isSelected ? '#fff' : cfg.color }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Library size={44} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.empty, { color: colors.icon }]}>
              {searchQuery || selectedStatuses.size < 3
                ? 'Aucun jeu ne correspond à vos filtres.'
                : "Votre bibliothèque est vide.\nAjoutez des jeux depuis leur fiche !"}
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
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => item.api_reference_id && router.push({ pathname: '/(public)/game/[id]', params: { id: item.api_reference_id } })}
              activeOpacity={item.api_reference_id ? 0.75 : 1}
            >
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
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summary: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0, paddingBottom: 8 },
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
