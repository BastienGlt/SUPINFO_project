import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Edit3, X, Globe, Lock, Gamepad2 } from 'lucide-react-native';

interface Liste {
  id: number;
  nom: string;
  description?: string;
  visibilite: 'PUBLIQUE' | 'PRIVEE';
}

interface Oeuvre {
  id: number;
  titre: string;
  api_reference_id?: string;
  description?: string;
}

export default function ListeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { token } = useAuth();

  const [liste, setListe] = useState<Liste | null>(null);
  const [oeuvres, setOeuvres] = useState<Oeuvre[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVis, setEditVis] = useState<'PUBLIQUE' | 'PRIVEE'>('PRIVEE');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [listeData, oeuvresData] = await Promise.all([
        apiFetch<Liste>(`/listes/${id}`, { token }),
        apiFetch<Oeuvre[]>(`/listes/${id}/oeuvres`, { token }),
      ]);
      setListe(listeData);
      setOeuvres(Array.isArray(oeuvresData) ? oeuvresData : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]));

  const openEdit = useCallback(() => {
    if (!liste) return;
    setEditNom(liste.nom);
    setEditDesc(liste.description ?? '');
    setEditVis(liste.visibilite);
    setEditError('');
    setEditModal(true);
  }, [liste]);

  const handleSaveEdit = useCallback(async () => {
    if (!editNom.trim()) { setEditError('Le nom est requis'); return; }
    if (!token || !id) return;
    setSaving(true); setEditError('');
    try {
      await apiFetch(`/listes/${id}`, {
        method: 'PUT', token,
        body: JSON.stringify({
          nom: editNom.trim(),
          ...(editDesc.trim() ? { description: editDesc.trim() } : {}),
          visibilite: editVis,
        }),
      });
      setListe(prev => prev ? { ...prev, nom: editNom.trim(), description: editDesc.trim() || undefined, visibilite: editVis } : null);
      setEditModal(false);
    } catch {
      setEditError('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  }, [editNom, editDesc, editVis, token, id]);

  const handleRemoveOeuvre = useCallback((oeuvreId: number, titre: string) => {
    Alert.alert('Retirer le jeu', `Retirer "${titre}" de la liste ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/listes/${id}/oeuvres/${oeuvreId}`, { method: 'DELETE', token });
            setOeuvres(prev => prev.filter(o => o.id !== oeuvreId));
          } catch {}
        },
      },
    ]);
  }, [id, token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: liste?.nom ?? 'Ma liste',
        headerRight: () => (
          <TouchableOpacity onPress={openEdit} hitSlop={8}>
            <Edit3 size={20} color={colors.tint} strokeWidth={2} />
          </TouchableOpacity>
        ),
      }} />
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        ListHeaderComponent={liste ? (
          <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {!!liste.description && (
              <Text style={[styles.desc, { color: colors.icon }]}>{liste.description}</Text>
            )}
            <View style={[styles.badge, {
              backgroundColor: liste.visibilite === 'PUBLIQUE' ? colors.tintDim : colors.surface,
              borderColor: liste.visibilite === 'PUBLIQUE' ? colors.tintBorder : colors.border,
            }]}>
              {liste.visibilite === 'PUBLIQUE'
                ? <Globe size={12} color={colors.tint} strokeWidth={2} />
                : <Lock size={12} color={colors.icon} strokeWidth={2} />
              }
              <Text style={[styles.badgeText, { color: liste.visibilite === 'PUBLIQUE' ? colors.tint : colors.icon }]}>
                {liste.visibilite === 'PUBLIQUE' ? 'Publique' : 'Privée'}
              </Text>
            </View>
          </View>
        ) : null}
        data={oeuvres}
        keyExtractor={(item, index) => item.id != null ? String(item.id) : `oeuvre-${index}`}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tintDim }]}>
              <Gamepad2 size={18} color={colors.tint} strokeWidth={2} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.titre}</Text>
            <TouchableOpacity onPress={() => handleRemoveOeuvre(item.id, item.titre)} hitSlop={8} style={styles.removeBtn}>
              <X size={16} color={colors.icon} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>Aucun jeu dans cette liste</Text>
            <Text style={[styles.emptySub, { color: colors.icon }]}>Ajoutez des jeux depuis leur page de détail</Text>
          </View>
        }
      />

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Modifier la liste</Text>
                <TouchableOpacity onPress={() => setEditModal(false)} hitSlop={8}>
                  <X size={20} color={colors.icon} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={editNom}
                onChangeText={setEditNom}
                placeholder="Nom de la liste *"
                placeholderTextColor={colors.icon}
                maxLength={100}
              />
              <TextInput
                style={[styles.inputMulti, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Description (facultatif)"
                placeholderTextColor={colors.icon}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.visRow}>
                {(['PRIVEE', 'PUBLIQUE'] as const).map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visBtn, {
                      borderColor: editVis === v ? colors.tint : colors.border,
                      backgroundColor: editVis === v ? colors.tintDim : colors.surface,
                    }]}
                    onPress={() => setEditVis(v)}
                    activeOpacity={0.8}
                  >
                    {v === 'PUBLIQUE'
                      ? <Globe size={14} color={editVis === v ? colors.tint : colors.icon} strokeWidth={2} />
                      : <Lock size={14} color={editVis === v ? colors.tint : colors.icon} strokeWidth={2} />
                    }
                    <Text style={[styles.visBtnText, { color: editVis === v ? colors.tint : colors.icon }]}>
                      {v === 'PUBLIQUE' ? 'Publique' : 'Privée'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!editError && <Text style={[styles.errorText, { color: colors.red }]}>{editError}</Text>}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint }, saving && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, gap: 10, paddingBottom: 40 },
  header:      { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 2 },
  desc:        { fontSize: 14, lineHeight: 20 },
  badge:       { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 12, fontWeight: '600' },
  card:        { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  iconWrap:    { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: '600' },
  removeBtn:   { padding: 4 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText:   { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub:    { fontSize: 13, textAlign: 'center' },
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 18, fontWeight: '800' },
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  inputMulti:  { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  visRow:      { flexDirection: 'row', gap: 10 },
  visBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  visBtnText:  { fontSize: 14, fontWeight: '600' },
  errorText:   { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  saveBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
