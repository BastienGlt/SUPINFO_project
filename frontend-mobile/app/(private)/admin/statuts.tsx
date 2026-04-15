import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Plus, Trash2, Check, X, Edit3, Tag } from 'lucide-react-native';

interface Statut {
  id: number;
  code: string;
  libele: string;
}

export default function AdminStatutsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, token } = useAuth();

  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newLibele, setNewLibele] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editLibele, setEditLibele] = useState('');

  const isAdmin = user?.role_id === 3;

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      apiFetch<Statut[]>('/admin/statuts')
        .then(setStatuts)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [isAdmin])
  );

  // Admin-only screen guard
  if (!isAdmin) return null;

  const create = () => {
    const code = newCode.trim().toUpperCase();
    const libele = newLibele.trim();
    if (!code || !libele) return;
    apiFetch<Statut>('/admin/statuts', {
      method: 'POST',
      token,
      body: JSON.stringify({ code, libele }),
    })
      .then((s) => {
        setStatuts((prev) => [...prev, s]);
        setNewCode('');
        setNewLibele('');
        setCreating(false);
      })
      .catch(() => {
        Alert.alert('Erreur', 'Impossible de créer le statut.');
      });
  };

  const startEdit = (s: Statut) => {
    setEditingId(s.id);
    setEditCode(s.code);
    setEditLibele(s.libele);
  };

  const saveEdit = (s: Statut) => {
    const code = editCode.trim().toUpperCase();
    const libele = editLibele.trim();
    if (!code || !libele) return;
    apiFetch<Statut>(`/admin/statuts/${s.id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ code, libele }),
    })
      .then((updated) => {
        setStatuts((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
        setEditingId(null);
      })
      .catch(() => {
        Alert.alert('Erreur', 'Impossible de modifier le statut.');
      });
  };

  const remove = (s: Statut) => {
    Alert.alert('Supprimer', `Supprimer le statut "${s.libele}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/statuts/${s.id}`, { method: 'DELETE', token })
            .then(() => setStatuts((prev) => prev.filter((x) => x.id !== s.id)))
            .catch((err) => {
              const e = err as { status?: number };
              if (e.status === 409) {
                Alert.alert('Impossible', 'Ce statut est encore utilisé par des items de bibliothèque.');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer le statut.');
              }
            });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      data={statuts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <>
          {/* Formulaire de création */}
          {creating ? (
            <View style={[styles.createForm, { backgroundColor: colors.surface, borderColor: colors.tint + '40' }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Nouveau statut</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="CODE (ex: ABANDONNE)"
                placeholderTextColor={colors.icon}
                value={newCode}
                onChangeText={setNewCode}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Libellé (ex: Abandonné)"
                placeholderTextColor={colors.icon}
                value={newLibele}
                onChangeText={setNewLibele}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.border }]} onPress={() => setCreating(false)} activeOpacity={0.75}>
                  <X size={14} color={colors.icon} strokeWidth={2.5} />
                  <Text style={[styles.btnSecondaryText, { color: colors.icon }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.tint }]} onPress={create} activeOpacity={0.85}>
                  <Check size={14} color="white" strokeWidth={2.5} />
                  <Text style={styles.btnPrimaryText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}
              onPress={() => setCreating(true)}
              activeOpacity={0.75}
            >
              <Plus size={18} color={colors.tint} strokeWidth={2.5} />
              <Text style={[styles.addBtnText, { color: colors.tint }]}>Ajouter un statut</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.listTitle, { color: colors.icon }]}>STATUTS ({statuts.length})</Text>
        </>
      }
      ListEmptyComponent={
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Tag size={32} color={colors.icon} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>Aucun statut défini</Text>
        </View>
      }
      renderItem={({ item: s }) =>
        editingId === s.id ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.tint + '40' }]}>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={editCode}
              onChangeText={setEditCode}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={editLibele}
              onChangeText={setEditLibele}
            />
            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.border }]} onPress={() => setEditingId(null)} activeOpacity={0.75}>
                <X size={15} color={colors.icon} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.tint + '18' }]} onPress={() => saveEdit(s)} activeOpacity={0.75}>
                <Check size={15} color={colors.tint} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statutInfo}>
              <Text style={[styles.code, { color: colors.tint }]}>{s.code}</Text>
              <Text style={[styles.libele, { color: colors.text }]}>{s.libele}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.tint + '12' }]} onPress={() => startEdit(s)} activeOpacity={0.75}>
                <Edit3 size={15} color={colors.tint} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#ef444412' }]} onPress={() => remove(s)} activeOpacity={0.75}>
                <Trash2 size={15} color="#ef4444" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  createForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  formTitle: { fontSize: 14, fontWeight: '700' },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formActions: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '600' },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  btnPrimaryText: { color: 'white', fontSize: 14, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  listTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statutInfo: { flex: 1, gap: 2 },
  code: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  libele: { fontSize: 15, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    gap: 10,
  },
  emptyText: { fontSize: 13 },
});
