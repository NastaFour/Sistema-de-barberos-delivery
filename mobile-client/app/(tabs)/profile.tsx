import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Options */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.option}>
          <Feather name="user" size={20} color="#9ca3af" />
          <Text style={styles.optionText}>Datos personales</Text>
          <Feather name="chevron-right" size={18} color="#4b5563" style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Feather name="bell" size={20} color="#9ca3af" />
          <Text style={styles.optionText}>Notificaciones</Text>
          <Feather name="chevron-right" size={18} color="#4b5563" style={styles.chevron} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, gap: 24 },
  header: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#000', fontSize: 36, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  email: { color: '#6b7280', fontSize: 14 },
  section: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  optionText: { flex: 1, color: '#d1d5db', fontSize: 15 },
  chevron: { marginLeft: 'auto' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7f1d1d',
    padding: 16,
    borderRadius: 14,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
