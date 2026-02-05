import { useState, useEffect, useRef } from 'react';
import { useDominantEmotion } from '../hooks/useDominantEmotion';
import { EmotionType } from '../types/emotion';
import { motion, AnimatePresence } from 'framer-motion';

const SOUND_MAPPING: Record<number, string> = {
    [EmotionType.Joy]: '/sounds/joy.mp3', // Happy, birds
    [EmotionType.Sadness]: '/sounds/rain.mp3', // Rain, gentle
    [EmotionType.Anger]: '/sounds/wind.mp3', // Stormy, wind
    [EmotionType.Anxiety]: '/sounds/wind.mp3',
    [EmotionType.Fatigue]: '/sounds/rain.mp3',
    // Default fallback
};

const DEFAULT_SOUND = '/sounds/neutral.mp3';

export function SoundManager() {
    const dominantEmotion = useDominantEmotion();
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial user interaction required
    const toggleSound = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Play failed", e));
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
            audioRef.current.volume = 0.3; // Low background volume
        }

        const targetSrc = dominantEmotion !== null && SOUND_MAPPING[dominantEmotion]
            ? SOUND_MAPPING[dominantEmotion]
            : DEFAULT_SOUND;

        // Only switch track if different
        // In a real app, we'd cross-fade here. For now, simple switch.
        const currentSrc = audioRef.current.getAttribute('src');
        // Note: audio.src returns absolute path, getAttribute returns what we set

        if (currentSrc !== targetSrc) {
            console.log(`Mood changed to ${dominantEmotion}, switching sound to ${targetSrc}`);
            const wasPlaying = isPlaying;
            audioRef.current.src = targetSrc;
            if (wasPlaying) {
                audioRef.current.play().catch(e => console.error("Switch track failed", e));
            }
        }
    }, [dominantEmotion, isPlaying]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSound}
                className={`p-3 rounded-full backdrop-blur-md transition-colors ${isPlaying
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10'
                    : 'bg-black/40 text-white/50'
                    }`}
            >
                {isPlaying ? (
                    <span className="text-xl">🔊</span>
                ) : (
                    <span className="text-xl">🔇</span>
                )}
            </motion.button>

            {/* Tooltip to explain */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-black/80 text-white text-xs px-3 py-1 rounded-lg pointer-events-none"
                    >
                        소리 켜기 (무드 사운드)
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
