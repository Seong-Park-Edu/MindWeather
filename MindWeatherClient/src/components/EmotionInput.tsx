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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl w-[95%] max-w-lg mx-auto"
        >
            <h2 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                오늘의 마음 날씨는? ☁️
            </h2>

            {/* Emotion Selection */}
            <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-gray-300">
                    감정 선택
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {AllEmotionTypes.map((emotion) => (
                        <motion.button
                            key={emotion}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedEmotion(emotion)}
                            className={`p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 ${selectedEmotion === emotion
                                ? 'ring-2 ring-white shadow-lg bg-white/20'
                                : 'hover:bg-white/10 bg-white/5'
                                }`}
                            style={{
                                backgroundColor:
                                    selectedEmotion === emotion
                                        ? EmotionColors[emotion] + '40'
                                        : undefined,
                            }}
                        >
                            <span className="text-3xl">{EmotionIcons[emotion]}</span>
                            <span className="text-sm font-medium">{EmotionLabels[emotion]}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Intensity Slider */}
            <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-gray-300">
                    감정 강도: <span className="text-white font-bold text-lg ml-1">{intensity}</span>
                </label>
                <div className="px-2">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2 font-medium">
                        <span>살짝 😊</span>
                        <span>매우 😭</span>
                    </div>
                </div>
            </div>

            {/* Region Selection - GPS 자동 감지 */}
            <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-gray-300">
                    지역 📍
                </label>
                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white transition-colors hover:bg-white/10">
                    {geo.loading ? (
                        <div className="flex items-center gap-3 text-gray-400 justify-center py-2">
                            <span className="animate-spin text-xl">🔄</span>
                            <span>위치 확인 중...</span>
                        </div>
                    ) : geo.error ? (
                        <div className="flex flex-col gap-3">
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
                                className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="">지역 선택</option>
                                {KoreanRegions.map((r) => (
                                    <option key={r} value={r} className="bg-gray-900">
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-green-400 text-lg">✅</span>
                                <span className="font-medium">{region || geo.address || '위치 확인됨'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => geo.refresh()}
                                className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                            >
                                🔄 새로고침
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tags Selection */}
            <div className="mb-10">
                <label className="block text-sm font-medium mb-4 text-gray-300">
                    태그 (선택)
                </label>
                <div className="flex flex-wrap gap-3">
                    {CommonTags.map((tag) => (
                        <motion.button
                            key={tag}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleTag(tag)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag)
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/15 border border-white/5'
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
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl ${selectedEmotion !== null && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
            >
                {isSubmitting ? (
                    '전송 중...'
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
