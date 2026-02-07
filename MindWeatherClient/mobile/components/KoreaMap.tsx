import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { DISTRICT_TRANSLATION } from '../utils/koreaDistricts';
import { EmotionType, EmotionIcons } from '../types/emotion';

const GEO_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json';

// Korean to English Translation Map
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
export const RegionCoordinates: Record<string, [number, number]> = {
    '서울': [126.978, 37.566],
    '부산': [129.075, 35.180],
    '대구': [128.602, 35.871],
    '인천': [126.705, 37.456],
    '광주': [126.852, 35.160],
    '대전': [127.385, 36.351],
    '울산': [129.311, 35.539],
    '세종': [127.289, 36.480],
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

// Normalize region names
export function normalizeRegionName(name: string): string {
    if (!name) return name;

    if (Object.values(REGION_TRANSLATION).includes(name)) {
        return REGION_TRANSLATION_REVERSE[name] || name;
    }
    if (REGION_TRANSLATION_REVERSE[name]) {
        return REGION_TRANSLATION_REVERSE[name];
    }
    if (DISTRICT_TRANSLATION[name]) {
        return DISTRICT_TRANSLATION[name];
    }

    // Strip common suffixes
    let normalized = name.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');

    // Handle multi-character province names to short forms
    if (normalized.startsWith('충청북')) return '충북';
    if (normalized.startsWith('충청남')) return '충남';
    if (normalized.startsWith('전라북')) return '전북';
    if (normalized.startsWith('전라남')) return '전남';
    if (normalized.startsWith('경상북')) return '경북';
    if (normalized.startsWith('경상남')) return '경남';

    return normalized;
}

interface MarkerData {
    region: string;
    emotion: EmotionType;
    count: number;
}

interface KoreaMapProps {
    onRegionClick?: (regionName: string) => void;
    onMarkerClick?: (marker: MarkerData) => void;
    regionColors?: Record<string, string>;
    markers?: MarkerData[];
    currentZoom?: number;
}

const AnimatedMarker = ({ marker, markerScale, onMarkerClick }: { marker: any, markerScale: number, onMarkerClick: (m: any) => void }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacityVal = useSharedValue(1);

    useEffect(() => {
        // Reset values
        scale.value = 1;
        translateY.value = 0;
        translateX.value = 0;
        opacityVal.value = 1;

        switch (marker.emotion) {
            case EmotionType.Joy:
            case EmotionType.Excitement:
                scale.value = withRepeat(withTiming(1.15, { duration: 1200 }), -1, true);
                break;
            case EmotionType.Calm:
                translateY.value = withRepeat(withTiming(-6, { duration: 2000 }), -1, true);
                break;
            case EmotionType.Anger:
                scale.value = withRepeat(withTiming(1.2, { duration: 400 }), -1, true);
                opacityVal.value = withRepeat(withTiming(0.7, { duration: 400 }), -1, true);
                break;
            case EmotionType.Anxiety:
                translateX.value = withRepeat(
                    withSequence(
                        withTiming(2, { duration: 100 }),
                        withTiming(-2, { duration: 100 })
                    ),
                    -1,
                    true
                );
                break;
            case EmotionType.Sadness:
            case EmotionType.Fatigue:
            case EmotionType.Loneliness:
                translateY.value = withRepeat(withTiming(4, { duration: 2500 }), -1, true);
                opacityVal.value = withRepeat(withTiming(0.6, { duration: 2500 }), -1, true);
                break;
            case EmotionType.Boredom:
            case EmotionType.Depression:
                scale.value = withRepeat(withTiming(0.85, { duration: 3000 }), -1, true);
                break;
        }
    }, [marker.emotion]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: marker.x - 20,
            top: marker.y - 20,
            transform: [
                { scale: markerScale * scale.value },
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
            opacity: opacityVal.value,
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                onPress={() => onMarkerClick?.(marker)}
                activeOpacity={0.7}
                style={{
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Text style={{ fontSize: 24 }}>{marker.emoji}</Text>
                {marker.count > 1 && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: '#8B5CF6',
                        borderRadius: 10,
                        minWidth: 16,
                        height: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 4
                    }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                            {marker.count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function KoreaMap({ onRegionClick, onMarkerClick, regionColors = {}, markers = [], currentZoom = 1 }: KoreaMapProps) {
    const [geography, setGeography] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    const { width } = Dimensions.get('window');
    const height = width * 2.0;

    useEffect(() => {
        fetch(GEO_URL)
            .then(response => response.json())
            .then(topology => {
                if (!topology) {
                    console.error('Topology is null');
                    setLoading(false);
                    return;
                }
                try {
                    const geojson = topojson.feature(topology, topology.objects.skorea_provinces_2018_geo as any);
                    if (!geojson || !geojson.features) {
                        console.error('GeoJSON creation failed');
                        setLoading(false);
                        return;
                    }
                    setGeography((geojson as any).features);
                } catch (e) {
                    console.error('TopoJSON processing error:', e);
                }
                setLoading(false);
            })
            .catch(error => {
                error.name === 'AbortError' || console.error('Failed to load map data', error);
                setLoading(false);
            });
    }, []);

    const projection = useMemo(() => {
        return d3.geoMercator()
            .center([127.8, 36.0])
            .scale(9500 * (width / 800))
            .translate([width / 2, height / 2]);
    }, [width, height]);

    const pathGenerator = useMemo(() => {
        return d3.geoPath().projection(projection);
    }, [projection]);

    // Project markers to screen coordinates
    const projectedMarkers = useMemo(() => {
        console.log(`--- Projecting ${markers.length} markers ---`);
        const result = markers.map(marker => {
            const parts = marker.region.split(' ');
            const province = parts[0];
            let coords = RegionCoordinates[marker.region] || RegionCoordinates[province];

            if (!coords) {
                console.log(`Failed to find coordinates for region: "${marker.region}"`);
                return null;
            }

            let finalCoords: [number, number] = coords;
            if (parts.length > 1) {
                const hash = marker.region.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const offsetLng = ((hash % 100) - 50) / 100 * 0.5;
                const offsetLat = ((hash % 73) - 36) / 100 * 0.3;
                finalCoords = [coords[0] + offsetLng, coords[1] + offsetLat];
            }

            const [x, y] = projection(finalCoords) || [0, 0];
            return {
                ...marker,
                x,
                y,
                emoji: EmotionIcons[marker.emotion] || '😐',
            };
        }).filter(Boolean) as { region: string; emotion: EmotionType; count: number; x: number; y: number; emoji: string }[];

        console.log(`Successfully projected ${result.length} markers`);
        return result;
    }, [markers, projection]);

    // Calculate region centroids for labels
    const regionCentroids = useMemo(() => {
        return geography.map(geo => {
            const centroid = d3.geoCentroid(geo);
            const [x, y] = projection(centroid) || [0, 0];
            const name = geo.properties.name || geo.properties.NAME_1 || '';
            return { name: normalizeRegionName(name), x, y };
        });
    }, [geography, projection]);

    // Calculate marker size based on zoom (inverse scaling)
    const markerScale = useMemo(() => {
        return Math.max(0.4, 1 / Math.sqrt(currentZoom));
    }, [currentZoom]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#A8A29E" />
            </View>
        );
    }

    return (
        <View style={{ width, height, backgroundColor: '#111827' }}>
            {/* Background Map */}
            <Svg width={width} height={height} style={{ position: 'absolute' }}>
                <G>
                    {geography.map((geo, index) => {
                        const provinceName = geo.properties.name || geo.properties.NAME_1 || '';
                        const normalizedName = normalizeRegionName(provinceName);
                        const fillColor = regionColors[normalizedName] || '#374151';
                        const d = pathGenerator(geo);

                        if (!d) return null;

                        return (
                            <Path
                                key={geo.properties.code || index}
                                d={d}
                                fill={fillColor}
                                stroke="#1F2937"
                                strokeWidth={1}
                                onPress={() => onRegionClick?.(normalizedName)}
                            />
                        );
                    })}
                </G>

                {/* Region Labels */}
                <G>
                    {regionCentroids.map((region, index) => {
                        let yOffset = 0;
                        if (region.name === '경기' || region.name === '경기도') yOffset = 30;
                        if (region.name === '충남' || region.name === '충청남도') yOffset = 25;

                        return (
                            <SvgText
                                key={`label-${index}`}
                                x={region.x}
                                y={region.y + yOffset}
                                fontSize={10}
                                fill="rgba(255,255,255,0.7)"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {region.name}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>

            {/* Foreground Markers - Overlay as Views for buttery-smooth animation */}
            <View style={{ position: 'absolute', width, height }}>
                {projectedMarkers.map((marker, index) => (
                    <AnimatedMarker
                        key={`marker-${marker.region}-${index}`}
                        marker={marker}
                        markerScale={markerScale}
                        onMarkerClick={onMarkerClick!}
                    />
                ))}
            </View>
        </View>
    );
}
