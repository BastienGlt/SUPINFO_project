import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, router, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Plus, X, ChevronRight, Lock, Globe, ChevronLeft, Search } from 'lucide-react-native';

interface Liste {
  id: number;
  user_id: number;
  nom: string;
  description?: string;
  visibilite: 'PUBLIQUE' | 'PRIVEE';
  created_at: string;
}

export default function ListesScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { token } = useAuth();

  const [listes, setListes] = useState<Liste[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [visibilite, setVisibilite] = useState<'PUBLIQUE' | 'PRIVEE'>('PRIVEE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<Set<'PUBLIQUE' | 'PRIVEE' | 'ALL'>>(new Set(['ALL']));

  const fetchListes = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<Liste[]>('/listes', { token });
      setListes(Array.isArray(data) ? data : []);
    } catch {
      setListes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchListes();
  }, [fetchListes]));

  const filteredListes = useMemo(() => {
    let result = listes;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.nom.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    }

    // Filter by visibility
    if (selectedVisibility.size > 0 && !selectedVisibility.has('ALL')) {
      result = result.filter(item => selectedVisibility.has(item.visibilite));
    }

    return result;
  }, [listes, searchQuery, selectedVisibility]);

  const openCreate = useCallback(() => {
    setNom(''); setDescription(''); setVisibilite('PRIVEE'); setError('');
    setCreateModal(true);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!nom.trim()) { setError('Le nom est requis'); return; }
    if (!token) return;
    setSaving(true); setError('');
    try {
      await apiFetch('/listes', {
        method: 'POST', token,
        body: JSON.stringify({
          nom: nom.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          visibilite,
        }),
      });
      setCreateModal(false);
      fetchListes();
    } catch {
      setError('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }, [nom, description, visibilite, token, fetchListes]);

  const handleDelete = useCallback((id: number, nomListe: string) => {
    Alert.alert('Supprimer la liste', `Supprimer "${nomListe}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/listes/${id}`, { method: 'DELETE', token });
            setListes(prev => prev.filter(l => l.id !== id));
          } catch {}
        },
      },
    ]);
  }, [token]);

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
        title: 'Mes listes',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={24} color={colors.tint} strokeWidth={2.5} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={openCreate} hitSlop={8}>
            <Plus size={22} color={colors.tint} strokeWidth={2.5} />
          </TouchableOpacity>
        ),
      }} />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.icon} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Chercher une liste..."
          placeholderTextColor={colors.icon}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={18} color={colors.icon} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          {(['ALL', 'PRIVEE', 'PUBLIQUE'] as const).map((visibility) => {
            const label = visibility === 'ALL' ? 'Tous' : visibility === 'PRIVEE' ? 'Privées' : 'Publiques';
            const isSelected = selectedVisibility.has(visibility);
            const icon = visibility === 'PUBLIQUE' ? <Globe size={14} /> : visibility === 'PRIVEE' ? <Lock size={14} /> : null;

            return (
              <TouchableOpacity
                key={visibility}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.surface,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedVisibility((prev) => {
                    const s = new Set(prev);
                    if (visibility === 'ALL') {
                      return new Set(['ALL']);
                    }
                    s.delete('ALL');
                    if (s.has(visibility)) s.delete(visibility);
                    else s.add(visibility);
                    if (s.size === 0) s.add('ALL');
                    return s;
                  })
                }
                activeOpacity={0.7}
              >
                {icon && <View style={{ tintColor: isSelected ? '#fff' : colors.icon }}>{icon}</View>}
                <Text style={[styles.filterBtnText, { color: isSelected ? '#fff' : colors.icon }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        data={filteredListes}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(`/(private)/liste/${item.id}`)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.tintDim }]}>
              {item.visibilite === 'PUBLIQUE'
                ? <Globe size={18} color={colors.tint} strokeWidth={2} />
                : <Lock size={18} color={colors.tint} strokeWidth={2} />
              }
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.nom}</Text>
              {!!item.description && (
                <Text style={[styles.cardDesc, { color: colors.icon }]} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={[styles.badge, {
                backgroundColor: item.visibilite === 'PUBLIQUE' ? colors.tintDim : colors.surface,
                borderColor: item.visibilite === 'PUBLIQUE' ? colors.tintBorder : colors.border,
              }]}>
                <Text style={[styles.badgeText, { color: item.visibilite === 'PUBLIQUE' ? colors.tint : colors.icon }]}>
                  {item.visibilite === 'PUBLIQUE' ? 'Publique' : 'Privée'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.nom)} hitSlop={8} style={styles.deleteBtn}>
              <X size={16} color={colors.icon} strokeWidth={2} />
            </TouchableOpacity>
            <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery || (selectedVisibility.size > 0 && !selectedVisibility.has('ALL'))
                ? 'Aucune liste ne correspond'
                : 'Aucune liste pour l\'instant'}
            </Text>
            {!searchQuery && (selectedVisibility.size === 0 || selectedVisibility.has('ALL')) && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}
                onPress={openCreate}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.tint} strokeWidth={2.5} />
                <Text style={[styles.emptyBtnText, { color: colors.tint }]}>Créer une liste</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setCreateModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Nouvelle liste</Text>
                <TouchableOpacity onPress={() => setCreateModal(false)} hitSlop={8}>
                  <X size={20} color={colors.icon} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={nom}
                onChangeText={setNom}
                placeholder="Nom de la liste *"
                placeholderTextColor={colors.icon}
                maxLength={100}
              />
              <TextInput
                style={[styles.inputMulti, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
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
                      borderColor: visibilite === v ? colors.tint : colors.border,
                      backgroundColor: visibilite === v ? colors.tintDim : colors.surface,
                    }]}
                    onPress={() => setVisibilite(v)}
                    activeOpacity={0.8}
                  >
                    {v === 'PUBLIQUE'
                      ? <Globe size={14} color={visibilite === v ? colors.tint : colors.icon} strokeWidth={2} />
                      : <Lock size={14} color={visibilite === v ? colors.tint : colors.icon} strokeWidth={2} />
                    }
                    <Text style={[styles.visBtnText, { color: visibilite === v ? colors.tint : colors.icon }]}>
                      {v === 'PUBLIQUE' ? 'Publique' : 'Privée'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!error && <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint }, saving && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 16, gap: 10, paddingBottom: 40 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 42 },
  searchInput:  { flex: 1, fontSize: 14, paddingVertical: 8 },
  filterScroll: { height: 44, marginHorizontal: 0, marginVertical: 0, backgroundColor: 'transparent' },
  filterContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
  filterBtn:   { height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12 },
  filterBtnText: { fontSize: 12, fontWeight: '600' },
  card:         { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  iconWrap:     { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardContent:  { flex: 1, gap: 4 },
  cardTitle:    { fontSize: 15, fontWeight: '700' },
  cardDesc:     { fontSize: 12, lineHeight: 17 },
  badge:        { alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  deleteBtn:    { padding: 4 },
  emptyWrap:    { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText:    { fontSize: 15, textAlign: 'center' },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '600' },
  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle:   { fontSize: 18, fontWeight: '800' },
  input:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  inputMulti:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  visRow:       { flexDirection: 'row', gap: 10 },
  visBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  visBtnText:   { fontSize: 14, fontWeight: '600' },
  errorText:    { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  saveBtn:      { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText:  { color: 'white', fontWeight: '700', fontSize: 16 },
});
