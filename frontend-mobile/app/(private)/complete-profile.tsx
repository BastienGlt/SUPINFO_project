import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
// Lucide : remplacement du 👋 emoji
import { Sparkles } from 'lucide-react-native';

export default function CompleteProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { completeProfile } = useAuth();

  const [form, setForm] = useState({ prenom: '', nom: '', pseudo: '', bio: '' });
  const [loading, setLoading] = useState(false);

  // POST /users/create — appelé via completeProfile() du AuthContext
  const handleSubmit = async () => {
    if (!form.prenom || !form.nom || !form.pseudo) {
      Alert.alert('Erreur', 'Prénom, nom et pseudo sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await completeProfile(form);
      router.replace('/(tabs)/');
    } catch (err: unknown) {
      const error = err as { error?: string };
      Alert.alert('Erreur', error?.error ?? 'Impossible de créer le profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* En-tête avec icône Sparkles */}
      <View style={styles.headerWrap}>
        <View style={[styles.iconWrap, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
          <Sparkles size={32} color={colors.tint} strokeWidth={1.5} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Bienvenue !</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Complétez votre profil pour rejoindre la communauté.
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          label="Prénom *"
          value={form.prenom}
          onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))}
          colors={colors}
          placeholder="Votre prénom"
        />
        <Field
          label="Nom *"
          value={form.nom}
          onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))}
          colors={colors}
          placeholder="Votre nom"
        />
        <Field
          label="Pseudo *"
          value={form.pseudo}
          onChangeText={(v) => setForm((f) => ({ ...f, pseudo: v }))}
          colors={colors}
          autoCapitalize="none"
          placeholder="@votre_pseudo"
        />
        <Field
          label="Bio (optionnel)"
          value={form.bio}
          onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
          colors={colors}
          multiline
          placeholder="Parlez-nous de vous..."
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.tint }, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Créer mon profil</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  colors,
  style,
  ...props
}: {
  label: string;
  colors: typeof Colors.light;
  style?: object;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={[fieldStyles.label, { color: colors.icon }]}>{label}</Text>
      <TextInput
        {...props}
        style={[
          fieldStyles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        placeholderTextColor={colors.tabIconDefault}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 28 },
  headerWrap: { alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  button: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  // Fond surface (blanc / slate-800) + bordure propre
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
});
