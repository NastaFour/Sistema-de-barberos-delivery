import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useBarbers } from '../../hooks/useQueries';
import { BarberCard } from '../../components/BarberCard';
import { Barber } from '../../types';
import { SlidersHorizontal } from 'lucide-react-native';

const { height } = Dimensions.get('window');
const DEFAULT_REGION = { latitude: 40.4168, longitude: -3.7038, latitudeDelta: 0.1, longitudeDelta: 0.1 };

export default function ExploreScreen() {
  const router = useRouter();
  const { latitude, longitude, isLoading: geoLoading } = useLocation();
  const [radius, setRadius] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const bottomAnim = useRef(new Animated.Value(height * 0.35)).current;
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: barbers = [], isLoading } = useBarbers({
    lat: latitude ?? undefined,
    lng: longitude ?? undefined,
    radius,
  });

  const region = latitude && longitude
    ? { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : DEFAULT_REGION;

  const toggleSheet = () => {
    const toValue = sheetOpen ? height * 0.35 : height * 0.08;
    Animated.spring(bottomAnim, { toValue, useNativeDriver: false }).start();
    setSheetOpen(!sheetOpen);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView style={styles.map} region={region} showsUserLocation userInterfaceStyle="dark">
        {barbers.map((b: Barber) => {
          const lat = b.profile?.latitude;
          const lng = b.profile?.longitude;
          if (!lat || !lng) return null;
          return (
            <Marker key={b.id} coordinate={{ latitude: lat, longitude: lng }}>
              <View style={styles.markerDot}>
                <Text style={styles.markerText}>{b.name.charAt(0)}</Text>
              </View>
              <Callout onPress={() => router.push(`/barber/${b.id}`)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{b.name}</Text>
                  <Text style={styles.calloutRating}>⭐ {b.profile?.rating?.toFixed(1) ?? '—'}</Text>
                  <Text style={styles.calloutLink}>Ver perfil →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Loading overlay */}
      {(geoLoading || isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      )}

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { bottom: 0, height: bottomAnim }]}>
        <TouchableOpacity style={styles.handle} onPress={toggleSheet}>
          <View style={styles.handleBar} />
          <Text style={styles.handleLabel}>
            {barbers.length} barberos cercanos
          </Text>
        </TouchableOpacity>

        <FlatList
          data={barbers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BarberCard barber={item} onPress={() => router.push(`/barber/${item.id}`)} />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.empty}>No encontramos barberos con estos filtros.</Text>
            ) : null
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { color: '#000', fontWeight: '800', fontSize: 14 },
  callout: { padding: 8, minWidth: 120 },
  calloutName: { fontWeight: '700', fontSize: 14 },
  calloutRating: { color: '#92400e', marginTop: 2 },
  calloutLink: { color: '#2563eb', marginTop: 4, fontSize: 12 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: { alignItems: 'center', paddingVertical: 10, gap: 6 },
  handleBar: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2 },
  handleLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 32 },
});
