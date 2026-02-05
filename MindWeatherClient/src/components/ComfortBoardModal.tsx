import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPublicMessages, postPublicMessage, likePublicMessage } from '../services/api';
import type { PublicMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ComfortBoardModalProps {
    onClose: () => void;
}

export function ComfortBoardModal({ onClose }: ComfortBoardModalProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const [newContent, setNewContent] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadMessages();
    }, [sortBy]);

    const loadMessages = async () => {
        try {
            const data = await getPublicMessages(sortBy);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load public messages:", error);
        }
    };

    const handlePost = async () => {
        if (!user || !newContent.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await postPublicMessage(user.id, newContent);
            setNewContent('');
            loadMessages();
        } catch (error) {
            alert("메시지 게시에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (id: number) => {
        try {
            const { likeCount } = await likePublicMessage(id);
            setMessages((prev: PublicMessage[]) => prev.map((m: PublicMessage) => m.id === id ? { ...m, likeCount } : m));
        } catch (error) {
            console.error("Failed to like message:", error);
        }
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
                className="relative w-full max-w-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
                {/* Close Button - positioned in the corner with margin */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-10 p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="flex justify-between items-center mb-10 shrink-0 pr-12">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-4xl">💌</span>
                        <span className="bg-gradient-to-r from-pink-200 to-rose-200 bg-clip-text text-transparent">익명 위로</span>
                    </h2>
                    <div className="flex bg-black/40 rounded-xl p-1.5 gap-1">
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${sortBy === 'latest' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                        >
                            최신순
                        </button>
                        <button
                            onClick={() => setSortBy('top')}
                            className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${sortBy === 'top' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                        >
                            인기순
                        </button>
                    </div>
                </div>

                {/* Post Form */}
                <div className="mb-8 shrink-0 bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="모두에게 따뜻한 한마디를 나누어 주세요. (최대 200자)"
                        className="w-full bg-transparent border-none focus:ring-0 text-base resize-none h-24 placeholder:text-white/20 leading-relaxed"
                        maxLength={200}
                    />
                    <div className="flex justify-end pt-2 border-t border-white/5">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePost}
                            disabled={!newContent.trim() || isSubmitting}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 rounded-xl text-md font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/20"
                        >
                            {isSubmitting ? '전송 중...' : '따뜻한 마음 나누기 🕊️'}
                        </motion.button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-6 min-h-0 pr-2 custom-scrollbar p-1">
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4 group hover:bg-white/10 transition-colors shadow-sm"
                        >
                            <p className="text-base leading-relaxed text-white/95 font-medium">{m.content}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40 font-mono">
                                    {new Date(m.createdAt).toLocaleString()}
                                </span>
                                <button
                                    onClick={() => handleLike(m.id)}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 hover:bg-pink-500/20 hover:text-pink-400 transition-all text-white/50"
                                >
                                    <span className="text-sm">❤️</span>
                                    <span className="text-xs font-bold">{m.likeCount}</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center py-24 text-white/20 flex flex-col items-center">
                            <span className="text-5xl mb-6 opacity-50">🍃</span>
                            <p className="text-lg">아직 게시된 위로가 없습니다.</p>
                            <p className="text-sm mt-2">첫 번째 위로를 전해보세요!</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
