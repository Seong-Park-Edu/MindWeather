import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as expoRouter from 'expo-router';
import ReactNativeZoomableView from 'react-native-zoomable-view';

// Components
import { Header } from '../components/Header';
import { Ticker } from '../components/Ticker';
import KoreaMap, { normalizeRegionName } from '../components/KoreaMap';
import { ComfortModal } from '../components/ComfortModal';
import { InboxModal } from '../components/InboxModal';
import { EmotionInputModal } from '../components/EmotionInputModal';
import { OnboardingTutorial } from '../components/OnboardingTutorial';

// Services & Types
import { getEmotionsForMap } from '../services/api';
import { EmotionResponse, EmotionType, EmotionColors } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';
import { hasCompletedOnboarding, setOnboardingCompleted } from '../utils/onboarding';

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
    const { user, loading: authLoading, isGuest } = useAuth();
    const router = expoRouter.useRouter();

    // Data state
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showEmotionInput, setShowEmotionInput] = useState(false);
    const [showComfortModal, setShowComfortModal] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<RegionCluster | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Zoom state
    const [currentZoom, setCurrentZoom] = useState(1);

    // Fetch map data
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
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    // Check onboarding status on mount
    useEffect(() => {
        const checkOnboarding = async () => {
            if (!user) return;
            const completed = await hasCompletedOnboarding();
            if (!completed) {
                setShowOnboarding(true);
            }
        };
        checkOnboarding();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Compute markers and colors from emotions
    const { regionColors, markers } = useMemo(() => {
        const colors: Record<string, string> = {};
        const markerMap = new Map<string, { emotion: EmotionType; count: number }>();

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

    // Show login prompt for guest users
    const showGuestPrompt = (feature: string) => {
        Alert.alert(
            '로그인이 필요합니다',
            `${feature} 기능을 사용하려면 로그인이 필요합니다.\n회원가입하시겠어요?`,
            [
                { text: '취소', style: 'cancel' },
                { text: '회원가입', onPress: () => router.push('/signup') },
                { text: '로그인', onPress: () => router.push('/login') },
            ]
        );
    };

    // Auth loading state
    if (authLoading) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        // For now, show a simple login prompt
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center p-6">
                <Text className="text-4xl mb-4">🌤️</Text>
                <Text className="text-white text-2xl font-bold mb-2">Mind Weather</Text>
                <Text className="text-gray-400 text-center mb-8">마음의 날씨를 나누고, 서로를 위로해요</Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    className="bg-purple-600 px-8 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold text-lg">시작하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleScroll = (event: any) => {
        // Calculate zoom level from scroll event if possible, or use onZoomScaleChange for iOS
        // Android ScrollView zoom is tricky. 
        // For now, let's try to get zoom scale.
        const zoom = event.nativeEvent.zoomScale || 1;
        setCurrentZoom(zoom);
        // console.log('Zoom:', zoom);
    };

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <Header onInboxPress={() => setShowInbox(true)} />

                {/* Ticker - now at top below header */}
                <Ticker />

                {/* Main Map Area */}
                <View className="flex-1 overflow-hidden">
                    <ReactNativeZoomableView
                        maxZoom={4}
                        minZoom={1}
                        zoomStep={0.5}
                        initialZoom={1}
                        bindToBorders={false} // Allow panning freely
                        style={{ flex: 1 }}
                        onZoomAfter={(event: any, gestureState: any, zoomableViewEventObject: any) => {
                            setCurrentZoom(zoomableViewEventObject.zoomLevel);
                        }}
                    >
                        {loading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#A78BFA" />
                            </View>
                        ) : (
                            <KoreaMap
                                regionColors={regionColors}
                                markers={markers}
                                onMarkerClick={handleMarkerClick}
                                currentZoom={currentZoom}
                            />
                        )}
                    </ReactNativeZoomableView>
                </View>

                {/* Floating Action Buttons */}
                <View className="absolute bottom-28 right-4 gap-3">
                    {/* Garden FAB */}
                    <TouchableOpacity
                        onPress={() => {
                            if (isGuest) {
                                showGuestPrompt('감정 정원');
                            } else {
                                router.push('/garden');
                            }
                        }}
                        className="w-14 h-14 bg-green-600/80 border border-green-500 rounded-full items-center justify-center"
                    >
                        <Text className="text-2xl">🌱</Text>
                    </TouchableOpacity>

                    {/* Diary FAB */}
                    <TouchableOpacity
                        onPress={() => {
                            if (isGuest) {
                                showGuestPrompt('감정 다이어리');
                            } else {
                                router.push('/diary');
                            }
                        }}
                        className="w-14 h-14 bg-gray-800/80 border border-gray-700 rounded-full items-center justify-center"
                    >
                        <Text className="text-2xl">📅</Text>
                    </TouchableOpacity>

                    {/* Board FAB */}
                    <TouchableOpacity
                        onPress={() => router.push('/board')}
                        className="w-14 h-14 bg-gray-800/80 border border-gray-700 rounded-full items-center justify-center"
                    >
                        <Text className="text-2xl">💌</Text>
                    </TouchableOpacity>

                    {/* Emotion Input FAB */}
                    <TouchableOpacity
                        onPress={() => {
                            if (isGuest) {
                                showGuestPrompt('감정 기록');
                            } else {
                                setShowEmotionInput(true);
                            }
                        }}
                        className="w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg"
                    >
                        <Text className="text-2xl">✏️</Text>
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

            <OnboardingTutorial
                visible={showOnboarding}
                onComplete={async () => {
                    await setOnboardingCompleted();
                    setShowOnboarding(false);
                }}
            />
        </View>
    );
}
