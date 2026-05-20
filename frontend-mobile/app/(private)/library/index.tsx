import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { CheckCircle2, Gamepad2, Bookmark, Library, Trash2, RefreshCw, Search, X } from 'lucide-react-native';

// Config visuelle uniquement — clé = code du statut en BDD
const STATUS_CONFIG: Record<string, { color: string; bg: string; darkBg: string }> = {
  VU:       { color: '#22c55e', bg: '#f0fdf4', darkBg: '#14532d22' },
  EN_COURS: { color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f22' },
  A_VOIR:   { color: '#f59e0b', bg: '#fffbeb', darkBg: '#78350f22' },
};

// Ordre du cycle UI
const STATUS_CYCLE = ['EN_COURS', 'VU', 'A_VOIR'];

function StatusIcon({ code, color, size = 14 }: { code: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2.5 };
  switch (code) {
    case 'VU':       return <CheckCircle2 {...props} />;
    case 'EN_COURS': return <Gamepad2 {...props} />;
    case 'A_VOIR':   return <Bookmark {...props} />;
    default: return null;
  }
}

interface Statut {
  id: number;
  code: string;
  libele: string;
}

interface BiblioItem {
  id: number;
  user_id: number;
  oeuvre_id: number;
  statut: Statut;
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
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      apiFetch<Statut[]>('/admin/statuts').then((data) => {
        setStatuts(data);
        setSelectedCodes(new Set(data.map((s) => s.code)));
      }).catch(() => {}),
      apiFetch<BiblioItem[]>('/bibliotheque/items', { token })
        .then(setItems)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token]);

  const grouped = useMemo(() => {
    const result: Record<string, BiblioItem[]> = {};
    for (const s of statuts) {
      result[s.code] = items.filter((i) => i.statut.code === s.code);
    }
    return result;
  }, [items, statuts]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.titre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedCodes.has(item.statut.code);
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, selectedCodes]);

  /**
   * PUT /bibliotheque/items/{id} — cycle le statut selon STATUS_CYCLE.
   */
  const handleCycleStatus = useCallback(async (item: BiblioItem) => {
    if (!token || updatingIds.has(item.id) || statuts.length === 0) return;

    const idx = STATUS_CYCLE.indexOf(item.statut.code);
    const nextCode = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const nextStatut = statuts.find((s) => s.code === nextCode);
    if (!nextStatut) return;

    // Mise à jour optimiste
    setItems((prev) =>
      prev.map((i) => i.id === item.id
        ? { ...i, statut: nextStatut, updated_at: new Date().toISOString() }
        : i)
    );
    setUpdatingIds((prev) => new Set(prev).add(item.id));

    try {
      await apiFetch(`/bibliotheque/items/${item.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ statut_id: nextStatut.id }),
      });
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, statut: item.statut } : i)
      );
    } finally {
      setUpdatingIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [token, updatingIds, statuts]);

  /**
   * DELETE /bibliotheque/items/{id}
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
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            try {
              await apiFetch(`/bibliotheque/items/${item.id}`, { method: 'DELETE', token });
            } catch {
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
          {statuts.map((statut) => {
            const cfg = STATUS_CONFIG[statut.code];
            const color = cfg?.color ?? colors.tint;
            const isSelected = selectedCodes.has(statut.code);
            return (
              <TouchableOpacity
                key={statut.id}
                style={[styles.filterBtn, { backgroundColor: isSelected ? color : colors.surface, borderColor: color }]}
                onPress={() =>
                  setSelectedCodes((prev) => {
                    const s = new Set(prev);
                    if (s.has(statut.code)) s.delete(statut.code); else s.add(statut.code);
                    return s;
                  })
                }
              >
                <StatusIcon code={statut.code} color={isSelected ? '#fff' : color} size={14} />
                <Text style={[styles.filterBtnText, { color: isSelected ? '#fff' : color }]}>
                  {statut.libele}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Résumé des compteurs par statut */}
      <View style={styles.summary}>
        {statuts.map((statut) => {
          const cfg = STATUS_CONFIG[statut.code];
          const color = cfg?.color ?? colors.tint;
          const bgColor = cfg ? (colorScheme === 'dark' ? cfg.darkBg : cfg.bg) : colors.surface;
          return (
            <View key={statut.id} style={[styles.summaryBadge, { backgroundColor: bgColor, borderColor: color + '50' }]}>
              <StatusIcon code={statut.code} color={color} />
              <Text style={[styles.summaryCount, { color }]}>{(grouped[statut.code] ?? []).length}</Text>
              <Text style={[styles.summaryLabel, { color }]}>{statut.libele}</Text>
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
              {searchQuery || selectedCodes.size < statuts.length
                ? 'Aucun jeu ne correspond à vos filtres.'
                : "Votre bibliothèque est vide.\nAjoutez des jeux depuis leur fiche !"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.statut.code];
          const color = cfg?.color ?? colors.tint;
          const bgColor = cfg ? (colorScheme === 'dark' ? cfg.darkBg : cfg.bg) : colors.surface;
          const isUpdating = updatingIds.has(item.id);

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => item.api_reference_id && router.push({ pathname: '/(public)/game/[id]', params: { id: item.api_reference_id } })}
              activeOpacity={item.api_reference_id ? 0.75 : 1}
            >
              <View style={[styles.statusStripe, { backgroundColor: color }]} />

              <View style={styles.cardContent}>
                <Text style={[styles.gameTitle, { color: colors.text }]}>{item.titre}</Text>
                <Text style={[styles.lastUpdate, { color: colors.icon }]}>
                  Mis à jour le {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              {/* Bouton statut (tappable) — PUT /bibliotheque/items/{id} */}
              <TouchableOpacity
                style={[styles.statusPill, { backgroundColor: bgColor, borderColor: color + '55' }]}
                onPress={() => handleCycleStatus(item)}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {isUpdating ? (
                  <RefreshCw size={13} color={color} strokeWidth={2.5} />
                ) : (
                  <StatusIcon code={item.statut.code} color={color} />
                )}
                <Text style={[styles.statusText, { color }]}>{item.statut.libele}</Text>
              </TouchableOpacity>

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
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 14 },
  empty: { textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
