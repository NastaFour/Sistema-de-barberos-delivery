import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { bookingsAPI, apiClient } from '../../services/api';
import { Booking } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { startLocationTracking, stopLocationTracking } from '../../services/locationTask';

export default function AgendaScreen() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.getMine();
      if (res.data.success) {
        // Sort: pending first, then by date, completed at the bottom
        const sorted = res.data.data.sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        });
        setBookings(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/bookings/${id}/status`, { status: newStatus });
      fetchBookings();
      if (newStatus === 'IN_PROGRESS') {
        const started = await startLocationTracking(id);
        if (!started) Alert.alert('Permiso denegado', 'Necesitamos tu ubicación para que el cliente te rastree.');
      } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        await stopLocationTracking();
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la reserva.');
    }
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const isToday = format(new Date(item.scheduledAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.time}>{format(new Date(item.scheduledAt), 'HH:mm')}</Text>
            <Text style={styles.date}>
              {isToday ? 'HOY' : format(new Date(item.scheduledAt), "d MMM", { locale: es })}
            </Text>
          </View>
          <View style={[styles.statusBadge, styles[`status_${item.status}` as keyof typeof styles] as any]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Feather name="user" size={16} color="#9ca3af" />
          <Text style={styles.clientName}>{item.client?.name || 'Cliente'}</Text>
        </View>
        <View style={styles.addressInfo}>
          <Feather name="map-pin" size={16} color="#9ca3af" />
          <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
        </View>

        <View style={styles.servicesBox}>
          {item.services?.map(s => {
            // @ts-ignore
            const name = s.service?.name || s.name;
            return <Text key={s.id} style={styles.serviceItem}>• {name}</Text>;
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {item.status === 'PENDING' && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => updateStatus(item.id, 'CONFIRMED')}>
              <Text style={styles.btnPrimaryTxt}>Aceptar Reserva</Text>
            </TouchableOpacity>
          )}
          {item.status === 'CONFIRMED' && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => updateStatus(item.id, 'IN_PROGRESS')}>
              <Text style={styles.btnPrimaryTxt}>Comenzar Servicio</Text>
            </TouchableOpacity>
          )}
          {item.status === 'IN_PROGRESS' && (
            <TouchableOpacity style={styles.btnSuccess} onPress={() => updateStatus(item.id, 'COMPLETED')}>
              <Text style={styles.btnSuccessTxt}>Marcar como Completado</Text>
            </TouchableOpacity>
          )}
          {item.status === 'COMPLETED' && (
            <Text style={styles.completedText}>✅ Servicio finalizado</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#f59e0b" size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(i: Booking) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        ListEmptyComponent={<Text style={styles.empty}>No tienes citas programadas.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  time: { color: '#fff', fontSize: 24, fontWeight: '800' },
  date: { color: '#f59e0b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  status_PENDING: { backgroundColor: '#d97706' },
  status_CONFIRMED: { backgroundColor: '#2563eb' },
  status_IN_PROGRESS: { backgroundColor: '#059669' },
  status_COMPLETED: { backgroundColor: '#1f2937' },
  status_CANCELLED: { backgroundColor: '#dc2626' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  clientName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  addressInfo: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addressText: { color: '#9ca3af', fontSize: 14, flex: 1 },
  servicesBox: { backgroundColor: '#0a0a0a', padding: 12, borderRadius: 8, marginBottom: 16 },
  serviceItem: { color: '#e5e7eb', fontSize: 14, marginBottom: 4 },
  actions: { borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 16 },
  btnPrimary: { backgroundColor: '#f59e0b', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimaryTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
  btnSuccess: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnSuccessTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  completedText: { color: '#10b981', textAlign: 'center', fontWeight: '700' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
