import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as expoRouter from 'expo-router';
// import ReactNativeZoomableView from 'react-native-zoomable-view'; // Temporarily disabled

// Components
import { Header } from '../components/Header';
import { Ticker } from '../components/Ticker';
import KoreaMap, { normalizeRegionName } from '../components/KoreaMap';
import { OnboardingTutorial } from '../components/OnboardingTutorial';

// Services & Types
import { getEmotionsForMap } from '../services/api';
import { EmotionResponse, EmotionType, EmotionColors } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
// import { useModal } from '../contexts/ModalContext'; // Removed
import { useFocusEffect } from 'expo-router';
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
    const { user, isGuest } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
    const router = expoRouter.useRouter();
    const insets = useSafeAreaInsets();
    // const { openModal } = useModal(); // Removed

    // Data state
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(false);

    // Modal states
    const [selectedCluster, setSelectedCluster] = useState<RegionCluster | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Zoom state
    const [currentZoom, setCurrentZoom] = useState(1);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    // Fetch map data
    const fetchData = useCallback(async () => {
        try {
            setMapError(false);
            setLoading(true);
            const data = await getEmotionsForMap();
            setEmotions(data);
        } catch (error) {
            console.error('Failed to fetch map data', error);
            setMapError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchData();
            }
        }, [user, fetchData])
    );

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

    // Optimized: Pre-calculate maps ensuring O(N) only runs when data changes
    const processedData = useMemo(() => {
        const provinceMap = new Map<string, { emotion: EmotionType; count: number }>();
        const districtMap = new Map<string, { emotion: EmotionType; count: number; province: string }>();

        emotions.forEach(item => {
            const parts = item.region.trim().split(' ');
            const rawProvince = parts[0];
            const normalizedProvince = normalizeRegionName(rawProvince);

            // Province Aggregation
            const pExisting = provinceMap.get(normalizedProvince);
            if (pExisting) {
                pExisting.count += 1;
            } else {
                provinceMap.set(normalizedProvince, { emotion: item.emotion, count: 1 });
            }

            // District Aggregation
            if (parts.length > 1) {
                const districtParts = parts.slice(1).filter(p => {
                    const lastChar = p.slice(-1);
                    return !['동', '읍', '면', '가'].includes(lastChar) &&
                        !p.toLowerCase().endsWith('dong') &&
                        !p.toLowerCase().endsWith('eup') &&
                        !p.toLowerCase().endsWith('myeon');
                });
                const districtName = districtParts.join(' ');

                if (districtName) {
                    const fullRegionKey = `${normalizedProvince} ${districtName}`;
                    const dExisting = districtMap.get(fullRegionKey);
                    if (dExisting) {
                        dExisting.count += 1;
                    } else {
                        districtMap.set(fullRegionKey, { emotion: item.emotion, count: 1, province: normalizedProvince });
                    }
                }
            }
        });

        // Generate Static Markers & Colors
        const allProvinceColors: Record<string, string> = {};
        const allMarkers: MarkerData[] = [];

        provinceMap.forEach((value, key) => {
            allProvinceColors[key] = EmotionColors[value.emotion];
            allMarkers.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
                type: 'province',
                provinceName: key
            });
        });

        districtMap.forEach((value, key) => {
            allMarkers.push({
                region: key,
                emotion: value.emotion,
                count: value.count,
                type: 'district',
                provinceName: value.province
            });
        });

        return { allProvinceColors, allMarkers };
    }, [emotions]);

    // Fast View Computation
    const { regionColors, markers } = useMemo(() => {
        return {
            regionColors: !selectedRegion ? processedData.allProvinceColors : {}, // No district colors as requested
            markers: processedData.allMarkers
        };
    }, [processedData, selectedRegion]);

    // Handle marker click
    const handleMarkerClick = (marker: MarkerData) => {
        if (marker.type === 'province') {
            setSelectedRegion(marker.region);
            return;
        }

        if (marker.type === 'district') {
            const markerDistrictName = marker.region.split(' ')[1] || marker.region;
            const districtEmotions = emotions.filter(e => {
                if (!e.region.startsWith(selectedRegion || '')) return false;
                return e.region.includes(markerDistrictName);
            });

            if (districtEmotions.length > 0) {
                const totalIntensity = districtEmotions.reduce((sum, e) => sum + e.intensity, 0);
                const avgIntensity = Math.round(totalIntensity / districtEmotions.length);
                const cluster: RegionCluster = {
                    region: marker.region,
                    emotions: districtEmotions,
                    dominantEmotion: districtEmotions[0].emotion,
                    avgIntensity,
                };
                setSelectedCluster(cluster);
                router.push({
                    pathname: '/modal/comfort',
                    params: { cluster: JSON.stringify(cluster) }
                });
            }
        }
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
    // ...

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
            {/* ... Safe Area ... */}
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <Header onInboxPress={() => router.push('/modal/inbox')} />

                {/* Ticker */}
                <Ticker />

                {/* Main Map Area */}
                <View className="flex-1 overflow-hidden">
                    <View style={{ flex: 1 }}>
                        {loading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#A78BFA" />
                            </View>
                        ) : mapError ? (
                            <View className="flex-1 justify-center items-center px-6">
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>😥</Text>
                                <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>
                                    지도 데이터를 불러오지 못했어요
                                </Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                                    네트워크 연결을 확인하고 다시 시도해주세요
                                </Text>
                                <TouchableOpacity
                                    onPress={fetchData}
                                    style={{
                                        backgroundColor: '#7C3AED',
                                        paddingHorizontal: 24,
                                        paddingVertical: 10,
                                        borderRadius: 20,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>다시 시도</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <KoreaMap
                                regionColors={regionColors}
                                markers={markers}
                                onMarkerClick={handleMarkerClick}
                                onRegionClick={(region) => {
                                    if (selectedRegion) {
                                        const clickedDistrictName = region;
                                        const targetEmotions = emotions.filter(e => {
                                            const parts = e.region.trim().split(' ');
                                            const p = normalizeRegionName(parts[0]);
                                            if (p !== selectedRegion) return false;
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
                                            const cluster: RegionCluster = {
                                                region: `${selectedRegion} ${clickedDistrictName}`,
                                                emotions: targetEmotions,
                                                dominantEmotion: targetEmotions[0].emotion,
                                                avgIntensity,
                                            };
                                            setSelectedCluster(cluster);
                                            router.push({
                                                pathname: '/modal/comfort',
                                                params: { cluster: JSON.stringify(cluster) }
                                            });
                                        }
                                    } else {
                                        setSelectedRegion(region);
                                    }
                                }}
                                selectedRegion={selectedRegion}
                                currentZoom={currentZoom}
                            />
                        )}
                    </View>
                </View>

            </SafeAreaView>

            {/* Bottom Action Bar */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: 8,
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: colors.bg.secondary,
                borderTopWidth: 1,
                borderTopColor: colors.border,
            }}>
                <TouchableOpacity
                    onPress={() => isGuest ? showGuestPrompt('감정 정원') : router.push('/garden')}
                    style={{ alignItems: 'center', paddingVertical: 4, minWidth: 56 }}
                >
                    <Text style={{ fontSize: 22 }}>🌱</Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 10, marginTop: 2 }}>정원</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => isGuest ? showGuestPrompt('감정 다이어리') : router.push('/diary')}
                    style={{ alignItems: 'center', paddingVertical: 4, minWidth: 56 }}
                >
                    <Text style={{ fontSize: 22 }}>📅</Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 10, marginTop: 2 }}>다이어리</Text>
                </TouchableOpacity>

                {/* Center - Emotion Input (Primary Action) */}
                <TouchableOpacity
                    onPress={() => isGuest ? showGuestPrompt('감정 기록') : router.push('/modal/emotion')}
                    style={{
                        backgroundColor: '#7C3AED',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: -20,
                        elevation: 6,
                        shadowColor: '#7C3AED',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                    }}
                >
                    <Text style={{ fontSize: 26 }}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/board')}
                    style={{ alignItems: 'center', paddingVertical: 4, minWidth: 56 }}
                >
                    <Text style={{ fontSize: 22 }}>💌</Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 10, marginTop: 2 }}>게시판</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => isGuest ? showGuestPrompt('편지함') : router.push('/modal/mail')}
                    style={{ alignItems: 'center', paddingVertical: 4, minWidth: 56 }}
                >
                    <Text style={{ fontSize: 22 }}>📩</Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 10, marginTop: 2 }}>편지</Text>
                </TouchableOpacity>
            </View>

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
