import Constants from 'expo-constants';

export const KAKAO_REST_KEY = Constants.expoConfig?.extra?.kakaoRestKey || process.env.EXPO_PUBLIC_KAKAO_REST_KEY;

/**
 * GPS 좌표로 행정구역(읍면동) 주소를 가져옵니다.
 * 카카오 로컬 API를 사용합니다.
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
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
            // 서울특별시 관악구 신림동 -> 서울 관악구 신림동 형태로 정규화
            const p1 = r1.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
            return r3 ? `${p1} ${r2} ${r3}` : r2 ? `${p1} ${r2}` : p1;
        }

        // 법정동(B) fallback
        const legalRegion = data.documents?.find((d: any) => d.region_type === 'B');
        if (legalRegion) {
            const p1 = legalRegion.region_1depth_name.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
            return `${p1} ${legalRegion.region_2depth_name} ${legalRegion.region_3depth_name}`.trim();
        }

        return estimateRegionFromCoords(lat, lng);
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return estimateRegionFromCoords(lat, lng);
    }
}

/**
 * API 호출 실패 시 좌표 기반으로 대략적인 시/도 추정
 */
export function estimateRegionFromCoords(lat: number, lng: number): string {
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
}
