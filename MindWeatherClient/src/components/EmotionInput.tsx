import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
    EmotionColors,
    KoreanRegions,
    CommonTags,
    AllEmotionTypes,
    type CreateEmotionRequest,
} from '../types/emotion';
import { postEmotion } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';

interface EmotionInputProps {
    onSuccess?: () => void;
}

export function EmotionInput({ onSuccess }: EmotionInputProps) {
    const { user } = useAuth();
    const geo = useGeolocation();
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
    const [intensity, setIntensity] = useState(5);
    const [region, setRegion] = useState('');
    const [useManualRegion, setUseManualRegion] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // GPS 주소가 설정되면 region 업데이트
    useEffect(() => {
        if (geo.address && !useManualRegion) {
            setRegion(geo.address);
        }
    }, [geo.address, useManualRegion]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (selectedEmotion === null || !user) return;

        setIsSubmitting(true);
        try {
            const request: CreateEmotionRequest = {
                userId: user.id,
                emotion: selectedEmotion,
                intensity,
                region: region || 'Unknown',
                tags: selectedTags.join(' '),
                latitude: geo.latitude ?? undefined,
                longitude: geo.longitude ?? undefined,
            };

            await postEmotion(request);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess?.();
            }, 2000);

            // Reset form
            setSelectedEmotion(null);
            setIntensity(5);
            setSelectedTags([]);
        } catch (error) {
            console.error('Failed to submit emotion:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl max-w-lg mx-auto"
        >
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                오늘의 마음 날씨는? ☁️
            </h2>

            {/* Emotion Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                    감정 선택
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {AllEmotionTypes.map((emotion) => (
                        <motion.button
                            key={emotion}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedEmotion(emotion)}
                            className={`p-4 rounded-xl transition-all duration-300 ${selectedEmotion === emotion
                                ? 'ring-2 ring-white shadow-lg'
                                : 'hover:bg-white/10'
                                }`}
                            style={{
                                backgroundColor:
                                    selectedEmotion === emotion
                                        ? EmotionColors[emotion] + '40'
                                        : 'rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            <span className="text-2xl block mb-1">{EmotionIcons[emotion]}</span>
                            <span className="text-sm">{EmotionLabels[emotion]}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Intensity Slider */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                    감정 강도: <span className="text-white font-bold">{intensity}</span>
                </label>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>살짝 😊</span>
                    <span>매우 😭</span>
                </div>
            </div>

            {/* Region Selection - GPS 자동 감지 */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                    지역 📍
                </label>
                <div className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                    {geo.loading ? (
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="animate-spin">🔄</span>
                            위치 확인 중...
                        </div>
                    ) : geo.error ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                <span>⚠️</span>
                                {geo.error}
                            </div>
                            <select
                                value={region}
                                onChange={(e) => {
                                    setRegion(e.target.value);
                                    setUseManualRegion(true);
                                }}
                                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                            >
                                <option value="">지역 선택</option>
                                {KoreanRegions.map((r) => (
                                    <option key={r} value={r} className="bg-gray-800">
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✅</span>
                                <span>{region || geo.address || '위치 확인됨'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => geo.refresh()}
                                className="text-xs text-purple-400 hover:text-purple-300"
                            >
                                🔄 새로고침
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tags Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                    태그 (선택)
                </label>
                <div className="flex flex-wrap gap-2">
                    {CommonTags.map((tag) => (
                        <motion.button
                            key={tag}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag)
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            {tag}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={selectedEmotion === null || isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${selectedEmotion !== null && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        >
                            ⏳
                        </motion.span>
                        전송 중...
                    </span>
                ) : (
                    '마음 기록하기 💫'
                )}
            </motion.button>

            {/* Success Message */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                    >
                        <div className="glass p-8 rounded-2xl text-center">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className="text-6xl block mb-4"
                            >
                                ✨
                            </motion.span>
                            <p className="text-xl font-semibold">마음이 안전하게 기록되었습니다!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
