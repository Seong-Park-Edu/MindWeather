import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getReceivedMessages, getSentMessages, thankMessage } from '../services/api';
import type { MessageResponse } from '../types/emotion';

interface InboxModalProps {
    onClose: () => void;
}

export function InboxModal({ onClose }: InboxModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [thankingId, setThankingId] = useState<number | null>(null);
    const [showOnlyToday, setShowOnlyToday] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadMessages();
    }, [user, activeTab]);

    const loadMessages = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = activeTab === 'received'
                ? await getReceivedMessages(user.id)
                : await getSentMessages(user.id);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleThank = async (messageId: number) => {
        if (!user) return;

        setThankingId(messageId);
        try {
            await thankMessage(messageId, user.id);

            // Update local state to show thanked immediately
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, isThanked: true, thankedAt: new Date().toISOString() }
                    : m
            ));
        } catch (error) {
            console.error('Failed to thank:', error);
            alert('감사 전송에 실패했습니다.');
        } finally {
            setThankingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const displayedMessages = messages.filter(msg => {
        if (!showOnlyToday) return true;
        const msgDate = new Date(msg.sentAt);
        const today = new Date();
        return msgDate.getDate() === today.getDate() &&
            msgDate.getMonth() === today.getMonth() &&
            msgDate.getFullYear() === today.getFullYear();
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass max-w-lg w-full h-[600px] flex flex-col rounded-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold">📬 마음 우체통</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-black/20">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'received'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        받은 위로 💌
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'sent'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        보낸 위로 🛫
                    </button>
                </div>

                {/* Filter Toggle */}
                <div className="px-6 pt-4 flex justify-end">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${showOnlyToday ? 'bg-purple-500' : 'bg-gray-600'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-300 ${showOnlyToday ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input
                            type="checkbox"
                            checked={showOnlyToday}
                            onChange={(e) => setShowOnlyToday(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                            오늘만 보기
                        </span>
                    </label>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-10">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : displayedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <span className="text-4xl mb-4 opacity-50">
                                {activeTab === 'received' ? '📭' : '📝'}
                            </span>
                            <p>
                                {showOnlyToday
                                    ? '오늘 주고받은 위로가 없어요.'
                                    : activeTab === 'received'
                                        ? '아직 받은 위로가 없어요.'
                                        : '아직 보낸 위로가 없어요.'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {displayedMessages.map((msg, index) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                                                {activeTab === 'received'
                                                    ? 'From. 익명의 이웃'
                                                    : 'To. 누군가에게'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(msg.sentAt)}
                                            </span>
                                        </div>
                                        {activeTab === 'sent' && msg.isThanked && (
                                            <span className="text-xs font-bold text-pink-400 animate-pulse">
                                                ❤️ 감사를 받았어요!
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                                        {msg.content}
                                    </p>

                                    {activeTab === 'received' && (
                                        <div className="flex justify-end">
                                            {msg.isThanked ? (
                                                <span className="text-xs text-pink-400 font-medium px-3 py-1.5 bg-pink-500/10 rounded-lg border border-pink-500/20">
                                                    ❤️ 감사를 전했습니다
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleThank(msg.id)}
                                                    disabled={thankingId === msg.id}
                                                    className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                                                >
                                                    {thankingId === msg.id ? '전송 중...' : '고마워요 보내기 💕'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
