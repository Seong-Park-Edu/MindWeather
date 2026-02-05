import { motion } from 'framer-motion';
import { EmotionType, EmotionIcons, EmotionColors } from '../types/emotion';
import { WEATHER_CONFIG } from '../config/weatherMapping';

interface EmotionBubbleProps {
    emotion: EmotionType;
    intensity: number;
    region: string;
    onClick?: () => void;
}

export function EmotionBubble({ emotion, intensity, region, onClick }: EmotionBubbleProps) {
    const config = WEATHER_CONFIG[emotion];
    const size = 40 + intensity * 8; // 48-120px based on intensity
    const variant = config.animationVariant;

    // Animation Definitions
    const animations = {
        pulsing: { // Joy
            scale: [1, 1.1, 1],
            opacity: [1, 0.9, 1],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        },
        wavering: { // Sadness
            x: [-5, 5, -5],
            transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        },
        flashing: { // Anger
            opacity: [1, 0.6, 1],
            scale: [1, 1.05, 1],
            transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } // Fast flash
        },
        swirling: { // Anxiety
            rotate: [0, 360],
            transition: { duration: 3, repeat: Infinity, ease: 'linear' } // Fast spin
        },
        fading: { // Fatigue
            opacity: [0.4, 0.8, 0.4],
            scale: [0.95, 1, 0.95],
            transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        },
        floating: { // Calm
            y: [-5, 5, -5],
            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        },
        sparkling: { // Excitement
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0],
            filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
            transition: { duration: 0.8, repeat: Infinity, ease: "circIn" }
        },
        spinning_slow: { // Boredom
            rotate: [0, 360],
            transition: { duration: 20, repeat: Infinity, ease: 'linear' } // Very slow spin
        },
        drifting: { // Loneliness
            y: [0, 15, 0],
            opacity: [0.8, 0.4, 0.8],
            transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        },
        contracting: { // Depression
            scale: [1, 0.85, 1],
            opacity: [0.9, 0.7, 0.9],
            backgroundColor: [EmotionColors[emotion], "#000000", EmotionColors[emotion]],
            transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        }
    } as const;

    const currentAnim = (animations as any)[variant] || {};

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, zIndex: 100 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="absolute cursor-pointer flex flex-col items-center justify-center group"
            style={{
                width: size,
                height: size,
                // Apply specific container animations if needed
            }}
        >
            {/* Glow / Background Effect */}
            <motion.div
                animate={variant === 'contracting' ? {} : {
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.3, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full blur-md"
                style={{ backgroundColor: EmotionColors[emotion] }}
            />

            {/* Main Bubble */}
            <motion.div
                animate={currentAnim}
                className="relative w-full h-full rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${EmotionColors[emotion]}ee, ${EmotionColors[emotion]}66)`,
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                <span className="text-2xl select-none filter drop-shadow-md">
                    {EmotionIcons[emotion]}
                </span>

                {/* Sparkling Extra Effect (Excitement) */}
                {variant === 'sparkling' && (
                    <>
                        <motion.div
                            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            className="absolute top-0 right-0 text-xs"
                        >✨</motion.div>
                        <motion.div
                            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, -90] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
                            className="absolute bottom-1 left-1 text-xs"
                        >✨</motion.div>
                    </>
                )}
            </motion.div>

            {/* Label (Tooltip style on hover) */}
            <div className="absolute -bottom-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                {region} • {config.description}
            </div>
        </motion.div>
    );
}
