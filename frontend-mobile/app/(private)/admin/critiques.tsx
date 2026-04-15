import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, SectionList,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Eye, EyeOff, Star, StarOff, Trash2, FileText } from 'lucide-react-native';

interface AdminCritique {
  id: number;
  user_id: number;
  note: number;
  contenu?: string;
  created_at: string;
  pseudo?: string;
  author_pseudo?: string;
  oeuvre_titre?: string;
}

export default function AdminCritiquesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, token } = useAuth();

  const [hidden, setHidden] = useState<AdminCritique[]>([]);
  const [featured, setFeatured] = useState<AdminCritique[]>([]);
  const [loading, setLoading] = useState(true);

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

  const unhide = (c: AdminCritique) => {
    apiFetch(`/admin/critiques/${c.id}/hide`, { method: 'DELETE', token }).catch(() => {});
    setHidden((prev) => prev.filter((x) => x.id !== c.id));
  };

  const deleteCritique = (c: AdminCritique) => {
    Alert.alert('Supprimer', 'Supprimer définitivement cette critique ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/critiques/${c.id}`, { method: 'DELETE', token }).catch(() => {});
          setHidden((prev) => prev.filter((x) => x.id !== c.id));
          setFeatured((prev) => prev.filter((x) => x.id !== c.id));
        },
      },
    ]);
  };

  const unfeature = (c: AdminCritique) => {
    apiFetch(`/admin/critiques/${c.id}/feature`, { method: 'DELETE', token }).catch(() => {});
    setFeatured((prev) => prev.filter((x) => x.id !== c.id));
  };

  const hide = (c: AdminCritique) => {
    Alert.alert('Masquer', 'Masquer cette critique ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Masquer',
        style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/critiques/${c.id}/hide`, { method: 'POST', token }).catch(() => {});
          setFeatured((prev) => prev.filter((x) => x.id !== c.id));
          setHidden((prev) => prev.some((x) => x.id === c.id) ? prev : [...prev, c]);
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

  const sections = [
    { title: 'MASQUÉES', data: hidden, type: 'hidden' as const },
    ...(isAdmin ? [{ title: 'MISES EN AVANT', data: featured, type: 'featured' as const }] : []),
  ];

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          {section.type === 'hidden'
            ? <EyeOff size={14} color={colors.icon} strokeWidth={2} />
            : <Star size={14} color={colors.icon} strokeWidth={2} />}
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>
            {section.title} ({section.data.length})
          </Text>
        </View>
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FileText size={32} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>Aucune critique</Text>
          </View>
        ) : null
      }
      renderItem={({ item, section }) => (
        <CritiqueCard
          c={item}
          type={section.type}
          isAdmin={isAdmin}
          colors={colors}
          onUnhide={unhide}
          onDelete={deleteCritique}
          onUnfeature={unfeature}
          onHide={hide}
        />
      )}
    />
  );
}

function CritiqueCard({
  c, type, isAdmin, colors, onUnhide, onDelete, onUnfeature, onHide,
}: {
  c: AdminCritique;
  type: 'hidden' | 'featured';
  isAdmin: boolean;
  colors: typeof Colors.light;
  onUnhide: (c: AdminCritique) => void;
  onDelete: (c: AdminCritique) => void;
  onUnfeature: (c: AdminCritique) => void;
  onHide: (c: AdminCritique) => void;
}) {
  const author = c.author_pseudo ?? c.pseudo ?? `Utilisateur #${c.user_id}`;
  const title = c.oeuvre_titre ?? `Critique #${c.id}`;
  const noteColor = c.note >= 4 ? '#22c55e' : c.note >= 2.5 ? '#f59e0b' : '#ef4444';

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

      <View style={styles.actions}>
        {type === 'hidden' && (
          <>
            <ActionBtn label="Afficher" icon={<Eye size={13} color={colors.tint} strokeWidth={2.5} />} color={colors.tint} onPress={() => onUnhide(c)} bg={colors.tint + '12'} />
            <ActionBtn label="Supprimer" icon={<Trash2 size={13} color="#ef4444" strokeWidth={2.5} />} color="#ef4444" onPress={() => onDelete(c)} bg="#ef444412" />
          </>
        )}
        {type === 'featured' && isAdmin && (
          <>
            <ActionBtn label="Retirer" icon={<StarOff size={13} color={colors.icon} strokeWidth={2.5} />} color={colors.icon} onPress={() => onUnfeature(c)} bg={colors.border} />
            <ActionBtn label="Masquer" icon={<EyeOff size={13} color="#f59e0b" strokeWidth={2.5} />} color="#f59e0b" onPress={() => onHide(c)} bg="#f59e0b12" />
            <ActionBtn label="Supprimer" icon={<Trash2 size={13} color="#ef4444" strokeWidth={2.5} />} color="#ef4444" onPress={() => onDelete(c)} bg="#ef444412" />
          </>
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
  container: { padding: 16, paddingBottom: 40 },
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
