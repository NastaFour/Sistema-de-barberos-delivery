import React, { useState, useRef } from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity,
  Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { geocodeAddress, reverseGeocode } from '../services/api';
import { GeocodingSuggestion } from '../types';
import { Feather } from '@expo/vector-icons';

interface Props {
  onSelect: (lat: number, lng: number, address: string) => void;
  defaultAddress?: string;
  placeholder?: string;
}

export function AddressAutocomplete({ onSelect, defaultAddress = '', placeholder = 'Buscar dirección...' }: Props) {
  const [query, setQuery] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeo, setIsGeo] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (text: string) => {
    setQuery(text);
    clearTimeout(debounce.current);
    if (text.length < 3) { setSuggestions([]); return; }
    setIsLoading(true);
    debounce.current = setTimeout(async () => {
      const res = await geocodeAddress(text);
      setSuggestions(res ?? []);
      setIsLoading(false);
    }, 500);
  };

  const handleSelect = (s: GeocodingSuggestion) => {
    setQuery(s.placeName);
    setSuggestions([]);
    onSelect(s.lat, s.lng, s.placeName);
  };

  const handleGeo = async () => {
    setIsGeo(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setIsGeo(false); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const addr = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    const label = addr ?? `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
    setQuery(label);
    onSelect(loc.coords.latitude, loc.coords.longitude, label);
    setIsGeo(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Feather name="map-pin" size={18} color="#6b7280" style={styles.icon} />
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        {isLoading || isGeo ? (
          <ActivityIndicator size="small" color="#f59e0b" />
        ) : (
          <TouchableOpacity onPress={handleGeo}>
            <Feather name="navigation" size={20} color="#f59e0b" />
          </TouchableOpacity>
        )}
      </View>

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(_, i) => i.toString()}
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
              <Feather name="map-pin" size={14} color="#f59e0b" />
              <Text style={styles.itemText} numberOfLines={2}>{item.placeName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  icon: {},
  input: { flex: 1, color: '#fff', fontSize: 14 },
  dropdown: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 4,
    maxHeight: 220,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  itemText: { flex: 1, color: '#d1d5db', fontSize: 13 },
});
