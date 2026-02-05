import { motion } from 'framer-motion';

interface AnimatedCloudProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedCloud({ size, color, glowColor: _glowColor, intensity = 5 }: AnimatedCloudProps) {
    const showRain = intensity >= 7;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <defs>
                <filter id="cloudGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </linearGradient>
            </defs>

            {/* Cloud shape with wavering animation */}
            <motion.g
                filter="url(#cloudGlow)"
                animate={{
                    x: [-2, 2, -2],
                    y: [-1, 1, -1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Main cloud body */}
                <ellipse cx="50" cy="50" rx="28" ry="18" fill="url(#cloudGradient)" />
                <ellipse cx="35" cy="48" rx="18" ry="14" fill="url(#cloudGradient)" />
                <ellipse cx="65" cy="48" rx="18" ry="14" fill="url(#cloudGradient)" />
                <ellipse cx="45" cy="40" rx="15" ry="12" fill="url(#cloudGradient)" />
                <ellipse cx="58" cy="42" rx="14" ry="11" fill="url(#cloudGradient)" />

                {/* Highlight */}
                <ellipse cx="42" cy="38" rx="8" ry="5" fill="rgba(255,255,255,0.3)" />
            </motion.g>

            {/* Rain drops for high intensity */}
            {showRain && (
                <g>
                    {[...Array(5)].map((_, i) => (
                        <motion.line
                            key={i}
                            x1={30 + i * 10}
                            y1={65}
                            x2={28 + i * 10}
                            y2={72}
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ opacity: 0, y: 0 }}
                            animate={{
                                opacity: [0, 0.8, 0],
                                y: [0, 15, 20],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: 'easeIn',
                            }}
                        />
                    ))}
                </g>
            )}
        </motion.svg>
    );
}
