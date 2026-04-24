import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    errorMsg: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted) {
          setState((s) => ({
            ...s,
            errorMsg: 'Permiso de ubicación denegado',
            isLoading: false,
          }));
        }
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (mounted) {
          setState({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            errorMsg: null,
            isLoading: false,
          });
        }
      } catch {
        if (mounted) {
          setState((s) => ({
            ...s,
            errorMsg: 'No se pudo obtener la ubicación',
            isLoading: false,
          }));
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
