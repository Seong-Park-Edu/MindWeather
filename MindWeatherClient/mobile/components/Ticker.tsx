import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
    EmotionLabels,
    EmotionIcons,
} from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useStats, getStreakEmoji } from '../hooks/useStats';

interface TickerProps {
    onModalStateChange?: (isOpen: boolean) => void;
}

export function Ticker({ onModalStateChange }: TickerProps) {
    const router = useRouter();
    const { isGuest } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
    const {
        todayCount,
        totalComforts,
        dominantEmotion,
        currentStreak,
        totalDays,
    } = useStats(60000);

    const [tickerIndex, setTickerIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

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
