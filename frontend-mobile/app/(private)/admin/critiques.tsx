import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import {
  Eye, EyeOff, Star, StarOff, Trash2, FileText, List,
  ChevronDown, ChevronUp,
} from 'lucide-react-native';

interface AdminCritique {
  id: number;
  user_id: number;
  note: number;
  contenu?: string;
  created_at: string;
  pseudo?: string;
  author_pseudo?: string;
  oeuvre_titre?: string;
  is_hidden?: boolean;
  is_featured?: boolean;
}

export default function AdminCritiquesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, token } = useAuth();

  const [hidden, setHidden] = useState<AdminCritique[]>([]);
  const [featured, setFeatured] = useState<AdminCritique[]>([]);
  const [allCritiques, setAllCritiques] = useState<AdminCritique[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isAdmin = user?.role_id === 3;

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      const fetches: Promise<void>[] = [
        apiFetch<AdminCritique[]>('/admin/critiques/hidden', { token }).then(setHidden).catch(() => {}),
      ];
      if (isAdmin) {
        fetches.push(
          apiFetch<AdminCritique[]>('/admin/critiques/featured', { token }).then(setFeatured).catch(() => {})
        );
      }
      Promise.all(fetches).finally(() => setLoading(false));
    }, [token, isAdmin])
  );

  const toggleAllCritiques = () => {
    if (showAll) { setShowAll(false); return; }
    setLoadingAll(true);
    apiFetch<AdminCritique[]>('/admin/critiques', { token })
      .then(setAllCritiques)
      .catch(() => {})
      .finally(() => { setLoadingAll(false); setShowAll(true); });
  };

  const unhide = (c: AdminCritique) => {
    apiFetch(`/admin/critiques/${c.id}/hide`, { method: 'DELETE', token }).catch(() => {});
    const updated = { ...c, is_hidden: false };
    setHidden(prev => prev.filter(x => x.id !== c.id));
    setAllCritiques(prev => prev.map(x => x.id === c.id ? updated : x));
  };

  const hide = (c: AdminCritique) => {
    Alert.alert('Masquer', 'Masquer cette critique ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Masquer', style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/critiques/${c.id}/hide`, { method: 'POST', token }).catch(() => {});
          const updated = { ...c, is_hidden: true, is_featured: false };
          setFeatured(prev => prev.filter(x => x.id !== c.id));
          setHidden(prev => prev.some(x => x.id === c.id) ? prev : [...prev, updated]);
          setAllCritiques(prev => prev.map(x => x.id === c.id ? updated : x));
        },
      },
    ]);
  };

  const feature = (c: AdminCritique) => {
    apiFetch(`/admin/critiques/${c.id}/feature`, { method: 'POST', token }).catch(() => {});
    const updated = { ...c, is_featured: true };
    setFeatured(prev => prev.some(x => x.id === c.id) ? prev : [...prev, updated]);
    setAllCritiques(prev => prev.map(x => x.id === c.id ? updated : x));
  };

  const unfeature = (c: AdminCritique) => {
    apiFetch(`/admin/critiques/${c.id}/feature`, { method: 'DELETE', token }).catch(() => {});
    const updated = { ...c, is_featured: false };
    setFeatured(prev => prev.filter(x => x.id !== c.id));
    setAllCritiques(prev => prev.map(x => x.id === c.id ? updated : x));
  };

  const deleteCritique = (c: AdminCritique) => {
    Alert.alert('Supprimer', 'Supprimer définitivement cette critique ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/critiques/${c.id}`, { method: 'DELETE', token }).catch(() => {});
          setHidden(prev => prev.filter(x => x.id !== c.id));
          setFeatured(prev => prev.filter(x => x.id !== c.id));
          setAllCritiques(prev => prev.filter(x => x.id !== c.id));
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
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>

      {/* Bouton toggle — toutes les critiques */}
      <TouchableOpacity
        style={[styles.toggleBtn, { backgroundColor: colors.tint + '14', borderColor: colors.tint + '30' }]}
        onPress={toggleAllCritiques}
        activeOpacity={0.75}
        disabled={loadingAll}
      >
        <List size={16} color={colors.tint} strokeWidth={2} />
        <Text style={[styles.toggleBtnText, { color: colors.tint }]}>
          {showAll ? 'Masquer toutes les critiques' : 'Voir toutes les critiques'}
        </Text>
        {loadingAll
          ? <ActivityIndicator size="small" color={colors.tint} />
          : showAll
            ? <ChevronUp size={16} color={colors.tint} strokeWidth={2} />
            : <ChevronDown size={16} color={colors.tint} strokeWidth={2} />}
      </TouchableOpacity>

      {/* Section : toutes les critiques */}
      {showAll && (
        <>
          <SectionHeaderView
            icon={<List size={14} color={colors.icon} strokeWidth={2} />}
            title={`TOUTES LES CRITIQUES (${allCritiques.length})`}
            colors={colors}
          />
          {allCritiques.length === 0
            ? <EmptyCard icon={<FileText size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucune critique" colors={colors} />
            : allCritiques.map(c => (
              <CritiqueCard
                key={c.id}
                c={c}
                type="all"
                isAdmin={isAdmin}
                colors={colors}
                onUnhide={unhide}
                onHide={hide}
                onFeature={feature}
                onUnfeature={unfeature}
                onDelete={deleteCritique}
              />
            ))}
        </>
      )}

      {/* Section : masquées */}
      <SectionHeaderView
        icon={<EyeOff size={14} color={colors.icon} strokeWidth={2} />}
        title={`MASQUÉES (${hidden.length})`}
        colors={colors}
      />
      {hidden.length === 0
        ? <EmptyCard icon={<FileText size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucune critique masquée" colors={colors} />
        : hidden.map(c => (
          <CritiqueCard
            key={c.id}
            c={c}
            type="hidden"
            isAdmin={isAdmin}
            colors={colors}
            onUnhide={unhide}
            onHide={hide}
            onFeature={feature}
            onUnfeature={unfeature}
            onDelete={deleteCritique}
          />
        ))}

      {/* Section : mises en avant (admin only) */}
      {isAdmin && (
        <>
          <SectionHeaderView
            icon={<Star size={14} color={colors.icon} strokeWidth={2} />}
            title={`MISES EN AVANT (${featured.length})`}
            colors={colors}
          />
          {featured.length === 0
            ? <EmptyCard icon={<FileText size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucune critique mise en avant" colors={colors} />
            : featured.map(c => (
              <CritiqueCard
                key={c.id}
                c={c}
                type="featured"
                isAdmin={isAdmin}
                colors={colors}
                onUnhide={unhide}
                onHide={hide}
                onFeature={feature}
                onUnfeature={unfeature}
                onDelete={deleteCritique}
              />
            ))}
        </>
      )}
    </ScrollView>
  );
}

function SectionHeaderView({
  icon, title, colors,
}: { icon: React.ReactNode; title: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={[styles.sectionTitle, { color: colors.icon }]}>{title}</Text>
    </View>
  );
}

function EmptyCard({
  icon, text, colors,
}: { icon: React.ReactNode; text: string; colors: typeof Colors.light }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.emptyText, { color: colors.icon }]}>{text}</Text>
    </View>
  );
}

function CritiqueCard({
  c, type, isAdmin, colors, onUnhide, onHide, onFeature, onUnfeature, onDelete,
}: {
  c: AdminCritique;
  type: 'all' | 'hidden' | 'featured';
  isAdmin: boolean;
  colors: typeof Colors.light;
  onUnhide: (c: AdminCritique) => void;
  onHide: (c: AdminCritique) => void;
  onFeature: (c: AdminCritique) => void;
  onUnfeature: (c: AdminCritique) => void;
  onDelete: (c: AdminCritique) => void;
}) {
  const author = c.author_pseudo ?? c.pseudo ?? `Utilisateur #${c.user_id}`;
  const title = c.oeuvre_titre ?? `Critique #${c.id}`;
  const noteColor = c.note >= 4 ? '#22c55e' : c.note >= 2.5 ? '#f59e0b' : '#ef4444';

  // Détermine l'état réel pour le type 'all'
  const isHidden = type === 'hidden' || (type === 'all' && c.is_hidden);
  const isFeatured = type === 'featured' || (type === 'all' && c.is_featured);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.cardAuthor, { color: colors.icon }]}>@{author}</Text>
        </View>
        <View style={[styles.noteBadge, { backgroundColor: noteColor + '18' }]}>
          <Text style={[styles.noteText, { color: noteColor }]}>{c.note}/5</Text>
        </View>
      </View>

      {c.contenu ? (
        <Text style={[styles.contenu, { color: colors.icon }]} numberOfLines={2}>{c.contenu}</Text>
      ) : null}

      {type === 'all' && (isHidden || isFeatured) && (
        <View style={styles.statusRow}>
          {isHidden && (
            <View style={[styles.statusBadge, { backgroundColor: '#f59e0b12' }]}>
              <EyeOff size={11} color="#f59e0b" strokeWidth={2} />
              <Text style={[styles.statusBadgeText, { color: '#f59e0b' }]}>Masquée</Text>
            </View>
          )}
          {isFeatured && (
            <View style={[styles.statusBadge, { backgroundColor: '#6366f112' }]}>
              <Star size={11} color="#6366f1" strokeWidth={2} />
              <Text style={[styles.statusBadgeText, { color: '#6366f1' }]}>Mise en avant</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {/* Actions selon le type de section ou l'état réel pour 'all' */}
        {isHidden && (
          <ActionBtn label="Afficher" icon={<Eye size={13} color={colors.tint} strokeWidth={2.5} />} color={colors.tint} onPress={() => onUnhide(c)} bg={colors.tint + '12'} />
        )}
        {!isHidden && (
          <ActionBtn label="Masquer" icon={<EyeOff size={13} color="#f59e0b" strokeWidth={2.5} />} color="#f59e0b" onPress={() => onHide(c)} bg="#f59e0b12" />
        )}
        {isAdmin && !isFeatured && !isHidden && (
          <ActionBtn label="Mettre en avant" icon={<Star size={13} color={colors.tint} strokeWidth={2.5} />} color={colors.tint} onPress={() => onFeature(c)} bg={colors.tint + '12'} />
        )}
        {isAdmin && isFeatured && (
          <ActionBtn label="Retirer" icon={<StarOff size={13} color={colors.icon} strokeWidth={2.5} />} color={colors.icon} onPress={() => onUnfeature(c)} bg={colors.border} />
        )}
        {isAdmin && (
          <ActionBtn label="Supprimer" icon={<Trash2 size={13} color="#ef4444" strokeWidth={2.5} />} color="#ef4444" onPress={() => onDelete(c)} bg="#ef444412" />
        )}
      </View>
    </View>
  );
}

function ActionBtn({
  label, icon, color, onPress, bg,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
  bg: string;
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      {icon}
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  toggleBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardMeta: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardAuthor: { fontSize: 12 },
  noteBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  noteText: { fontSize: 12, fontWeight: '700' },
  contenu: { fontSize: 13, lineHeight: 18 },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    gap: 10,
    marginBottom: 8,
  },
  emptyText: { fontSize: 13 },
});
