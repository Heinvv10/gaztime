import { useState, useEffect, useCallback } from 'react';

export interface DriverLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GeoError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  onLocationUpdate?: (position: DriverLocation) => void;
  onError?: (error: GeoError) => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
    onLocationUpdate,
    onError,
  } = options;

  const [position, setPosition] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<GeoError | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = useCallback(
    (pos: GeolocationPosition) => {
      const newPosition: DriverLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      };

      setPosition(newPosition);
      setError(null);
      setLoading(false);

      if (onLocationUpdate) {
        onLocationUpdate(newPosition);
      }
    },
    [onLocationUpdate]
  );

  const handleError = useCallback(
    (err: GeolocationPositionError) => {
      const newError: GeoError = {
        code: err.code,
        message: err.message,
      };

      setError(newError);
      setLoading(false);

      if (onError) {
        onError(newError);
      }
    },
    [onError]
  );

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: -1,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: -1,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    if (watch) {
      startWatching();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, startWatching, watchId]);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
  };
}
