import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
    address: string | null;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        loading: true,
        error: null,
        address: null,
    });

    const getAddress = useCallback(async (lat: number, lng: number): Promise<string> => {
        const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

        if (!KAKAO_REST_KEY) {
            return estimateRegionFromCoords(lat, lng);
        }

        try {
            const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `KakaoAK ${KAKAO_REST_KEY}`,
                },
            });

            if (!response.ok) {
                return estimateRegionFromCoords(lat, lng);
            }

            const data = await response.json();

            // 행정동(H) 정보 우선
            const adminRegion = data.documents?.find((d: any) => d.region_type === 'H');
            if (adminRegion) {
                const r1 = adminRegion.region_1depth_name || '';
                const r2 = adminRegion.region_2depth_name || '';
                const r3 = adminRegion.region_3depth_name || '';
                return r3 ? `${r1} ${r2} ${r3}` : r2 ? `${r1} ${r2}` : r1;
            }

            // 법정동(B) fallback
            const legalRegion = data.documents?.find((d: any) => d.region_type === 'B');
            if (legalRegion) {
                return `${legalRegion.region_1depth_name} ${legalRegion.region_2depth_name} ${legalRegion.region_3depth_name}`.trim();
            }

            return estimateRegionFromCoords(lat, lng);
        } catch {
            return estimateRegionFromCoords(lat, lng);
        }
    }, []);

    // GPS 좌표로 대략적인 시/도 추정 (API 없이)
    const estimateRegionFromCoords = (lat: number, lng: number): string => {
        // 한국 주요 도시 좌표 범위
        if (lat >= 37.4 && lat <= 37.7 && lng >= 126.7 && lng <= 127.2) return '서울';
        if (lat >= 37.3 && lat <= 37.6 && lng >= 126.5 && lng <= 127.0) return '인천';
        if (lat >= 37.0 && lat <= 37.6 && lng >= 126.7 && lng <= 127.5) return '경기';
        if (lat >= 35.0 && lat <= 35.3 && lng >= 128.8 && lng <= 129.2) return '부산';
        if (lat >= 35.7 && lat <= 36.0 && lng >= 128.4 && lng <= 128.8) return '대구';
        if (lat >= 35.0 && lat <= 35.3 && lng >= 126.7 && lng <= 127.0) return '광주';
        if (lat >= 36.2 && lat <= 36.5 && lng >= 127.2 && lng <= 127.5) return '대전';
        if (lat >= 35.4 && lat <= 35.7 && lng >= 129.1 && lng <= 129.5) return '울산';
        if (lat >= 33.2 && lat <= 33.6 && lng >= 126.1 && lng <= 126.9) return '제주';
        if (lat >= 37.0 && lat <= 38.0 && lng >= 127.5 && lng <= 129.5) return '강원';
        if (lat >= 36.0 && lat <= 37.0 && lng >= 127.0 && lng <= 128.0) return '충북';
        if (lat >= 35.5 && lat <= 37.0 && lng >= 126.0 && lng <= 127.0) return '충남';
        if (lat >= 35.0 && lat <= 36.0 && lng >= 126.5 && lng <= 127.5) return '전북';
        if (lat >= 34.0 && lat <= 35.5 && lng >= 126.0 && lng <= 127.5) return '전남';
        if (lat >= 35.5 && lat <= 37.0 && lng >= 128.0 && lng <= 130.0) return '경북';
        if (lat >= 34.5 && lat <= 35.8 && lng >= 127.5 && lng <= 129.0) return '경남';
        if (lat >= 36.4 && lat <= 36.6 && lng >= 127.2 && lng <= 127.4) return '세종';

        return '대한민국';
    };

    const requestLocation = useCallback(() => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: '이 브라우저에서는 위치 정보를 지원하지 않습니다.',
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Nominatim API로 주소 가져오기
                const address = await getAddress(latitude, longitude);

                setState({
                    latitude,
                    longitude,
                    loading: false,
                    error: null,
                    address,
                });
            },
            (error) => {
                let errorMessage = '위치 정보를 가져올 수 없습니다.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
                        break;
                }
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // 1분 캐시
            }
        );
    }, [getAddress]);

    // 컴포넌트 마운트 시 자동으로 위치 요청
    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    return {
        ...state,
        refresh: requestLocation,
    };
}

// Global kakao type declaration
declare global {
    interface Window {
        kakao: any;
    }
}
