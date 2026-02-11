import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5015/api';

interface Letter {
    id: number;
    content: string;
    generatedAt: string;
    isRead: boolean;
    readAt: string | null;
    analyzedFrom: string;
    analyzedTo: string;
}

interface LettersModalProps {
    onClose: () => void;
}

export function LettersModal({ onClose }: LettersModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchLetters();
    }, [user]);

    const fetchLetters = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/letters/${user.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch letters');
            }
            const data = await response.json();
            setLetters(data);
        } catch (error) {
            console.error('Failed to fetch letters:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLetter = async (letter: Letter) => {
        setSelectedLetter(letter);

        // Mark as read if not already
        if (!letter.isRead) {
            try {
                const response = await fetch(`${API_URL}/letters/${letter.id}/read?userId=${user?.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error('Failed to mark letter as read');
                }
                // Update local state
                setLetters(prev =>
                    prev.map(l =>
                        l.id === letter.id ? { ...l, isRead: true, readAt: new Date().toISOString() } : l
                    )
                );
            } catch (error) {
                console.error('Failed to mark letter as read:', error);
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        return `${month}월 ${day}일 오후 ${hours}시`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="backdrop-blur-md border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                style={{ backgroundColor: colors.bg.primary + 'F0', borderColor: colors.border, color: colors.text.primary }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
                    {selectedLetter ? (
                        <>
                            <button
                                onClick={() => setSelectedLetter(null)}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                ← 목록
                            </button>
                            <span className="text-sm text-gray-400">
                                {formatDate(selectedLetter.generatedAt)}
                            </span>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold">편지함 🌱</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors text-2xl"
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : selectedLetter ? (
                        // Letter Detail View
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center">
                                <div className="text-6xl mb-4">🌱</div>
                                <h3 className="text-xl font-bold mb-2">마음의 정원에서 온 편지</h3>
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent my-6" />
                            </div>
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                {selectedLetter.content}
                            </p>
                        </motion.div>
                    ) : letters.length === 0 ? (
                        // Empty State
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="text-6xl mb-4">🌱</div>
                            <p className="text-xl font-semibold mb-2">아직 도착한 편지가 없어요</p>
                            <p className="text-gray-400">매일 저녁 7시에 따뜻한 편지가 도착할 거예요</p>
                        </div>
                    ) : (
                        // Letters List
                        <div className="space-y-4">
                            {letters.map((letter) => (
                                <motion.button
                                    key={letter.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openLetter(letter)}
                                    className="w-full border rounded-xl p-5 text-left transition-all"
                                    style={{ backgroundColor: colors.bg.tertiary + '80', borderColor: colors.border }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">🌱</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">마음의 정원에서 온 편지</h3>
                                                {!letter.isRead && (
                                                    <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-bold">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">
                                                {formatDate(letter.generatedAt)}
                                            </p>
                                            <p className="text-sm text-gray-300 line-clamp-2">
                                                {letter.content}
                                            </p>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
