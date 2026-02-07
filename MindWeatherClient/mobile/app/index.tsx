import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// 

// Components
import { Header } from '../components/Header';
import { Ticker } from '../components/Ticker';
import KoreaMap, { normalizeRegionName } from '../components/KoreaMap';
import { ComfortModal } from '../components/ComfortModal';
import { InboxModal } from '../components/InboxModal';
import { EmotionInputModal } from '../components/EmotionInputModal';
import BackgroundMusic from '../components/BackgroundMusic';

// Services & Types
import { getEmotionsForMap } from '../services/api';
import { EmotionResponse, EmotionType, EmotionColors, IsNegativeEmotion } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';

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

export default function MainScreen() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Data state
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showEmotionInput, setShowEmotionInput] = useState(false);
    const [showComfortModal, setShowComfortModal] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<RegionCluster | null>(null);

    // Fetch map data
    const fetchData = useCallback(async () => {
        try {
            console.log('--- Fetching Map Data ---');
            const data = await getEmotionsForMap();
            console.log(`Received ${data.length} emotions from server`);
            if (data.length > 0) {
                console.log('First emotion sample:', data[0]);
            }
            setEmotions(data);
        } catch (error) {
            console.error('Failed to fetch map data', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refresh when route is focused
    // Use router focus to refresh data (especially after generating dummy data)
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Compute markers and colors from emotions
    const { regionColors, markers, dominantEmotion } = useMemo(() => {
        const colors: Record<string, string> = {};
        const markerMap = new Map<string, { emotion: EmotionType; count: number }>();
        const emotionCounts: Record<number, number> = {};

        emotions.forEach(item => {
            const normalizedRegion = normalizeRegionName(item.region);

            if (!colors[normalizedRegion]) {
                colors[normalizedRegion] = EmotionColors[item.emotion];
            }

            const existing = markerMap.get(normalizedRegion);
            if (existing) {
                existing.count += 1;
            } else {
                markerMap.set(normalizedRegion, { emotion: item.emotion, count: 1 });
            }

            emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
        });

        const markerData: MarkerData[] = [];
        markerMap.forEach((value, key) => {
            markerData.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
            });
        });

        // Calculate overall dominant emotion
        let dominant: EmotionType | null = null;
        let maxCount = 0;
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominant = parseInt(emotion) as EmotionType;
            }
        });

        return { regionColors: colors, markers: markerData, dominantEmotion: dominant };
    }, [emotions]);

    // Handle marker click
    const handleMarkerClick = (marker: MarkerData) => {
        const regionEmotions = emotions.filter(e => normalizeRegionName(e.region) === marker.region);
        if (regionEmotions.length === 0) return;

        const totalIntensity = regionEmotions.reduce((sum, e) => sum + e.intensity, 0);
        const avgIntensity = Math.round(totalIntensity / regionEmotions.length);

        const cluster: RegionCluster = {
            region: marker.region,
            emotions: regionEmotions,
            dominantEmotion: marker.emotion,
            avgIntensity,
        };

        setSelectedCluster(cluster);
        setShowComfortModal(true);
    };

    // Handle emotion submit success
    const handleEmotionSuccess = () => {
        fetchData(); // Refresh map
    };

    // Zoom state
    const [currentZoom, setCurrentZoom] = useState(1);

    const handleScroll = (event: any) => {
        // Calculate zoom level from scroll event if possible, or use onZoomScaleChange for iOS
        const zoom = event.nativeEvent.zoomScale || 1;
        setCurrentZoom(zoom);
    };

    // Auth loading state
    if (authLoading) {
        return (
            <View className='flex-1 bg-gray-900 items-center justify-center'>
                <ActivityIndicator size='large' color='#A78BFA' />
            </View>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        // For now, show a simple login prompt
        return (
            <View className='flex-1 bg-gray-900 items-center justify-center p-6'>
                <Text className='text-4xl mb-4'></Text>
                <Text className='text-white text-2xl font-bold mb-2'>Mind Weather</Text>
                <Text className='text-gray-400 text-center mb-8'>마음의 날씨를 나누고, 서로를 위로해요</Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    className='bg-purple-600 px-8 py-4 rounded-xl'
                >
                    <Text className='text-white font-bold text-lg'>시작하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className='flex-1 bg-gray-900'>
            <SafeAreaView edges={['top']} className='flex-1'>
                {/* Header */}
                <Header onInboxPress={() => setShowInbox(true)} />

                {/* Ticker - now at top below header */}
                <Ticker />

                {/* Main Map Area */}
                <ScrollView
                    className='flex-1'
                    contentContainerStyle={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />
                    }
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {loading ? (
                            <View className='flex-1 justify-center items-center'>
                                <ActivityIndicator size='large' color='#A78BFA' />
                            </View>
                        ) : (
                            <KoreaMap
                                regionColors={regionColors}
                                markers={markers}
                                onMarkerClick={handleMarkerClick}
                                currentZoom={currentZoom}
                            />
                        )}
                    </View>
                </ScrollView>

                {/* Background Music Player */}
                <BackgroundMusic dominantEmotion={dominantEmotion} />

                {/* Floating Action Buttons */}
                <View className='absolute bottom-28 right-4 gap-3'>
                    {/* Diary FAB */}
                    <TouchableOpacity
                        onPress={() => router.push('/diary')}
                        className='w-14 h-14 bg-gray-800/80 border border-gray-700 rounded-full items-center justify-center'
                    >
                        <Ionicons name="calendar-outline" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Board FAB */}
                    <TouchableOpacity
                        onPress={() => router.push('/board')}
                        className='w-14 h-14 bg-gray-800/80 border border-gray-700 rounded-full items-center justify-center'
                    >
                        <Ionicons name="chatbubbles-outline" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Emotion Input FAB */}
                    <TouchableOpacity
                        onPress={() => setShowEmotionInput(true)}
                        className='w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg'
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Modals */}
            <EmotionInputModal
                visible={showEmotionInput}
                onClose={() => setShowEmotionInput(false)}
                onSuccess={handleEmotionSuccess}
            />

            <ComfortModal
                visible={showComfortModal}
                cluster={selectedCluster}
                onClose={() => {
                    setShowComfortModal(false);
                    setSelectedCluster(null);
                }}
            />

            <InboxModal
                visible={showInbox}
                onClose={() => setShowInbox(false)}
            />
        </View>
    );
}