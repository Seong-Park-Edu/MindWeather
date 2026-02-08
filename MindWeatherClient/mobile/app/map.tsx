import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KoreaMap, { normalizeRegionName } from '../components/KoreaMap';
import { ComfortModal } from '../components/ComfortModal';
import { getEmotionsForMap } from '../services/api';
import { EmotionResponse, EmotionType, EmotionColors, EmotionLabels, EmotionIcons } from '../types/emotion';

interface MarkerData {
    region: string;
    emotion: EmotionType;
    count: number;
}

interface RegionCluster {
    region: string;
    emotions: EmotionResponse[];
    dominantEmotion: EmotionType;
    avgIntensity: number;
}

export default function MapScreen() {
    const router = useRouter();
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedCluster, setSelectedCluster] = useState<RegionCluster | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Map Viewport state
    const [mapPosition, setMapPosition] = useState({
        zoom: 1,
        center: [127.8, 36.0] as [number, number]
    });

    const fetchData = useCallback(async () => {
        try {
            const data = await getEmotionsForMap();
            setEmotions(data);
        } catch (error) {
            console.error('Failed to fetch map data', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Derived state: Clustering level based on zoom or selection
    const clusterLevel = useMemo(() => {
        console.log('[MapScreen] Selection:', selectedRegion);
        return selectedRegion ? 2 : 1;
    }, [selectedRegion]);

    // Compute region colors and markers from emotions data
    const { regionColors, markers } = useMemo(() => {
        const colors: Record<string, string> = {};
        const markerMap = new Map<string, { emotion: EmotionType; count: number }>();

        emotions.forEach(item => {
            const parts = item.region.split(' ');
            const province = parts[0];
            const district = parts[1] ? `${province} ${parts[1]}` : province;

            const normalizedProvince = normalizeRegionName(province);
            const normalizedDistrict = normalizeRegionName(district);

            // Filling strategy:
            // macro view -> province colors
            // micro view -> district colors if mapped
            if (clusterLevel === 1) {
                if (!colors[normalizedProvince]) {
                    colors[normalizedProvince] = EmotionColors[item.emotion];
                }

                const existing = markerMap.get(normalizedProvince);
                if (existing) {
                    existing.count += 1;
                } else {
                    markerMap.set(normalizedProvince, { emotion: item.emotion, count: 1 });
                }
            } else {
                // Micro view (District level)
                if (!colors[normalizedDistrict]) {
                    colors[normalizedDistrict] = EmotionColors[item.emotion];
                }

                const existing = markerMap.get(normalizedDistrict);
                if (existing) {
                    existing.count += 1;
                } else {
                    markerMap.set(normalizedDistrict, { emotion: item.emotion, count: 1 });
                }
            }
        });

        const markerData: MarkerData[] = [];
        markerMap.forEach((value, key) => {
            markerData.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
            });
        });

        return { regionColors: colors, markers: markerData };
    }, [emotions, clusterLevel]);

    const handleRegionClick = (regionName: string, coords: [number, number]) => {
        console.log('[MapScreen] Region clicked:', regionName);
        setSelectedRegion(regionName);
        setMapPosition({
            zoom: 1.8,
            center: coords
        });
    };

    const resetZoom = () => {
        console.log('[MapScreen] Resetting zoom');
        setSelectedRegion(null);
        setMapPosition({
            zoom: 1,
            center: [127.8, 36.0]
        });
    };

    // Handle marker click - open ComfortModal
    const handleMarkerClick = (marker: MarkerData) => {
        const regionEmotions = emotions.filter(e => {
            const normalized = normalizeRegionName(e.region);
            return normalized === marker.region || normalized.startsWith(marker.region);
        });

        if (regionEmotions.length === 0) return;

        // Calculate average intensity
        const totalIntensity = regionEmotions.reduce((sum, e) => sum + e.intensity, 0);
        const avgIntensity = Math.round(totalIntensity / regionEmotions.length);

        const cluster: RegionCluster = {
            region: marker.region,
            emotions: regionEmotions,
            dominantEmotion: marker.emotion,
            avgIntensity,
        };

        setSelectedCluster(cluster);
        setShowModal(true);
    };

    const selectedEmotionData = useMemo(() => {
        if (!selectedRegion) return null;
        return emotions.find(e => normalizeRegionName(e.region) === selectedRegion);
    }, [selectedRegion, emotions]);

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView edges={['top']} className="bg-gray-900 z-10">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Emotion Map</Text>
                    <TouchableOpacity onPress={onRefresh}>
                        <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View className="flex-1 relative">
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="purple" />
                    </View>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <KoreaMap
                            onRegionClick={handleRegionClick}
                            onMarkerClick={handleMarkerClick}
                            regionColors={regionColors}
                            markers={markers}
                            selectedRegion={selectedRegion}
                            currentZoom={mapPosition.zoom}
                        />

                        {/* Reset Zoom Button */}
                        {selectedRegion && (
                            <TouchableOpacity
                                onPress={resetZoom}
                                className="absolute bottom-10 left-6 bg-purple-600 px-4 py-2 rounded-full shadow-lg border border-purple-400"
                            >
                                <View className="flex-row items-center gap-2">
                                    <Ionicons name="contract" size={18} color="white" />
                                    <Text className="text-white font-bold">전체 지도로</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {selectedRegion && (
                            <View className="absolute bottom-10 right-6 bg-gray-800/90 p-4 rounded-xl border border-gray-700 shadow-xl">
                                <Text className="text-white text-lg font-bold mb-1">{selectedRegion}</Text>
                                {selectedEmotionData ? (
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-2xl">
                                            {EmotionIcons[selectedEmotionData.emotion]}
                                        </Text>
                                        <Text className="text-gray-300">
                                            {EmotionLabels[selectedEmotionData.emotion]}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text className="text-gray-500">No data today</Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Comfort Modal */}
            <ComfortModal
                visible={showModal}
                cluster={selectedCluster}
                onClose={() => {
                    setShowModal(false);
                    setSelectedCluster(null);
                }}
            />
        </View>
    );
}
