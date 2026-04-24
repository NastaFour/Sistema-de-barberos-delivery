import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useBarber, useAvailableSlots, useCreateBooking } from '../../hooks/useQueries';
import { apiClient } from '../../services/api';
import { AddressAutocomplete } from '../../components/AddressAutocomplete';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarberService } from '../../types';

const STEPS = ['Servicios', 'Fecha', 'Hora', 'Dirección', 'Resumen'];

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ barberId: string; serviceIds: string }>();
  const router = useRouter();
  const barberId = params.barberId;
  const preSelectedIds = params.serviceIds?.split(',').filter(Boolean) ?? [];

  const { data: barber, isLoading } = useBarber(barberId);
  const createBooking = useCreateBooking();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>(preSelectedIds);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slots = [], isLoading: slotsLoading } = useAvailableSlots(barberId, dateStr);

  const services = (barber?.services ?? []) as BarberService[];
  const selectedDetails = services.filter((s) => selectedServices.includes(s.id));
  const subtotal = selectedDetails.reduce((a, s) => a + s.price, 0);
  const fee = subtotal * 0.05;
  const total = subtotal + fee;
  const duration = selectedDetails.reduce((a, s) => a + s.duration, 0);

  const next = () => {
    if (step === 0 && selectedServices.length === 0) { Alert.alert('Error', 'Selecciona al menos un servicio.'); return; }
    if (step === 1 && !selectedDate) { Alert.alert('Error', 'Elige una fecha.'); return; }
    if (step === 2 && !selectedSlot) { Alert.alert('Error', 'Elige una hora.'); return; }
    if (step === 3 && (!latitude || !longitude)) { Alert.alert('Error', 'Selecciona una dirección válida.'); return; }
    if (step < 4) setStep((s) => s + 1);
  };

  const confirm = async () => {
    if (!latitude || !longitude) return;
    try {
      const res = await createBooking.mutateAsync({
        barberId,
        scheduledAt: new Date(`${dateStr}T${selectedSlot}`).toISOString(),
        serviceIds: selectedServices,
        address,
        latitude,
        longitude,
        notes: notes || undefined,
      });

      if (res.data.success && res.data.data?.id) {
        const bookingId = res.data.data.id;
        
        const intentRes = await apiClient.post<{ success: boolean; data: { clientSecret: string, paymentIntentId: string } }>(
          '/payments/create-intent', 
          { bookingId }
        );
        
        if (!intentRes.data.success) {
          throw new Error('Error al generar intención de pago.');
        }

        const { clientSecret, paymentIntentId } = intentRes.data.data;

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'BarberGo',
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: false,
          appearance: { colors: { primary: '#f59e0b', background: '#111827' } }
        });

        if (initError) throw new Error(initError.message);

        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
          Alert.alert('Pago incompleto', paymentError.message);
        } else {
          try {
            await apiClient.post('/payments/confirm', { paymentIntentId });
          } catch {}
          Alert.alert('¡Pago exitoso!', 'Tu cita fue agendada con éxito.', [
            { text: 'Ver mis reservas', onPress: () => router.replace('/(tabs)/bookings') },
          ]);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No pudimos crear la reserva. Inténtalo de nuevo.');
    }
  };

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color="#f59e0b" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              <Text style={[styles.progressNum, i <= step && styles.progressNumActive]}>{i + 1}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.progressLine, i < step && styles.progressLineActive]} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepTitle}>{STEPS[step]}</Text>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Step 0: Services */}
        {step === 0 && services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sCard, selectedServices.includes(s.id) && styles.sCardSel]}
            onPress={() => setSelectedServices((p) => p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id])}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sName}>{s.name}</Text>
              <Text style={styles.sMeta}>{s.duration} min · ${s.price}</Text>
            </View>
            <View style={[styles.check, selectedServices.includes(s.id) && styles.checkSel]}>
              {selectedServices.includes(s.id) && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {/* Step 1: Date */}
        {step === 1 && (
          <View style={styles.dateGrid}>
            {next7Days.map((d) => {
              const active = format(d, 'yyyy-MM-dd') === dateStr;
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  style={[styles.dateBtn, active && styles.dateBtnActive]}
                  onPress={() => { setSelectedDate(d); setSelectedSlot(''); }}
                >
                  <Text style={[styles.dateDayName, active && styles.dateTxtActive]}>
                    {format(d, 'EEE', { locale: es })}
                  </Text>
                  <Text style={[styles.dateDay, active && styles.dateTxtActive]}>
                    {format(d, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Time */}
        {step === 2 && (
          slotsLoading
            ? <ActivityIndicator color="#f59e0b" style={{ marginTop: 32 }} />
            : slots.length === 0
              ? <Text style={styles.empty}>No hay horarios disponibles para esta fecha.</Text>
              : (
                <View style={styles.slotsGrid}>
                  {slots.map((slot: string) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotTxt, selectedSlot === slot && styles.slotTxtActive]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
        )}

        {/* Step 3: Address */}
        {step === 3 && (
          <View style={{ gap: 16 }}>
            <AddressAutocomplete
              onSelect={(lat, lng, addr) => { setLatitude(lat); setLongitude(lng); setAddress(addr); }}
              defaultAddress={address}
            />
            {latitude && longitude && (
              <View style={styles.coordBox}>
                <Text style={styles.coordText}>✓ Ubicación detectada</Text>
              </View>
            )}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas opcionales (piso, timbre...)"
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </View>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <View style={{ gap: 14 }}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Servicios</Text>
              {selectedDetails.map((s) => (
                <View key={s.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{s.name}</Text>
                  <Text style={styles.summaryValue}>${s.price}</Text>
                </View>
              ))}
            </View>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha</Text>
                <Text style={styles.summaryValue}>{format(selectedDate, "d 'de' MMMM", { locale: es })}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hora</Text>
                <Text style={styles.summaryValue}>{selectedSlot}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duración</Text>
                <Text style={styles.summaryValue}>{duration} min</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dirección</Text>
                <Text style={[styles.summaryValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{address}</Text>
              </View>
            </View>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Comisión (5%)</Text>
                <Text style={styles.summaryValue}>${fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnTxt}>← Atrás</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextBtnTxt}>Continuar →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, createBooking.isPending && { opacity: 0.6 }]}
            onPress={confirm}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.nextBtnTxt}>Confirmar Reserva</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 8 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: '#f59e0b' },
  progressNum: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
  progressNumActive: { color: '#000' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#1f2937' },
  progressLineActive: { backgroundColor: '#f59e0b' },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  sCard: { backgroundColor: '#111827', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937', marginBottom: 10 },
  sCardSel: { borderColor: '#f59e0b', backgroundColor: '#1c1a10' },
  sName: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  sMeta: { color: '#6b7280', fontSize: 12 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  checkSel: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  checkMark: { color: '#000', fontWeight: '800', fontSize: 12 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dateBtn: { width: '13%', minWidth: 44, aspectRatio: 0.7, backgroundColor: '#111827', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1f2937', paddingVertical: 8 },
  dateBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  dateDayName: { color: '#6b7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  dateDay: { color: '#fff', fontSize: 20, fontWeight: '800' },
  dateTxtActive: { color: '#000' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: { backgroundColor: '#111827', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1f2937' },
  slotBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  slotTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
  slotTxtActive: { color: '#000' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40 },
  coordBox: { backgroundColor: '#064e3b', borderRadius: 10, padding: 12 },
  coordText: { color: '#34d399', fontWeight: '700' },
  notesInput: { backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#1f2937', padding: 14, color: '#fff', fontSize: 14, textAlignVertical: 'top' },
  summaryBox: { backgroundColor: '#111827', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1f2937', gap: 10 },
  summaryTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#9ca3af', fontSize: 13 },
  summaryValue: { color: '#fff', fontWeight: '600', fontSize: 13 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 10, marginTop: 4 },
  totalLabel: { color: '#fff', fontWeight: '800', fontSize: 15 },
  totalValue: { color: '#f59e0b', fontWeight: '800', fontSize: 18 },
  navBar: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#1f2937', backgroundColor: '#0a0a0a' },
  backBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#111827' },
  backBtnTxt: { color: '#9ca3af', fontWeight: '700', fontSize: 15 },
  nextBtn: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f59e0b' },
  nextBtnTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
});
