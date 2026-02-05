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
                className="relative w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span>💌</span>
                        <span>익명 위로 게시판</span>
                    </h2>
                    <div className="flex bg-black/20 rounded-lg p-1">
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${sortBy === 'latest' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            최신순
                        </button>
                        <button
                            onClick={() => setSortBy('top')}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${sortBy === 'top' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            인기순
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                    ✕
                </button>

                {/* Post Form */}
                <div className="mb-6 shrink-0 bg-white/5 p-4 rounded-xl border border-white/10">
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="모두에게 따뜻한 한마디를 나누어 주세요. (최대 200자)"
                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-white/20"
                        maxLength={200}
                    />
                    <div className="flex justify-end mt-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePost}
                            disabled={!newContent.trim() || isSubmitting}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50"
                        >
                            {isSubmitting ? '전송 중...' : '나누기'}
                        </motion.button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2 custom-scrollbar">
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3 group"
                        >
                            <p className="text-sm leading-relaxed text-white/90">{m.content}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-white/30">
                                    {new Date(m.createdAt).toLocaleString()}
                                </span>
                                <button
                                    onClick={() => handleLike(m.id)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 hover:text-pink-400 transition-all text-white/40"
                                >
                                    <span className="text-sm">❤️</span>
                                    <span className="text-xs font-bold">{m.likeCount}</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center py-20 text-white/20 flex flex-col items-center">
                            <span className="text-4xl mb-4">🍃</span>
                            아직 게시된 위로가 없습니다. <br />
                            첫 번째 위로를 전해보세요!
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
