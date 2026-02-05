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
            <header className="absolute top-0 left-0 right-0 z-20 flex justify-center p-6 pointer-events-none">
                <div className="w-full max-w-4xl glass px-6 py-3 flex justify-between items-center pointer-events-auto shadow-2xl bg-black/20">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 10 }}
                            className="text-3xl"
                        >
                            🌤️
                        </motion.div>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent"
                            >
                                Mind Weather
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-[10px] text-white/50 tracking-wider"
                            >
                                당신의 마음을 읽는 날씨
                            </motion.p>
                        </div>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative cursor-pointer group p-2 hover:bg-white/10 rounded-full transition-colors"
                            onClick={handleBellClick}
                        >
                            <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">🔔</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce shadow-lg ring-2 ring-black/20">
                                    {unreadCount}
                                </span>
                            )}
                        </motion.div>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        {/* User Profile / Logout */}
                        <div className="flex items-center gap-3">
                            {user?.user_metadata?.email && (
                                <span className="text-xs text-white/40 hidden sm:block">
                                    {user.user_metadata.email.split('@')[0]}님
                                </span>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={signOut}
                                className="text-xs bg-white/10 text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-all border border-white/5"
                            >
                                로그아웃
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showInbox && <InboxModal onClose={() => setShowInbox(false)} />}
            </AnimatePresence>
        </>
    );
}
