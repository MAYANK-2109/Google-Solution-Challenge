import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

// Bounding box for a generic hotel campus (Goa, India as demo)
const CAMPUS_CENTER = { lat: 15.3173, lng: 73.9278 };
const DRIFT = 0.005; // ~500m radius

const randomOffset = () => (Math.random() - 0.5) * DRIFT;

export const useGeolocation = (tripId, userId, isActive) => {
  const { socket } = useSocket();
  const intervalRef = useRef(null);
  const posRef = useRef({ lat: CAMPUS_CENTER.lat + randomOffset(), lng: CAMPUS_CENTER.lng + randomOffset() });

  const emitLocation = useCallback(() => {
    if (!socket || !tripId) return;

    // Try real GPS first, fall back to simulated walk
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          posRef.current = { lat, lng };
          socket.emit('location-update', { tripId, userId, lat, lng });
        },
        () => {
          // Simulate gentle walk within campus
          posRef.current = {
            lat: posRef.current.lat + (Math.random() - 0.5) * 0.0003,
            lng: posRef.current.lng + (Math.random() - 0.5) * 0.0003,
          };
          socket.emit('location-update', { tripId, userId, ...posRef.current });
        },
        { timeout: 3000, enableHighAccuracy: true }
      );
    } else {
      posRef.current = {
        lat: posRef.current.lat + (Math.random() - 0.5) * 0.0003,
        lng: posRef.current.lng + (Math.random() - 0.5) * 0.0003,
      };
      socket.emit('location-update', { tripId, userId, ...posRef.current });
    }
  }, [socket, tripId, userId]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(intervalRef.current);
      return;
    }
    emitLocation();
    intervalRef.current = setInterval(emitLocation, 5000);
    return () => clearInterval(intervalRef.current);
  }, [isActive, emitLocation]);

  return posRef.current;
};
