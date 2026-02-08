import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EmotionType, EmotionLabels, EmotionIcons, EmotionColors } from '../types/emotion';
import { getAdminStats, broadcastComfort, getUserProfile, postEmotion } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getRandomDetailedAddress, getTotalDistrictCount } from '../utils/koreaDistrictData';

interface EmotionPanel {
    emotion: EmotionType;
    count: number;
    totalLogs: number;
    message: string;
    isSending: boolean;
    lastResult: string | null;
}

export function AdminDashboard() {
    const { session } = useAuth();
    const [panels, setPanels] = useState<EmotionPanel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dummy Generator State
    const [dummyCount, setDummyCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState('');

    const DUMMY_TAGS = ['#출근', '#퇴근', '#야근', '#운동', '#산책', '#데이트', '#시험', '#공부', '#휴식', '#여행', '#맛집', '#커피', '#투자', '#비옴', '#맑음'];

    // Permission Check
    useEffect(() => {
        const checkAdmin = async () => {
            if (!session?.access_token) return;

            try {
                const profile = await getUserProfile(session.access_token);
                if (!profile.isAdmin) {
                    alert('관리자 권한이 없습니다.');
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Failed to verify admin status:', error);
                window.location.href = '/';
            }
        };

        checkAdmin();
    }, [session]);

    useEffect(() => {
        if (!session?.access_token) return;

        loadStats();
        const interval = setInterval(loadStats, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [session]);

    const loadStats = async () => {
        if (!session?.access_token) return;

        try {
            const stats = await getAdminStats(session.access_token);

            setPanels(prev => {
                // Merge with existing state to preserve message drafts
                const newPanels = Object.values(EmotionType)
                    .filter((v): v is EmotionType => typeof v === 'number')
                    .map(emotion => {
                        const stat = stats.find(s => s.emotion === emotion);
                        const existing = prev.find(p => p.emotion === emotion);
                        return {
                            emotion,
                            count: stat?.count ?? 0,
                            totalLogs: stat?.totalLogs ?? 0,
                            message: existing?.message ?? '',
                            isSending: existing?.isSending ?? false,
                            lastResult: existing?.lastResult ?? null,
                        };
                    });
                return newPanels;
            });
        } catch (error) {
            console.error('Failed to load admin stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBroadcast = async (emotion: EmotionType) => {
        const panel = panels.find(p => p.emotion === emotion);
        if (!panel || !panel.message.trim() || !session?.access_token) return;

        // Set sending state
        setPanels(prev => prev.map(p =>
            p.emotion === emotion ? { ...p, isSending: true, lastResult: null } : p
        ));

        try {
            const result = await broadcastComfort(emotion, panel.message, session.access_token);

            setPanels(prev => prev.map(p =>
                p.emotion === emotion
                    ? { ...p, isSending: false, lastResult: result.message, message: '' }
                    : p
            ));
        } catch (error) {
            setPanels(prev => prev.map(p =>
                p.emotion === emotion
                    ? { ...p, isSending: false, lastResult: error instanceof Error ? error.message : '전송 실패' }
                    : p
            ));
        }
    };

    const updateMessage = (emotion: EmotionType, message: string) => {
        setPanels(prev => prev.map(p =>
            p.emotion === emotion ? { ...p, message } : p
        ));
    };

    const handleGenerateDummy = async () => {
        if (!session?.user?.id || isGenerating) return;

        setIsGenerating(true);
        setGenProgress('준비 중...');

        const emotionTypes = Object.values(EmotionType).filter((v): v is EmotionType => typeof v === 'number');

        try {
            for (let i = 0; i < dummyCount; i++) {
                setGenProgress(`${i + 1} / ${dummyCount} 생성 중...`);

                // Get random detailed address (시/도 + 시/군/구 + 읍/면/동)
                const addressData = getRandomDetailedAddress();
                const randomEmotion = emotionTypes[Math.floor(Math.random() * emotionTypes.length)];
                const randomIntensity = Math.floor(Math.random() * 5) + 1; // 1-5
                const randomTag = DUMMY_TAGS[Math.floor(Math.random() * DUMMY_TAGS.length)];

                // Use fullAddress which includes 읍/면/동 detail
                await postEmotion({
                    userId: session.user.id,
                    emotion: randomEmotion,
                    intensity: randomIntensity,
                    region: addressData.fullAddress, // e.g., "서울 강남구 역삼동"
                    tags: randomTag,
                    latitude: 0,
                    longitude: 0
                });

                // Slight delay to not overwhelm DB
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            setGenProgress(`완료! ${dummyCount}개의 감정이 생성되었습니다.`);
            loadStats(); // Refresh stats

            // Clear success msg after 3s
            setTimeout(() => setGenProgress(''), 3000);

        } catch (error) {
            console.error(error);
            setGenProgress('오류 발생: 생성이 중단되었습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 pt-24 pb-20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold mb-2">🛡️ 관리자 대시보드</h1>
                    <p className="text-gray-400">감정별 사용자에게 위로 메시지를 일괄 전송합니다</p>
                </div>

                {/* Stats Summary */}
                <div className="glass p-4 rounded-xl mb-12">
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold text-purple-400">
                                {panels.reduce((sum, p) => sum + p.count, 0)}
                            </p>
                            <p className="text-xs text-gray-400">총 활성 사용자 (24h)</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-400">
                                {panels.reduce((sum, p) => sum + p.totalLogs, 0)}
                            </p>
                            <p className="text-xs text-gray-400">총 감정 기록</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-pink-400">
                                {panels.filter(p => p.count > 0).length}
                            </p>
                            <p className="text-xs text-gray-400">활성 감정 유형</p>
                        </div>
                    </div>
                </div>

                {/* Emotion Control Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {panels.map(panel => (
                        <motion.div
                            key={panel.emotion}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-5 rounded-xl"
                            style={{
                                borderLeft: `4px solid ${EmotionColors[panel.emotion]}`,
                            }}
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="text-3xl p-2 rounded-lg"
                                        style={{ backgroundColor: EmotionColors[panel.emotion] + '30' }}
                                    >
                                        {EmotionIcons[panel.emotion]}
                                    </span>
                                    <div>
                                        <h3 className="font-bold">{EmotionLabels[panel.emotion]}</h3>
                                        <p className="text-xs text-gray-400">
                                            {panel.count}명 활성 • {panel.totalLogs}개 기록
                                        </p>
                                    </div>
                                </div>

                                {/* Live count badge */}
                                <div
                                    className="px-3 py-1 rounded-full text-sm font-bold"
                                    style={{
                                        backgroundColor: EmotionColors[panel.emotion] + '30',
                                        color: EmotionColors[panel.emotion],
                                    }}
                                >
                                    {panel.count}
                                </div>
                            </div>

                            {/* Message Input */}
                            <textarea
                                value={panel.message}
                                onChange={(e) => updateMessage(panel.emotion, e.target.value)}
                                placeholder={`${EmotionLabels[panel.emotion]}을(를) 느끼는 분들에게 보낼 메시지...`}
                                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                                rows={3}
                            />

                            {/* Last Result */}
                            {panel.lastResult && (
                                <p className={`text-xs mt-2 ${panel.lastResult.includes('실패') ? 'text-red-400' : 'text-green-400'}`}>
                                    {panel.lastResult}
                                </p>
                            )}

                            {/* Broadcast Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleBroadcast(panel.emotion)}
                                disabled={!panel.message.trim() || panel.isSending || panel.count === 0}
                                className={`w-full mt-3 py-2 rounded-lg font-semibold text-sm transition-all ${panel.message.trim() && !panel.isSending && panel.count > 0
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {panel.isSending
                                    ? '전송 중...'
                                    : panel.count === 0
                                        ? '대상 없음'
                                        : `${panel.count}명에게 일괄 전송 📢`
                                }
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Dummy Data Generator Section */}
                <div className="mt-16 mb-12">
                    <div className="glass p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    🎲 더미 데이터 생성기
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    지도에 활력을 불어넣기 위해 랜덤한 감정 데이터를 생성합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-end gap-4 bg-black/20 p-4 rounded-lg">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">생성할 개수 (1-100)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={dummyCount}
                                    onChange={(e) => setDummyCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateDummy}
                                disabled={isGenerating}
                                className={`px-6 py-2 rounded-lg font-bold transition-all ${isGenerating
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'}`}
                            >
                                {isGenerating ? '생성 중...' : '데이터 생성하기 ✨'}
                            </motion.button>
                        </div>

                        {genProgress && (
                            <div className="mt-4 text-center text-sm font-medium text-cyan-300 bg-cyan-900/20 py-2 rounded-lg animate-pulse">
                                {genProgress}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Warning */}
                <div className="mt-12 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ 이 페이지는 관리자 전용입니다. 메시지는 시스템 계정에서 전송됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
