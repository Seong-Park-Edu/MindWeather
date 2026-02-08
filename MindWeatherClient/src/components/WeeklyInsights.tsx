import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWeeklyInsights } from '../services/api';
import type { WeeklyInsightsData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Emotion types mapping
const EmotionLabels: Record<number, string> = {
    0: '기쁨', 1: '흥분', 2: '슬픔', 3: '우울',
    4: '분노', 5: '평온', 6: '불안', 7: '피로',
    8: '지루함', 9: '외로움'
};

const EmotionIcons: Record<number, string> = {
    0: '😊', 1: '🤩', 2: '😢', 3: '😔',
    4: '😠', 5: '😌', 6: '😰', 7: '😩',
    8: '😐', 9: '🥺'
};

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
    const { user } = useAuth();
    const [insights, setInsights] = useState<WeeklyInsightsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchInsights = async () => {
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
    }, [user]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!insights || !insights.hasData) {
        return (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white text-lg font-bold mb-2">📊 지난 주 리포트</h3>
                <p className="text-gray-400 text-center py-4">
                    아직 충분한 데이터가 없어요.<br />감정을 기록하고 인사이트를 받아보세요!
                </p>
            </div>
        );
    }

    const getInsightMessage = (): string => {
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
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-white text-xl font-bold">📊 지난 주 리포트</h3>
                    <p className="text-gray-400 text-xs mt-1">최근 7일간의 감정 분석</p>
                </div>
                <div className="bg-purple-500/20 px-3 py-1.5 rounded-full">
                    <span className="text-purple-300 text-xs font-bold">{insights.totalEmotions}개 기록</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Dominant Emotion */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-400 text-xs mb-2">가장 많이 느낀 감정</p>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{EmotionIcons[insights.dominantEmotion]}</span>
                        <div>
                            <p className="text-white text-xl font-bold">
                                {EmotionLabels[insights.dominantEmotion]}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {insights.emotionBreakdown[insights.dominantEmotion]}회 기록됨
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <p className="text-gray-400 text-xs mb-1">평균 강도</p>
                        <p className="text-white text-2xl font-bold">{insights.averageIntensity}</p>
                        <p className="text-gray-500 text-xs">/ 5.0</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <p className="text-gray-400 text-xs mb-1">긍정 비율</p>
                        <p className="text-green-400 text-2xl font-bold">{insights.positivePercentage}%</p>
                        <p className="text-gray-500 text-xs">긍정적 감정</p>
                    </div>
                </div>

                {/* Most Active Day */}
                {insights.mostProductiveDay && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <p className="text-gray-400 text-xs mb-2">가장 많이 기록한 날</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📅</span>
                            <span className="text-white text-lg font-bold">
                                {DAY_TRANSLATION[insights.mostProductiveDay] || insights.mostProductiveDay}
                            </span>
                            <span className="text-gray-400 text-sm">
                                ({insights.dayOfWeekPattern[insights.mostProductiveDay]}회)
                            </span>
                        </div>
                    </div>
                )}

                {/* Emotion Breakdown */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-400 text-xs mb-3">감정 분포</p>
                    <div className="space-y-2">
                        {Object.entries(insights.emotionBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([emotion, count]) => {
                                const emotionType = parseInt(emotion);
                                const percentage = (count / insights.totalEmotions) * 100;
                                return (
                                    <div key={emotion} className="flex items-center gap-2">
                                        <span className="text-xl w-8">{EmotionIcons[emotionType]}</span>
                                        <span className="text-gray-300 text-sm flex-1">
                                            {EmotionLabels[emotionType]}
                                        </span>
                                        <span className="text-gray-400 text-xs">{count}회</span>
                                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 0.5, delay: 0.1 }}
                                                className="h-full bg-purple-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Insight Message */}
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">💡</span>
                        <div className="flex-1">
                            <p className="text-purple-300 text-sm font-medium mb-1">인사이트</p>
                            <p className="text-gray-300 text-sm">{getInsightMessage()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
