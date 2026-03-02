import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';

const ROLE_LABELS: Record<number, string> = { 1: 'Membre', 2: 'Modérateur', 3: 'Admin' };

export default function MyProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuth();

  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [critiquesCount, setCritiquesCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ followers: number; following: number }>(`/users/${user.id}/follow-stats`)
      .then(setFollowStats)
      .catch(() => {});
    apiFetch<unknown[]>(`/users/${user.id}/ratings`)
      .then((data) => setCritiquesCount(data.length))
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const role = ROLE_LABELS[user.role_id] ?? 'Membre';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '30' }]}>
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>
              {user.prenom?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>
          {user.prenom} {user.nom}
        </Text>
        <Text style={[styles.pseudo, { color: colors.tint }]}>@{user.pseudo}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.tint + '20', borderColor: colors.tint + '40' }]}>
          <Text style={[styles.roleText, { color: colors.tint }]}>{role}</Text>
        </View>
      </View>

      <View style={[styles.statsRow, { borderColor: colors.tabIconDefault + '30' }]}>
        <StatItem label="Abonnés" value={followStats.followers} colors={colors} />
        <StatItem label="Abonnements" value={followStats.following} colors={colors} />
        <StatItem label="Critiques" value={critiquesCount} colors={colors} />
      </View>

      {user.bio ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
          <Text style={[styles.bio, { color: colors.icon }]}>{user.bio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.tabIconDefault + '15', borderColor: colors.tabIconDefault + '30' }]}>
          <InfoRow label="Email" value={user.email} colors={colors} />
          <InfoRow
            label="Membre depuis"
            value={new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Accès rapide</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            label="🗂️ Ma Collection"
            onPress={() => router.push('/(private)/bibliotheque')}
            colors={colors}
          />
          <QuickLink
            label="🔔 Notifications"
            onPress={() => router.push('/(private)/notifications')}
            colors={colors}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatItem({ label, value, colors }: { label: string; value: number; colors: typeof Colors.light }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.icon }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function QuickLink({ label, onPress, colors }: { label: string; onPress: () => void; colors: typeof Colors.light }) {
  return (
    <TouchableOpacity
      style={[styles.quickLinkCard, { backgroundColor: colors.tabIconDefault + '15', borderColor: colors.tabIconDefault + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickLinkText, { color: colors.text }]}>{label}</Text>
      <Text style={{ color: colors.icon }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 32, gap: 6, paddingHorizontal: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarInitial: { fontSize: 40, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800' },
  pseudo: { fontSize: 15, fontWeight: '600' },
  roleBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  roleText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginHorizontal: 16, marginBottom: 8 },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  bio: { fontSize: 14, lineHeight: 22 },
  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  quickLinks: { gap: 10 },
  quickLinkCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  quickLinkText: { fontSize: 15, fontWeight: '500' },
  logoutButton: { margin: 20, marginTop: 32, backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
