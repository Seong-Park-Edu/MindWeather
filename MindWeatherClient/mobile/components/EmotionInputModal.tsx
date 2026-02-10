import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
    EmotionColors,
    KoreanRegions,
    CommonTags,
    AllEmotionTypes,
    CreateEmotionRequest,
} from '../types/emotion';
import { postEmotion } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useMobileGeolocation } from '../hooks/useMobileGeolocation';

interface EmotionInputModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function EmotionInputModal({ visible, onClose, onSuccess }: EmotionInputModalProps) {
    const { user } = useAuth();
    const geo = useMobileGeolocation();
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
    const [intensity, setIntensity] = useState(5);
    const [region, setRegion] = useState('서울');
    const [useManualRegion, setUseManualRegion] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [canClose, setCanClose] = useState(false);

    // Update region when GPS address is available
    useEffect(() => {
        if (geo.address && !useManualRegion) {
            setRegion(geo.address);
        }
    }, [geo.address, useManualRegion]);

    useEffect(() => {
        if (visible) {
            // Prevent immediate closing (ghost touches)
            setCanClose(false);
            const timer = setTimeout(() => {
                setCanClose(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setCanClose(false);
        }
    }, [visible]);

    const handleBackdropPress = () => {
        if (canClose) {
            onClose();
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (selectedEmotion === null || !user) return;

        setIsSubmitting(true);
        try {
            const request: CreateEmotionRequest = {
                userId: user.id,
                emotion: selectedEmotion,
                intensity,
                region: region || 'Unknown',
                tags: selectedTags.join(' '),
                latitude: geo.latitude ?? undefined,
                longitude: geo.longitude ?? undefined,
            };

            await postEmotion(request);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                resetForm();
                onSuccess?.();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit emotion:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedEmotion(null);
        setIntensity(5);
        setSelectedTags([]);
        setUseManualRegion(false);
    };

    // Intensity buttons (1-10)
    const intensityButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {
            if (canClose) onClose();
        }}>
            <Pressable
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
                onPress={handleBackdropPress}
            >
                <Pressable style={{ backgroundColor: '#111827', width: '100%', maxWidth: 512, borderRadius: 16, overflow: 'hidden', height: '85%' }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                    >
                                {/* Title */}
                                <Text className="text-2xl font-bold text-center text-purple-400 mb-6">
                                    오늘의 마음 날씨는? ☁️
                                </Text>

                                {/* Emotion Selection */}
                                <Text className="text-gray-300 text-sm mb-3">감정 선택</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {AllEmotionTypes.map((emotion) => (
                                        <TouchableOpacity
                                            key={emotion}
                                            onPress={() => setSelectedEmotion(emotion)}
                                            className={`p-3 rounded-xl items-center ${selectedEmotion === emotion
                                                ? 'ring-2 ring-white'
                                                : 'bg-gray-800'
                                                }`}
                                            style={{
                                                backgroundColor:
                                                    selectedEmotion === emotion
                                                        ? EmotionColors[emotion] + '60'
                                                        : '#1f2937',
                                                width: '30%',
                                            }}
                                        >
                                            <Text className="text-2xl">{EmotionIcons[emotion]}</Text>
                                            <Text className="text-white text-xs mt-1">{EmotionLabels[emotion]}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Intensity Selection - Touch buttons instead of slider */}
                                <Text className="text-gray-300 text-sm mb-2">
                                    감정 강도: <Text className="text-white font-bold">{intensity}</Text>
                                </Text>
                                <View className="flex-row flex-wrap gap-2 mb-2">
                                    {intensityButtons.map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => setIntensity(val)}
                                            className={`w-8 h-8 rounded-full items-center justify-center ${intensity === val ? 'bg-purple-600' : 'bg-gray-800'
                                                }`}
                                        >
                                            <Text className={intensity === val ? 'text-white font-bold' : 'text-gray-400'}>
                                                {val}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View className="flex-row justify-between mb-6">
                                    <Text className="text-gray-400 text-xs">살짝 😊</Text>
                                    <Text className="text-gray-400 text-xs">매우 😭</Text>
                                </View>

                                {/* Region Selection */}
                                <Text className="text-gray-300 text-sm mb-3">지역 📍</Text>

                                {/* GPS Status UI */}
                                <View className="bg-gray-800 p-4 rounded-xl mb-4">
                                    {geo.loading ? (
                                        <View className="flex-row items-center justify-center py-2">
                                            <ActivityIndicator size="small" color="#A78BFA" />
                                            <Text className="text-gray-400 ml-2">위치 확인 중...</Text>
                                        </View>
                                    ) : geo.error ? (
                                        <View>
                                            <Text className="text-yellow-500 text-xs mb-2">⚠️ {geo.error}</Text>
                                            <Text className="text-white font-bold">{region}</Text>
                                        </View>
                                    ) : (
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-1">
                                                <Text className="text-green-500 text-xs mb-1">✅ 현재 위치</Text>
                                                <Text className="text-white font-bold">{region}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => geo.refresh()}
                                                className="bg-purple-600/20 px-3 py-1.5 rounded-lg"
                                            >
                                                <Text className="text-purple-400 text-xs">새로고침</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                <Text className="text-gray-500 text-[10px] mb-2">위치 정보가 정확하지 않다면 아래에서 선택해주세요</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-6"
                                    nestedScrollEnabled={true}
                                >
                                    <View className="flex-row gap-2">
                                        {KoreanRegions.map((r) => (
                                            <TouchableOpacity
                                                key={r}
                                                onPress={() => {
                                                    setRegion(r);
                                                    setUseManualRegion(true);
                                                }}
                                                className={`px-3 py-2 rounded-lg ${region === r ? 'bg-purple-600' : 'bg-gray-800'
                                                    }`}
                                            >
                                                <Text className={region === r ? 'text-white' : 'text-gray-400'}>
                                                    {r}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Tags */}
                                <Text className="text-gray-300 text-sm mb-3">태그 (선택)</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {CommonTags.map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            onPress={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-full ${selectedTags.includes(tag)
                                                ? 'bg-purple-600'
                                                : 'bg-gray-800'
                                                }`}
                                        >
                                            <Text
                                                className={
                                                    selectedTags.includes(tag)
                                                        ? 'text-white text-sm'
                                                        : 'text-gray-400 text-sm'
                                                }
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={selectedEmotion === null || isSubmitting}
                                    className={`py-4 rounded-xl items-center ${selectedEmotion !== null && !isSubmitting
                                        ? 'bg-purple-600'
                                        : 'bg-gray-700'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text
                                            className={
                                                selectedEmotion !== null
                                                    ? 'text-white font-bold text-lg'
                                                    : 'text-gray-500 text-lg'
                                            }
                                        >
                                            마음 기록하기 💫
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Success overlay */}
                                {showSuccess && (
                                    <View className="absolute inset-0 bg-black/80 items-center justify-center rounded-2xl">
                                        <Text className="text-6xl mb-4">✨</Text>
                                        <Text className="text-white text-xl font-bold">마음이 기록되었습니다!</Text>
                                    </View>
                                )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
