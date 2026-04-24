import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, parseISO, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMyBookings, useCancelBooking } from '../../hooks/useQueries';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../../types';

const TABS: { label: string; status?: BookingStatus[] }[] = [
  { label: 'Próximas',  status: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
  { label: 'Pasadas',   status: ['COMPLETED'] },
  { label: 'Canceladas', status: ['CANCELLED', 'NO_SHOW'] },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const { data: bookings = [], isLoading, refetch } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const filtered = bookings.filter((b: Booking) =>
    TABS[activeTab].status?.includes(b.status)
  );

  const handleCancel = (booking: Booking) => {
    const hoursUntil = (new Date(booking.scheduledAt).getTime() - Date.now()) / 36e5;
    if (hoursUntil < 4) {
      Alert.alert('No disponible', 'Solo puedes cancelar con más de 4 horas de anticipación.');
      return;
    }
    Alert.alert('Cancelar reserva', '¿Estás seguro?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(booking.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f59e0b" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />}
        renderItem={({ item: booking }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.barberName}>{booking.barber?.name ?? 'Barbero'}</Text>
              <BookingStatusBadge status={booking.status} />
            </View>

            <Text style={styles.date}>
              {format(parseISO(booking.scheduledAt), "d 'de' MMMM, HH:mm", { locale: es })}
            </Text>

            <Text style={styles.services} numberOfLines={1}>
              {booking.services.map((s) => s.service.name).join(' · ')}
            </Text>

            <View style={styles.footer}>
              <Text style={styles.total}>${booking.total.toFixed(2)}</Text>
              <View style={styles.actions}>
                {booking.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.btnDanger}
                    onPress={() => handleCancel(booking)}
                  >
                    <Text style={styles.btnDangerText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => router.push(`/booking/${booking.id}`)}
                  >
                    <Text style={styles.btnPrimaryText}>Tracking</Text>
                  </TouchableOpacity>
                )}
                {booking.status === 'COMPLETED' && !booking.review && (
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => router.push(`/review/${booking.id}`)}
                  >
                    <Text style={styles.btnPrimaryText}>Reseña</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes reservas aquí aún.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#0a0a0a' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#f59e0b' },
  tabText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#f59e0b' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barberName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  date: { color: '#9ca3af', fontSize: 13 },
  services: { color: '#6b7280', fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  total: { color: '#f59e0b', fontWeight: '800', fontSize: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: 13 },
  btnDanger: { backgroundColor: '#7f1d1d', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnDangerText: { color: '#fca5a5', fontWeight: '700', fontSize: 13 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
