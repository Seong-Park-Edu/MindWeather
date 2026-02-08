import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignalR } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
} from '../types/emotion';
import { getEmotionStats, getComfortStats, getEmotionsForMap, getPublicMessages, getUserStreak } from '../services/api';
import type { StreakData } from '../services/api';

export function Ticker() {
    const { latestEmotion } = useSignalR();
    const { user } = useAuth();
    const [todayCount, setTodayCount] = useState(0);
    const [totalComforts, setTotalComforts] = useState(0);
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);
    const [topPublicMessage, setTopPublicMessage] = useState<string | null>(null);
    const [tickerIndex, setTickerIndex] = useState(0);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [streakData, setStreakData] = useState<StreakData | null>(null);

    useEffect(() => {
        if (latestEmotion) {
            setTodayCount(prev => prev + 1);
        }
    }, [latestEmotion]);

    useEffect(() => {
        loadStats();
        loadStreak();
        const interval = setInterval(() => {
            loadStats();
            loadStreak();
        }, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const messageCount = user && streakData ? 4 : 4;
        const tickerInterval = setInterval(() => {
            setTickerIndex((prev) => (prev + 1) % messageCount);
        }, 4000);
        return () => clearInterval(tickerInterval);
    }, [user, streakData]);

    const loadStats = async () => {
        try {
            const [emotionStats, comfortStats, emotions, publicMsgs] = await Promise.all([
                getEmotionStats(),
                getComfortStats(),
                getEmotionsForMap(),
                getPublicMessages('top')
            ]);
            setTodayCount(emotionStats.todayCount);
            setTotalComforts(comfortStats.totalComforts);

            if (publicMsgs && publicMsgs.length > 0) {
                setTopPublicMessage(publicMsgs[0].content);
            }

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
            } else {
                setDominantEmotion(null);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadStreak = async () => {
        if (!user) {
            setStreakData(null);
            return;
        }
        try {
            const data = await getUserStreak(user.id);
            setStreakData(data);
        } catch (error) {
            console.error('Failed to load streak:', error);
            setStreakData(null);
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
        topPublicMessage
            ? `💌 오늘의 추천 위로: "${topPublicMessage.length > 20 ? topPublicMessage.slice(0, 20) + '...' : topPublicMessage}"`
            : `총 ${totalComforts.toLocaleString()}번의 위로가 전해졌어요 ✨`,
        user && streakData
            ? streakData.currentStreak === 0
                ? streakData.totalDays > 0
                    ? `${getStreakEmoji(0)} 총 ${streakData.totalDays}일 기록했어요! 오늘도 기록해볼까요?`
                    : `${getStreakEmoji(0)} 오늘 감정을 기록하고 스트릭을 시작해보세요!`
                : `${getStreakEmoji(streakData.currentStreak)} 내 스트릭: ${streakData.currentStreak}일 연속 기록 중!`
            : `총 ${totalComforts.toLocaleString()}번의 마음의 연결이 이루어졌습니다 ✨`
    ];

    return (
        <>
            {/* Clickable Ticker - matches mobile style */}
            <button
                onClick={() => setShowStatsModal(true)}
                className="w-full bg-gray-800/90 border-t border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-700/90 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-gray-400">LIVE</span>
                    </div>

                    {/* Ticker content */}
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tickerIndex}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-center text-sm text-white truncate"
                            >
                                {tickerMessages[tickerIndex]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Stats badges - Icon only like mobile */}
                    <div className="flex gap-2 shrink-0">
                        <div className="bg-purple-500/20 px-2 py-1 rounded-full text-xs">
                            🎭 <span className="font-bold text-white">{todayCount}</span>
                        </div>
                        <div className="bg-pink-500/20 px-2 py-1 rounded-full text-xs">
                            🤗 <span className="font-bold text-white">{totalComforts}</span>
                        </div>
                    </div>
                </div>
            </button>

            {/* Stats Modal - exactly like mobile */}
            <AnimatePresence>
                {showStatsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowStatsModal(false)}
                        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center px-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-3xl p-6"
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <span className="text-2xl mb-2 block">📊</span>
                                <h2 className="text-white text-xl font-bold">실시간 통계</h2>
                                <p className="text-gray-400 text-xs mt-1">현재 Mind Weather 현황</p>
                            </div>

                            {/* Stats Grid - exactly like mobile */}
                            <div className="space-y-4">
                                {/* Today's Emotions */}
                                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🎭</span>
                                        <div className="flex-1">
                                            <p className="text-gray-400 text-xs mb-1">오늘 공유된 감정</p>
                                            <p className="text-white text-2xl font-bold">{todayCount.toLocaleString()}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">명이 마음을 공유했어요</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dominant Emotion */}
                                {dominantEmotion !== null && (
                                    <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{EmotionIcons[dominantEmotion]}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-400 text-xs mb-1">가장 많은 감정</p>
                                                <p className="text-white text-xl font-bold">{EmotionLabels[dominantEmotion]}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">지금 이 감정이 가장 많아요</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Total Comforts */}
                                <div className="bg-pink-500/10 rounded-2xl p-4 border border-pink-500/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🤗</span>
                                        <div className="flex-1">
                                            <p className="text-gray-400 text-xs mb-1">전달된 위로</p>
                                            <p className="text-white text-2xl font-bold">{totalComforts.toLocaleString()}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">번의 따뜻한 위로가 전해졌어요</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Streak - Only for logged in users */}
                                {user && streakData && (
                                    <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/20">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{getStreakEmoji(streakData.currentStreak)}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-400 text-xs mb-1">내 기록</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white text-xl font-bold">{streakData.currentStreak}일 연속</p>
                                                    {streakData.longestStreak > 0 && (
                                                        <span className="text-gray-500 text-xs">(최고: {streakData.longestStreak}일)</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 text-xs mt-0.5">총 {streakData.totalDays}일 기록했어요</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Close button - matches mobile */}
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
                            >
                                닫기
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
