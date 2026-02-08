import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserStreak } from '../services/api';
import type { StreakData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StreakDisplayProps {
    compact?: boolean;
}

export function StreakDisplay({ compact = false }: StreakDisplayProps) {
    const { user } = useAuth();
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStreak = async () => {
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
    }, [user]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!streak) return null;

    const getStreakEmoji = (days: number): string => {
        if (days === 0) return '💤';
        if (days < 7) return '🔥';
        if (days < 30) return '🔥🔥';
        if (days < 100) return '🔥🔥🔥';
        return '🏆';
    };

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
            <div className="flex items-center gap-2">
                <span className="text-lg">{getStreakEmoji(streak.currentStreak)}</span>
                <span className="text-gray-400 text-sm">{streak.currentStreak}일 연속</span>
            </div>
        );
    }

    const milestones = [
        { days: 7, emoji: '🎯', label: '일주일' },
        { days: 30, emoji: '🌟', label: '한 달' },
        { days: 100, emoji: '👑', label: '백일' },
        { days: 365, emoji: '🏆', label: '일 년' },
    ];

    const nextMilestone = milestones.find(m => m.days > streak.currentStreak);
    const remaining = nextMilestone ? nextMilestone.days - streak.currentStreak : 0;
    const progress = nextMilestone ? (streak.currentStreak / nextMilestone.days) * 100 : 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
            {/* Current Streak - Main Display */}
            <div className="text-center mb-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="text-6xl mb-3"
                >
                    {getStreakEmoji(streak.currentStreak)}
                </motion.div>
                <div className="flex items-baseline justify-center gap-2">
                    <span className="text-white text-5xl font-bold">{streak.currentStreak}</span>
                    <span className="text-gray-400 text-xl">일 연속</span>
                </div>
                <p className="text-purple-400 mt-2 font-medium">
                    {getStreakMessage(streak.currentStreak)}
                </p>
            </div>

            {/* Stats Row */}
            <div className="flex justify-around pt-6 border-t border-gray-700">
                <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">최고 기록</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-white text-2xl font-bold">{streak.longestStreak}</span>
                        <span className="text-gray-500 text-sm">일</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">총 기록일</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-white text-2xl font-bold">{streak.totalDays}</span>
                        <span className="text-gray-500 text-sm">일</span>
                    </div>
                </div>
            </div>

            {/* Next Milestone */}
            {streak.currentStreak > 0 && nextMilestone && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-400 text-xs mb-3">다음 목표</p>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 text-sm">
                            {nextMilestone.emoji} {nextMilestone.label}
                        </span>
                        <span className="text-gray-400 text-xs">{remaining}일 남음</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                </div>
            )}

            {streak.currentStreak > 0 && !nextMilestone && (
                <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                    <p className="text-purple-300 font-medium">모든 목표 달성! 🎊</p>
                </div>
            )}
        </motion.div>
    );
}
