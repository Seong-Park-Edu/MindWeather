import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { getWeeklyInsights, WeeklyInsights as WeeklyInsightsData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { EmotionLabels, EmotionIcons, EmotionType } from '../types/emotion';

const DAY_TRANSLATION: Record<string, string> = {
    'Monday': '월요일',
    'Tuesday': '화요일',
    'Wednesday': '수요일',
    'Thursday': '목요일',
    'Friday': '금요일',
    'Saturday': '토요일',
    'Sunday': '일요일',
};

export function WeeklyInsights() {
    const { user, isGuest } = useAuth();
    const [insights, setInsights] = useState<WeeklyInsightsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || isGuest || user.id === 'guest-user') {
            setLoading(false);
            return;
        }

        const fetchInsights = async () => {
            if (!user || isGuest || user.id === 'guest-user') {
                setLoading(false);
                return;
            }

            try {
                const data = await getWeeklyInsights(user.id);
                setInsights(data);
            } catch (error) {
                console.error('Failed to fetch weekly insights:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [user, isGuest]);

    if (isGuest || !user) return null;

    if (loading) {
        return (
            <View className="bg-gray-800 rounded-2xl p-6 border border-gray-700 items-center">
                <ActivityIndicator size="small" color="#A78BFA" />
            </View>
        );
    }

    if (!insights || !insights.hasData) {
        return (
            <View className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <Text className="text-white text-lg font-bold mb-2">📊 지난 주 리포트</Text>
                <Text className="text-gray-400 text-center py-4">
                    아직 충분한 데이터가 없어요.{'\n'}감정을 기록하고 인사이트를 받아보세요!
                </Text>
            </View>
        );
    }

    const dominantEmotionType = insights.dominantEmotion as EmotionType;

    return (
        <View className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/30">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View>
                    <Text className="text-white text-xl font-bold">📊 지난 주 리포트</Text>
                    <Text className="text-gray-400 text-xs mt-1">최근 7일간의 감정 분석</Text>
                </View>
                <View className="bg-purple-500/20 px-3 py-1.5 rounded-full">
                    <Text className="text-purple-300 text-xs font-bold">{insights.totalEmotions}개 기록</Text>
                </View>
            </View>

            {/* Main Stats */}
            <View className="gap-4">
                {/* Dominant Emotion */}
                <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <Text className="text-gray-400 text-xs mb-2">가장 많이 느낀 감정</Text>
                    <View className="flex-row items-center gap-3">
                        <Text className="text-4xl">{EmotionIcons[dominantEmotionType]}</Text>
                        <View>
                            <Text className="text-white text-xl font-bold">
                                {EmotionLabels[dominantEmotionType]}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                                {insights.emotionBreakdown[dominantEmotionType]}회 기록됨
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row gap-3">
                    {/* Average Intensity */}
                    <View className="flex-1 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <Text className="text-gray-400 text-xs mb-1">평균 강도</Text>
                        <Text className="text-white text-2xl font-bold">
                            {insights.averageIntensity}
                        </Text>
                        <Text className="text-gray-500 text-xs">/ 5.0</Text>
                    </View>

                    {/* Positive Percentage */}
                    <View className="flex-1 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <Text className="text-gray-400 text-xs mb-1">긍정 비율</Text>
                        <Text className="text-green-400 text-2xl font-bold">
                            {insights.positivePercentage}%
                        </Text>
                        <Text className="text-gray-500 text-xs">긍정적 감정</Text>
                    </View>
                </View>

                {/* Most Active Day */}
                {insights.mostProductiveDay && (
                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <Text className="text-gray-400 text-xs mb-2">가장 많이 기록한 날</Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-2xl">📅</Text>
                            <Text className="text-white text-lg font-bold">
                                {DAY_TRANSLATION[insights.mostProductiveDay] || insights.mostProductiveDay}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                                ({insights.dayOfWeekPattern[insights.mostProductiveDay]}회)
                            </Text>
                        </View>
                    </View>
                )}

                {/* Emotion Breakdown */}
                <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <Text className="text-gray-400 text-xs mb-3">감정 분포</Text>
                    <View className="gap-2">
                        {Object.entries(insights.emotionBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([emotion, count]) => {
                                const emotionType = parseInt(emotion) as EmotionType;
                                const percentage = (count / insights.totalEmotions) * 100;
                                return (
                                    <View key={emotion} className="flex-row items-center gap-2">
                                        <Text className="text-xl">{EmotionIcons[emotionType]}</Text>
                                        <Text className="text-gray-300 text-sm flex-1">
                                            {EmotionLabels[emotionType]}
                                        </Text>
                                        <Text className="text-gray-400 text-xs">{count}회</Text>
                                        <View className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <View
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                    </View>
                </View>

                {/* Insight Message */}
                <View className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                    <View className="flex-row items-start gap-2">
                        <Text className="text-2xl">💡</Text>
                        <View className="flex-1">
                            <Text className="text-purple-300 text-sm font-medium mb-1">인사이트</Text>
                            <Text className="text-gray-300 text-sm">
                                {getInsightMessage(insights)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

function getInsightMessage(insights: WeeklyInsightsData): string {
    if (insights.positivePercentage >= 70) {
        return '이번 주는 긍정적인 감정이 많았어요! 🌟 좋은 한 주를 보내셨네요.';
    } else if (insights.positivePercentage >= 50) {
        return '균형잡힌 한 주였어요. 긍정과 부정적 감정을 모두 경험했군요.';
    } else if (insights.averageIntensity >= 4) {
        return '감정의 강도가 높았던 한 주예요. 휴식이 필요할 수 있어요. 🌿';
    } else if (insights.totalEmotions >= 10) {
        return '감정을 꾸준히 기록하고 계시네요! 자기 인식이 높아지고 있어요. 📈';
    } else {
        return '이번 주도 수고하셨어요. 계속해서 감정을 기록해보세요. ✨';
    }
}
