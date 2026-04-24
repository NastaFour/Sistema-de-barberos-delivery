import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, Linking, Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBarber, useBarberReviews } from '../../hooks/useQueries';
import { BarberService } from '../../types';
import { Feather } from '@expo/vector-icons';

type Tab = 'services' | 'gallery' | 'reviews';

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: barber, isLoading } = useBarber(id);
  const { data: reviewsData } = useBarberReviews(id);
  const [tab, setTab] = useState<Tab>('services');
  const [selected, setSelected] = useState<string[]>([]);

  if (isLoading || !barber) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f59e0b" size="large" />
      </View>
    );
  }

  const toggle = (sid: string) =>
    setSelected((p) => (p.includes(sid) ? p.filter((s) => s !== sid) : [...p, sid]));

  const selectedDetails = (barber.services ?? []).filter((s) => selected.includes(s.id));
  const total = selectedDetails.reduce((a, s) => a + s.price, 0);
  const duration = selectedDetails.reduce((a, s) => a + s.duration, 0);
  const lat = barber.profile?.latitude;
  const lng = barber.profile?.longitude;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Cover */}
        <View style={styles.cover}>
          {barber.profile?.gallery?.[0] ? (
            <Image source={{ uri: barber.profile.gallery[0] }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.coverPlaceholder]}>
              <Text style={styles.coverInitial}>{barber.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.coverOverlay}>
            <Text style={styles.name}>{barber.name}</Text>
            <View style={styles.row}>
              <Feather name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingTxt}>
                {barber.profile?.rating?.toFixed(1)} ({barber.profile?.totalReviews})
              </Text>
            </View>
          </View>
        </View>

        {barber.profile?.bio && <Text style={styles.bio}>{barber.profile.bio}</Text>}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['services', 'gallery', 'reviews'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t === 'services' ? 'Servicios' : t === 'gallery' ? 'Galería' : 'Reseñas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'services' && (
          <View style={styles.section}>
            {(barber.services ?? []).map((s: BarberService) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sCard, selected.includes(s.id) && styles.sCardSel]}
                onPress={() => toggle(s.id)}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.sName}>{s.name}</Text>
                  <View style={styles.row}>
                    <Feather name="clock" size={12} color="#6b7280" />
                    <Text style={styles.sMeta}>{s.duration} min · ${s.price}</Text>
                  </View>
                </View>
                <View style={[styles.check, selected.includes(s.id) && styles.checkSel]}>
                  {selected.includes(s.id) && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'gallery' && (
          <View style={styles.gallery}>
            {(barber.profile?.gallery ?? []).map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImg} />
            ))}
            {!barber.profile?.gallery?.length && <Text style={styles.empty}>Sin imágenes.</Text>}
          </View>
        )}

        {tab === 'reviews' && (
          <View style={styles.section}>
            {(reviewsData?.data ?? []).map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Text style={styles.reviewAuthor}>{r.client?.name}</Text>
                <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
                {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        {lat && lng && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.mapBox}>
              <MapView
                style={{ flex: 1 }}
                region={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                scrollEnabled={false}
                userInterfaceStyle="dark"
              >
                <Marker coordinate={{ latitude: lat, longitude: lng }} />
              </MapView>
            </View>
            <TouchableOpacity style={styles.dirBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)}>
              <Feather name="navigation" size={16} color="#f59e0b" />
              <Text style={styles.dirBtnTxt}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {selected.length > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatMeta}>{selected.length} servicio(s) · {duration} min</Text>
            <Text style={styles.floatTotal}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.bookBtn} onPress={() =>
            router.push({ pathname: '/booking/checkout', params: { barberId: id, serviceIds: selected.join(',') } })
          }>
            <Text style={styles.bookBtnTxt}>Reservar →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  cover: { height: 220, justifyContent: 'flex-end' },
  coverPlaceholder: { backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  coverInitial: { color: '#f59e0b', fontSize: 64, fontWeight: '800' },
  coverOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.55)', gap: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingTxt: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  bio: { color: '#9ca3af', fontSize: 14, lineHeight: 20, padding: 16 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#f59e0b' },
  tabTxt: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  tabTxtActive: { color: '#f59e0b' },
  section: { padding: 16, gap: 10 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sCard: { backgroundColor: '#111827', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  sCardSel: { borderColor: '#f59e0b', backgroundColor: '#1c1a10' },
  sName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sMeta: { color: '#6b7280', fontSize: 12 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  checkSel: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  checkMark: { color: '#000', fontWeight: '800', fontSize: 12 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  galleryImg: { width: '47%', height: 140, borderRadius: 10, resizeMode: 'cover' },
  reviewCard: { backgroundColor: '#111827', borderRadius: 10, padding: 12, gap: 4, borderWidth: 1, borderColor: '#1f2937' },
  reviewAuthor: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reviewStars: {},
  reviewComment: { color: '#9ca3af', fontSize: 12 },
  empty: { color: '#6b7280', textAlign: 'center', paddingVertical: 24 },
  mapBox: { height: 170, borderRadius: 12, overflow: 'hidden' },
  dirBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#1f2937' },
  dirBtnTxt: { color: '#f59e0b', fontWeight: '700' },
  floatingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1f2937', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 28 },
  floatMeta: { color: '#9ca3af', fontSize: 12 },
  floatTotal: { color: '#f59e0b', fontWeight: '800', fontSize: 22 },
  bookBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  bookBtnTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
});
