import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateReview } from '../../hooks/useQueries';
import { Feather } from '@expo/vector-icons';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Error', 'Selecciona una calificación.'); return; }
    try {
      await createReview.mutateAsync({ bookingId, data: { rating, comment: comment.trim() || undefined } });
      Alert.alert('¡Gracias!', 'Tu reseña fue enviada.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch {
      Alert.alert('Error', 'No pudimos enviar tu reseña. Inténtalo de nuevo.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>¿Cómo estuvo el servicio?</Text>
      <Text style={styles.subtitle}>Tu opinión ayuda a otros clientes a elegir bien.</Text>

      {/* Star rating */}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Feather name="star" size={44} color={s <= rating ? '#f59e0b' : '#374151'} />
          </TouchableOpacity>
        ))}
      </View>

      {rating > 0 && (
        <Text style={styles.ratingLabel}>
          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'][rating]}
        </Text>
      )}

      {/* Comment */}
      <View style={styles.field}>
        <Text style={styles.label}>Comentario (opcional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Cuéntanos más sobre tu experiencia..."
          placeholderTextColor="#4b5563"
          multiline
          numberOfLines={5}
          style={styles.textarea}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (createReview.isPending || rating === 0) && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={createReview.isPending || rating === 0}
      >
        {createReview.isPending
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.submitBtnTxt}>Enviar reseña</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, gap: 24, alignItems: 'center' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 8 },
  ratingLabel: { color: '#f59e0b', fontWeight: '700', fontSize: 16 },
  field: { width: '100%', gap: 8 },
  label: { color: '#9ca3af', fontWeight: '600', fontSize: 13 },
  textarea: {
    backgroundColor: '#111827', borderRadius: 12, borderWidth: 1,
    borderColor: '#1f2937', padding: 14, color: '#fff', fontSize: 14,
    textAlignVertical: 'top', minHeight: 120, width: '100%',
  },
  submitBtn: {
    width: '100%', backgroundColor: '#f59e0b', padding: 18,
    borderRadius: 14, alignItems: 'center',
  },
  submitBtnTxt: { color: '#000', fontWeight: '800', fontSize: 16 },
});
