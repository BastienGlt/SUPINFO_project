import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, Pressable,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import {
  Flag, CheckCircle, XCircle, Clock, List,
  ChevronDown, ChevronUp, User, FileText, X,
} from 'lucide-react-native';

interface Signalement {
  id: number;
  type_contenu: string;
  contenu_id: number;
  motif: string;
  statut: string;
  created_at: string;
  signaleur_id: number;
  signaleur_pseudo: string;
  signaleur_photo?: string;
}

const MOTIF_LABELS: Record<string, string> = {
  insultes: 'Insultes / Harcèlement',
  spam: 'Spam',
  contenu_adulte: 'Contenu inapproprié',
  usurpation: "Usurpation d'identité",
  autre: 'Autre',
};

const TYPE_LABELS: Record<string, string> = {
  profil: 'Profil utilisateur',
  critique: 'Critique',
  commentaire: 'Commentaire',
};

export default function AdminSignalementsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { token } = useAuth();

  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<Signalement | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      apiFetch<Signalement[]>('/admin/signalements', { token })
        .then(setSignalements)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [token])
  );

  const updateStatut = async (s: Signalement, newStatut: string) => {
    const previousStatut = s.statut;
    setSignalements(prev => prev.map(x => x.id === s.id ? { ...x, statut: newStatut } : x));
    setSelected(prev => prev?.id === s.id ? { ...prev, statut: newStatut } : prev);
    try {
      await apiFetch(`/admin/signalements/${s.id}/statut`, {
        method: 'PUT',
        token: token ?? undefined,
        body: JSON.stringify({ statut: newStatut }),
      });
    } catch {
      setSignalements(prev => prev.map(x => x.id === s.id ? { ...x, statut: previousStatut } : x));
      setSelected(prev => prev?.id === s.id ? { ...prev, statut: previousStatut } : prev);
    }
  };

  const pending = signalements.filter(s => s.statut === 'en_attente' || s.statut === 'en_examen');
  const resolved = signalements.filter(s => s.statut === 'rejete' || s.statut === 'modere');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
        <SectionHeaderView
          icon={<Clock size={14} color={colors.icon} strokeWidth={2} />}
          title={`EN ATTENTE (${pending.length})`}
          colors={colors}
        />
        {pending.length === 0
          ? <EmptyCard icon={<Flag size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucun signalement en attente" colors={colors} />
          : pending.map(s => (
            <SignalementCard
              key={s.id}
              s={s}
              colors={colors}
              onPress={() => setSelected(s)}
            />
          ))}

        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}
          onPress={() => setShowResolved(v => !v)}
          activeOpacity={0.75}
        >
          <List size={16} color={colors.tint} strokeWidth={2} />
          <Text style={[styles.toggleBtnText, { color: colors.tint }]}>
            {showResolved ? 'Masquer les signalements traités' : `Signalements traités (${resolved.length})`}
          </Text>
          {showResolved
            ? <ChevronUp size={16} color={colors.tint} strokeWidth={2} />
            : <ChevronDown size={16} color={colors.tint} strokeWidth={2} />}
        </TouchableOpacity>

        {showResolved && (
          <>
            <SectionHeaderView
              icon={<CheckCircle size={14} color={colors.icon} strokeWidth={2} />}
              title={`TRAITÉS (${resolved.length})`}
              colors={colors}
            />
            {resolved.length === 0
              ? <EmptyCard icon={<Flag size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucun signalement traité" colors={colors} />
              : resolved.map(s => (
                <SignalementCard
                  key={s.id}
                  s={s}
                  colors={colors}
                  onPress={() => setSelected(s)}
                />
              ))}
          </>
        )}
      </ScrollView>

      {/* Modale détail signalement */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Signalement #{selected?.id}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} activeOpacity={0.7}>
                <X size={20} color={colors.icon} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selected && (() => {
                const cur = selected;
                return (
                  <>
                    <DetailRow label="Signalé par" value={`@${cur.signaleur_pseudo}`} colors={colors} />
                    <DetailRow label="Type" value={TYPE_LABELS[cur.type_contenu] ?? cur.type_contenu} colors={colors} />
                    <DetailRow label="Motif" value={MOTIF_LABELS[cur.motif] ?? cur.motif} colors={colors} />
                    <DetailRow label="Date" value={new Date(cur.created_at).toLocaleDateString('fr-FR')} colors={colors} />
                    <DetailRow label="Statut" value={STATUT_DISPLAY[cur.statut]?.label ?? cur.statut} colors={colors} accent={STATUT_DISPLAY[cur.statut]?.color} />

                    <Text style={[styles.actionsTitle, { color: colors.icon }]}>ACTIONS</Text>
                    <View style={styles.modalActions}>
                      {(cur.statut === 'en_attente' || cur.statut === 'rejete') && (
                        <ActionBtn
                          label="Mettre en examen"
                          icon={<Clock size={13} color="#6366f1" strokeWidth={2.5} />}
                          color="#6366f1"
                          bg="#6366f112"
                          onPress={() => updateStatut(cur, 'en_examen')}
                        />
                      )}
                      {(cur.statut === 'en_attente' || cur.statut === 'en_examen') && (
                        <ActionBtn
                          label="Modéré"
                          icon={<CheckCircle size={13} color="#22c55e" strokeWidth={2.5} />}
                          color="#22c55e"
                          bg="#22c55e12"
                          onPress={() => updateStatut(cur, 'modere')}
                        />
                      )}
                      {(cur.statut === 'en_attente' || cur.statut === 'en_examen') && (
                        <ActionBtn
                          label="Rejeter"
                          icon={<XCircle size={13} color="#ef4444" strokeWidth={2.5} />}
                          color="#ef4444"
                          bg="#ef444412"
                          onPress={() => updateStatut(cur, 'rejete')}
                        />
                      )}
                      {(cur.statut === 'modere' || cur.statut === 'rejete') && (
                        <ActionBtn
                          label="Rouvrir"
                          icon={<Flag size={13} color={colors.tint} strokeWidth={2.5} />}
                          color={colors.tint}
                          bg={colors.tintDim}
                          onPress={() => updateStatut(cur, 'en_attente')}
                        />
                      )}
                    </View>
                  </>
                );
              })()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const STATUT_DISPLAY: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: '#f59e0b' },
  en_examen: { label: 'En examen', color: '#6366f1' },
  modere: { label: 'Modéré', color: '#22c55e' },
  rejete: { label: 'Rejeté', color: '#ef4444' },
};

function DetailRow({ label, value, colors, accent }: {
  label: string;
  value: string;
  colors: typeof Colors.dark;
  accent?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.icon }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: accent ?? colors.text }]}>{value}</Text>
    </View>
  );
}

function SignalementCard({ s, colors, onPress }: {
  s: Signalement;
  colors: typeof Colors.dark;
  onPress: () => void;
}) {
  const statut = STATUT_DISPLAY[s.statut];
  const statutColor = statut?.color ?? colors.icon;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeIcon, { backgroundColor: colors.tintDim }]}>
          {s.type_contenu === 'profil'
            ? <User size={16} color={colors.tint} strokeWidth={2} />
            : <FileText size={16} color={colors.tint} strokeWidth={2} />}
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardType, { color: colors.text }]}>
            {TYPE_LABELS[s.type_contenu] ?? s.type_contenu} #{s.contenu_id}
          </Text>
          <Text style={[styles.cardReporter, { color: colors.icon }]}>
            Signalé par @{s.signaleur_pseudo}
          </Text>
          <Text style={[styles.cardMotif, { color: colors.icon }]}>
            {MOTIF_LABELS[s.motif] ?? s.motif}
          </Text>
        </View>
        <View style={[styles.statutBadge, { backgroundColor: statutColor + '18' }]}>
          <Text style={[styles.statutText, { color: statutColor }]}>{statut?.label ?? s.statut}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeaderView({ icon, title, colors }: { icon: React.ReactNode; title: string; colors: typeof Colors.dark }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={[styles.sectionTitle, { color: colors.icon }]}>{title}</Text>
    </View>
  );
}

function EmptyCard({ icon, text, colors }: { icon: React.ReactNode; text: string; colors: typeof Colors.dark }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.emptyText, { color: colors.icon }]}>{text}</Text>
    </View>
  );
}

function ActionBtn({ label, icon, color, bg, onPress }: {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  onPress: () => void;
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
    marginVertical: 4,
  },
  toggleBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardMeta: { flex: 1, gap: 3 },
  cardType: { fontSize: 14, fontWeight: '600' },
  cardReporter: { fontSize: 12 },
  cardMotif: { fontSize: 12 },
  statutBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  statutText: { fontSize: 11, fontWeight: '700' },
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
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000015' },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  actionsTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionLabel: { fontSize: 13, fontWeight: '600' },
});
