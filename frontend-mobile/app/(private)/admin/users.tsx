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
  AlertTriangle, Ban, ShieldOff, UserCheck, User, Users,
  ChevronDown, ChevronUp, Trash2,
} from 'lucide-react-native';

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
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isAdmin = user?.role_id === 3;

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      const fetchWarned = apiFetch<AdminUser[]>('/admin/users/warned', { token })
        .then(setWarned).catch(() => {});
      const fetchBanned = isAdmin
        ? apiFetch<AdminUser[]>('/admin/users/banned', { token }).then(setBanned).catch(() => {})
        : Promise.resolve();
      Promise.all([fetchWarned, fetchBanned]).finally(() => setLoading(false));
    }, [token, isAdmin])
  );

  const toggleAllUsers = () => {
    if (showAll) { setShowAll(false); return; }
    setLoadingAll(true);
    apiFetch<AdminUser[]>('/admin/users', { token })
      .then(setAllUsers)
      .catch(() => {})
      .finally(() => { setLoadingAll(false); setShowAll(true); });
  };

  const warn = (u: AdminUser) => {
    Alert.alert('Avertir', `Avertir @${u.pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Avertir', style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/warn`, { method: 'PUT', token }).catch(() => {});
          const updated = { ...u, status: 'warned' };
          setWarned(prev => prev.some(w => w.id === u.id) ? prev : [...prev, updated]);
          setAllUsers(prev => prev.map(x => x.id === u.id ? updated : x));
        },
      },
    ]);
  };

  const unwarn = (u: AdminUser) => {
    Alert.alert("Retirer l'avertissement", `Retirer l'avertissement de @${u.pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/unwarn`, { method: 'PUT', token }).catch(() => {});
          const updated = { ...u, status: 'active' };
          setWarned(prev => prev.filter(w => w.id !== u.id));
          setAllUsers(prev => prev.map(x => x.id === u.id ? updated : x));
        },
      },
    ]);
  };

  const ban = (u: AdminUser) => {
    Alert.alert('Bannir', `Bannir @${u.pseudo} ? Cette action est sévère.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bannir', style: 'destructive',
        onPress: () => {
          apiFetch(`/admin/users/${u.id}/ban`, { method: 'PUT', token }).catch(() => {});
          const updated = { ...u, status: 'banned' };
          setBanned(prev => prev.some(b => b.id === u.id) ? prev : [...prev, updated]);
          setWarned(prev => prev.filter(w => w.id !== u.id));
          setAllUsers(prev => prev.map(x => x.id === u.id ? updated : x));
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
          const updated = { ...u, status: 'active' };
          setBanned(prev => prev.filter(b => b.id !== u.id));
          setAllUsers(prev => prev.map(x => x.id === u.id ? updated : x));
        },
      },
    ]);
  };

  const deleteUser = (u: AdminUser) => {
    Alert.alert(
      'Supprimer le compte',
      `Supprimer définitivement le compte de @${u.pseudo} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => {
            apiFetch(`/users/${u.id}`, { method: 'DELETE', token }).catch(() => {});
            setAllUsers(prev => prev.filter(x => x.id !== u.id));
            setWarned(prev => prev.filter(x => x.id !== u.id));
            setBanned(prev => prev.filter(x => x.id !== u.id));
          },
        },
      ]
    );
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

      {/* Bouton toggle — tous les utilisateurs */}
      <TouchableOpacity
        style={[styles.toggleBtn, { backgroundColor: colors.tint + '14', borderColor: colors.tint + '30' }]}
        onPress={toggleAllUsers}
        activeOpacity={0.75}
        disabled={loadingAll}
      >
        <Users size={16} color={colors.tint} strokeWidth={2} />
        <Text style={[styles.toggleBtnText, { color: colors.tint }]}>
          {showAll ? 'Masquer tous les utilisateurs' : 'Voir tous les utilisateurs'}
        </Text>
        {loadingAll
          ? <ActivityIndicator size="small" color={colors.tint} />
          : showAll
            ? <ChevronUp size={16} color={colors.tint} strokeWidth={2} />
            : <ChevronDown size={16} color={colors.tint} strokeWidth={2} />}
      </TouchableOpacity>

      {/* Section : tous les utilisateurs */}
      {showAll && (
        <>
          <SectionHeaderView
            icon={<Users size={14} color={colors.icon} strokeWidth={2} />}
            title={`TOUS LES UTILISATEURS (${allUsers.length})`}
            colors={colors}
          />
          {allUsers.length === 0
            ? <EmptyCard icon={<User size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucun utilisateur" colors={colors} />
            : allUsers.map(u => (
              <UserCard
                key={u.id}
                u={u}
                type="all"
                isAdmin={isAdmin}
                isSelf={u.id === user?.id}
                colors={colors}
                onWarn={warn}
                onUnwarn={unwarn}
                onBan={ban}
                onUnban={unban}
                onDelete={deleteUser}
              />
            ))}
        </>
      )}

      {/* Section : avertis */}
      <SectionHeaderView
        icon={<AlertTriangle size={14} color={colors.icon} strokeWidth={2} />}
        title={`AVERTIS (${warned.length})`}
        colors={colors}
      />
      {warned.length === 0
        ? <EmptyCard icon={<User size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucun utilisateur averti" colors={colors} />
        : warned.map(u => (
          <UserCard
            key={u.id}
            u={u}
            type="warned"
            isAdmin={isAdmin}
            isSelf={false}
            colors={colors}
            onWarn={warn}
            onUnwarn={unwarn}
            onBan={ban}
            onUnban={unban}
            onDelete={deleteUser}
          />
        ))}

      {/* Section : bannis (admin only) */}
      {isAdmin && (
        <>
          <SectionHeaderView
            icon={<Ban size={14} color={colors.icon} strokeWidth={2} />}
            title={`BANNIS (${banned.length})`}
            colors={colors}
          />
          {banned.length === 0
            ? <EmptyCard icon={<User size={32} color={colors.icon} strokeWidth={1.5} />} text="Aucun utilisateur banni" colors={colors} />
            : banned.map(u => (
              <UserCard
                key={u.id}
                u={u}
                type="banned"
                isAdmin={isAdmin}
                isSelf={false}
                colors={colors}
                onWarn={warn}
                onUnwarn={unwarn}
                onBan={ban}
                onUnban={unban}
                onDelete={deleteUser}
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

function UserCard({
  u, type, isAdmin, isSelf, colors, onWarn, onUnwarn, onBan, onUnban, onDelete,
}: {
  u: AdminUser;
  type: 'all' | 'warned' | 'banned';
  isAdmin: boolean;
  isSelf: boolean;
  colors: typeof Colors.light;
  onWarn: (u: AdminUser) => void;
  onUnwarn: (u: AdminUser) => void;
  onBan: (u: AdminUser) => void;
  onUnban: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
}) {
  // Pour 'all', on se base sur u.status ; sinon sur le type de section
  const effectiveStatus = type === 'all' ? u.status : type;
  const isWarned = effectiveStatus === 'warned';
  const isBanned = effectiveStatus === 'banned';
  const statusColor = isBanned ? '#ef4444' : isWarned ? '#f59e0b' : colors.icon;

  return (
    <View style={[styles.cardCol, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.userInfo}>
          <Text style={[styles.pseudo, { color: colors.text }]}>@{u.pseudo}</Text>
          <Text style={[styles.email, { color: colors.icon }]}>{u.email}</Text>
          {type === 'all' && (
            <Text style={[styles.roleBadge, { color: colors.icon }]}>
              {u.role_id === 3 ? 'Admin' : u.role_id === 2 ? 'Modérateur' : 'Membre'}
              {isWarned ? ' · Averti' : isBanned ? ' · Banni' : ''}
              {isSelf ? ' · Vous' : ''}
            </Text>
          )}
        </View>
      </View>
      {!isSelf && (
        <View style={styles.actionsBelow}>
          {!isBanned && !isWarned && u.role_id < 2 && (
            <ActionBtn
              label="Avertir"
              icon={<AlertTriangle size={13} color="#f59e0b" strokeWidth={2.5} />}
              color="#f59e0b"
              onPress={() => onWarn(u)}
              bg="#f59e0b12"
            />
          )}
          {isWarned && (
            <>
              <ActionBtn
                label="Retirer avert."
                icon={<UserCheck size={13} color={colors.tint} strokeWidth={2.5} />}
                color={colors.tint}
                onPress={() => onUnwarn(u)}
                bg={colors.tint + '12'}
              />
              {isAdmin && u.role_id < 3 && (
                <ActionBtn
                  label="Bannir"
                  icon={<Ban size={13} color="#ef4444" strokeWidth={2.5} />}
                  color="#ef4444"
                  onPress={() => onBan(u)}
                  bg="#ef444412"
                />
              )}
            </>
          )}
          {isBanned && isAdmin && (
            <ActionBtn
              label="Débannir"
              icon={<ShieldOff size={13} color={colors.tint} strokeWidth={2.5} />}
              color={colors.tint}
              onPress={() => onUnban(u)}
              bg={colors.tint + '12'}
            />
          )}
          {isAdmin && !isBanned && !isWarned && u.role_id < 3 && (
            <ActionBtn
              label="Bannir"
              icon={<Ban size={13} color="#ef4444" strokeWidth={2.5} />}
              color="#ef4444"
              onPress={() => onBan(u)}
              bg="#ef444412"
            />
          )}
          {isAdmin && (
            <ActionBtn
              label="Supprimer"
              icon={<Trash2 size={13} color="#ef4444" strokeWidth={2.5} />}
              color="#ef4444"
              onPress={() => onDelete(u)}
              bg="#ef444412"
            />
          )}
        </View>
      )}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  cardCol: {
    flexDirection: 'column',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  userInfo: { flex: 1, gap: 2 },
  pseudo: { fontSize: 14, fontWeight: '600' },
  email: { fontSize: 12 },
  roleBadge: { fontSize: 11, marginTop: 1 },
  actionsBelow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
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
