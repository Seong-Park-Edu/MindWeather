import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
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
    const router = useRouter();
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
    const fadeAnim = useRef(new Animated.Value(1)).current;



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
                    router.push('/modal/stats');
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

        </>
    );
}
