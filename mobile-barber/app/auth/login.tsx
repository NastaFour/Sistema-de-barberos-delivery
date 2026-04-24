import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      if (res.data.success) {
        if (res.data.data.user.role !== 'BARBER') {
          Alert.alert('Acceso Denegado', 'Esta app es exclusiva para barberos.');
          return;
        }
        await setAuth(res.data.data.user, res.data.data.token);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Email o contraseña incorrectos';
      Alert.alert('Error de acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Feather name="scissors" size={40} color="#f59e0b" />
          </View>
          <Text style={styles.title}>BarberGo Pro</Text>
          <Text style={styles.subtitle}>Gestiona tus citas y ganancias</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginBtnText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9ca3af' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { color: '#e5e7eb', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937' },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, height: 56, color: '#fff', fontSize: 16, paddingHorizontal: 12 },
  eyeIcon: { padding: 16 },
  loginBtn: { backgroundColor: '#f59e0b', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  loginBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
