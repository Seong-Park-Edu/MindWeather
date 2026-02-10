import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, Modal, Pressable } from 'react-native';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
} from '../types/emotion';
import { getEmotionStats, getComfortStats, getEmotionsForMap, getUserStreak } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';

interface TickerProps {
    onModalStateChange?: (isOpen: boolean) => void;
}

export function Ticker({ onModalStateChange }: TickerProps) {
    const { user, isGuest } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
    const [todayCount, setTodayCount] = useState(0);
    const [totalComforts, setTotalComforts] = useState(0);
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);
    const [currentStreak, setCurrentStreak] = useState<number | null>(null);
    const [totalDays, setTotalDays] = useState<number | null>(null);
    const [longestStreak, setLongestStreak] = useState<number | null>(null);
    const [tickerIndex, setTickerIndex] = useState(0);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [canClose, setCanClose] = useState(false); // Fix for ghost touch
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        onModalStateChange?.(showStatsModal);
    }, [showStatsModal, onModalStateChange]);

    useEffect(() => {
        if (showStatsModal) {
            setCanClose(false);
            const timer = setTimeout(() => setCanClose(true), 500);
            return () => clearTimeout(timer);
        } else {
            setCanClose(false);
        }
    }, [showStatsModal]);

    const handleBackdropPress = () => {
        if (canClose) {
            console.log('Ticker Backdrop pressed, closing modal');
            setShowStatsModal(false);
        } else {
            console.log('Ticker Backdrop pressed too early, ignoring');
        }
    };

    useEffect(() => {
        loadStats();
        loadStreak();
        const interval = setInterval(() => {
            loadStats();
            loadStreak();
        }, 30000);
        return () => clearInterval(interval);
    }, [user, isGuest]);

    useEffect(() => {
        const messageCount = (!isGuest && currentStreak !== null) ? 4 : 3;
        const tickerInterval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Change message
                setTickerIndex((prev) => (prev + 1) % messageCount);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, 4000);
        return () => clearInterval(tickerInterval);
    }, [isGuest, currentStreak, fadeAnim]);

    const loadStats = async () => {
        try {
            const [emotionStats, comfortStats, emotions] = await Promise.all([
                getEmotionStats(),
                getComfortStats(),
                getEmotionsForMap(),
            ]);
            setTodayCount(emotionStats.todayCount);
            setTotalComforts(comfortStats.totalComforts);

            if (emotions && emotions.length > 0) {
                const emotionCounts = new Map<EmotionType, number>();
                emotions.forEach(e => {
                    emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) || 0) + 1);
                });

                let maxCount = 0;
                let domEmotion: EmotionType = EmotionType.Calm;

                emotionCounts.forEach((count, emotion) => {
                    if (count > maxCount) {
                        maxCount = count;
                        domEmotion = emotion;
                    }
                });
                setDominantEmotion(domEmotion);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadStreak = async () => {
        if (!user || isGuest || user.id === 'guest-user') {
            setCurrentStreak(null);
            setTotalDays(null);
            return;
        }
        try {
            const streak = await getUserStreak(user.id);
            setCurrentStreak(streak.currentStreak);
            setTotalDays(streak.totalDays);
            setLongestStreak(streak.longestStreak);
        } catch (error) {
            console.error('Failed to load streak:', error);
            setCurrentStreak(null);
            setTotalDays(null);
            setLongestStreak(null);
        }
    };

    const getStreakEmoji = (days: number): string => {
        if (days === 0) return '💤';
        if (days < 7) return '🔥';
        if (days < 30) return '🔥🔥';
        if (days < 100) return '🔥🔥🔥';
        return '🏆';
    };

    const tickerMessages = [
        `오늘 ${todayCount.toLocaleString()}명이 마음을 공유했어요 💭`,
        dominantEmotion !== null
            ? `${EmotionIcons[dominantEmotion]} 가장 많은 감정: "${EmotionLabels[dominantEmotion]}"`
            : "☁️ 아직 기록된 감정이 없어요",
        `총 ${totalComforts.toLocaleString()}번의 위로가 전해졌어요 ✨`,
    ];

    // Add streak message for logged-in users
    if (!isGuest && currentStreak !== null && totalDays !== null) {
        if (currentStreak === 0) {
            // Show total days instead when streak is broken
            tickerMessages.push(
                totalDays > 0
                    ? `${getStreakEmoji(0)} 총 ${totalDays}일 기록했어요! 오늘도 기록해볼까요?`
                    : `${getStreakEmoji(0)} 오늘 감정을 기록하고 스트릭을 시작해보세요!`
            );
        } else {
            tickerMessages.push(
                `${getStreakEmoji(currentStreak)} 내 스트릭: ${currentStreak}일 연속 기록 중!`
            );
        }
    }

    return (
        <>
            <TouchableOpacity
                onPress={() => {
                    setShowStatsModal(true);
                }}
                activeOpacity={0.7}
                style={{
                    backgroundColor: colors.bg.secondary + 'E6',
                    borderTopColor: colors.border,
                    borderTopWidth: 1
                }}
                className="px-4 py-3"
            >
                <View className="flex-row items-center gap-3">
                    {/* Live indicator */}
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2 h-2 bg-red-500 rounded-full" />
                        <Text style={{ color: colors.text.tertiary }} className="text-xs">LIVE</Text>
                    </View>

                    {/* Ticker content */}
                    <View className="flex-1">
                        <Animated.Text
                            style={{
                                color: colors.text.primary,
                                opacity: fadeAnim
                            }}
                            className="text-center text-sm"
                            numberOfLines={1}
                        >
                            {tickerMessages[tickerIndex]}
                        </Animated.Text>
                    </View>

                    {/* Stats badges - Icon only */}
                    <View className="flex-row gap-2">
                        <View className="bg-purple-500/20 px-2 py-1 rounded-full">
                            <Text className="text-xs">
                                🎭 <Text className="font-bold text-white">{todayCount}</Text>
                            </Text>
                        </View>
                        <View className="bg-pink-500/20 px-2 py-1 rounded-full">
                            <Text className="text-xs">
                                🤗 <Text className="font-bold text-white">{totalComforts}</Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Stats Modal */}
            <Modal
                visible={showStatsModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (canClose) setShowStatsModal(false);
                }}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                    onPress={handleBackdropPress}
                >
                    <Pressable
                        style={{
                            backgroundColor: colors.bg.secondary,
                            borderColor: colors.border
                        }}
                        className="rounded-3xl p-6 w-full max-w-md border"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View className="items-center mb-6">
                            <Text className="text-2xl mb-2">📊</Text>
                            <Text style={{ color: colors.text.primary }} className="text-xl font-bold">실시간 통계</Text>
                            <Text style={{ color: colors.text.secondary }} className="text-xs mt-1">현재 Mind Weather 현황</Text>
                        </View>

                        {/* Stats Grid */}
                        <View className="gap-4">
                            {/* Today's Emotions */}
                            <View className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/20">
                                <View className="flex-row items-center gap-3">
                                    <Text className="text-3xl">🎭</Text>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs mb-1">오늘 공유된 감정</Text>
                                        <Text className="text-white text-2xl font-bold">{todayCount.toLocaleString()}</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5">명이 마음을 공유했어요</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Dominant Emotion */}
                            {dominantEmotion !== null && (
                                <View className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-3xl">{EmotionIcons[dominantEmotion]}</Text>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs mb-1">가장 많은 감정</Text>
                                            <Text className="text-white text-xl font-bold">{EmotionLabels[dominantEmotion]}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">지금 이 감정이 가장 많아요</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Total Comforts */}
                            <View className="bg-pink-500/10 rounded-2xl p-4 border border-pink-500/20">
                                <View className="flex-row items-center gap-3">
                                    <Text className="text-3xl">🤗</Text>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs mb-1">전달된 위로</Text>
                                        <Text className="text-white text-2xl font-bold">{totalComforts.toLocaleString()}</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5">번의 따뜻한 위로가 전해졌어요</Text>
                                    </View>
                                </View>
                            </View>

                            {/* User Streak - Only for logged in users */}
                            {!isGuest && currentStreak !== null && totalDays !== null && (
                                <View className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/20">
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-3xl">{getStreakEmoji(currentStreak)}</Text>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs mb-1">내 기록</Text>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-white text-xl font-bold">{currentStreak}일 연속</Text>
                                                {longestStreak !== null && longestStreak > 0 && (
                                                    <Text className="text-gray-500 text-xs">(최고: {longestStreak}일)</Text>
                                                )}
                                            </View>
                                            <Text className="text-gray-500 text-xs mt-0.5">총 {totalDays}일 기록했어요</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={() => setShowStatsModal(false)}
                            style={{ backgroundColor: colors.bg.tertiary }}
                            className="mt-6 py-3 rounded-xl"
                        >
                            <Text style={{ color: colors.text.primary }} className="text-center font-medium">닫기</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
