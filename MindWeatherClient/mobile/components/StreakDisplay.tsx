import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getUserStreak, StreakData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StreakDisplayProps {
    compact?: boolean;
}

export function StreakDisplay({ compact = false }: StreakDisplayProps) {
    const { user, isGuest } = useAuth();
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Early return for guests or no user
        if (!user || isGuest || user.id === 'guest-user') {
            setLoading(false);
            return;
        }

        const fetchStreak = async () => {
            // Double-check before API call
            if (!user || isGuest || user.id === 'guest-user') {
                setLoading(false);
                return;
            }

            try {
                const data = await getUserStreak(user.id);
                setStreak(data);
            } catch (error) {
                console.error('Failed to fetch streak:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStreak();
    }, [user, isGuest]);

    if (isGuest || !user) return null;

    if (loading) {
        return (
            <View className="items-center py-2">
                <ActivityIndicator size="small" color="#A78BFA" />
            </View>
        );
    }

    if (!streak) return null;

    // Get streak emoji based on current streak
    const getStreakEmoji = (days: number): string => {
        if (days === 0) return '💤';
        if (days < 7) return '🔥';
        if (days < 30) return '🔥🔥';
        if (days < 100) return '🔥🔥🔥';
        return '🏆';
    };

    // Get streak message
    const getStreakMessage = (days: number): string => {
        if (days === 0) return '오늘 감정을 기록해보세요!';
        if (days === 1) return '좋은 시작이에요!';
        if (days < 7) return '계속 기록 중!';
        if (days === 7) return '일주일 달성! 🎉';
        if (days < 30) return '대단해요! 계속 가세요!';
        if (days === 30) return '한 달 달성! 🎊';
        if (days < 100) return '멈출 수 없어요! 🚀';
        if (days === 100) return '100일 달성! 전설이에요! 👑';
        return '레전드! 🌟';
    };

    if (compact) {
        return (
            <View className="flex-row items-center gap-2 bg-purple-500/20 px-3 py-2 rounded-full border border-purple-500/30">
                <Text className="text-xl">{getStreakEmoji(streak.currentStreak)}</Text>
                <Text className="text-white font-bold text-sm">{streak.currentStreak}일</Text>
            </View>
        );
    }

    return (
        <View className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            {/* Current Streak - Main Display */}
            <View className="items-center mb-6">
                <Text className="text-6xl mb-3">{getStreakEmoji(streak.currentStreak)}</Text>
                <View className="flex-row items-baseline gap-2">
                    <Text className="text-white text-5xl font-bold">{streak.currentStreak}</Text>
                    <Text className="text-gray-400 text-xl">일 연속</Text>
                </View>
                <Text className="text-purple-400 text-center mt-2 font-medium">
                    {getStreakMessage(streak.currentStreak)}
                </Text>
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-around pt-6 border-t border-gray-700">
                {/* Longest Streak */}
                <View className="items-center">
                    <Text className="text-gray-400 text-xs mb-1">최고 기록</Text>
                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-2xl font-bold">{streak.longestStreak}</Text>
                        <Text className="text-gray-500 text-sm">일</Text>
                    </View>
                </View>

                {/* Total Days */}
                <View className="items-center">
                    <Text className="text-gray-400 text-xs mb-1">총 기록일</Text>
                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-2xl font-bold">{streak.totalDays}</Text>
                        <Text className="text-gray-500 text-sm">일</Text>
                    </View>
                </View>
            </View>

            {/* Milestones Progress */}
            {streak.currentStreak > 0 && (
                <View className="mt-6 pt-6 border-t border-gray-700">
                    <Text className="text-gray-400 text-xs mb-3">다음 목표</Text>
                    <View className="space-y-2">
                        {renderNextMilestone(streak.currentStreak)}
                    </View>
                </View>
            )}
        </View>
    );
}

function renderNextMilestone(currentStreak: number): JSX.Element {
    const milestones = [
        { days: 7, emoji: '🎯', label: '일주일' },
        { days: 30, emoji: '🌟', label: '한 달' },
        { days: 100, emoji: '👑', label: '백일' },
        { days: 365, emoji: '🏆', label: '일 년' },
    ];

    const nextMilestone = milestones.find(m => m.days > currentStreak);

    if (!nextMilestone) {
        return (
            <View className="items-center py-2">
                <Text className="text-purple-300 font-medium">모든 목표 달성! 🎊</Text>
            </View>
        );
    }

    const remaining = nextMilestone.days - currentStreak;
    const progress = (currentStreak / nextMilestone.days) * 100;

    return (
        <View>
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-300 text-sm">
                    {nextMilestone.emoji} {nextMilestone.label}
                </Text>
                <Text className="text-gray-400 text-xs">{remaining}일 남음</Text>
            </View>
            <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <View
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </View>
        </View>
    );
}
