import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Barber } from '../types';
import { Feather } from '@expo/vector-icons';

interface Props {
  barber: Barber;
  onPress: () => void;
}

export function BarberCard({ barber, onPress }: Props) {
  const minPrice = barber.services?.length
    ? Math.min(...barber.services.map((s) => s.price))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {barber.profile?.avatar ? (
          <Image source={{ uri: barber.profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{barber.name.charAt(0)}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{barber.name}</Text>

        <View style={styles.row}>
          <Feather name="star" size={13} color="#f59e0b" />
          <Text style={styles.rating}>
            {barber.profile?.rating?.toFixed(1) ?? '—'}{' '}
            <Text style={styles.reviews}>({barber.profile?.totalReviews ?? 0})</Text>
          </Text>
        </View>

        {barber.distance !== undefined && (
          <View style={styles.row}>
            <Feather name="map-pin" size={12} color="#6b7280" />
            <Text style={styles.meta}>{barber.distance.toFixed(1)} km</Text>
          </View>
        )}

        {minPrice !== null && (
          <Text style={styles.price}>Desde ${minPrice}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 12,
  },
  imageContainer: { justifyContent: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#9ca3af', fontSize: 28, fontWeight: '700' },
  info: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  reviews: { color: '#6b7280', fontWeight: '400' },
  meta: { color: '#6b7280', fontSize: 12 },
  price: { color: '#f59e0b', fontSize: 13, fontWeight: '700', marginTop: 2 },
});
