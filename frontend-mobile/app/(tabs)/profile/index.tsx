import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import { Lock, Library, Bell, ShieldUser, ChevronRight, LogIn, UserCheck, List } from 'lucide-react-native';

export default function ProfileTabScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { user, loading, token } = useAuth();

  const [followStats, setFollowStats]             = useState({ followers: 0, following: 0 });
  const [critiquesCount, setCritiquesCount]       = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [refreshing, setRefreshing]               = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user || !token) return;
    await Promise.allSettled([
      apiFetch<{ followers: number; following: number }>(`/users/${user.id}/follow-stats`, { token }).then(setFollowStats),
      apiFetch<{ critiques: unknown[]; pagination: { total: number } }>(`/users/${user.id}/ratings`, { token })
        .then((data) => setCritiquesCount(data.pagination?.total ?? (Array.isArray(data.critiques) ? data.critiques.length : 0))),
      apiFetch<{ id: number }[]>('/follow-requests', { token })
        .then((data) => setPendingRequestsCount(Array.isArray(data) ? data.length : 0)),
    ]);
  }, [user?.id, token]);

  useFocusEffect(useCallback(() => { fetchProfileData().catch(() => {}); }, [fetchProfileData]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData().catch(() => {}).finally(() => setRefreshing(false));
  }, [fetchProfileData]);

  if (loading) return null;

  if (!user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.guestIconWrap, { backgroundColor: colors.tintDim, borderColor: colors.tintBorder }]}>
          <Lock size={36} color={colors.tint} strokeWidth={1.5} />
        </View>
        <Text style={[styles.guestTitle, { color: colors.text }]}>Connectez-vous</Text>
        <Text style={[styles.guestSub, { color: colors.icon }]}>
          Créez votre profil, gérez votre bibliothèque et suivez la communauté.
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(public)/auth/login')}
          activeOpacity={0.85}
        >
          <LogIn size={16} color="white" strokeWidth={2.5} />
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}
    >
      {/* Profile header */}
      <TouchableOpacity
        style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push('/(private)/settings')}
        activeOpacity={0.8}
      >
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.tintDim }]}>
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>{user.prenom?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{user.prenom} {user.nom}</Text>
          <Text style={[styles.pseudo, { color: colors.tint }]}>@{user.pseudo}</Text>
        </View>
        <ChevronRight size={20} color={colors.icon} strokeWidth={2} />
      </TouchableOpacity>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <StatItem label="Abonnés"      value={followStats.followers} colors={colors} onPress={() => router.push('/(tabs)/profile/followers')} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Abonnements"  value={followStats.following} colors={colors} onPress={() => router.push('/(tabs)/profile/following')} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Critiques"    value={critiquesCount} colors={colors} onPress={() => router.push('/(tabs)/profile/critiques')} />
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <MenuItem icon={<Library size={20} color={colors.tint} />}   label="Ma Collection" description="Gérez vos jeux" onPress={() => router.push('/(private)/library')} colors={colors} />
        <MenuItem icon={<List size={20} color={colors.tint} />}       label="Mes Listes" description="Vos listes thématiques" onPress={() => router.push('/(private)/listes')} colors={colors} />
        <MenuItem icon={<Bell size={20} color={colors.tint} />}       label="Notifications"  description="Vos alertes récentes" onPress={() => router.push('/(private)/notifications')} colors={colors} />
        <MenuItem
          icon={<UserCheck size={20} color={colors.tint} />}
          label="Demandes d'abonnement"
          description={pendingRequestsCount > 0 ? `${pendingRequestsCount} demande${pendingRequestsCount > 1 ? 's' : ''} en attente` : 'Gérer les demandes reçues'}
          onPress={() => router.push('/(private)/follow-requests')}
          colors={colors}
          badge={pendingRequestsCount > 0 ? pendingRequestsCount : undefined}
        />
        {user.role_id >= 2 && (
          <MenuItem
            icon={<ShieldUser size={20} color={colors.tint} />}
            label="Administration"
            description={user.role_id === 3 ? 'Panel administrateur' : 'Panel modérateur'}
            onPress={() => router.push('/(private)/admin')}
            colors={colors}
          />
        )}
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, colors, onPress }: { label: string; value: number; colors: typeof Colors.dark; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({
  icon, label, description, onPress, colors, badge,
}: {
  icon: React.ReactNode; label: string; description: string;
  onPress: () => void; colors: typeof Colors.dark; badge?: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: colors.tintDim }]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.menuDesc, { color: colors.icon }]}>{description}</Text>
      </View>
      {badge !== undefined && (
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:       { paddingBottom: 40, gap: 12, padding: 16 },
  guestContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 18 },
  guestIconWrap:   { width: 88, height: 88, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  guestTitle:      { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  guestSub:        { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  loginButton:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 4 },
  loginButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  profileHeader:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  avatar:          { width: 56, height: 56, borderRadius: 28 },
  avatarFallback:  { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:   { fontSize: 24, fontWeight: '700' },
  profileInfo:     { flex: 1 },
  name:            { fontSize: 17, fontWeight: '700' },
  pseudo:          { fontSize: 13, fontWeight: '500', marginTop: 1 },
  statsRow:        { flexDirection: 'row', borderRadius: 16, borderWidth: 1, paddingVertical: 16 },
  statItem:        { flex: 1, alignItems: 'center', gap: 2 },
  statDivider:     { width: 1, marginVertical: 4 },
  statValue:       { fontSize: 20, fontWeight: '700' },
  statLabel:       { fontSize: 11 },
  menuSection:     { gap: 10 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  menuIconWrap:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText:        { flex: 1, gap: 2 },
  menuLabel:       { fontSize: 15, fontWeight: '600' },
  menuDesc:        { fontSize: 12 },
  badge:           { minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText:       { color: 'white', fontSize: 12, fontWeight: '700' },
});
