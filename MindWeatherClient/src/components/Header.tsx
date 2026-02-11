import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getNotificationCount } from '../services/api';
import { InboxModal } from './InboxModal';
import { ThemeSwitcher } from './ThemeSwitcher';

const LAST_CHECKED_KEY = 'notificationLastChecked';

export function Header() {
    const { user, isGuest, isAdmin, signOut } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
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

    // Poll for notifications (skip for guests)
    useEffect(() => {
        if (!user || isGuest) return;

        const poll = async () => {
            const since = getLastCheckedAt();
            const result = await getNotificationCount(user.id, since || undefined);
            setUnreadCount(result.total);
        };

        poll();
        const interval = setInterval(poll, 10000);
        return () => clearInterval(interval);
    }, [user, isGuest, showInbox, getLastCheckedAt]);

    // Handle bell click - reset count and open inbox
    const handleBellClick = () => {
        setLastCheckedAt();
        setUnreadCount(0);
        setShowInbox(true);
    };

    const handleAuthAction = () => {
        if (isGuest) {
            // Reload to go back to login page
            window.location.reload();
        } else {
            signOut();
        }
    };

    return (
        <>
            <header
                className="absolute top-0 left-0 right-0 z-30 p-4"
                style={{ backgroundColor: colors.bg.secondary + 'CC' }}
            >
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
                            className="text-sm mt-1"
                            style={{ color: colors.text.secondary }}
                        >
                            마음의 날씨를 나누고, 서로를 위로해요
                        </motion.p>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-2">
                        {/* Guest Badge */}
                        {isGuest && (
                            <span
                                className="px-3 py-1 rounded-full text-xs font-bold border"
                                style={{
                                    backgroundColor: '#EAB30833',
                                    borderColor: '#EAB30850',
                                    color: '#FBBF24',
                                }}
                            >
                                👀 게스트
                            </span>
                        )}

                        {/* Admin Badge */}
                        {!isGuest && isAdmin && (
                            <a
                                href="/?admin=true"
                                className="p-2 rounded-full border text-center"
                                style={{
                                    backgroundColor: colors.accent.primary + '20',
                                    borderColor: colors.accent.primary + '30',
                                }}
                            >
                                <span style={{ fontSize: 18 }}>🛡️</span>
                            </a>
                        )}

                        {/* Notification Bell - hide for guests */}
                        {!isGuest && (
                            <div
                                className="relative cursor-pointer group p-2 rounded-full transition-colors"
                                style={{ color: colors.text.primary }}
                                onClick={handleBellClick}
                            >
                                <span className="text-2xl">🔔</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Theme Switcher */}
                        <ThemeSwitcher />

                        {/* Login/Logout Button */}
                        <button
                            onClick={handleAuthAction}
                            className="text-xs px-3 py-1 rounded-full transition-colors"
                            style={{
                                backgroundColor: colors.bg.tertiary,
                                color: colors.text.primary,
                            }}
                        >
                            {isGuest ? '로그인' : '로그아웃'}
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
