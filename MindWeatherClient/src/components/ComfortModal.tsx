import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
    EmotionColors,
    type EmotionResponse,
} from '../types/emotion';
import { sendComfortMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RegionCluster {
    region: string;
    emotions: EmotionResponse[];
    dominantEmotion: EmotionType;
    avgIntensity: number;
}

interface ComfortModalProps {
    cluster: RegionCluster;
    onClose: () => void;
}

const comfortPhrases = [
    '오늘 하루도 수고했어요 💪',
    '힘내세요, 응원합니다! 🌟',
    '당신은 혼자가 아닙니다 🤗',
    '잘 될 거예요, 믿어요 ✨',
    '편안한 휴식 되세요 🌙',
    '좋은 일이 생길 거예요 🍀',
];

export function ComfortModal({ cluster, onClose }: ComfortModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<'intro' | 'compose' | 'success'>('intro');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate dominant count logic once
    const dominantCount = cluster.emotions.filter(e => e.emotion === cluster.dominantEmotion).length;

    const handleSend = async () => {
        if (!message.trim() || !user) return;

        setIsSending(true);
        setError(null);

        try {
            // Pick a random receiver from the cluster (실제 유저에게 전송!)
            const eligibleReceivers = cluster.emotions.filter(e => e.userId !== user.id);

            if (eligibleReceivers.length === 0) {
                setError('이 지역에 위로를 보낼 다른 사용자가 없습니다.');
                // Show error but stay on compose step or maybe show success if we want to fake it broadly?
                // Let's be honest for now.
                return;
            }

            const randomReceiver = eligibleReceivers[Math.floor(Math.random() * eligibleReceivers.length)];

            await sendComfortMessage({
                senderId: user.id,
                receiverId: randomReceiver.userId,
                content: message,
            });

            setStep('success'); // Move to success step

            // Close automatically after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : '전송에 실패했습니다');
        } finally {
            setIsSending(false);
        }
    };

    const selectPhrase = (phrase: string) => {
        setMessage(phrase);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                key={step} // Animate when step changes
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass max-w-md w-full p-10 rounded-3xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Step 1: Intro */}
                {step === 'intro' && (
                    <div className="text-center flex flex-col gap-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center text-6xl shadow-xl"
                            style={{
                                backgroundColor: EmotionColors[cluster.dominantEmotion] + '20',
                                boxShadow: `0 0 30px ${EmotionColors[cluster.dominantEmotion]}40`
                            }}
                        >
                            {EmotionIcons[cluster.dominantEmotion]}
                        </motion.div>

                        <div>
                            <h3 className="text-2xl font-bold mb-2">{cluster.region}</h3>
                            <p className="text-white/80 leading-relaxed">
                                이곳에는 지금 <span style={{ color: EmotionColors[cluster.dominantEmotion], fontWeight: 'bold' }}>{EmotionLabels[cluster.dominantEmotion]}</span>의<br />
                                날씨가 지나가고 있습니다.
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6">
                            <p className="text-sm text-gray-300">
                                총 {cluster.emotions.length}명의 이웃 중<br />
                                <strong className="text-white text-lg">{dominantCount}명</strong>이 이 감정을 느끼고 있어요.
                            </p>
                        </div>

                        <button
                            onClick={() => setStep('compose')}
                            className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: `linear-gradient(135deg, ${EmotionColors[cluster.dominantEmotion]}, ${EmotionColors[cluster.dominantEmotion]}dd)`
                            }}
                        >
                            💌 랜덤한 1명에게 위로 건네기
                        </button>
                    </div>
                )}

                {/* Step 2: Compose */}
                {step === 'compose' && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setStep('intro')} className="text-gray-400 hover:text-white transition-colors">
                                ← 뒤로
                            </button>
                            <span className="text-sm text-gray-400">나의 따뜻한 한마디</span>
                            <div className="w-8"></div> {/* Spacer */}
                        </div>

                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{EmotionIcons[cluster.dominantEmotion]}</span>
                                <p className="text-sm text-gray-300">
                                    <span style={{ color: EmotionColors[cluster.dominantEmotion], fontWeight: 'bold' }}>{EmotionLabels[cluster.dominantEmotion]}</span>을(를) 느끼는 익명의 이웃에게
                                </p>
                            </div>
                        </div>

                        {/* Quick phrases */}
                        <div>
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">추천 메세지</p>
                            <div className="flex flex-wrap gap-2">
                                {comfortPhrases.map((phrase) => (
                                    <button
                                        key={phrase}
                                        onClick={() => selectPhrase(phrase)}
                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${message === phrase
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                            }`}
                                    >
                                        {phrase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom message input */}
                        <div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="따뜻한 위로의 말을 적어주세요..."
                                maxLength={500}
                                className="w-full p-6 rounded-2xl bg-black/20 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none transition-colors min-h-[140px]"
                            />
                            <p className="text-xs text-gray-600 text-right mt-2">
                                {message.length}/500
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSend}
                            disabled={!message.trim() || isSending}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${message.trim() && !isSending
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    전송 중...
                                </span>
                            ) : '위로 보내기 🚀'}
                        </motion.button>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 'success' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-12"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                            className="text-7xl block mb-6"
                        >
                            📬
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                            마음이 전송되었습니다!
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            당신의 작은 위로가<br />
                            누군가에게 큰 힘이 될 거예요 ✨
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </motion.div >
    );
}
