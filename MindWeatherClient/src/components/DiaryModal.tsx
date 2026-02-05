import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { EmotionResponse } from '../types/emotion';
import { getMyEmotions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { EmotionColors, EmotionIcons, EmotionLabels } from '../types/emotion';

interface DiaryModalProps {
    onClose: () => void;
}

export function DiaryModal({ onClose }: DiaryModalProps) {
    const { user } = useAuth();
    const userId = user?.id;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12

    useEffect(() => {
        if (userId) {
            loadEmotions();
        }
    }, [userId, year, month]);

    const loadEmotions = async () => {
        if (!userId) return;
        try {
            const data = await getMyEmotions(userId, year, month);
            setEmotions(data);
        } catch (error) {
            console.error("Failed to load emotions:", error);
        }
    };

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month, 1));
        setSelectedDate(null);
    };

    // Group emotions by day
    const emotionsByDay = new Map<number, EmotionResponse[]>();
    emotions.forEach(e => {
        const day = new Date(e.createdAt).getDate();
        const list = emotionsByDay.get(day) || [];
        list.push(e);
        emotionsByDay.set(day, list);
    });

    // Calendar generation
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0: Sun

    const renderCalendarDays = () => {
        const days = [];
        // Empty cells for padding
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }
        // Content cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEmotions = emotionsByDay.get(d) || [];

            days.push(
                <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`h-10 flex flex-col items-center justify-center rounded-lg transition-colors relative
						${selectedDate === d ? 'bg-white/20' : 'hover:bg-white/10'}
					`}
                >
                    <span className="text-sm font-medium">{d}</span>
                    {dayEmotions.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                            {dayEmotions.slice(0, 3).map((e, idx) => (
                                <div
                                    key={idx}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: EmotionColors[e.emotion] }}
                                />
                            ))}
                            {dayEmotions.length > 3 && <span className="text-[0.5rem] leading-none">+</span>}
                        </div>
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="fixed inset-0 min-h-screen flex items-center justify-center z-[100] px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-2 text-white/30 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                >
                    ✕
                </button>

                {/* Header - Centered Navigation */}
                <div className="flex justify-center items-center gap-6 mb-8 shrink-0 relative">
                    <button onClick={prevMonth} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">◀</button>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        {year}년 {month}월
                    </h2>
                    <button onClick={nextMonth} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">▶</button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 text-center mb-8 shrink-0">
                    {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                        <div key={d} className="text-xs text-white/40 font-bold py-2">{d}</div>
                    ))}
                    {renderCalendarDays()}
                </div>

                {/* Details List */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0 bg-black/20 rounded-2xl p-4 custom-scrollbar">
                    {selectedDate ? (
                        <>
                            <h3 className="text-sm font-bold text-white/60 mb-3 px-1">
                                {month}월 {selectedDate}일 기록
                            </h3>
                            {emotionsByDay.get(selectedDate)?.length ? (
                                emotionsByDay.get(selectedDate)!.map((e, idx) => (
                                    <div key={idx} className="bg-white/5 p-3 rounded-lg flex items-start gap-3">
                                        <div className="text-2xl pt-1">{EmotionIcons[e.emotion]}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm" style={{ color: EmotionColors[e.emotion] }}>
                                                    {EmotionLabels[e.emotion]}
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {e.tags && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {e.tags.split(' ').map((tag, i) => (
                                                        <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="text-xs text-white/50 mt-1">{e.region}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-white/30 py-4">기록된 감정이 없어요 ☁️</div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-white/30 py-10 flex flex-col items-center">
                            <span className="text-3xl mb-2">📅</span>
                            날짜를 선택하여 기록을 확인하세요
                        </div>
                    )}
                </div>

            </motion.div>
        </div>
    );
}
