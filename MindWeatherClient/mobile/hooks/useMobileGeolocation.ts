import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getAddressFromCoords } from '../utils/location';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
    address: string | null;
}

export function useMobileGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        loading: true,
        error: null,
        address: null,
    });

    const requestLocation = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: '위치 권한이 거부되었습니다. 설정에서 허용해주세요.',
                }));
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoords(latitude, longitude);

            setState({
                latitude,
                longitude,
                loading: false,
                error: null,
                address,
            });
        } catch (error) {
            console.error('Failed to get location:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: '위치 정보를 가져올 수 없습니다.',
            }));
        }
    }, []);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    return {
        ...state,
        refresh: requestLocation,
    };
}
