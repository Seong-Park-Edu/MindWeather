import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Dimensions, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
import { useTheme, themes } from '../contexts/ThemeContext';

const GEO_URL_PROVINCE = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json';
const GEO_URL_MUNICIPALITY = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json';

// Mapping provinces to their statistical codes (first 2 digits)
export const PROVINCE_CODES: Record<string, string> = {
    '서울': '11', '부산': '21', '대구': '22', '인천': '23', '광주': '24',
    '대전': '25', '울산': '26', '세종': '29', '경기': '31', '강원': '32',
    '충북': '33', '충남': '34', '전북': '35', '전남': '36', '경북': '37',
    '경남': '38', '제주': '39',
};

// Korean to English Translation Map
export const REGION_TRANSLATION: Record<string, string> = {
    '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon',
    '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong',
    '경기': 'Gyeonggi-do', '강원': 'Gangwon-do', '충북': 'Chungcheongbuk-do',
    '충남': 'Chungcheongnam-do', '전북': 'Jeollabuk-do', '전남': 'Jeollanam-do',
    '경북': 'Gyeongsangbuk-do', '경남': 'Gyeongsangnam-do', '제주': 'Jeju-do',
};

export const REGION_TRANSLATION_REVERSE: Record<string, string> = Object.fromEntries(
    Object.entries(REGION_TRANSLATION).map(([k, v]) => [v, k])
);

// Fallback coordinates for markers
export const RegionCoordinates: Record<string, [number, number]> = {
    '서울': [126.978, 37.566], '부산': [129.075, 35.180], '대구': [128.602, 35.871],
    '인천': [126.705, 37.456], '광주': [126.852, 35.160], '대전': [127.385, 36.351],
    '울산': [129.311, 35.539], '세종': [127.289, 36.480], '경기': [127.018, 37.275],
    '강원': [128.312, 37.555], '충북': [127.491, 36.628], '충남': [126.800, 36.518],
    '전북': [127.108, 35.716], '전남': [126.463, 34.816], '경북': [128.888, 36.249],
    '경남': [128.242, 35.238], '제주': [126.498, 33.489],
};

export function normalizeRegionName(name: string): string {
    if (!name) return name;
    name = name.trim();
    if (Object.values(REGION_TRANSLATION).includes(name)) return REGION_TRANSLATION_REVERSE[name] || name;
    if (REGION_TRANSLATION_REVERSE[name]) return REGION_TRANSLATION_REVERSE[name];
    if (DISTRICT_TRANSLATION[name]) return DISTRICT_TRANSLATION[name];

    // Case-insensitive check for districts
    const lowerName = name.toLowerCase();
    const matchedDistrict = Object.keys(DISTRICT_TRANSLATION).find(k => k.toLowerCase() === lowerName);
    if (matchedDistrict) return DISTRICT_TRANSLATION[matchedDistrict];

    let normalized = name.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
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
    type?: 'province' | 'district';
    provinceName?: string;
}

interface KoreaMapProps {
    onRegionClick?: (regionName: string, coords: [number, number]) => void;
    onMarkerClick?: (marker: MarkerData) => void;
    regionColors?: Record<string, string>;
    markers?: MarkerData[];
    selectedRegion: string | null;
    currentZoom?: number;
}

const AnimatedMarker = ({ marker, markerScale, onMarkerClick, accentColor }: { marker: any, markerScale: number, onMarkerClick: (m: any) => void, accentColor: string }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacityVal = useSharedValue(1);

    useEffect(() => {
        scale.value = 1; translateY.value = 0; translateX.value = 0; opacityVal.value = 1;

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
                translateX.value = withRepeat(withSequence(withTiming(2, { duration: 100 }), withTiming(-2, { duration: 100 })), -1, true);
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
            <TouchableOpacity onPress={() => onMarkerClick?.(marker)} activeOpacity={0.7} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, opacity: marker.type === 'district' ? 0.6 : 1 }}>{marker.emoji}</Text>
                {marker.count > 1 && (
                    <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: accentColor, borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{marker.count}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const KoreaMap = ({
    onRegionClick,
    onMarkerClick,
    regionColors = {},
    markers = [],
    selectedRegion = null,
    currentZoom = 1
}: KoreaMapProps) => {
    const { theme } = useTheme();
    const colors = themes[theme];

    // Separate states for datasets to allow synchronous switching
    const [provinceGeo, setProvinceGeo] = useState<any[]>([]);
    const [municipalityGeo, setMunicipalityGeo] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { width } = Dimensions.get('window');
    const height = width * 1.5;

    // Load BOTH datasets on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Provinces
                const provRes = await fetch(GEO_URL_PROVINCE);
                const provTopo = await provRes.json();
                const provFeatures = (topojson.feature(provTopo, provTopo.objects['skorea_provinces_2018_geo'] as any) as any).features;
                setProvinceGeo(provFeatures);

                // Load Municipalities
                const muniRes = await fetch(GEO_URL_MUNICIPALITY);
                const muniTopo = await muniRes.json();
                const muniFeatures = (topojson.feature(muniTopo, muniTopo.objects['skorea_municipalities_2018_geo'] as any) as any).features;
                setMunicipalityGeo(muniFeatures);
            } catch (error) {
                console.error('[KoreaMap] Data loading error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Synchronously derive the correct features to render
    const filteredGeography = useMemo(() => {
        if (loading) return [];

        if (selectedRegion) {
            // Detailed View: Filter Municipalities by Selected Province
            const regionCode = PROVINCE_CODES[selectedRegion];
            if (!regionCode) return municipalityGeo; // Fallback

            return municipalityGeo.filter(geo => {
                const code = geo.properties.code || '';
                return code.startsWith(regionCode);
            });
        } else {
            // Macro View: Show All Provinces
            return provinceGeo;
        }
    }, [selectedRegion, provinceGeo, municipalityGeo, loading]);

    const featureGroup = useMemo(() => {
        return { type: 'FeatureCollection', features: filteredGeography } as any;
    }, [filteredGeography]);

    const projection = useMemo(() => {
        const proj = d3.geoMercator();

        if (selectedRegion && featureGroup.features.length > 0) {
            // Zoom into selected region using fitExtent
            const padding = 40;
            proj.fitExtent(
                [[padding, padding], [width - padding, height - padding]],
                featureGroup
            );
        } else {
            // Default view for entire Korea
            proj.center([127.8, 36.0])
                .scale(8500 * (width / 800))
                .translate([width / 2, height / 2]);
        }

        return proj;
    }, [width, height, featureGroup, selectedRegion]);

    const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

    const projectedMarkers = useMemo(() => {
        return markers.filter(m => {
            if (!selectedRegion) {
                return m.type === 'province' || !m.type;
            } else {
                return m.type === 'district' && m.provinceName === selectedRegion;
            }
        }).map(marker => {
            // Try to find accurate centroid from geometry first
            let finalCoords: [number, number] | null = null;

            if (selectedRegion && marker.type === 'district') {
                // Find matching feature in filteredGeography
                const districtName = marker.region.split(' ')[1] || marker.region; // "서울 종로구" -> "종로구"
                const normalizedDistrict = normalizeRegionName(districtName);

                const matchedGeo = filteredGeography.find(geo => {
                    const props = geo.properties || {};
                    const name = props.name || props.name_eng || props.name_kor || '';
                    return normalizeRegionName(name) === normalizedDistrict;
                });

                if (matchedGeo) {
                    finalCoords = d3.geoCentroid(matchedGeo);
                }
            }

            // Fallback to static coordinates or offset
            if (!finalCoords) {
                const parts = marker.region.split(' ');
                const province = parts[0];
                let coords = RegionCoordinates[marker.region] || RegionCoordinates[province];
                if (!coords) return null;

                finalCoords = coords;
                if (parts.length > 1) {
                    const hash = marker.region.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                    const offsetLng = ((hash % 100) - 50) / 100 * 0.1;
                    const offsetLat = ((hash % 73) - 36) / 100 * 0.1;
                    finalCoords = [coords[0] + offsetLng, coords[1] + offsetLat];
                }
            }

            const [x, y] = projection(finalCoords) || [0, 0];
            return { ...marker, x, y, emoji: EmotionIcons[marker.emotion] || '😐' };
        }).filter(Boolean) as any[];
    }, [markers, projection, selectedRegion, filteredGeography]);

    const regionCentroids = useMemo(() => {
        return filteredGeography.map(geo => {
            const centroid = d3.geoCentroid(geo);
            const [x, y] = projection(centroid) || [0, 0];
            const name = geo.properties.name || '';
            return { name: normalizeRegionName(name), x, y };
        });
    }, [filteredGeography, projection]);

    return (
        <View style={{ width, height, backgroundColor: colors.bg.primary }}>
            <Svg width={width} height={height} pointerEvents="box-none">
                <G pointerEvents="auto">
                    {filteredGeography.map((geo, index) => {
                        const props = geo.properties || {};
                        const name = props.name || props.name_eng || props.name_kor || '';
                        const normalizedName = normalizeRegionName(name);

                        const fillColor = regionColors[normalizedName] || colors.bg.secondary;
                        const d = pathGenerator(geo);
                        if (!d) return null;

                        return (
                            <Path
                                key={`${geo.properties.code || index}-${selectedRegion}`}
                                d={d}
                                fill={fillColor}
                                stroke={colors.border}
                                strokeWidth={selectedRegion ? 2 : 1}
                                onPress={() => {
                                    const centroid = d3.geoCentroid(geo);
                                    const [x, y] = projection(centroid) || [width / 2, height / 2];
                                    onRegionClick?.(normalizedName, [x, y]);
                                }}
                            />
                        );
                    })}
                </G>

                <G pointerEvents="none">
                    {regionCentroids.map((region, index) => {
                        if (selectedRegion && regionCentroids.length > 30 && index % 2 !== 0) return null;

                        return (
                            <SvgText
                                key={`label-${index}-${region.name}`}
                                x={region.x}
                                y={region.y}
                                fontSize={selectedRegion ? 10 : 12}
                                fill={colors.text.primary}
                                fillOpacity={0.7}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {region.name}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {projectedMarkers.map((marker, index) => (
                    <AnimatedMarker
                        key={`marker-${marker.region}-${index}`}
                        marker={marker}
                        markerScale={(selectedRegion ? 1.5 : 1.0) * (1 / currentZoom)}
                        onMarkerClick={onMarkerClick!}
                        accentColor={colors.accent.secondary}
                    />
                ))}
            </View>

            {loading && (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary + 'AF' }]}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
            )}
        </View>
    );
};

export default React.memo(KoreaMap);
