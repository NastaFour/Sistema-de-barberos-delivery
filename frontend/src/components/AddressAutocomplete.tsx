import React, { useState, useEffect, useRef } from 'react';
import { geocodeAddress, reverseGeocode, GeocodingSuggestion } from '../services/geocoding';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressAutocompleteProps {
  onSelect: (lat: number, lng: number, address: string) => void;
  defaultAddress?: string;
  className?: string;
}

export function AddressAutocomplete({ onSelect, defaultAddress = '', className = '' }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length > 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        const results = await geocodeAddress(value);
        setSuggestions(results || []);
        setShowDropdown(true);
        setIsLoading(false);
      }, 500);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (suggestion: GeocodingSuggestion) => {
    setQuery(suggestion.placeName);
    setShowDropdown(false);
    onSelect(suggestion.lat, suggestion.lng, suggestion.placeName);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        if (address) {
          setQuery(address);
          onSelect(latitude, longitude, address);
          toast.success('Ubicación obtenida');
        } else {
          toast.error('No se pudo determinar tu dirección exacta');
          // Still pass coords even if reverse geocoding fails? Let's just pass what we have
          setQuery(`${latitude}, ${longitude}`);
          onSelect(latitude, longitude, `Ubicación GPS (${latitude}, ${longitude})`);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location', error);
        toast.error('Debes permitir el acceso a tu ubicación');
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Ej: Calle Mayor 1, Madrid"
          className="w-full pl-10 pr-12 py-3 bg-dark-900 border border-dark-800 text-white rounded-lg focus:border-primary outline-none transition"
        />
        {isLoading && (
          <div className="absolute right-12 flex items-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isGettingLocation}
          className="absolute right-2 p-2 text-gray-400 hover:text-primary transition disabled:opacity-50"
          title="Usar mi ubicación actual"
        >
          {isGettingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-dark-900 border border-dark-800 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 hover:bg-dark-800 cursor-pointer flex items-start gap-3 transition"
            >
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{suggestion.placeName}</span>
            </li>
          ))}
        </ul>
      )}
      {showDropdown && !isLoading && query.length > 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-900 border border-dark-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">No pudimos encontrar esa dirección. Intenta con otra.</p>
        </div>
      )}
    </div>
  );
}
