import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      if (res.data.success) {
        await setAuth(res.data.data.user, res.data.data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Credenciales inválidas.');
      }
    } catch {
      Alert.alert('Error', 'No pudimos conectar. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Logo area */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>✂</Text>
          </View>
          <Text style={styles.title}>BarberGo</Text>
          <Text style={styles.subtitle}>Barberos a domicilio, a tu ritmo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#4b5563"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#4b5563"
                secureTextEntry={!showPw}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw ? <Feather name="eye-off" size={20} color="#6b7280" /> : <Feather name="eye" size={20} color="#6b7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.loginBtnText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta? <Text style={styles.registerHighlight}>Regístrate gratis</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 40 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#6b7280', fontSize: 15 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 14 },
  loginBtn: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  registerLink: { alignItems: 'center', paddingVertical: 8 },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerHighlight: { color: '#f59e0b', fontWeight: '700' },
});
