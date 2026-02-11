import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, themes, type ThemeName } from '../contexts/ThemeContext';

const themeOptions: { key: ThemeName; emoji: string; name: string; desc: string }[] = [
    { key: 'dark', emoji: '🌙', name: '다크', desc: '기본 어두운 테마' },
    { key: 'light', emoji: '☀️', name: '라이트', desc: '밝고 깔끔한 테마' },
    { key: 'ocean', emoji: '🌊', name: '오션', desc: '바다처럼 시원한 테마' },
    { key: 'purple', emoji: '💜', name: '퍼플', desc: '보라빛 감성 테마' },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const colors = themes[theme];
    const currentOption = themeOptions.find(t => t.key === theme)!;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-full transition-colors hover:bg-white/10"
                title="테마 변경"
                style={{ color: colors.text.primary }}
            >
                <span className="text-xl">{currentOption.emoji}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 rounded-2xl shadow-2xl overflow-hidden z-[200] border"
                        style={{
                            backgroundColor: colors.bg.secondary,
                            borderColor: colors.border,
                        }}
                    >
                        <div className="p-2">
                            {themeOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => {
                                        setTheme(opt.key);
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                    style={{
                                        backgroundColor: theme === opt.key ? colors.accent.primary + '20' : 'transparent',
                                    }}
                                >
                                    <span className="text-xl">{opt.emoji}</span>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold" style={{ color: colors.text.primary }}>
                                            {opt.name}
                                        </p>
                                        <p className="text-xs" style={{ color: colors.text.tertiary }}>
                                            {opt.desc}
                                        </p>
                                    </div>
                                    {theme === opt.key && (
                                        <span style={{ color: colors.accent.primary }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
