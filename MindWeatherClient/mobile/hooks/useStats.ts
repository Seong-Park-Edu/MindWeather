import { useState, useEffect, useCallback } from 'react';
import { EmotionType } from '../types/emotion';
import { getEmotionStats, getComfortStats, getEmotionsForMap, getUserStreak } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface StatsData {
    todayCount: number;
    totalComforts: number;
    dominantEmotion: EmotionType | null;
    currentStreak: number | null;
    totalDays: number | null;
    longestStreak: number | null;
    loading: boolean;
    refresh: () => void;
}

export function getStreakEmoji(days: number): string {
    if (days === 0) return '\u{1F4A4}';
    if (days < 7) return '\u{1F525}';
    if (days < 30) return '\u{1F525}\u{1F525}';
    if (days < 100) return '\u{1F525}\u{1F525}\u{1F525}';
    return '\u{1F3C6}';
}

/**
 * 통계 데이터를 가져오는 커스텀 훅
 * @param pollingInterval - 폴링 간격 (ms). 0이면 폴링 안 함
 */
export function useStats(pollingInterval = 0): StatsData {
    const { user, isGuest } = useAuth();

    const [todayCount, setTodayCount] = useState(0);
    const [totalComforts, setTotalComforts] = useState(0);
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);
    const [currentStreak, setCurrentStreak] = useState<number | null>(null);
    const [totalDays, setTotalDays] = useState<number | null>(null);
    const [longestStreak, setLongestStreak] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
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
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStreak = useCallback(async () => {
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
    }, [user, isGuest]);

    const refresh = useCallback(() => {
        loadStats();
        loadStreak();
    }, [loadStats, loadStreak]);

    useEffect(() => {
        loadStats();
        loadStreak();

        if (pollingInterval > 0) {
            const interval = setInterval(() => {
                loadStats();
                loadStreak();
            }, pollingInterval);
            return () => clearInterval(interval);
        }
    }, [user, isGuest, pollingInterval, loadStats, loadStreak]);

    return {
        todayCount,
        totalComforts,
        dominantEmotion,
        currentStreak,
        totalDays,
        longestStreak,
        loading,
        refresh,
    };
}
