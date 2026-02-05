import { memo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
    Marker,
} from 'react-simple-maps';
import { DISTRICT_TRANSLATION } from '../utils/koreaDistricts';

// Real TopoJSON data for South Korea provinces
const GEO_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json';

interface KoreaMapProps {
    className?: string;
    onZoomChange?: (zoom: number) => void;
    onRegionClick?: (regionName: string) => void;
    currentZoom?: number;
}

// Korean to English Translation Map
// Maps Korean DB region names to English TopoJSON names
export const REGION_TRANSLATION: Record<string, string> = {
    '서울': 'Seoul',
    '부산': 'Busan',
    '대구': 'Daegu',
    '인천': 'Incheon',
    '광주': 'Gwangju',
    '대전': 'Daejeon',
    '울산': 'Ulsan',
    '세종': 'Sejong',
    '경기': 'Gyeonggi-do',
    '강원': 'Gangwon-do',
    '충북': 'Chungcheongbuk-do',
    '충남': 'Chungcheongnam-do',
    '전북': 'Jeollabuk-do',
    '전남': 'Jeollanam-do',
    '경북': 'Gyeongsangbuk-do',
    '경남': 'Gyeongsangnam-do',
    '제주': 'Jeju-do',
};

// Reverse mapping: English to Korean
export const REGION_TRANSLATION_REVERSE: Record<string, string> = Object.fromEntries(
    Object.entries(REGION_TRANSLATION).map(([k, v]) => [v, k])
);

// Real latitude/longitude coordinates for Korean provinces
// Keys are in KOREAN to match DB data
export const RegionCoordinates: Record<string, [number, number]> = {
    // Metropolitan cities
    '서울': [126.978, 37.566],
    '부산': [129.075, 35.180],
    '대구': [128.602, 35.871],
    '인천': [126.705, 37.456],
    '광주': [126.852, 35.160],
    '대전': [127.385, 36.351],
    '울산': [129.311, 35.539],
    '세종': [127.289, 36.480],

    // Provinces
    '경기': [127.018, 37.275],
    '강원': [128.312, 37.555],
    '충북': [127.491, 36.628],
    '충남': [126.800, 36.518],
    '전북': [127.108, 35.716],
    '전남': [126.463, 34.816],
    '경북': [128.888, 36.249],
    '경남': [128.242, 35.238],
    '제주': [126.498, 33.489],
};

// Normalize region names from various sources (DB, TopoJSON, etc)
// Always returns the SHORT KOREAN NAME used as key in RegionCoordinates
export function normalizeRegionName(name: string): string {
    // If already a short Korean name, return as-is
    if (RegionCoordinates[name]) {
        return name;
    }

    // Check if it's an English name - convert to Korean
    if (REGION_TRANSLATION_REVERSE[name]) {
        return REGION_TRANSLATION_REVERSE[name];
    }

    // Check if it's an English district name - convert to Korean
    if (DISTRICT_TRANSLATION[name]) {
        return DISTRICT_TRANSLATION[name];
    }

    // Handle long Korean names
    const longToShort: Record<string, string> = {
        '서울특별시': '서울',
        '부산광역시': '부산',
        '대구광역시': '대구',
        '인천광역시': '인천',
        '광주광역시': '광주',
        '대전광역시': '대전',
        '울산광역시': '울산',
        '세종특별자치시': '세종',
        '경기도': '경기',
        '강원도': '강원',
        '충청북도': '충북',
        '충청남도': '충남',
        '전라북도': '전북',
        '전라남도': '전남',
        '경상북도': '경북',
        '경상남도': '경남',
        '제주특별자치도': '제주',
    };

    return longToShort[name] || name;
}

// Get English name for TopoJSON matching
export function getEnglishRegionName(koreanName: string): string {
    const normalized = normalizeRegionName(koreanName);
    return REGION_TRANSLATION[normalized] || koreanName;
}

export const KoreaMap = memo(function KoreaMap({
    className = '',
    onZoomChange,
    onRegionClick,
    currentZoom = 1,
}: KoreaMapProps) {
    return (
        <div className={`w-full h-full ${className}`}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 5500,
                    center: [127.8, 36.0],
                }}
                style={{ width: '100%', height: '100%' }}
            >
                <ZoomableGroup
                    zoom={currentZoom}
                    minZoom={0.8}
                    maxZoom={8}
                    onMoveEnd={({ zoom }) => {
                        onZoomChange?.(zoom);
                    }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) => (
                            <>
                                {geographies.map((geo) => {
                                    const provinceName = geo.properties.name || geo.properties.NAME_1 || '';

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onClick={() => {
                                                // Convert to Korean for our data model
                                                onRegionClick?.(normalizeRegionName(provinceName));
                                            }}
                                            style={{
                                                default: {
                                                    fill: '#E8ECF1',
                                                    stroke: '#FFFFFF',
                                                    strokeWidth: 0.75,
                                                    outline: 'none',
                                                },
                                                hover: {
                                                    fill: '#C7D2FE',
                                                    stroke: '#FFFFFF',
                                                    strokeWidth: 1,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                },
                                                pressed: {
                                                    fill: '#A5B4FC',
                                                    stroke: '#FFFFFF',
                                                    strokeWidth: 1,
                                                    outline: 'none',
                                                },
                                            }}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
});

// Export a Marker wrapper for placing weather icons on the map
interface MapMarkerProps {
    coordinates: [number, number];
    children: React.ReactNode;
}

export function MapMarker({ coordinates, children }: MapMarkerProps) {
    return (
        <Marker coordinates={coordinates}>
            {children}
        </Marker>
    );
}
