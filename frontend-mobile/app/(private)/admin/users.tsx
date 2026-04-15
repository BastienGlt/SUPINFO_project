import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, SectionList,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { AlertTriangle, Ban, ShieldOff, ShieldCheck, UserCheck, User } from 'lucide-react-native';

interface AdminUser {
  id: number;
  pseudo: string;
  prenom: string;
  nom: string;
  email: string;
  role_id: number;
  status: string;
}

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, token } = useAuth();

  const [warned, setWarned] = useState<AdminUser[]>([]);
  const [banned, setBanned] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role_id === 3;

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      const fetchWarned = apiFetch<AdminUser[]>('/admin/users/warned', { token })
        .then(setWarned)
        .catch(() => {});
      const fetchBanned = isAdmin
        ? apiFetch<AdminUser[]>('/admin/users/banned', { token }).then(setBanned).catch(() => {})
        : Promise.resolve();
      Promise.all([fetchWarned, fetchBanned]).finally(() => setLoading(false));
    }, [token, isAdmin])
  );

  const warn = (u: AdminUser) => {
    Alert.alert('Avertir', `Avertir @${u.pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Avertir',
        style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/warn`, { method: 'PUT', token }).catch(() => {});
          setWarned((prev) => prev.some((w) => w.id === u.id) ? prev : [...prev, { ...u, status: 'warned' }]);
        },
      },
    ]);
  };

  const unwarn = (u: AdminUser) => {
    Alert.alert('Retirer l\'avertissement', `Retirer l\'avertissement de @${u.pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/unwarn`, { method: 'PUT', token }).catch(() => {});
          setWarned((prev) => prev.filter((w) => w.id !== u.id));
        },
      },
    ]);
  };

  const ban = (u: AdminUser) => {
    Alert.alert('Bannir', `Bannir @${u.pseudo} ? Cette action est sévère.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bannir',
        style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/ban`, { method: 'PUT', token }).catch(() => {});
          setBanned((prev) => prev.some((b) => b.id === u.id) ? prev : [...prev, { ...u, status: 'banned' }]);
          setWarned((prev) => prev.filter((w) => w.id !== u.id));
        },
      },
    ]);
  };

  const unban = (u: AdminUser) => {
    Alert.alert('Débannir', `Débannir @${u.pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Débannir',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/unban`, { method: 'PUT', token }).catch(() => {});
          setBanned((prev) => prev.filter((b) => b.id !== u.id));
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
    { title: 'AVERTIS', data: warned, type: 'warned' as const },
    ...(isAdmin ? [{ title: 'BANNIS', data: banned, type: 'banned' as const }] : []),
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
          {section.type === 'warned'
            ? <AlertTriangle size={14} color={colors.icon} strokeWidth={2} />
            : <Ban size={14} color={colors.icon} strokeWidth={2} />}
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>
            {section.title} ({section.data.length})
          </Text>
        </View>
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <User size={32} color={colors.icon} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>Aucun utilisateur</Text>
          </View>
        ) : null
      }
      renderItem={({ item, section }) => (
        <UserCard
          u={item}
          type={section.type}
          isAdmin={isAdmin}
          colors={colors}
          onWarn={warn}
          onUnwarn={unwarn}
          onBan={ban}
          onUnban={unban}
        />
      )}
    />
  );
}

function UserCard({
  u, type, isAdmin, colors, onWarn, onUnwarn, onBan, onUnban,
}: {
  u: AdminUser;
  type: 'warned' | 'banned';
  isAdmin: boolean;
  colors: typeof Colors.light;
  onWarn: (u: AdminUser) => void;
  onUnwarn: (u: AdminUser) => void;
  onBan: (u: AdminUser) => void;
  onUnban: (u: AdminUser) => void;
}) {
  const statusColor = type === 'banned' ? '#ef4444' : '#f59e0b';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <View style={styles.userInfo}>
        <Text style={[styles.pseudo, { color: colors.text }]}>@{u.pseudo}</Text>
        <Text style={[styles.email, { color: colors.icon }]}>{u.email}</Text>
      </View>
      <View style={styles.actions}>
        {type === 'warned' && (
          <>
            <ActionBtn label="Retirer" icon={<UserCheck size={13} color={colors.tint} strokeWidth={2.5} />} color={colors.tint} onPress={() => onUnwarn(u)} bg={colors.tint + '12'} />
            {isAdmin && (
              <ActionBtn label="Bannir" icon={<Ban size={13} color="#ef4444" strokeWidth={2.5} />} color="#ef4444" onPress={() => onBan(u)} bg="#ef444412" />
            )}
          </>
        )}
        {type === 'banned' && isAdmin && (
          <ActionBtn label="Débannir" icon={<ShieldOff size={13} color={colors.tint} strokeWidth={2.5} />} color={colors.tint} onPress={() => onUnban(u)} bg={colors.tint + '12'} />
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  userInfo: { flex: 1, gap: 2 },
  pseudo: { fontSize: 14, fontWeight: '600' },
  email: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
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
