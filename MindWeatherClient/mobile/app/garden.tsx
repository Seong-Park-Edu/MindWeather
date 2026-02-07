import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserStreak } from '../services/api';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';

interface GardenState {
    level: number;
    waterLevel: number;
    plants: PlantData[];
    lastWatered: string;
}

interface PlantData {
    id: string;
    type: string;
    emoji: string;
    size: number;
    position: { x: number; y: number };
    color: string;
}

const PLANT_TYPES = [
    { type: 'flower', emoji: '🌸', color: '#FF69B4', minLevel: 0 },
    { type: 'tree', emoji: '🌳', color: '#228B22', minLevel: 7 },
    { type: 'sunflower', emoji: '🌻', color: '#FFD700', minLevel: 14 },
    { type: 'rose', emoji: '🌹', color: '#DC143C', minLevel: 21 },
    { type: 'cherry', emoji: '🌸', color: '#FFB6C1', minLevel: 30 },
    { type: 'palm', emoji: '🌴', color: '#006400', minLevel: 50 },
    { type: 'cactus', emoji: '🌵', color: '#90EE90', minLevel: 100 },
];

const AnimatedPlant = ({ plant, onPress }: { plant: PlantData; onPress: () => void }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000 }),
                withTiming(1, { duration: 2000 })
            ),
            -1,
            false
        );

        translateY.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value },
            ],
        };
    });

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                position: 'absolute',
                left: plant.position.x,
                top: plant.position.y,
            }}
        >
            <Animated.View style={animatedStyle}>
                <Text style={{ fontSize: plant.size }}>{plant.emoji}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function GardenScreen() {
    const router = useRouter();
    const { user, isGuest } = useAuth();
    const [garden, setGarden] = useState<GardenState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGarden();
    }, [user]);

    const loadGarden = async () => {
        if (!user || isGuest) {
            setLoading(false);
            return;
        }

        try {
            const key = `@garden_${user.id}`;
            const stored = await AsyncStorage.getItem(key);

            if (stored) {
                setGarden(JSON.parse(stored));
            } else {
                // Initialize new garden
                const newGarden: GardenState = {
                    level: 1,
                    waterLevel: 50,
                    plants: [
                        {
                            id: '1',
                            type: 'flower',
                            emoji: '🌸',
                            size: 40,
                            position: { x: 50, y: 100 },
                            color: '#FF69B4',
                        },
                    ],
                    lastWatered: new Date().toISOString(),
                };
                await saveGarden(newGarden);
                setGarden(newGarden);
            }

            // Update level based on streak
            const streak = await getUserStreak(user.id);
            if (stored) {
                const currentGarden = JSON.parse(stored);
                if (currentGarden.level !== streak.currentStreak + 1) {
                    currentGarden.level = Math.max(1, streak.currentStreak + 1);
                    await saveGarden(currentGarden);
                    setGarden(currentGarden);
                }
            }
        } catch (error) {
            console.error('Failed to load garden:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveGarden = async (gardenData: GardenState) => {
        if (!user) return;
        try {
            const key = `@garden_${user.id}`;
            await AsyncStorage.setItem(key, JSON.stringify(gardenData));
        } catch (error) {
            console.error('Failed to save garden:', error);
        }
    };

    const waterPlants = async () => {
        if (!garden) return;

        const newWaterLevel = Math.min(100, garden.waterLevel + 20);
        const updatedGarden = { ...garden, waterLevel: newWaterLevel, lastWatered: new Date().toISOString() };
        await saveGarden(updatedGarden);
        setGarden(updatedGarden);

        Alert.alert('💧 물 주기 완료!', '식물들이 건강하게 자라고 있어요.');
    };

    const plantNewPlant = async () => {
        if (!garden) return;

        // Check if user has unlocked new plants
        const availablePlants = PLANT_TYPES.filter(p => p.minLevel <= garden.level);
        if (garden.plants.length >= availablePlants.length) {
            Alert.alert('🌱', '모든 식물을 심었어요! 더 높은 레벨에서 새로운 식물을 만나보세요.');
            return;
        }

        const nextPlant = availablePlants[garden.plants.length];
        const randomX = Math.random() * 250 + 20;
        const randomY = Math.random() * 200 + 50;

        const newPlant: PlantData = {
            id: Date.now().toString(),
            type: nextPlant.type,
            emoji: nextPlant.emoji,
            size: 40,
            position: { x: randomX, y: randomY },
            color: nextPlant.color,
        };

        const updatedGarden = {
            ...garden,
            plants: [...garden.plants, newPlant],
        };

        await saveGarden(updatedGarden);
        setGarden(updatedGarden);
        Alert.alert('🌱 새 식물!', `${nextPlant.emoji}를 심었어요!`);
    };

    const handlePlantPress = (plant: PlantData) => {
        Alert.alert(
            `${plant.emoji} ${plant.type}`,
            `이 식물은 레벨 ${PLANT_TYPES.find(p => p.type === plant.type)?.minLevel}에서 잠금 해제되었어요!`
        );
    };

    if (isGuest) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center p-6">
                <Text className="text-4xl mb-4">🔒</Text>
                <Text className="text-white text-xl font-bold mb-2">로그인이 필요해요</Text>
                <Text className="text-gray-400 text-center mb-6">
                    나만의 감정 정원을 가꾸려면{'\n'}로그인이 필요합니다.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    className="bg-purple-600 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-bold">로그인하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading || !garden) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <Text className="text-2xl">🌱</Text>
                <Text className="text-gray-400 mt-2">정원 불러오는 중...</Text>
            </View>
        );
    }

    const availablePlants = PLANT_TYPES.filter(p => p.minLevel <= garden.level);
    const nextUnlock = PLANT_TYPES.find(p => p.minLevel > garden.level);

    return (
        <View className="flex-1 bg-gradient-to-b from-sky-300 to-green-200" style={{ backgroundColor: '#87CEEB' }}>
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-4 py-3 bg-green-600/80">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">🌱 감정 정원</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView className="flex-1">
                    {/* Stats */}
                    <View className="px-4 py-4 bg-white/80">
                        <View className="flex-row items-center justify-around">
                            <View className="items-center">
                                <Text className="text-2xl mb-1">🏆</Text>
                                <Text className="text-gray-600 text-xs">레벨</Text>
                                <Text className="text-gray-900 text-xl font-bold">{garden.level}</Text>
                            </View>

                            <View className="items-center">
                                <Text className="text-2xl mb-1">💧</Text>
                                <Text className="text-gray-600 text-xs">수분</Text>
                                <Text className="text-blue-600 text-xl font-bold">{garden.waterLevel}%</Text>
                            </View>

                            <View className="items-center">
                                <Text className="text-2xl mb-1">🌸</Text>
                                <Text className="text-gray-600 text-xs">식물</Text>
                                <Text className="text-green-600 text-xl font-bold">
                                    {garden.plants.length}/{availablePlants.length}
                                </Text>
                            </View>
                        </View>

                        {/* Progress to next unlock */}
                        {nextUnlock && (
                            <View className="mt-4 bg-purple-50 p-3 rounded-xl">
                                <Text className="text-purple-900 text-xs font-medium mb-1">
                                    다음 잠금 해제: {nextUnlock.emoji}
                                </Text>
                                <View className="flex-row items-center gap-2">
                                    <View className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                                        <View
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${(garden.level / nextUnlock.minLevel) * 100}%` }}
                                        />
                                    </View>
                                    <Text className="text-xs text-gray-600">
                                        {garden.level}/{nextUnlock.minLevel}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Garden Area */}
                    <View className="flex-1 relative" style={{ minHeight: 400, backgroundColor: '#90EE90' }}>
                        {/* Ground */}
                        <View
                            className="absolute bottom-0 left-0 right-0"
                            style={{ height: 100, backgroundColor: '#8B4513' }}
                        />

                        {/* Plants */}
                        {garden.plants.map((plant) => (
                            <AnimatedPlant key={plant.id} plant={plant} onPress={() => handlePlantPress(plant)} />
                        ))}

                        {/* Empty message */}
                        {garden.plants.length === 0 && (
                            <View className="absolute inset-0 items-center justify-center">
                                <Text className="text-gray-600 text-center">
                                    식물을 심어보세요! 🌱
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View className="px-4 py-6 bg-white space-y-3">
                        <TouchableOpacity
                            onPress={waterPlants}
                            className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
                        >
                            <Text className="text-2xl">💧</Text>
                            <Text className="text-white font-bold text-lg">물 주기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={plantNewPlant}
                            className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
                        >
                            <Text className="text-2xl">🌱</Text>
                            <Text className="text-white font-bold text-lg">새 식물 심기</Text>
                        </TouchableOpacity>

                        <View className="bg-amber-50 p-4 rounded-xl">
                            <Text className="text-amber-900 text-sm">
                                💡 <Text className="font-bold">팁:</Text> 감정을 기록하면 정원 레벨이 올라가요!
                                연속으로 기록할수록 더 많은 식물을 잠금 해제할 수 있어요.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
