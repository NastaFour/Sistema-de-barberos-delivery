const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export interface GeocodingSuggestion {
  lat: number;
  lng: number;
  placeName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingSuggestion[] | null> {
  if (!address.trim()) return null;
  if (!MAPBOX_TOKEN) {
    console.error('Falta el token VITE_MAPBOX_ACCESS_TOKEN en el .env');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=es,us,mx,co,ar`
    );
    
    if (!response.ok) {
      throw new Error('Error geocoding address');
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features.map((feature: any) => ({
      lat: feature.center[1],
      lng: feature.center[0],
      placeName: feature.place_name,
    }));
  } catch (error) {
    console.error('Error en geocodeAddress:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    
    if (!response.ok) throw new Error('Error en reverse geocoding');
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error('Error en reverseGeocode:', error);
    return null;
  }
}
