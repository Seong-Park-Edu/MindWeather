import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationCount } from '../services/api';
import { InboxModal } from './InboxModal';

const LAST_CHECKED_KEY = 'notificationLastChecked';

export function Header() {
    const { user, signOut } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showInbox, setShowInbox] = useState(false);

    // Get lastCheckedAt from localStorage
    const getLastCheckedAt = useCallback(() => {
        if (!user) return null;
        const stored = localStorage.getItem(`${LAST_CHECKED_KEY}_${user.id}`);
        return stored || null;
    }, [user]);

    // Set lastCheckedAt to localStorage
    const setLastCheckedAt = useCallback(() => {
        if (!user) return;
        const now = new Date().toISOString();
        localStorage.setItem(`${LAST_CHECKED_KEY}_${user.id}`, now);
    }, [user]);

    // Poll for notifications
    useEffect(() => {
        if (!user) return;

        const poll = async () => {
            const since = getLastCheckedAt();
            const result = await getNotificationCount(user.id, since || undefined);
            setUnreadCount(result.total);
        };

        poll(); // Initial call
        const interval = setInterval(poll, 10000);
        return () => clearInterval(interval);
    }, [user, showInbox, getLastCheckedAt]); // Refresh when inbox closes

    // Handle bell click - reset count and open inbox
    const handleBellClick = () => {
        setLastCheckedAt(); // Mark as checked
        setUnreadCount(0); // Reset count immediately
        setShowInbox(true);
    };

    return (
        <>
            <header className="absolute top-0 left-0 right-0 z-30 p-4">
                <div className="flex justify-between items-start">
                    <div className="text-center flex-1 ml-10">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent cursor-pointer"
                        >
                            🌤️ Mind Weather
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 text-sm mt-1"
                        >
                            마음의 날씨를 나누고, 서로를 위로해요
                        </motion.p>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <div
                            className="relative cursor-pointer group p-2 hover:bg-white/10 rounded-full transition-colors"
                            onClick={handleBellClick}
                        >
                            <span className="text-2xl">🔔</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce hidden-on-hover">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={signOut}
                            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showInbox && <InboxModal onClose={() => setShowInbox(false)} />}
            </AnimatePresence>
        </>
    );
}
