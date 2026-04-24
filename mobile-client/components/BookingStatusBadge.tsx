import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookingStatus } from '../types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  PENDING:     { label: 'Pendiente',   bg: '#fef3c7', text: '#92400e' },
  CONFIRMED:   { label: 'Confirmada',  bg: '#d1fae5', text: '#065f46' },
  IN_PROGRESS: { label: 'En curso',    bg: '#dbeafe', text: '#1e40af' },
  COMPLETED:   { label: 'Completada',  bg: '#f3f4f6', text: '#374151' },
  CANCELLED:   { label: 'Cancelada',   bg: '#fee2e2', text: '#991b1b' },
  NO_SHOW:     { label: 'No asistió',  bg: '#fde8d8', text: '#9a3412' },
};

interface Props {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
