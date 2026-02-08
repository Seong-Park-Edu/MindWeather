import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as expoRouter from 'expo-router';
// import ReactNativeZoomableView from 'react-native-zoomable-view'; // Temporarily disabled

// Components
import { Header } from '../components/Header';
import { Ticker } from '../components/Ticker';
import KoreaMap, { normalizeRegionName } from '../components/KoreaMap';
import { ComfortModal } from '../components/ComfortModal';
import { InboxModal } from '../components/InboxModal';
import { EmotionInputModal } from '../components/EmotionInputModal';
import { OnboardingTutorial } from '../components/OnboardingTutorial';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

// Services & Types
import { getEmotionsForMap } from '../services/api';
import { EmotionResponse, EmotionType, EmotionColors } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import { hasCompletedOnboarding, setOnboardingCompleted } from '../utils/onboarding';

interface MarkerData {
    region: string;
    emotion: EmotionType;
    count: number;
    type?: 'province' | 'district';
    provinceName?: string;
}

interface RegionCluster {
    region: string;
    emotions: EmotionResponse[];
    dominantEmotion: EmotionType;
    avgIntensity: number;
}

export default function MainScreen() {
    const { user, loading: authLoading, isGuest } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
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
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

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

    // Handle device back button
    useEffect(() => {
        const backAction = () => {
            if (selectedRegion) {
                setSelectedRegion(null);
                setCurrentZoom(1);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [selectedRegion]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Compute markers and colors from emotions
    const { regionColors, markers } = useMemo(() => {
        const colors: Record<string, string> = {};
        const provinceMap = new Map<string, { emotion: EmotionType; count: number }>();
        const districtMap = new Map<string, { emotion: EmotionType; count: number; province: string }>();

        emotions.forEach(item => {
            const parts = item.region.trim().split(' ');
            const rawProvince = parts[0];
            const normalizedProvince = normalizeRegionName(rawProvince);

            // National Mode Coloring (Province Level)
            if (!selectedRegion && !colors[normalizedProvince]) {
                colors[normalizedProvince] = EmotionColors[item.emotion];
            }

            // Province Aggregation
            const pExisting = provinceMap.get(normalizedProvince);
            if (pExisting) {
                pExisting.count += 1;
            } else {
                provinceMap.set(normalizedProvince, { emotion: item.emotion, count: 1 });
            }

            // District Aggregation
            if (parts.length > 1) {
                // Filter out 'dong', 'eup', 'myeon' to get the administrative district name.
                const districtParts = parts.slice(1).filter(p => {
                    const lastChar = p.slice(-1);
                    return !['동', '읍', '면', '가'].includes(lastChar) &&
                        !p.toLowerCase().endsWith('dong') &&
                        !p.toLowerCase().endsWith('eup') &&
                        !p.toLowerCase().endsWith('myeon');
                });

                const districtName = districtParts.join(' ');

                // Color Logic for District Mode
                if (selectedRegion && normalizedProvince === selectedRegion && districtName) {
                    const normalizedDistrict = normalizeRegionName(districtName);
                    // Use the emotion of this specific district item
                    if (!colors[normalizedDistrict]) {
                        colors[normalizedDistrict] = EmotionColors[item.emotion];
                    }
                }

                const fullRegionKey = `${normalizedProvince} ${districtName}`;
                const dExisting = districtMap.get(fullRegionKey);
                if (dExisting) {
                    dExisting.count += 1;
                } else {
                    districtMap.set(fullRegionKey, { emotion: item.emotion, count: 1, province: normalizedProvince });
                }
            }
        });

        const markerData: MarkerData[] = [];

        provinceMap.forEach((value, key) => {
            markerData.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
                type: 'province',
                provinceName: key
            });
        });

        districtMap.forEach((value, key) => {
            markerData.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
                type: 'district',
                provinceName: value.province
            });
        });

        return { regionColors: colors, markers: markerData };
    }, [emotions, selectedRegion]);

    // Handle marker click (Keep primarily for province markers or fallback)
    const handleMarkerClick = (marker: MarkerData) => {
        if (marker.type === 'province') {
            setSelectedRegion(marker.region);
            return;
        }
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
            <View style={{ flex: 1, backgroundColor: colors.bg.primary }} className="items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent.secondary} />
            </View>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg.primary }} className="items-center justify-center p-6">
                <Text className="text-4xl mb-4">🌤️</Text>
                <Text style={{ color: colors.text.primary }} className="text-2xl font-bold mb-2">Mind Weather</Text>
                <Text style={{ color: colors.text.secondary }} className="text-center mb-8">마음의 날씨를 나누고, 서로를 위로해요</Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    style={{ backgroundColor: colors.accent.primary }}
                    className="px-8 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold text-lg">시작하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleScroll = (event: any) => {
        const zoom = event.nativeEvent.zoomScale || 1;
        setCurrentZoom(zoom);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <Header onInboxPress={() => setShowInbox(true)} />

                {/* Ticker - now at top below header */}
                <Ticker />

                {/* Main Map Area */}
                <View className="flex-1 overflow-hidden">
                    <View style={{ flex: 1 }}>
                        {loading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#A78BFA" />
                            </View>
                        ) : (
                            <KoreaMap
                                regionColors={regionColors}
                                markers={markers}
                                onMarkerClick={handleMarkerClick}
                                onRegionClick={(region, coords) => {
                                    if (selectedRegion) {
                                        // District Clicked (Choropleth Interaction)
                                        const clickedDistrictName = region;

                                        // Find all emotions for this district in the selected province
                                        const targetEmotions = emotions.filter(e => {
                                            const parts = e.region.trim().split(' ');
                                            const p = normalizeRegionName(parts[0]);
                                            if (p !== selectedRegion) return false;

                                            // Extract district part using same logic
                                            const districtParts = parts.slice(1).filter(p => {
                                                const lastChar = p.slice(-1);
                                                return !['동', '읍', '면', '가'].includes(lastChar) &&
                                                    !p.toLowerCase().endsWith('dong') &&
                                                    !p.toLowerCase().endsWith('eup') &&
                                                    !p.toLowerCase().endsWith('myeon');
                                            });
                                            const d = districtParts.join(' ');

                                            return normalizeRegionName(d) === clickedDistrictName;
                                        });

                                        if (targetEmotions.length > 0) {
                                            const totalIntensity = targetEmotions.reduce((sum, e) => sum + e.intensity, 0);
                                            const avgIntensity = Math.round(totalIntensity / targetEmotions.length);
                                            const domEmotion = targetEmotions[0].emotion;

                                            const cluster: RegionCluster = {
                                                region: `${selectedRegion} ${clickedDistrictName}`,
                                                emotions: targetEmotions,
                                                dominantEmotion: domEmotion,
                                                avgIntensity,
                                            };
                                            setSelectedCluster(cluster);
                                            setShowComfortModal(true);
                                        }
                                    } else {
                                        // National Mode: Zoom to Province
                                        setSelectedRegion(region);
                                    }
                                }}
                                selectedRegion={selectedRegion}
                                currentZoom={currentZoom}
                            />
                        )}
                    </View>
                </View>

                {/* Floating Action Buttons */}
                <View className="absolute bottom-28 right-4 gap-3 items-end">
                    {/* Theme Switcher FAB */}
                    <View>
                        <ThemeSwitcher />
                    </View>

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
