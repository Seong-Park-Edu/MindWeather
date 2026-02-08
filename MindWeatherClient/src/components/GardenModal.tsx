import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyEmotions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { EmotionResponse } from '../types/emotion';

// Emotion types mapping
const EmotionLabels: Record<number, string> = {
    0: '기쁨', 1: '흥분', 2: '슬픔', 3: '우울',
    4: '분노', 5: '평온', 6: '불안', 7: '피로',
    8: '지루함', 9: '외로움'
};

// Plant image paths for each emotion type
const PLANT_IMAGES: Record<number, string> = {
    0: '/garden/plants/plant_joy.png',
    1: '/garden/plants/plant_excitement.png',
    2: '/garden/plants/plant_sadness.png',
    3: '/garden/plants/plant_depression.png',
    4: '/garden/plants/plant_anger.png',
    5: '/garden/plants/plant_calm.png',
    6: '/garden/plants/plant_anxiety.png',
    7: '/garden/plants/plant_fatigue.png',
    8: '/garden/plants/plant_boredom.png',
    9: '/garden/plants/plant_loneliness.png',
};

const PLANT_INFO: Record<number, { name: string; color: string }> = {
    0: { name: '해바라기', color: '#FFD700' },
    1: { name: '해바라기(활력)', color: '#FFA500' },
    2: { name: '튤립', color: '#FF69B4' },
    3: { name: '백합', color: '#4B0082' },
    4: { name: '선인장', color: '#2E8B57' },
    5: { name: '분재나무', color: '#228B22' },
    6: { name: '라벤더', color: '#9370DB' },
    7: { name: '버섯', color: '#8B4513' },
    8: { name: '강아지풀', color: '#DAA520' },
    9: { name: '가을나무', color: '#A0522D' },
};

const ALL_EMOTION_TYPES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    if (count < 20) return 4;
    if (count < 30) return 5;
    return 6;
};

const getPlantImage = (type: number, level: number): string => {
    if (level === 0) return '';
    if (level === 1) return '/garden/plants/common_sprout.png';
    if (level === 2) return '/garden/plants/common_growing.png';
    return PLANT_IMAGES[type] || '/garden/plants/common_growing.png';
};

interface GardenState {
    waterLevel: number;
    waterDrops: number;
    lastWatered: string;
    lastLoginDate: string;
}

interface GardenModalProps {
    onClose: () => void;
}

export function GardenModal({ onClose }: GardenModalProps) {
    const { user } = useAuth();
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [gardenState, setGardenState] = useState<GardenState>({
        waterLevel: 50,
        waterDrops: 3,
        lastWatered: new Date().toISOString(),
        lastLoginDate: ''
    });
    const [selectedPlant, setSelectedPlant] = useState<{ type: number; count: number } | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const now = new Date();
            const data = await getMyEmotions(user.id, now.getFullYear(), now.getMonth() + 1);
            setEmotions(data);

            const savedState = localStorage.getItem(`garden_state_${user.id}`);
            let currentState: GardenState = savedState ? JSON.parse(savedState) : {
                waterLevel: 50,
                waterDrops: 3,
                lastWatered: new Date().toISOString(),
                lastLoginDate: ''
            };

            const today = now.toISOString().split('T')[0];
            if (currentState.lastLoginDate !== today) {
                currentState.waterDrops = (currentState.waterDrops || 0) + 3;
                currentState.lastLoginDate = today;
                localStorage.setItem(`garden_state_${user.id}`, JSON.stringify(currentState));
            }

            setGardenState(currentState);
        } catch (error) {
            console.error('Failed to load garden:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const emotionCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        ALL_EMOTION_TYPES.forEach(t => counts[t] = 0);
        emotions.forEach(e => {
            if (counts[e.emotion] !== undefined) {
                counts[e.emotion]++;
            }
        });
        return counts;
    }, [emotions]);

    const handleWatering = () => {
        if (!user) return;

        if (gardenState.waterDrops <= 0) {
            alert('💧 물방울이 없어요! 감정 일기를 쓰거나 내일 다시 방문해주세요.');
            return;
        }

        if (gardenState.waterLevel >= 100) {
            alert('💧 이미 수분이 가득 차 있어요!');
            return;
        }

        const newLevel = Math.min(100, gardenState.waterLevel + 10);
        const newDrops = gardenState.waterDrops - 1;

        const newState = {
            ...gardenState,
            waterLevel: newLevel,
            waterDrops: newDrops,
            lastWatered: new Date().toISOString()
        };

        localStorage.setItem(`garden_state_${user.id}`, JSON.stringify(newState));
        setGardenState(newState);
    };

    const handlePlantClick = (type: number, count: number) => {
        setSelectedPlant({ type, count });
    };

    const totalPlants = Object.values(emotionCounts).filter(c => c > 0).length;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-green-500/30 shadow-2xl"
                    style={{
                        backgroundImage: 'url(/garden/garden_bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-green-900/95 backdrop-blur-sm p-4 border-b border-green-500/30 flex items-center justify-between z-10">
                        <h2 className="text-white text-xl font-bold">🌱 감정 수호 정원</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex justify-between px-6 py-4 bg-black/50 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-2xl">🌱</p>
                            <p className="text-gray-300 text-xs">식물</p>
                            <p className="text-white font-bold">{totalPlants} / 10</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl">💧</p>
                            <p className="text-gray-300 text-xs">물방울</p>
                            <p className="text-white font-bold">{gardenState.waterDrops}개</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl">
                                {gardenState.waterLevel >= 80 ? '✨' : gardenState.waterLevel < 30 ? '🥀' : '🌿'}
                            </p>
                            <p className="text-gray-300 text-xs">수분</p>
                            <p className={`font-bold ${gardenState.waterLevel < 30 ? 'text-red-400' : 'text-white'}`}>
                                {gardenState.waterLevel}%
                            </p>
                        </div>
                    </div>

                    {/* Garden Grid */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {ALL_EMOTION_TYPES.map((type) => {
                                    const count = emotionCounts[type] || 0;
                                    const level = getLevel(count);
                                    const info = PLANT_INFO[type];
                                    const isWithered = gardenState.waterLevel < 30 && level > 0;
                                    const plantImage = getPlantImage(type, level);

                                    return (
                                        <motion.button
                                            key={type}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handlePlantClick(type, count)}
                                            className={`relative p-3 rounded-2xl border transition-all aspect-square flex flex-col items-center justify-center ${level === 0
                                                    ? 'bg-gray-800/50 border-gray-700/50 opacity-50'
                                                    : 'bg-green-800/50 border-green-600/50 hover:border-green-400'
                                                }`}
                                        >
                                            {/* Aura Effect for high level plants */}
                                            {level >= 4 && !isWithered && (
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-2xl"
                                                    style={{
                                                        background: `radial-gradient(circle, ${info.color}60 0%, transparent 70%)`
                                                    }}
                                                />
                                            )}

                                            {/* Plant Image or Empty Slot */}
                                            <div className={`relative z-10 w-16 h-16 flex items-center justify-center ${isWithered ? 'opacity-60 grayscale' : ''}`}>
                                                {level === 0 ? (
                                                    <div className="w-12 h-12 rounded-full bg-gray-700/50 border-2 border-dashed border-gray-600 flex items-center justify-center">
                                                        <span className="text-gray-500 text-2xl">?</span>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={plantImage}
                                                        alt={info.name}
                                                        className="w-full h-full object-contain drop-shadow-lg"
                                                    />
                                                )}
                                            </div>

                                            {/* Sparkles for well-watered plants */}
                                            {gardenState.waterLevel >= 80 && level >= 1 && (
                                                <motion.img
                                                    src="/garden/plants/aura_shine.png"
                                                    alt="shine"
                                                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1, 0.8] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="absolute top-0 right-0 w-8 h-8"
                                                />
                                            )}

                                            {/* Water Drop Icon for withered plants */}
                                            {isWithered && (
                                                <span className="absolute top-1 right-1 text-lg">💧</span>
                                            )}

                                            {/* Label */}
                                            <div className="text-center mt-1 relative z-10">
                                                <p className="text-white text-xs font-medium truncate">
                                                    {EmotionLabels[type]}
                                                </p>
                                                {level > 0 && (
                                                    <p className="text-gray-400 text-xs">Lv.{level}</p>
                                                )}
                                                {level >= 6 && (
                                                    <p className="text-yellow-500 text-xs font-bold">MASTER</p>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && emotions.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-white bg-black/60 inline-block px-6 py-3 rounded-xl backdrop-blur-sm">
                                    감정을 기록하여 수호 식물을 깨워보세요!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Watering Button */}
                    <div className="p-6 pt-0 flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWatering}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            🚿 물주기
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                                {gardenState.waterDrops}
                            </span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Plant Detail Modal */}
                <AnimatePresence>
                    {selectedPlant && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPlant(null)}
                            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full text-center"
                            >
                                <PlantDetail
                                    type={selectedPlant.type}
                                    count={selectedPlant.count}
                                    waterLevel={gardenState.waterLevel}
                                    onClose={() => setSelectedPlant(null)}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}

function PlantDetail({ type, count, waterLevel, onClose }: {
    type: number;
    count: number;
    waterLevel: number;
    onClose: () => void;
}) {
    const level = getLevel(count);
    const info = PLANT_INFO[type];
    const plantImage = getPlantImage(type, level);

    let nextGoal = 0;
    if (level < 3) nextGoal = [1, 3, 6][level];
    else if (level === 3) nextGoal = 10;
    else if (level === 4) nextGoal = 20;
    else if (level === 5) nextGoal = 30;

    const needed = level < 6 ? nextGoal - count : 0;
    const message = level >= 6
        ? "최고 레벨 도달! (전설의 정원사)"
        : level === 0
            ? "첫 기록을 남겨보세요!"
            : needed > 0
                ? `다음 단계까지 ${needed}번 더 기록 필요`
                : "성장 가능!";

    let status = "보통";
    let statusColor = "text-gray-600";
    if (waterLevel < 30) {
        status = "목마름 💧";
        statusColor = "text-red-500";
    } else if (waterLevel >= 80) {
        status = "행복함 ✨";
        statusColor = "text-blue-500";
    }

    return (
        <>
            <p className="text-gray-600 text-lg font-bold">{EmotionLabels[type]}</p>
            <h3 className="text-gray-900 text-3xl font-black mt-1">{info.name}</h3>

            <div className="flex justify-center gap-2 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${level >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                    Lv.{level}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gray-100 ${statusColor}`}>
                    {status}
                </span>
            </div>

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative my-8 h-40 flex items-center justify-center"
            >
                {level === 0 ? (
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-dashed border-gray-400 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">?</span>
                    </div>
                ) : (
                    <>
                        {/* Aura ring for high level */}
                        {level >= 4 && (
                            <motion.img
                                src="/garden/plants/aura_ring.png"
                                alt="aura"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute w-48 h-48 opacity-50"
                            />
                        )}
                        <img
                            src={plantImage}
                            alt={info.name}
                            className="relative z-10 w-32 h-32 object-contain drop-shadow-xl"
                        />
                    </>
                )}
            </motion.div>

            <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">이번 달 기록</span>
                    <span className="text-gray-900 font-bold">{count}회</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: level >= 6 ? '100%' : `${Math.min(100, (count / nextGoal) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: info.color }}
                    />
                </div>
                <p className="text-gray-500 text-sm mt-2">{message}</p>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors"
            >
                닫기
            </button>
        </>
    );
}
