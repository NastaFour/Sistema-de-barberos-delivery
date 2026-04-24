import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { socketService } from './socket';
import * as SecureStore from 'expo-secure-store';

export const LOCATION_TASK_NAME = 'barber-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const { latitude, longitude } = locations[0].coords;
      
      try {
        const activeBookingId = await SecureStore.getItemAsync('active_booking_id');
        if (activeBookingId) {
           // Ensure socket is connected if app is in background
           if (!socketService.socket?.connected) {
             await socketService.connect();
           }
           socketService.emitLocation(activeBookingId, latitude, longitude);
        }
      } catch (e) {
        console.error('Error emitting location in background', e);
      }
    }
  }
});

export const startLocationTracking = async (bookingId: string) => {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') return false;

  await SecureStore.setItemAsync('active_booking_id', bookingId);
  
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Navegando al cliente",
      notificationBody: "BarberGo Pro está compartiendo tu ubicación en tiempo real.",
      notificationColor: "#f59e0b",
    }
  });
  return true;
};

export const stopLocationTracking = async () => {
  await SecureStore.deleteItemAsync('active_booking_id');
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};
