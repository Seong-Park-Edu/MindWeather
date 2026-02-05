import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignalR } from '../contexts/SignalRContext';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
} from '../types/emotion';
import { getEmotionStats, getComfortStats, getEmotionsForMap, getPublicMessages } from '../services/api';

export function Ticker() {
    const { latestEmotion } = useSignalR();
    const [todayCount, setTodayCount] = useState(0);
    const [totalComforts, setTotalComforts] = useState(0);
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);
    const [topPublicMessage, setTopPublicMessage] = useState<string | null>(null);
    const [tickerIndex, setTickerIndex] = useState(0);

    // Live update for stats
    useEffect(() => {
        if (latestEmotion) {
            setTodayCount(prev => prev + 1);
        }
    }, [latestEmotion]);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const tickerInterval = setInterval(() => {
            setTickerIndex((prev) => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(tickerInterval);
    }, []);

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

    const tickerMessages = [
        `오늘 ${todayCount.toLocaleString()}명이 마음을 공유했어요 💭`,
        dominantEmotion !== null
            ? `${EmotionIcons[dominantEmotion]} 지금 가장 많은 감정은 "${EmotionLabels[dominantEmotion]}" 입니다`
            : "☁️ 아직 기록된 감정 날씨가 없어요",
        topPublicMessage
            ? `💌 오늘의 추천 위로: "${topPublicMessage.length > 20 ? topPublicMessage.slice(0, 20) + '...' : topPublicMessage}"`
            : `오늘 ${totalComforts.toLocaleString()}개의 따뜻한 위로가 전해졌어요 🌈`,
        `총 ${totalComforts.toLocaleString()}번의 마음의 연결이 이루어졌습니다 ✨`
    ];

    return (
        <div className="glass rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-4">
                {/* Live indicator */}
                <div className="flex items-center gap-2 shrink-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-red-500 rounded-full"
                    />
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
                            transition={{ duration: 0.5 }}
                            className="text-center font-medium"
                        >
                            {tickerMessages[tickerIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Stats badges */}
                <div className="flex gap-2 shrink-0">
                    <div className="bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                        <span className="text-purple-300">공유</span>{' '}
                        <span className="font-bold">{todayCount}</span>
                    </div>
                    <div className="bg-pink-500/20 px-3 py-1 rounded-full text-sm">
                        <span className="text-pink-300">위로</span>{' '}
                        <span className="font-bold">{totalComforts}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
