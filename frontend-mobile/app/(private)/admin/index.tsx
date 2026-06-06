import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { Users, FileText, Tag, Shield, ChevronRight, Flag } from 'lucide-react-native';

export default function AdminDashboard() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();

  if (!user || user.role_id < 2) return null;

  const isAdmin = user.role_id === 3;
  const roleLabel = isAdmin ? 'Administrateur' : 'Modérateur';
  const roleBg = isAdmin ? '#ef444418' : '#f59e0b18';
  const roleColor = isAdmin ? '#ef4444' : '#f59e0b';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* En-tête rôle */}
      <View style={[styles.roleCard, { backgroundColor: roleBg, borderColor: roleColor + '40' }]}>
        <Shield size={20} color={roleColor} strokeWidth={2} />
        <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.icon }]}>MODÉRATION</Text>

      <NavCard
        icon={<Users size={22} color={colors.tint} strokeWidth={2} />}
        title="Utilisateurs"
        desc="Avertis et bannis — warn / ban / unban"
        onPress={() => router.push('/(private)/admin/users')}
        colors={colors}
      />
      <NavCard
        icon={<FileText size={22} color={colors.tint} strokeWidth={2} />}
        title="Critiques"
        desc="Masquées, mises en avant, suppression"
        onPress={() => router.push('/(private)/admin/critiques')}
        colors={colors}
      />
      <NavCard
        icon={<Flag size={22} color={colors.tint} strokeWidth={2} />}
        title="Signalements"
        desc="Signalements en attente et traités"
        onPress={() => router.push('/(private)/admin/signalements')}
        colors={colors}
      />

      {isAdmin && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.icon, marginTop: 8 }]}>ADMINISTRATION</Text>
          <NavCard
            icon={<Tag size={22} color={colors.tint} strokeWidth={2} />}
            title="Statuts bibliothèque"
            desc="Créer, modifier et supprimer les statuts"
            onPress={() => router.push('/(private)/admin/statuts')}
            colors={colors}
          />
        </>
      )}
    </ScrollView>
  );
}

function NavCard({
  icon, title, desc, onPress, colors,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onPress: () => void;
  colors: typeof Colors.dark;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.tintDim }]}>{icon}</View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: colors.icon }]}>{desc}</Text>
      </View>
      <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  roleText: { fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, lineHeight: 17 },
});
