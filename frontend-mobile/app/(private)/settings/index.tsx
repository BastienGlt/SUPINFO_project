import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/services/apiService';
import {
  Library, Bell, ChevronRight, LogOut, Mail, CalendarDays, ShieldCheck,
  Pencil, X, Check,
} from 'lucide-react-native';

const ROLE_LABELS: Record<number, string> = { 1: 'Membre', 2: 'Modérateur', 3: 'Admin' };

export default function MyProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout, updateUser } = useAuth();

  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [critiquesCount, setCritiquesCount] = useState(0);

  // Mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', pseudo: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // GET /users/{id}/follow-stats
    apiFetch<{ followers: number; following: number }>(`/users/${user.id}/follow-stats`)
      .then(setFollowStats)
      .catch(() => {});
    // GET /users/{id}/ratings
    apiFetch<unknown[]>(`/users/${user.id}/ratings`)
      .then((data) => setCritiquesCount(data.length))
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const role = ROLE_LABELS[user.role_id] ?? 'Membre';

  /** Ouvre le formulaire d'édition pré-rempli avec les données actuelles */
  const startEdit = () => {
    setEditForm({ prenom: user.prenom, nom: user.nom, pseudo: user.pseudo, bio: user.bio ?? '' });
    setIsEditing(true);
  };

  /** Annule l'édition sans sauvegarder */
  const cancelEdit = () => setIsEditing(false);

  /**
   * PUT /users/{id} — sauvegarde les modifications du profil.
   * updateUser() est fourni par AuthContext et met à jour l'état global `user`.
   */
  const handleSave = async () => {
    if (!editForm.prenom.trim() || !editForm.nom.trim() || !editForm.pseudo.trim()) {
      Alert.alert('Erreur', 'Prénom, nom et pseudo sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await updateUser(user.id, {
        prenom: editForm.prenom.trim(),
        nom: editForm.nom.trim(),
        pseudo: editForm.pseudo.trim(),
        bio: editForm.bio.trim(),
      });
      setIsEditing(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Avatar + identité + bouton Modifier */}
      <View style={styles.profileHeader}>
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '25' }]}>
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>
              {user.prenom?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        {isEditing ? (
          // --- Mode édition : champs texte inline ---
          <View style={styles.editForm}>
            <EditInput
              value={editForm.prenom}
              onChangeText={(v) => setEditForm((f) => ({ ...f, prenom: v }))}
              placeholder="Prénom"
              colors={colors}
            />
            <EditInput
              value={editForm.nom}
              onChangeText={(v) => setEditForm((f) => ({ ...f, nom: v }))}
              placeholder="Nom"
              colors={colors}
            />
            <EditInput
              value={editForm.pseudo}
              onChangeText={(v) => setEditForm((f) => ({ ...f, pseudo: v }))}
              placeholder="Pseudo"
              colors={colors}
              autoCapitalize="none"
            />
            <EditInput
              value={editForm.bio}
              onChangeText={(v) => setEditForm((f) => ({ ...f, bio: v }))}
              placeholder="Bio (optionnel)"
              colors={colors}
              multiline
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
            {/* Boutons Annuler / Sauvegarder */}
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                onPress={cancelEdit}
                disabled={saving}
                activeOpacity={0.8}
              >
                <X size={16} color={colors.icon} />
                <Text style={[styles.editBtnText, { color: colors.icon }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.tint }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Check size={16} color="white" strokeWidth={2.5} />
                    <Text style={[styles.editBtnText, { color: 'white' }]}>Sauvegarder</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // --- Mode affichage ---
          <>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.prenom} {user.nom}
            </Text>
            <Text style={[styles.pseudo, { color: colors.tint }]}>@{user.pseudo}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
              <ShieldCheck size={12} color={colors.tint} strokeWidth={2.5} />
              <Text style={[styles.roleText, { color: colors.tint }]}>{role}</Text>
            </View>
            {/* Bouton "Modifier le profil" — PUT /users/{id} */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={startEdit}
              activeOpacity={0.8}
            >
              <Pencil size={14} color={colors.tint} strokeWidth={2.5} />
              <Text style={[styles.editProfileBtnText, { color: colors.tint }]}>Modifier le profil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Ligne de stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <StatItem label="Abonnés" value={followStats.followers} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Abonnements" value={followStats.following} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem label="Critiques" value={critiquesCount} colors={colors} />
      </View>

      {/* Bio (mode affichage uniquement) */}
      {!isEditing && user.bio ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
          <Text style={[styles.bio, { color: colors.icon }]}>{user.bio}</Text>
        </View>
      ) : null}

      {/* Informations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow
            icon={<Mail size={15} color={colors.icon} />}
            label="Email"
            value={user.email}
            colors={colors}
          />
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon={<CalendarDays size={15} color={colors.icon} />}
            label="Membre depuis"
            value={new Date(user.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            colors={colors}
          />
        </View>
      </View>

      {/* Accès rapide */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Accès rapide</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            icon={<Library size={18} color={colors.tint} />}
            label="Ma Collection"
            onPress={() => router.push('/(private)/bibliotheque')}
            colors={colors}
          />
          <QuickLink
            icon={<Bell size={18} color={colors.tint} />}
            label="Notifications"
            onPress={() => router.push('/(private)/notifications')}
            colors={colors}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color="white" strokeWidth={2.5} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Champ de saisie pour le mode édition
function EditInput({
  colors,
  style,
  ...props
}: { colors: typeof Colors.light; style?: object } & React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={[editInputStyle.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }, style]}
      placeholderTextColor={colors.tabIconDefault}
    />
  );
}

const editInputStyle = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    width: '100%',
  },
});

function StatItem({ label, value, colors }: { label: string; value: number; colors: typeof Colors.light }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon, label, value, colors,
}: { icon: React.ReactNode; label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        {icon}
        <Text style={[styles.infoLabel, { color: colors.icon }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function QuickLink({
  icon, label, onPress, colors,
}: { icon: React.ReactNode; label: string; onPress: () => void; colors: typeof Colors.light }) {
  return (
    <TouchableOpacity
      style={[styles.quickLinkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickLinkIconWrap, { backgroundColor: colors.tint + '14' }]}>{icon}</View>
      <Text style={[styles.quickLinkText, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 28, gap: 6, paddingHorizontal: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarInitial: { fontSize: 40, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800' },
  pseudo: { fontSize: 15, fontWeight: '600' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: '600' },
  // Bouton Modifier le profil
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  editProfileBtnText: { fontSize: 13, fontWeight: '600' },
  // Formulaire d'édition inline
  editForm: { width: '100%', gap: 10, marginTop: 8 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  editBtnText: { fontSize: 14, fontWeight: '700' },
  // Stats
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  bio: { fontSize: 14, lineHeight: 22 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoDivider: { height: 1 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  infoLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  quickLinks: { gap: 10 },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  quickLinkIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLinkText: { fontSize: 15, fontWeight: '500', flex: 1 },
  logoutButton: {
    margin: 16,
    marginTop: 32,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
