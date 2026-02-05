import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
    Marker,
} from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import {
    EmotionType,
    type EmotionResponse,
    EmotionColors,
} from '../types/emotion';
import { getEmotionsForMap } from '../services/api';
import { WeatherIcon } from './weather/WeatherIcon';
import { ComfortModal } from './ComfortModal';
import { RegionCoordinates, normalizeRegionName } from './KoreaMap';
import { DISTRICT_TRANSLATION } from '../utils/koreaDistricts';

// TopoJSON URL for South Korea provinces (Macro view)
const GEO_URL_PROVINCE = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json';
// TopoJSON URL for South Korea municipalities (Detailed view - ~600KB)
const GEO_URL_MUNICIPALITY = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json';

// Zoom level thresholds for different clustering levels
const ZOOM_LEVEL = {
    PROVINCE: 2,    // zoom < 2: 시/도 단위
    DISTRICT: 4,    // zoom 2-4: 구/군 단위
    NEIGHBORHOOD: 6 // zoom > 4: 읍/면/동 단위
};

// Parsed address structure
interface ParsedAddress {
    level1: string; // 시/도 (서울특별시, 경기도)
    level2: string; // 구/군 (강남구, 수원시)
    level3: string; // 읍/면/동 (역삼1동)
    full: string;   // 전체 주소
}

interface RegionCluster {
    region: string;
    displayName: string; // 현재 줌 레벨에서 표시할 이름
    emotions: EmotionResponse[];
    dominantEmotion: EmotionType;
    avgIntensity: number;
    coordinates: [number, number];
    level: 1 | 2 | 3; // 클러스터 레벨
}

import { useSignalR } from '../contexts/SignalRContext';

export function MapView() {
    const { latestEmotion } = useSignalR();
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [clusters, setClusters] = useState<RegionCluster[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<RegionCluster | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [mapPosition, setMapPosition] = useState({ zoom: 1, center: [127.8, 36.0] as [number, number] });

    // Sync currentZoom with mapPosition.zoom for other logic
    useEffect(() => {
        setCurrentZoom(mapPosition.zoom);
    }, [mapPosition.zoom]);

    // Handle Real-time updates
    useEffect(() => {
        if (latestEmotion) {
            console.log("Live update received in MapView", latestEmotion);
            setEmotions(prev => {
                // Prevent duplicates if needed, though rare with unique timestamps
                // Just prepend
                return [...prev, latestEmotion];
            });
        }
    }, [latestEmotion]);

    // Determine current clustering level based on zoom
    const clusterLevel = useMemo(() => {
        if (currentZoom < ZOOM_LEVEL.PROVINCE) return 1; // 시/도
        if (currentZoom < ZOOM_LEVEL.DISTRICT) return 2; // 구/군
        return 3; // 읍/면/동
    }, [currentZoom]);

    // Parse address into 3 levels
    const parseAddress = useCallback((region: string): ParsedAddress => {
        const parts = region.split(' ').filter(Boolean);
        return {
            level1: parts[0] || '알 수 없음', // 서울특별시
            level2: parts[1] || '',           // 강남구
            level3: parts[2] || '',           // 역삼1동
            full: region
        };
    }, []);

    // Load emotions from API
    useEffect(() => {
        const loadEmotions = async () => {
            try {
                const data = await getEmotionsForMap();
                setEmotions(data);
            } catch (error) {
                console.error('Failed to load emotions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEmotions();
        // Keep polling as backup, but maybe less frequent?
        const interval = setInterval(loadEmotions, 30000);
        return () => clearInterval(interval);
    }, []);

    // Recalculate clusters when emotions or zoom level changes
    useEffect(() => {
        if (emotions.length === 0) return;

        // Group by current clustering level
        const clusterMap = new Map<string, { emotions: EmotionResponse[], parsed: ParsedAddress[] }>();

        emotions.forEach((e) => {
            const parsed = parseAddress(e.region);

            // Determine cluster key based on level
            let clusterKey: string;
            if (clusterLevel === 1) {
                clusterKey = normalizeRegionName(parsed.level1);
            } else if (clusterLevel === 2) {
                clusterKey = `${normalizeRegionName(parsed.level1)}_${parsed.level2}`;
            } else {
                clusterKey = `${normalizeRegionName(parsed.level1)}_${parsed.level2}_${parsed.level3}`;
            }

            const existing = clusterMap.get(clusterKey) || { emotions: [], parsed: [] };
            clusterMap.set(clusterKey, {
                emotions: [...existing.emotions, e],
                parsed: [...existing.parsed, parsed]
            });
        });

        // Build clusters
        const newClusters: RegionCluster[] = [];

        clusterMap.forEach((data, key) => {
            const { emotions: clusterEmotions, parsed } = data;
            const firstParsed = parsed[0];

            // Get display name based on level
            let displayName: string;
            if (clusterLevel === 1) {
                displayName = firstParsed.level1;
            } else if (clusterLevel === 2) {
                displayName = firstParsed.level2 || firstParsed.level1;
            } else {
                displayName = firstParsed.level3 || firstParsed.level2 || firstParsed.level1;
            }

            // Get base coordinates (시/도 level)
            const baseRegion = normalizeRegionName(firstParsed.level1);
            const baseCoords = RegionCoordinates[baseRegion];
            if (!baseCoords) return;

            // Calculate offset for sub-regions
            let coords: [number, number];
            if (clusterLevel === 1) {
                coords = baseCoords;
            } else {
                // Add deterministic offset based on cluster key hash
                const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const offsetLng = ((hash % 100) - 50) / 100 * 0.5;
                const offsetLat = ((hash % 73) - 36) / 100 * 0.3;
                coords = [baseCoords[0] + offsetLng, baseCoords[1] + offsetLat];
            }

            // Find dominant emotion
            const emotionStats = new Map<EmotionType, { count: number, totalIntensity: number }>();
            let clusterTotalIntensity = 0;

            clusterEmotions.forEach((e) => {
                const current = emotionStats.get(e.emotion) || { count: 0, totalIntensity: 0 };
                emotionStats.set(e.emotion, {
                    count: current.count + 1,
                    totalIntensity: current.totalIntensity + e.intensity
                });
                clusterTotalIntensity += e.intensity;
            });

            let dominantEmotion: EmotionType | null = null;
            let maxCount = -1;
            let maxIntensity = -1;

            emotionStats.forEach((stat, emotion) => {
                // Priority: 1. Count, 2. Intensity
                if (stat.count > maxCount) {
                    maxCount = stat.count;
                    maxIntensity = stat.totalIntensity;
                    dominantEmotion = emotion;
                } else if (stat.count === maxCount) {
                    // Tie-breaking: choose the one with higher total intensity
                    if (stat.totalIntensity > maxIntensity) {
                        maxIntensity = stat.totalIntensity;
                        dominantEmotion = emotion;
                    }
                }
            });

            // Fallback if map is empty (rare)
            if (dominantEmotion === null) dominantEmotion = EmotionType.Calm;

            if (dominantEmotion === EmotionType.Calm && maxCount === -1) {
                console.log('No dominant found for', key);
            }

            console.log(`[Cluster Debug] Region: ${key}, Total: ${clusterEmotions.length}, Dominant: ${dominantEmotion} (${maxCount})`);

            newClusters.push({
                region: key,
                displayName,
                emotions: clusterEmotions,
                dominantEmotion,
                avgIntensity: Math.round(clusterTotalIntensity / clusterEmotions.length),
                coordinates: coords,
                level: clusterLevel as 1 | 2 | 3
            });
        });

        setClusters(newClusters);
    }, [emotions, clusterLevel, parseAddress]);

    // Get zoom level label
    const getZoomLabel = useCallback(() => {
        if (clusterLevel === 1) return '🗺️ 시/도 단위';
        if (clusterLevel === 2) return '🏙️ 구/군 단위';
        return '🏘️ 읍/면/동 단위';
    }, [clusterLevel]);

    // Calculate marker size based on zoom (smaller when zoomed in)
    const markerSize = useMemo(() => {
        // Base size 60, scales down to 30 at max zoom
        const baseSize = 60;
        const minSize = 25;
        const scale = Math.max(minSize, baseSize / Math.sqrt(currentZoom));
        return Math.round(scale);
    }, [currentZoom]);

    // Handle region click to zoom in
    const handleRegionClick = useCallback((geo: any) => {
        const regionName = geo.properties.name || geo.properties.NAME_1;
        if (!regionName) return;

        const normalizedName = normalizeRegionName(regionName);
        const coords = RegionCoordinates[normalizedName];

        if (coords) {
            // Zoom in to the region
            setMapPosition({
                zoom: 4, // Zoom level to show districts
                center: coords,
            });
        }
    }, []);

    // Handle cluster click
    const handleClusterClick = useCallback((cluster: RegionCluster) => {
        // If it's a macro view, zoom in to that region
        if (clusterLevel === 1) {
            setMapPosition({
                zoom: 4,
                center: cluster.coordinates
            });
        }
        setSelectedCluster(cluster);
    }, [clusterLevel]);

    // Select map data based on zoom level
    const geoUrl = currentZoom >= ZOOM_LEVEL.PROVINCE ? GEO_URL_MUNICIPALITY : GEO_URL_PROVINCE;

    return (
        <div className="relative w-full h-full min-h-[600px]">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 rounded-2xl overflow-hidden">
                {/* Animated background clouds */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-32 h-16 bg-white/5 rounded-full blur-xl"
                        initial={{ x: -200 }}
                        animate={{ x: '120%' }}
                        transition={{
                            duration: 20 + i * 5,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 3,
                        }}
                        style={{ top: `${10 + i * 15}%` }}
                    />
                ))}
            </div>

            {/* Map container */}
            <div className="relative w-full h-full glass rounded-2xl overflow-hidden">
                {/* Header */}
                {/* Header removed to avoid overlap with App Header */
                }

                {/* Zoom Controls Hint - Moved to bottom left */}
                <div className="absolute bottom-20 left-6 z-20 bg-black/50 text-white/60 text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10 pointer-events-none">
                    🔍 지도 클릭 시 확대 | 줌: {getZoomLabel()} ({currentZoom.toFixed(1)}x)
                </div>

                {/* Main Map with react-simple-maps */}
                {/* Main Map with react-simple-maps */}
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 5500,
                        center: [127.8, 36.0],
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <ZoomableGroup
                        zoom={mapPosition.zoom}
                        center={mapPosition.center}
                        minZoom={0.8}
                        maxZoom={12}
                        onMoveEnd={({ zoom, coordinates }) => {
                            setMapPosition({ zoom, center: coordinates as [number, number] });
                        }}
                    >
                        {/* Korea Province/Municipality Boundaries */}
                        <Geographies geography={geoUrl}>
                            {({ geographies }) => {
                                // Prepare cluster lookup map for performance
                                const clusterMap = new Map<string, RegionCluster>();
                                if (currentZoom > 3.5) {
                                    // Helper Set for valid district names
                                    const validDistricts = new Set(Object.values(DISTRICT_TRANSLATION));

                                    // Aggregation Map: District Name -> All Emotions in that district
                                    // Aggregation Map: District Name -> { emotions: EmotionResponse[], coordinates: [number, number] }
                                    const aggMap = new Map<string, { emotions: EmotionResponse[], coordinates: [number, number] }>();

                                    clusters.forEach(c => {
                                        let districtName = '';

                                        // 1. Try to find a valid district name in the region string
                                        // "Seoul Yongsan-gu Hangang-ro" -> "Yongsan-gu" found in values? No, values are Korean "용산구"
                                        // c.region is Korean: "서울 용산구 한강로동" -> "용산구" found in Set? YES.
                                        const tokens = c.region.split(/[\s_]+/);
                                        const found = tokens.find(t => validDistricts.has(t));

                                        if (found) {
                                            districtName = found;
                                        } else {
                                            // Fallback: splitting logic for Level 2
                                            let keyName = c.displayName;
                                            if (keyName.includes('_')) {
                                                const parts = keyName.split('_');
                                                keyName = parts[parts.length - 1];
                                            } else if (keyName.includes(' ')) {
                                                const parts = keyName.split(' ');
                                                keyName = parts[parts.length - 1];
                                            }
                                            districtName = keyName;
                                        }

                                        if (districtName) {
                                            const existing = aggMap.get(districtName);
                                            if (existing) {
                                                existing.emotions.push(...c.emotions);
                                            } else {
                                                aggMap.set(districtName, {
                                                    emotions: [...c.emotions],
                                                    coordinates: c.coordinates // Save coordinates from the first match
                                                });
                                            }
                                        }
                                    });

                                    // 2. Convert aggregated data to clusterMap
                                    aggMap.forEach((data, key) => {
                                        const ctxEmotions = data.emotions;
                                        // Calculate Dominant Emotion
                                        const stats = new Map<EmotionType, number>();
                                        let maxCount = -1;
                                        let dominant: EmotionType = EmotionType.Calm;

                                        ctxEmotions.forEach(e => {
                                            const count = (stats.get(e.emotion) || 0) + 1;
                                            stats.set(e.emotion, count);
                                            if (count > maxCount) {
                                                maxCount = count;
                                                dominant = e.emotion;
                                            }
                                        });

                                        // Create a synthetic cluster for the view
                                        clusterMap.set(normalizeRegionName(key), {
                                            region: key,
                                            displayName: key,
                                            emotions: ctxEmotions,
                                            dominantEmotion: dominant,
                                            avgIntensity: 0,
                                            coordinates: data.coordinates, // Use preserved coordinates
                                            level: 2,
                                        });
                                    });
                                }

                                return (
                                    <>
                                        {geographies.map((geo) => {
                                            const geoName = geo.properties.name || geo.properties.NAME_1;
                                            const normalizedName = normalizeRegionName(geoName);
                                            const matchedCluster = clusterMap.get(normalizedName);

                                            // Determine fill color
                                            let fillColor = '#1e293b'; // slate-800 for uncolored regions (Dark theme)
                                            let strokeColor = '#475569'; // slate-600
                                            let hoverColor = '#334155'; // slate-700

                                            if (matchedCluster) {
                                                const emotionColor = EmotionColors[matchedCluster.dominantEmotion];
                                                // Add transparency to the color
                                                fillColor = emotionColor + '99'; // ~60% opacity
                                                hoverColor = emotionColor + 'CC'; // ~80% opacity
                                                strokeColor = 'rgba(255,255,255,0.3)';
                                            }

                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    onClick={() => {
                                                        if (matchedCluster) {
                                                            // Open modal directly if in Choropleth mode
                                                            setSelectedCluster(matchedCluster);
                                                        } else {
                                                            // Zoom logic
                                                            handleRegionClick(geo);
                                                        }
                                                    }}
                                                    style={{
                                                        default: {
                                                            fill: fillColor,
                                                            stroke: strokeColor,
                                                            strokeWidth: 0.5,
                                                            outline: 'none',
                                                            transition: 'all 0.3s ease',
                                                            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
                                                        },
                                                        hover: {
                                                            fill: hoverColor,
                                                            stroke: '#94a3b8',
                                                            strokeWidth: 1,
                                                            outline: 'none',
                                                            cursor: matchedCluster ? 'pointer' : 'default',
                                                            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))',
                                                        },
                                                        pressed: {
                                                            fill: matchedCluster ? hoverColor : '#334155',
                                                            stroke: '#ffffff',
                                                            strokeWidth: 1,
                                                            outline: 'none',
                                                        },
                                                    }}
                                                />
                                            );
                                        })}
                                        {/* Region Labels (Zoom >= 4) - ALL Regions */}
                                        {currentZoom >= 4 && geographies.map((geo) => {
                                            const centroid = geoCentroid(geo);
                                            const geoName = geo.properties.name || geo.properties.NAME_1;
                                            const displayName = normalizeRegionName(geoName);
                                            // Check if we have cluster data for this region to potentially style differently (optional)
                                            // const hasData = clusterMap.has(displayName);

                                            return (
                                                <Marker key={`label-all-${geo.rsmKey}`} coordinates={centroid}>
                                                    <text
                                                        textAnchor="middle"
                                                        y={2}
                                                        style={{
                                                            fontFamily: 'Pretendard, system-ui, sans-serif',
                                                            // Calculate font size inversely proportional to zoom to keep it manageable
                                                            // At zoom 4: ~3px, At zoom 10: ~1.2px (in map units)
                                                            fontSize: `${Math.max(0.8, 12 / currentZoom)}px`,
                                                            fill: 'white',
                                                            fontWeight: 500,
                                                            pointerEvents: 'none',
                                                            textShadow: '0 0 2px rgba(0,0,0,0.8)'
                                                        }}
                                                    >
                                                        {displayName}
                                                    </text>
                                                </Marker>
                                            );
                                        })}
                                    </>
                                );
                            }}
                        </Geographies>

                        {/* Dynamic Clusters based on zoom level - Hide when in Choropleth mode */}
                        <AnimatePresence>
                            {currentZoom <= 3.5 && clusters.map((cluster) => (
                                <Marker
                                    key={`cluster-${cluster.region}`}
                                    coordinates={cluster.coordinates}
                                >
                                    <motion.g
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => handleClusterClick(cluster)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <foreignObject
                                            x={-markerSize / 2}
                                            y={-markerSize / 2}
                                            width={markerSize}
                                            height={markerSize}
                                        >
                                            <div className="w-full h-full flex items-center justify-center">
                                                <WeatherIcon
                                                    emotion={cluster.dominantEmotion}
                                                    intensity={cluster.avgIntensity}
                                                    region={cluster.displayName}
                                                    size={markerSize}
                                                />
                                            </div>
                                        </foreignObject>
                                        {/* Count badge - scaled with marker */}
                                        {cluster.emotions.length > 1 && (
                                            <g transform={`translate(${markerSize / 2}, ${-markerSize / 2})`}>
                                                <circle r={Math.max(6, markerSize / 6)} fill="#8B5CF6" />
                                                <text
                                                    textAnchor="middle"
                                                    y={markerSize / 18}
                                                    fontSize={Math.max(6, markerSize / 6)}
                                                    fill="white"
                                                    fontWeight="bold"
                                                >
                                                    {cluster.emotions.length}
                                                </text>
                                            </g>
                                        )}
                                    </motion.g>
                                </Marker>
                            ))}
                        </AnimatePresence>
                    </ZoomableGroup>
                </ComposableMap>

                {/* Empty state overlay */}
                {!isLoading && clusters.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10 pointer-events-none">
                        <div className="text-center bg-black/40 backdrop-blur-sm p-6 rounded-xl">
                            <span className="text-4xl block mb-2">🌤️</span>
                            <p className="text-white">아직 기록된 마음이 없습니다</p>
                            <p className="text-sm text-white/60">첫 번째로 마음을 나눠보세요!</p>
                        </div>
                    </div>
                )}

                {/* Loading spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"
                        />
                    </div>
                )}
            </div>

            {/* Comfort Modal */}
            <AnimatePresence>
                {selectedCluster && (
                    <ComfortModal
                        cluster={selectedCluster}
                        onClose={() => setSelectedCluster(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
