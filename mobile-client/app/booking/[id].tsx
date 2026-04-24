import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { useBooking } from '../../hooks/useQueries';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { Feather } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { io, Socket } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading } = useBooking(id);
  const [barberCoords, setBarberCoords] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<Socket | undefined>(undefined);

  useEffect(() => {
    if (!booking) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join', `client:${booking.clientId}`);

    socket.on('barber_location_update', (data: { barberId: string; latitude: number; longitude: number }) => {
      if (data.barberId === booking.barberId) {
        setBarberCoords({ lat: data.latitude, lng: data.longitude });
      }
    });

    return () => { socket.disconnect(); };
  }, [booking?.id]);

  if (isLoading || !booking) {
    return <View style={styles.center}><ActivityIndicator color="#f59e0b" size="large" /></View>;
  }

  const clientCoord = { latitude: booking.latitude, longitude: booking.longitude };

  const TIMELINE = [
    { label: 'Reservado', status: 'PENDING' },
    { label: 'Confirmado', status: 'CONFIRMED' },
    { label: 'En camino', status: 'IN_PROGRESS' },
    { label: 'Completado', status: 'COMPLETED' },
  ];

  const statusIdx = TIMELINE.findIndex((t) => t.status === booking.status);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        region={{
          latitude: barberCoords?.lat ?? clientCoord.latitude,
          longitude: barberCoords?.lng ?? clientCoord.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        userInterfaceStyle="dark"
      >
        {/* Client pin */}
        <Marker coordinate={clientCoord} pinColor="blue" title="Tu ubicación" />

        {/* Barber pin (real-time) */}
        {barberCoords && (
          <Marker coordinate={{ latitude: barberCoords.lat, longitude: barberCoords.lng }} pinColor="orange" title="Barbero" />
        )}

        {/* Route line */}
        {barberCoords && (
          <Polyline
            coordinates={[
              { latitude: barberCoords.lat, longitude: barberCoords.lng },
              clientCoord,
            ]}
            strokeColor="#f59e0b"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Bottom info card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.barberName}>{booking.barber?.name}</Text>
          <BookingStatusBadge status={booking.status} />
        </View>

        <Text style={styles.time}>
          {format(parseISO(booking.scheduledAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
        </Text>

        {/* Timeline */}
        <View style={styles.timeline}>
          {TIMELINE.map((t, i) => (
            <View key={t.status} style={styles.timelineItem}>
              <View style={[styles.dot, i <= statusIdx && styles.dotActive]} />
              <Text style={[styles.dotLabel, i <= statusIdx && styles.dotLabelActive]}>
                {t.label}
              </Text>
              {i < TIMELINE.length - 1 && <View style={[styles.line, i < statusIdx && styles.lineActive]} />}
            </View>
          ))}
        </View>

        {/* Contact */}
        {booking.barber?.phone && (
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`tel:${booking.barber.phone}`)}
          >
            <Feather name="phone" size={18} color="#f59e0b" />
            <Text style={styles.contactBtnTxt}>Llamar al barbero</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  card: {
    backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 14, borderTopWidth: 1, borderTopColor: '#1f2937',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barberName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  time: { color: '#9ca3af', fontSize: 13 },
  timeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineItem: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#374151', marginBottom: 4 },
  dotActive: { backgroundColor: '#f59e0b' },
  dotLabel: { color: '#6b7280', fontSize: 10, textAlign: 'center' },
  dotLabelActive: { color: '#f59e0b', fontWeight: '700' },
  line: { position: 'absolute', top: 7, left: '60%', right: '-40%', height: 2, backgroundColor: '#374151' },
  lineActive: { backgroundColor: '#f59e0b' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#1f2937', borderRadius: 12 },
  contactBtnTxt: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
});
