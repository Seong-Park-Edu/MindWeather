import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
} from '../types/emotion';
import { getEmotionStats, getComfortStats, getEmotionsForMap } from '../services/api';

export function Ticker() {
    const [todayCount, setTodayCount] = useState(0);
    const [totalComforts, setTotalComforts] = useState(0);
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);
    const [tickerIndex, setTickerIndex] = useState(0);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const tickerInterval = setInterval(() => {
            setTickerIndex((prev) => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(tickerInterval);
    }, []);

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

    const tickerMessages = [
        `오늘 ${todayCount.toLocaleString()}명이 마음을 공유했어요 💭`,
        dominantEmotion !== null
            ? `${EmotionIcons[dominantEmotion]} 가장 많은 감정: "${EmotionLabels[dominantEmotion]}"`
            : "☁️ 아직 기록된 감정이 없어요",
        `총 ${totalComforts.toLocaleString()}번의 위로가 전해졌어요 ✨`,
    ];

    return (
        <View className="bg-gray-900/90 border-t border-gray-800 px-4 py-3">
            <View className="flex-row items-center gap-3">
                {/* Live indicator */}
                <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 bg-red-500 rounded-full" />
                    <Text className="text-xs text-gray-400">LIVE</Text>
                </View>

                {/* Ticker content */}
                <View className="flex-1">
                    <Text className="text-white text-center text-sm" numberOfLines={1}>
                        {tickerMessages[tickerIndex]}
                    </Text>
                </View>

                {/* Stats badges */}
                <View className="flex-row gap-2">
                    <View className="bg-purple-500/20 px-2 py-1 rounded-full">
                        <Text className="text-purple-300 text-xs">
                            공유 <Text className="font-bold text-white">{todayCount}</Text>
                        </Text>
                    </View>
                    <View className="bg-pink-500/20 px-2 py-1 rounded-full">
                        <Text className="text-pink-300 text-xs">
                            위로 <Text className="font-bold text-white">{totalComforts}</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
