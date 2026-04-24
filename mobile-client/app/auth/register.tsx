import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      if (res.data.success) {
        await setAuth(res.data.data.user, res.data.data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', res.data.error ?? 'No pudimos crear tu cuenta.');
      }
    } catch {
      Alert.alert('Error', 'No pudimos conectar. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; keyboard?: any; secure?: boolean }[] = [
    { key: 'name', label: 'Nombre completo', placeholder: 'Juan García' },
    { key: 'email', label: 'Correo electrónico', placeholder: 'tu@email.com', keyboard: 'email-address' },
    { key: 'phone', label: 'Teléfono (opcional)', placeholder: '+34 600 000 000', keyboard: 'phone-pad' },
    { key: 'password', label: 'Contraseña', placeholder: '••••••••', secure: true },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Reserva barberos a domicilio</Text>
        </View>

        <View style={styles.form}>
          {fields.map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={set(key)}
                placeholder={placeholder}
                placeholderTextColor="#4b5563"
                autoCapitalize={key === 'name' ? 'words' : 'none'}
                keyboardType={keyboard ?? 'default'}
                secureTextEntry={secure}
                style={styles.input}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta? <Text style={styles.loginHighlight}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flexGrow: 1, padding: 24, paddingTop: 48, gap: 28 },
  header: { gap: 4 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#6b7280', fontSize: 14 },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, padding: 14, color: '#fff', fontSize: 15,
  },
  btn: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginText: { color: '#6b7280', fontSize: 14 },
  loginHighlight: { color: '#f59e0b', fontWeight: '700' },
});
