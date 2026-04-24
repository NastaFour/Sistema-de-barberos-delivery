import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current status
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get(`/barbers/${user?.id}`);
        if (res.data.success) {
          setIsActive(res.data.data.isActive);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchStatus();
  }, [user?.id]);

  const toggleStatus = async (value: boolean) => {
    setIsActive(value);
    try {
      await apiClient.patch(`/barbers/${user?.id}/status`, { isActive: value });
    } catch {
      setIsActive(!value); // revert on error
      Alert.alert('Error', 'No se pudo actualizar tu estado.');
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{user?.name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name={isActive ? "check-circle" : "moon"} size={20} color={isActive ? "#10b981" : "#9ca3af"} />
            <Text style={styles.rowText}>Estoy disponible</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={toggleStatus}
            disabled={loading}
            trackColor={{ false: '#374151', true: '#f59e0b' }}
            thumbColor={'#fff'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text style={[styles.rowText, { color: '#ef4444' }]}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarInitials: { color: '#f59e0b', fontSize: 24, fontWeight: '800' },
  name: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  email: { color: '#9ca3af', fontSize: 14 },
  section: { backgroundColor: '#111827', borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
