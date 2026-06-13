import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useRef } from 'react';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { rawgFetch } from '@/services/rawgService';
import { apiFetch } from '@/services/apiService';
import { Star, Plus, Check, ChevronDown, Edit3, BookOpen, ChevronUp, X, List } from 'lucide-react-native';

interface RawgGameDetail {
  id: number;
  name: string;
  description_raw: string;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  released: string | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
}

interface RatingStats {
  average_rating?: string | number;
  total_ratings?: number;
  rating_1?: string | number;
  rating_2?: string | number;
  rating_3?: string | number;
  rating_4?: string | number;
  rating_5?: string | number;
  max_rating?: number;
  min_rating?: number;
  oeuvre_id?: number;
  note_moyenne?: string | number;
  total_critiques?: number;
  moyenne?: number;
  total?: number;
  distribution?: Record<string, number>;
}
interface UserRating  { id: number; note: number; contenu?: string; }
interface UserListe {
  id: number;
  nom: string;
  visibilite: string;
}

function metacriticColor(score: number) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { user, token } = useAuth();

  const [game, setGame]             = useState<RawgGameDetail | null>(null);
  const [stats, setStats]           = useState<RatingStats | null>(null);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [librairie, setLibrairie]   = useState<BiblioItem | null>(null);
  const [statuts, setStatuts]       = useState<Statut[]>([]);
  const [loading, setLoading]       = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [statutModal, setStatutModal]   = useState(false);
  const [savingStatut, setSavingStatut] = useState(false);
  const [critiqueModal, setCritiqueModal] = useState(false);
  const [critiqueNote, setCritiqueNote]   = useState('');
  const [critiqueContenu, setCritiqueContenu] = useState('');
  const [savingCritique, setSavingCritique]   = useState(false);
  const [critiqueError, setCritiqueError]     = useState('');
  const [listesModal, setListesModal]         = useState(false);
  const [userListes, setUserListes]           = useState<UserListe[]>([]);
  const [gameListesIds, setGameListesIds]     = useState<number[]>([]);
  const [addingToListeId, setAddingToListeId] = useState<number | null>(null);
  const loadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const isFirstLoad = !loadedRef.current;
      if (isFirstLoad) {
        loadedRef.current = true;
        setLoading(true);
        const staticLoads: Promise<unknown>[] = [
          rawgFetch<RawgGameDetail>(`/games/${id}`).then(setGame).catch(() => {}),
          apiFetch<Statut[]>('/admin/statuts').then(setStatuts).catch(() => {}),
        ];
        Promise.all(staticLoads).finally(() => setLoading(false));
      }
      const dynamicLoads: Promise<unknown>[] = [
        apiFetch<RatingStats>(`/critiques/${id}/ratings/stats`).then(setStats).catch(() => {}),
      ];
      if (user && token) {
        dynamicLoads.push(
          apiFetch<UserRating>(`/critiques/${id}/ratings/me`, { token })
            .then((r) => { setUserRating(r); setCritiqueNote(String(r.note)); setCritiqueContenu(r.contenu ?? ''); })
            .catch(() => {}),
          apiFetch<BiblioItem[]>('/bibliotheque/items', { token })
            .then((items) => { const found = items.find((i) => String(i.oeuvre_id) === String(id) || String(i.api_reference_id) === String(id)); setLibrairie(found ?? null); })
            .catch(() => {}),
        );
      }
      Promise.all(dynamicLoads);
    }, [id, user?.id, token])
  );

  const handleSetStatut = useCallback(async (statut: Statut) => {
    if (!token || !id) return;
    setSavingStatut(true);
    try {
      if (librairie) {
        await apiFetch(`/bibliotheque/items/${librairie.id}`, { method: 'PUT', token, body: JSON.stringify({ statut_id: statut.id }) });
        setLibrairie((prev) => prev ? { ...prev, statut } : null);
      } else {
        const data = await apiFetch<{ item_id: number }>('/bibliotheque/items', { method: 'POST', token, body: JSON.stringify({ api_reference_id: String(id), titre: game?.name ?? '', description: game?.description_raw ?? '', statut_id: statut.id }) });
        setLibrairie({ id: data.item_id, oeuvre_id: Number(id), statut });
      }
      setStatutModal(false);
    } finally { setSavingStatut(false); }
  }, [token, id, librairie, game]);

  const handleSaveCritique = useCallback(async () => {    if (!token || !id) return;
    const note = parseFloat(critiqueNote.replace(',', '.'));
    if (isNaN(note) || note < 0 || note > 5) { setCritiqueError('Note invalide (entre 0 et 5)'); return; }
    setSavingCritique(true); setCritiqueError('');
    try {
      const body = JSON.stringify({ note, titre: game?.name ?? '', description: game?.description_raw?.slice(0, 500) ?? '', ...(critiqueContenu.trim() ? { contenu: critiqueContenu.trim() } : {}) });
      const method = userRating ? 'PUT' : 'POST';
      const saved = await apiFetch<UserRating>(`/critiques/${id}/ratings`, { method, token, body });
      setUserRating(saved ?? { id: 0, note, contenu: critiqueContenu.trim() });
      apiFetch<RatingStats>(`/critiques/${id}/ratings/stats`).then(setStats).catch(() => {});
      setCritiqueModal(false);
    } catch (err) {
      const e = err as { status?: number; error?: string; message?: string };
      if (e?.status === 409) {
        try {
          const body = JSON.stringify({ note, titre: game?.name ?? '', description: game?.description_raw?.slice(0, 500) ?? '', ...(critiqueContenu.trim() ? { contenu: critiqueContenu.trim() } : {}) });
          const saved = await apiFetch<UserRating>(`/critiques/${id}/ratings`, { method: 'PUT', token, body });
          setUserRating(saved ?? { id: userRating?.id ?? 0, note, contenu: critiqueContenu.trim() });
          apiFetch<RatingStats>(`/critiques/${id}/ratings/stats`).then(setStats).catch(() => {});
          setCritiqueModal(false);
        } catch {}
      } else { setCritiqueError(e?.error ?? e?.message ?? `Erreur ${e?.status ?? ''}`); }
    } finally { setSavingCritique(false); }
  }, [token, id, critiqueNote, critiqueContenu, userRating, game]);

  const handleOpenListesModal = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<UserListe[]>('/listes', { token });
      setUserListes(Array.isArray(data) ? data : []);

      // Chercher les listes contenant cette oeuvre
      const listeIds: number[] = [];
      if (Array.isArray(data)) {
        for (const liste of data) {
          try {
            const oeuvres = await apiFetch<Array<{ api_reference_id?: string; oeuvre_id?: number }>>(`/listes/${liste.id}/oeuvres`, { token });
            if (Array.isArray(oeuvres) && oeuvres.some(o => o.api_reference_id === String(id))) {
              listeIds.push(liste.id);
            }
          } catch {
            // Ignorer les erreurs de chaque liste
          }
        }
      }
      setGameListesIds(listeIds);
    } catch {
      setUserListes([]);
      setGameListesIds([]);
    }
    setListesModal(true);
  }, [token, id]);

  const handleAddToListe = useCallback(async (listeId: number) => {
    if (!token || !id || !game) return;
    setAddingToListeId(listeId);
    try {
      await apiFetch(`/listes/${listeId}/oeuvres`, {
        method: 'POST', token,
        body: JSON.stringify({
          api_reference_id: String(id),
          titre: game.name,
          description: game.description_raw?.slice(0, 500) ?? '',
        }),
      });
      // Ajouter l'ID de la liste à gameListesIds pour mettre à jour l'UI
      setGameListesIds(prev => Array.from(new Set([...prev, listeId])));
    } catch {}
    setAddingToListeId(null);
  }, [token, id, game]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.tint} size="large" /></View>;
  if (!game) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><Text style={{ color: colors.icon }}>Jeu introuvable</Text></View>;

  const rawgStars = Math.round(game.rating);

  return (
    <>
      <Stack.Screen options={{ title: game.name }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {game.background_image ? (
          <Image source={game.background_image} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, { backgroundColor: colors.tintDim }]} />
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{game.name}</Text>
            {game.metacritic != null && (
              <View style={[styles.metacriticBadge, { backgroundColor: metacriticColor(game.metacritic) + '20' }]}>
                <Text style={[styles.metacriticText, { color: metacriticColor(game.metacritic) }]}>{game.metacritic}</Text>
              </View>
            )}
          </View>


          <View style={styles.tagsRow}>
            {game.released && (
              <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.icon }]}>{game.released.split('-')[0]}</Text>
              </View>
            )}
            {game.genres.slice(0, 3).map((g) => (
              <View key={g.id} style={[styles.tag, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}>
                <Text style={[styles.tagText, { color: colors.tint }]}>{g.name}</Text>
              </View>
            ))}
          </View>

          {game.platforms.length > 0 && (
            <Text style={[styles.platforms, { color: colors.icon }]} numberOfLines={2}>
              {game.platforms.slice(0, 6).map((p) => p.platform.name).join(' · ')}
            </Text>
          )}

          {!!game.description_raw?.trim() && (
            <View>
              <Text style={[styles.description, { color: colors.icon }]} numberOfLines={descExpanded ? undefined : 5}>
                {game.description_raw.trim()}
              </Text>
              <TouchableOpacity style={styles.readMoreBtn} onPress={() => setDescExpanded((v) => !v)} activeOpacity={0.7}>
                {descExpanded ? <ChevronUp size={14} color={colors.tint} strokeWidth={2} /> : <ChevronDown size={14} color={colors.tint} strokeWidth={2} />}
                <Text style={[styles.readMoreText, { color: colors.tint }]}>{descExpanded ? 'Réduire' : 'Lire la suite'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(game.rating > 0 || (stats != null && (stats.total_ratings ?? stats.total_critiques ?? stats.total ?? 0) > 0)) && (
            <View style={[styles.ratingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ratingsTitle, { color: colors.text }]}>Notations</Text>
              {game.rating > 0 && (
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingSource, { color: colors.icon }]}>RAWG</Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={13} strokeWidth={0} color={colors.tint} fill={i <= rawgStars ? colors.tint : colors.border} />
                    ))}
                  </View>
                  <Text style={[styles.ratingVal, { color: colors.tint }]}>
                    {game.rating.toFixed(1)}<Text style={[styles.ratingValSuffix, { color: colors.icon }]}>/5</Text>
                  </Text>
                </View>
              )}
              {stats != null && (stats.total_ratings ?? stats.total_critiques ?? stats.total ?? 0) > 0 && (() => {
                const total = stats.total_ratings ?? stats.total_critiques ?? stats.total ?? 0;
                const avg = typeof (stats.average_rating ?? stats.note_moyenne ?? stats.moyenne) === 'string'
                  ? parseFloat(String(stats.average_rating ?? stats.note_moyenne ?? stats.moyenne))
                  : (stats.average_rating ?? stats.note_moyenne ?? stats.moyenne ?? 0);
                return (
                  <>
                    {game.rating > 0 && <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />}
                    <View style={styles.ratingRow}>
                      <Text style={[styles.ratingSource, { color: colors.icon }]}>Communauté</Text>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={13} strokeWidth={0} color={colors.tint} fill={i <= Math.round(avg) ? colors.tint : colors.border} />
                        ))}
                      </View>
                      <Text style={[styles.ratingVal, { color: colors.tint }]}>
                        {avg.toFixed(1)}<Text style={[styles.ratingValSuffix, { color: colors.icon }]}>/5</Text>
                      </Text>
                      <Text style={[styles.ratingCount, { color: colors.icon }]}>{total} avis</Text>
                    </View>
                    {(() => {
                      const distMap: Record<number, number> = {};
                      for (let i = 1; i <= 5; i++) {
                        const count = parseInt(String(stats[`rating_${i}` as keyof typeof stats] ?? 0), 10);
                        distMap[i] = count;
                      }
                      const hasDistribution = Object.values(distMap).some(v => v > 0);
                      return hasDistribution && (
                        <View style={styles.distContainer}>
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = distMap[star] ?? 0;
                            const pct = total > 0 ? count / total : 0;
                            return (
                              <View key={star} style={styles.distRow}>
                                <Text style={[styles.distLabel, { color: colors.icon }]}>{star}</Text>
                                <Star size={9} strokeWidth={0} color={colors.tint} fill={colors.tint} />
                                <View style={[styles.distTrack, { backgroundColor: colors.border }]}>
                                  <View style={[styles.distFill, { backgroundColor: colors.tint, width: `${Math.round(pct * 100)}%` as any }]} />
                                </View>
                                <Text style={[styles.distCount, { color: colors.icon }]}>{count}</Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}
                  </>
                );
              })()}
            </View>
          )}

          {user && token && (
            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: librairie ? colors.tintBorder : colors.border, backgroundColor: librairie ? colors.tintDim : colors.surface }]}
                onPress={() => setStatutModal(true)}
                activeOpacity={0.8}
              >
                <BookOpen size={18} color={librairie ? colors.tint : colors.icon} strokeWidth={2} />
                <Text style={[styles.actionBtnText, { color: librairie ? colors.tint : colors.text }]}>
                  {librairie ? librairie.statut.libele : 'Ajouter à ma collection'}
                </Text>
                <ChevronDown size={14} color={librairie ? colors.tint : colors.icon} strokeWidth={2} />
              </TouchableOpacity>

              {userRating ? (
                <View style={[styles.myRatingCard, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}>
                  <View style={styles.myRatingRow}>
                    <Star size={14} color={colors.tint} fill={colors.tint} strokeWidth={0} />
                    <Text style={[styles.myRatingTitle, { color: colors.tint }]}>Mon avis : {userRating.note}/5</Text>
                    <TouchableOpacity onPress={() => { setCritiqueError(''); setCritiqueModal(true); }} hitSlop={8} activeOpacity={0.7}>
                      <Edit3 size={15} color={colors.tint} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {!!userRating.contenu && (
                    <Text style={[styles.myRatingContenu, { color: colors.icon }]} numberOfLines={4}>
                      {userRating.contenu}
                    </Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => { setCritiqueError(''); setCritiqueModal(true); }}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={colors.icon} strokeWidth={2} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Donner mon avis</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleOpenListesModal}
                activeOpacity={0.8}
              >
                <List size={18} color={colors.icon} strokeWidth={2} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Ajouter à une liste</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Library modal */}
      <Modal visible={statutModal} transparent animationType="slide" onRequestClose={() => setStatutModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatutModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ma collection</Text>
              <TouchableOpacity onPress={() => setStatutModal(false)} hitSlop={8}><X size={20} color={colors.icon} strokeWidth={2} /></TouchableOpacity>
            </View>
            {statuts.map((s) => {
              const isSelected = librairie?.statut.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.statutItem, { borderColor: colors.border }, isSelected && { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}
                  onPress={() => handleSetStatut(s)}
                  disabled={savingStatut}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.statutText, { color: isSelected ? colors.tint : colors.text }]}>{s.libele}</Text>
                  {isSelected && (savingStatut ? <ActivityIndicator size="small" color={colors.tint} /> : <Check size={16} color={colors.tint} strokeWidth={2.5} />)}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Critique modal */}
      <Modal visible={critiqueModal} transparent animationType="slide" onRequestClose={() => setCritiqueModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCritiqueModal(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{userRating ? 'Modifier ma critique' : 'Donner mon avis'}</Text>
                  <TouchableOpacity onPress={() => setCritiqueModal(false)} hitSlop={8}><X size={20} color={colors.icon} strokeWidth={2} /></TouchableOpacity>
                </View>
                <View style={[styles.noteRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput style={[styles.noteInput, { color: colors.text }]} value={critiqueNote} onChangeText={setCritiqueNote} placeholder="0 – 5" placeholderTextColor={colors.tabIconDefault} keyboardType="decimal-pad" maxLength={5} />
                  <Text style={[styles.noteSuffix, { color: colors.icon }]}>/5</Text>
                </View>
                <TextInput
                  style={[styles.contenuInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={critiqueContenu} onChangeText={setCritiqueContenu}
                  placeholder="Votre critique (facultatif)…" placeholderTextColor={colors.tabIconDefault}
                  multiline maxLength={2000} textAlignVertical="top"
                />
                {!!critiqueError && <Text style={[styles.critiqueErrorText, { color: colors.red }]}>{critiqueError}</Text>}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.tint }, savingCritique && { opacity: 0.6 }]}
                  onPress={handleSaveCritique} disabled={savingCritique} activeOpacity={0.85}
                >
                  {savingCritique ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Listes modal */}
      <Modal visible={listesModal} transparent animationType="slide" onRequestClose={() => setListesModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setListesModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter à une liste</Text>
              <TouchableOpacity onPress={() => setListesModal(false)} hitSlop={8}><X size={20} color={colors.icon} strokeWidth={2} /></TouchableOpacity>
            </View>
            {userListes.length === 0 ? (
              <Text style={[styles.noListeText, { color: colors.icon }]}>Aucune liste. Créez-en une depuis votre profil.</Text>
            ) : (
              userListes.map(l => {
                const isInList = gameListesIds.includes(l.id);
                const isLoading = addingToListeId === l.id;
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.statutItem, { borderColor: isInList ? colors.tintBorder : colors.border }, isInList && { backgroundColor: colors.tintDim }]}
                    onPress={() => !isInList && handleAddToListe(l.id)}
                    disabled={isLoading || isInList}
                    activeOpacity={0.75}
                  >
                    <View style={styles.listeItemContent}>
                      <Text style={[styles.statutText, { color: isInList ? colors.tint : colors.text }]}>{l.nom}</Text>
                      {l.visibilite === 'PRIVEE' && (
                        <Text style={[styles.listeVisibilite, { color: colors.icon }]}>Privée</Text>
                      )}
                    </View>
                    {isLoading && <ActivityIndicator size="small" color={colors.tint} />}
                    {isInList && <Check size={16} color={colors.tint} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { paddingBottom: 60 },
  hero:          { width: '100%', height: 220 },
  body:          { padding: 20, gap: 16 },
  titleRow:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title:         { flex: 1, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  metacriticBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', minWidth: 44, alignItems: 'center' },
  metacriticText:  { fontWeight: '800', fontSize: 16 },
  ratingsCard:     { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  ratingsTitle:    { fontWeight: '700', fontSize: 15 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingSource:    { fontSize: 13, fontWeight: '600', width: 88 },
  ratingStars:     { flexDirection: 'row', gap: 2 },
  ratingVal:       { fontSize: 15, fontWeight: '700', marginLeft: 2 },
  ratingValSuffix: { fontSize: 12, fontWeight: '500' },
  ratingCount:     { fontSize: 12, flex: 1, textAlign: 'right' },
  ratingDivider:   { height: 1, marginVertical: 2 },
  distContainer:   { gap: 4, marginTop: 4 },
  distRow:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  distLabel:       { fontSize: 11, fontWeight: '600', width: 10, textAlign: 'right' },
  distTrack:       { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  distFill:        { height: '100%', borderRadius: 3 },
  distCount:       { fontSize: 11, width: 24, textAlign: 'right' },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:           { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:       { fontSize: 12, fontWeight: '500' },
  platforms:     { fontSize: 12, lineHeight: 19 },
  description:   { fontSize: 14, lineHeight: 22 },
  readMoreBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  readMoreText:  { fontSize: 13, fontWeight: '600' },
  myRatingCard:  { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  myRatingRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'space-between' },
  myRatingTitle: { flex: 1, fontWeight: '700', fontSize: 14 },
  myRatingContenu: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  actionsCol:    { gap: 10 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  actionBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  modalSheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:    { fontSize: 18, fontWeight: '800' },
  statutItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  statutText:    { fontSize: 15, fontWeight: '600' },
  noteRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  noteInput:     { flex: 1, fontSize: 16, paddingVertical: 10 },
  noteSuffix:    { fontSize: 14 },
  contenuInput:  { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 100 },
  saveBtn:       { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: 'white', fontWeight: '700', fontSize: 16 },
  critiqueErrorText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  noListeText:       { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  listeItemContent:  { flex: 1, gap: 2 },
  listeVisibilite:   { fontSize: 11, fontWeight: '500' },
});
