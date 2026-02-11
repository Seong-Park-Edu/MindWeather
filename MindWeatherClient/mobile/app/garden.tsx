import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, ImageBackground, Image, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyEmotions } from '../services/api';
import { EmotionResponse, EmotionType, AllEmotionTypes, EmotionLabels } from '../types/emotion';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    Easing,
    ZoomIn,
    FadeIn
} from 'react-native-reanimated';

// Asset Configuration
const PLANT_IMAGES: Record<string, any> = {
    sprout: require('../assets/garden/plants/common_sprout.png'),
    growing: require('../assets/garden/plants/common_growing.png'),
    auraRing: require('../assets/garden/plants/aura_ring.png'),
    auraShine: require('../assets/garden/plants/aura_shine.png'),
    plants: {
        [EmotionType.Joy]: require('../assets/garden/plants/plant_joy.png'),
        [EmotionType.Excitement]: require('../assets/garden/plants/plant_excitement.png'),
        [EmotionType.Sadness]: require('../assets/garden/plants/plant_sadness.png'),
        [EmotionType.Depression]: require('../assets/garden/plants/plant_depression.png'),
        [EmotionType.Anger]: require('../assets/garden/plants/plant_anger.png'),
        [EmotionType.Calm]: require('../assets/garden/plants/plant_calm.png'),
        [EmotionType.Anxiety]: require('../assets/garden/plants/plant_anxiety.png'),
        [EmotionType.Fatigue]: require('../assets/garden/plants/plant_fatigue.png'),
        [EmotionType.Boredom]: require('../assets/garden/plants/plant_boredom.png'),
        [EmotionType.Loneliness]: require('../assets/garden/plants/plant_loneliness.png'),
    }
};

const PLANT_INFO: Record<number, { name: string; color: string }> = {
    [EmotionType.Joy]: { name: '해바라기', color: '#FFD700' },
    [EmotionType.Excitement]: { name: '해바라기(활력)', color: '#FFA500' },
    [EmotionType.Sadness]: { name: '튤립', color: '#FF69B4' },
    [EmotionType.Depression]: { name: '백합', color: '#4B0082' },
    [EmotionType.Anger]: { name: '선인장', color: '#2E8B57' },
    [EmotionType.Calm]: { name: '분재나무', color: '#228B22' },
    [EmotionType.Anxiety]: { name: '라벤더', color: '#9370DB' },
    [EmotionType.Fatigue]: { name: '버섯', color: '#8B4513' },
    [EmotionType.Boredom]: { name: '강아지풀', color: '#DAA520' },
    [EmotionType.Loneliness]: { name: '가을나무', color: '#A0522D' },
};

const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    if (count < 20) return 4;
    if (count < 30) return 5;
    return 6;
};

const getExampleSource = (type: EmotionType, level: number) => {
    if (level === 0) return PLANT_IMAGES.sprout;
    if (level === 1) return PLANT_IMAGES.sprout;
    if (level === 2) return PLANT_IMAGES.growing;
    return PLANT_IMAGES.plants[type];
};

const getPlantSource = (type: EmotionType, level: number) => {
    if (level === 0) return null;
    return getExampleSource(type, level);
};

interface GardenState {
    waterLevel: number;
    waterDrops: number;
    lastWatered: string;
    lastLoginDate: string;
}

const Sparkle = ({ delay }: { delay: number }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(1, { duration: 500 })),
                withTiming(0, { duration: 500 })
            ),
            -1,
            true
        );
        scale.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(1, { duration: 500 })),
                withTiming(0.5, { duration: 500 })
            ),
            -1,
            true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const top = Math.random() * 80 - 40;
    const left = Math.random() * 80 - 40;

    return (
        <Animated.View style={[{ position: 'absolute', top, left, zIndex: 10 }, animStyle]}>
            <Text style={{ fontSize: 16 }}>✨</Text>
        </Animated.View>
    );
};

const AuraEffect = ({ level, color, waterLevel, sizeMultiplier = 1 }: { level: number; color: string; waterLevel: number; sizeMultiplier?: number }) => {
    if (waterLevel < 30) return null;

    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (level >= 4) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 8000, easing: Easing.linear }),
                -1,
                false
            );
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 2000 }),
                    withTiming(1, { duration: 2000 })
                ),
                -1,
                true
            );
        }
    }, [level]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
        opacity: 0.6,
    }));

    if (level < 4) return null;

    return (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={animatedStyle}>
                <Image
                    source={PLANT_IMAGES.auraRing}
                    style={{ width: 110 * sizeMultiplier, height: 110 * sizeMultiplier, tintColor: color }}
                    resizeMode="contain"
                />
            </Animated.View>
            {level >= 6 && (
                <Animated.View style={{ position: 'absolute', opacity: 0.8 }}>
                    <Image
                        source={PLANT_IMAGES.auraShine}
                        style={{ width: 140 * sizeMultiplier, height: 140 * sizeMultiplier, tintColor: 'gold' }}
                        resizeMode="contain"
                    />
                </Animated.View>
            )}
        </View>
    );
};

const GuardianPlant = ({
    type,
    count,
    waterLevel,
    onPress
}: {
    type: EmotionType;
    count: number;
    waterLevel: number;
    onPress: () => void;
}) => {
    const level = getLevel(count);
    const source = getPlantSource(type, level);
    const info = PLANT_INFO[type];

    const scale = useSharedValue(0);

    useEffect(() => {
        if (level > 0) {
            scale.value = withSpring(1);
        }
    }, [level]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isWithered = waterLevel < 30 && level > 0;

    if (level === 0) {
        return (
            <TouchableOpacity onPress={onPress} style={styles.plantSlotEmpty}>
                <View style={styles.soilSpot} />
                <Text style={styles.plantLabelEmpty}>{EmotionLabels[type]}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} style={styles.plantSlot}>
            <View style={styles.plantContainer}>
                <AuraEffect level={level} color={info.color} waterLevel={waterLevel} />
                {waterLevel >= 80 && level >= 1 && (
                    <>
                        <Sparkle delay={0} />
                        <Sparkle delay={500} />
                        <Sparkle delay={1000} />
                    </>
                )}
                <Animated.View style={[animatedStyle, isWithered && styles.witheredPlant]}>
                    <Image
                        source={source}
                        style={{ width: 90, height: 90 }}
                        resizeMode="contain"
                    />
                </Animated.View>
                {isWithered && (
                    <Text style={styles.waterDropIcon}>💧</Text>
                )}
            </View>
            <View style={[styles.plantLabel, isWithered && styles.plantLabelWithered]}>
                <Text style={styles.plantLabelText}>
                    {EmotionLabels[type]} Lv.{level}
                </Text>
                {level >= 6 && !isWithered && <Text style={styles.masterText}>MASTER</Text>}
            </View>
        </TouchableOpacity>
    );
};

const PlantDetailModal = ({
    plant,
    waterLevel,
    onClose
}: {
    plant: { type: EmotionType; count: number } | null;
    waterLevel: number;
    onClose: () => void;
}) => {
    if (!plant) return null;

    const { type, count } = plant;
    const level = getLevel(count);
    const info = PLANT_INFO[type];
    const source = getExampleSource(type, level);

    let message = "";
    let nextGoal = 0;

    if (level < 3) nextGoal = [1, 3, 6][level];
    else if (level === 3) nextGoal = 10;
    else if (level === 4) nextGoal = 20;
    else if (level === 5) nextGoal = 30;

    if (level < 6) {
        const needed = nextGoal - count;
        message = (needed > 0) ? `다음 단계까지 ${needed}번 더 기록 필요` : "성장 가능!";
        if (level === 0) message = "첫 기록을 남겨보세요!";
    } else {
        message = "최고 레벨 도달! (전설의 정원사)";
    }

    let status = "보통";
    let statusColor = "#666";
    if (waterLevel < 30) {
        status = "목마름 💧";
        statusColor = "#ef4444";
    } else if (waterLevel >= 80) {
        status = "행복함 ✨";
        statusColor = "#3b82f6";
    }

    return (
        <View style={styles.modalOverlayAbsolute}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalEmotion}>{EmotionLabels[type]}</Text>
                    <Text style={styles.modalPlantName}>{info.name}</Text>
                    <View style={styles.modalBadges}>
                        <View style={[styles.badge, level >= 6 ? styles.badgeMaster : styles.badgeNormal]}>
                            <Text style={[styles.badgeText, level >= 6 ? styles.badgeTextMaster : styles.badgeTextNormal]}>Lv.{level}</Text>
                        </View>
                        <View style={[styles.badge, styles.badgeGray]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.modalPlantView}>
                    <Image
                        source={source}
                        style={{ width: 180, height: 180 }}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.progressBox}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>이번 달 기록</Text>
                        <Text style={styles.progressValue}>{count}회</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[styles.progressBarFill, {
                                width: level >= 6 ? '100%' : `${Math.min(100, (count / nextGoal) * 100)}%`,
                                backgroundColor: info.color
                            }]}
                        />
                    </View>
                    <Text style={styles.progressMessage}>{message}</Text>
                </View>

                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>닫기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function GardenScreen() {
    const router = useRouter();
    const { user, isGuest } = useAuth();

    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [gardenState, setGardenState] = useState<GardenState>({
        waterLevel: 50,
        waterDrops: 3,
        lastWatered: new Date().toISOString(),
        lastLoginDate: ''
    });
    const [selectedPlant, setSelectedPlant] = useState<{ type: EmotionType, count: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [wateringToast, setWateringToast] = useState('');
    const toastOpacity = useSharedValue(0);
    const toastTranslateY = useSharedValue(20);

    const fetchData = useCallback(async () => {
        if (!user || isGuest) return;

        try {
            setLoading(true);
            const now = new Date();
            const data = await getMyEmotions(user.id, now.getFullYear(), now.getMonth() + 1);
            setEmotions(data);

            const savedState = await AsyncStorage.getItem(`@garden_state_${user.id}`);
            let currentState = savedState ? JSON.parse(savedState) : {
                waterLevel: 50,
                waterDrops: 3,
                lastWatered: new Date().toISOString(),
                lastLoginDate: ''
            };

            if (currentState.waterDrops === undefined) currentState.waterDrops = 3;
            if (currentState.lastLoginDate === undefined) currentState.lastLoginDate = '';

            const today = now.toISOString().split('T')[0];
            if (currentState.lastLoginDate !== today) {
                currentState.waterDrops = (currentState.waterDrops || 0) + 3;
                currentState.lastLoginDate = today;
                Alert.alert('🎁 출석 선물', '오늘의 물방울 3개를 받았습니다!');
                await AsyncStorage.setItem(`@garden_state_${user.id}`, JSON.stringify(currentState));
            }

            setGardenState(currentState);

        } catch (error) {
            console.error('Failed to load garden:', error);
        } finally {
            setLoading(false);
        }
    }, [user, isGuest]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const emotionCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        AllEmotionTypes.forEach(t => counts[t] = 0);
        emotions.forEach(e => {
            if (counts[e.emotion] !== undefined) {
                counts[e.emotion]++;
            }
        });
        return counts;
    }, [emotions]);

    const showToast = (message: string) => {
        setWateringToast(message);
        toastOpacity.value = withSequence(
            withTiming(1, { duration: 300 }),
            withDelay(1500, withTiming(0, { duration: 500 }))
        );
        toastTranslateY.value = withSequence(
            withTiming(0, { duration: 300 }),
            withDelay(1500, withTiming(-20, { duration: 500 }))
        );
    };

    const toastStyle = useAnimatedStyle(() => ({
        opacity: toastOpacity.value,
        transform: [{ translateY: toastTranslateY.value }],
    }));

    const handlePlantPress = (type: EmotionType, count: number) => {
        setSelectedPlant({ type, count });
    };

    const handleWatering = async () => {
        if (gardenState.waterDrops <= 0) {
            showToast('💧 물방울이 없어요! 내일 다시 방문해주세요');
            return;
        }

        if (gardenState.waterLevel >= 100) {
            showToast('💧 이미 수분이 가득 차 있어요!');
            return;
        }

        const newLevel = Math.min(100, gardenState.waterLevel + 10);
        const newDrops = gardenState.waterDrops - 1;

        const newState = {
            ...gardenState,
            waterLevel: newLevel,
            waterDrops: newDrops,
            lastWatered: new Date().toISOString()
        };

        await AsyncStorage.setItem(`@garden_state_${user?.id}`, JSON.stringify(newState));
        setGardenState(newState);

        showToast('💧 물을 줬어요! 식물이 촉촉해졌어요 ✨');
    };

    if (isGuest) {
        return (
            <View style={styles.guestContainer}>
                <Text style={styles.guestIcon}>🔒</Text>
                <Text style={styles.guestTitle}>로그인이 필요해요</Text>
                <TouchableOpacity onPress={() => router.push('/login')} style={styles.guestButton}>
                    <Text style={styles.guestButtonText}>로그인하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/garden/garden_bg.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>감정 수호 정원</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: '100%' }}>
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>🌱</Text>
                            <Text style={styles.statLabel}>식물</Text>
                            <Text style={styles.statValue}>
                                {Object.values(emotionCounts).filter(c => c > 0).length} / 10
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>💧</Text>
                            <Text style={styles.statLabel}>물방울</Text>
                            <Text style={styles.statValue}>{gardenState.waterDrops}개</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>
                                {gardenState.waterLevel >= 80 ? '✨' : gardenState.waterLevel < 30 ? '🥀' : '🌿'}
                            </Text>
                            <Text style={styles.statLabel}>수분</Text>
                            <Text style={[styles.statValue, gardenState.waterLevel < 30 && { color: '#dc2626' }]}>
                                {gardenState.waterLevel}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.gardenGrid}>
                        {loading ? (
                            <ActivityIndicator size="large" color="white" style={{ marginTop: 100 }} />
                        ) : (
                            <View style={styles.plantGrid}>
                                {AllEmotionTypes.map((type) => (
                                    <GuardianPlant
                                        key={type}
                                        type={type}
                                        count={emotionCounts[type] || 0}
                                        waterLevel={gardenState.waterLevel}
                                        onPress={() => handlePlantPress(type, emotionCounts[type] || 0)}
                                    />
                                ))}
                            </View>
                        )}

                        {!loading && emotions.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    감정을 기록하여 수호 식물을 깨워보세요!
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    onPress={handleWatering}
                    style={styles.fab}
                >
                    <Text style={styles.fabEmoji}>🚿</Text>
                    <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>{gardenState.waterDrops}</Text>
                    </View>
                </TouchableOpacity>

                {/* Watering Toast */}
                {wateringToast !== '' && (
                    <Animated.View style={[styles.wateringToast, toastStyle]} pointerEvents="none">
                        <Text style={styles.wateringToastText}>{wateringToast}</Text>
                    </Animated.View>
                )}

                <PlantDetailModal
                    plant={selectedPlant}
                    waterLevel={gardenState.waterLevel}
                    onClose={() => setSelectedPlant(null)}
                />
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    guestContainer: { flex: 1, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', padding: 24 },
    guestIcon: { fontSize: 48, marginBottom: 16 },
    guestTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    guestButton: { backgroundColor: '#9333ea', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
    guestButtonText: { color: 'white', fontWeight: 'bold' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },

    statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    statItem: { alignItems: 'center' },
    statEmoji: { fontSize: 24 },
    statLabel: { fontSize: 12, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f' },

    gardenGrid: { flex: 1, position: 'relative', marginTop: 16, paddingBottom: 80, minHeight: 600 },
    plantGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 32, paddingHorizontal: 8 },

    plantSlotEmpty: { alignItems: 'center', justifyContent: 'center', width: '30%', height: 144, opacity: 0.4, margin: 4 },
    soilSpot: { width: 64, height: 32, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 32, marginBottom: 8, transform: [{ scaleX: 2.0 }] },
    plantLabelEmpty: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },

    plantSlot: { alignItems: 'center', justifyContent: 'center', width: '30%', height: 144, margin: 4, marginBottom: 16 },
    plantContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 96, height: 96 },
    witheredPlant: { opacity: 0.6, transform: [{ scale: 0.9 }, { rotate: '-5deg' }] },
    waterDropIcon: { position: 'absolute', top: -8, right: -8, fontSize: 24 },

    plantLabel: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    plantLabelWithered: { backgroundColor: '#d1d5db' },
    plantLabelText: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
    masterText: { fontSize: 10, color: '#ca8a04', fontWeight: '800' },

    emptyState: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    emptyStateText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 12 },

    fab: { position: 'absolute', bottom: 40, right: 24, width: 64, height: 64, backgroundColor: '#3b82f6', borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white', elevation: 5 },
    fabEmoji: { fontSize: 30 },
    fabBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },
    fabBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    modalOverlayAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, alignItems: 'center', justifyContent: 'center' },
    modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
    modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalContent: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 32, borderRadius: 40, alignItems: 'center', width: '85%', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
    modalHeader: { alignItems: 'center', marginBottom: 24 },
    modalEmotion: { fontSize: 20, fontWeight: '800', color: '#6b7280' },
    modalPlantName: { fontSize: 30, fontWeight: '900', color: '#1f2937', marginTop: 4 },
    modalBadges: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeMaster: { backgroundColor: '#fef3c7' },
    badgeNormal: { backgroundColor: '#dcfce7' },
    badgeGray: { backgroundColor: '#f3f4f6' },
    badgeText: { fontWeight: 'bold' },
    badgeTextMaster: { color: '#a16207' },
    badgeTextNormal: { color: '#15803d' },

    modalPlantView: { height: 260, width: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },

    progressBox: { width: '100%', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, marginBottom: 24 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { color: '#6b7280', fontWeight: 'bold' },
    progressValue: { color: '#1f2937', fontWeight: 'bold' },
    progressBarBg: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 6 },
    progressMessage: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 8 },

    closeButton: { backgroundColor: '#1f2937', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    closeButtonText: { fontWeight: 'bold', color: 'white', fontSize: 18 },

    wateringToast: { position: 'absolute', bottom: 120, left: 24, right: 24, backgroundColor: 'rgba(30,58,95,0.92)', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, alignItems: 'center', zIndex: 900 },
    wateringToastText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
