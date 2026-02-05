import { motion } from 'framer-motion';
import { useDominantEmotion } from '../hooks/useDominantEmotion';
import { EmotionType } from '../types/emotion';

// Detailed gradient mapping for each emotion
const BG_GRADIENTS: Record<number, string> = {
    [EmotionType.Joy]: 'linear-gradient(135deg, #FFD93D 0%, #FF8400 100%)',
    [EmotionType.Sadness]: 'linear-gradient(135deg, #4A90E2 0%, #141E30 100%)',
    [EmotionType.Anger]: 'linear-gradient(135deg, #FF6B6B 0%, #750D0D 100%)',
    [EmotionType.Anxiety]: 'linear-gradient(135deg, #9B59B6 0%, #341F97 100%)',
    [EmotionType.Fatigue]: 'linear-gradient(135deg, #95A5A6 0%, #2C3E50 100%)',
    [EmotionType.Calm]: 'linear-gradient(135deg, #4ECDC4 0%, #2F80ED 100%)',
    [EmotionType.Excitement]: 'linear-gradient(135deg, #F472B6 0%, #9D174D 100%)',
    [EmotionType.Boredom]: 'linear-gradient(135deg, #A8A29E 0%, #44403C 100%)',
    [EmotionType.Loneliness]: 'linear-gradient(135deg, #6366F1 0%, #312E81 100%)',
    [EmotionType.Depression]: 'linear-gradient(135deg, #1E293B 0%, #020617 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #0F172A 0%, #020617 100%)';

export function DynamicBackground() {
    const dominantEmotion = useDominantEmotion();

    const currentGradient = dominantEmotion !== null && BG_GRADIENTS[dominantEmotion]
        ? BG_GRADIENTS[dominantEmotion]
        : DEFAULT_GRADIENT;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Base Layer */}
            <div
                className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
                style={{ background: currentGradient }}
            />

            {/* Animated Glow / Overlay for depth */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.1)_0%,transparent_100%)]"
            />

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
}
