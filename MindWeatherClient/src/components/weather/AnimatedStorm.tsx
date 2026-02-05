import { motion } from 'framer-motion';

interface AnimatedStormProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedStorm({ size, color, glowColor: _glowColor, intensity = 5 }: AnimatedStormProps) {
    // Flash frequency based on intensity
    const flashDuration = Math.max(0.8, 2 - intensity * 0.12);

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
                <filter id="stormGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="stormGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#4A0E0E" stopOpacity="0.8" />
                </linearGradient>
            </defs>

            {/* Dark storm cloud */}
            <motion.g
                filter="url(#stormGlow)"
                animate={{
                    x: [-1, 1, -1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <ellipse cx="50" cy="35" rx="30" ry="18" fill="url(#stormGradient)" />
                <ellipse cx="32" cy="33" rx="18" ry="14" fill="url(#stormGradient)" />
                <ellipse cx="68" cy="33" rx="18" ry="14" fill="url(#stormGradient)" />
                <ellipse cx="45" cy="26" rx="14" ry="11" fill="url(#stormGradient)" />
                <ellipse cx="60" cy="28" rx="12" ry="10" fill="url(#stormGradient)" />
            </motion.g>

            {/* Lightning bolt with flash animation */}
            <motion.path
                d="M52 45 L48 55 L54 55 L46 72 L50 60 L44 60 L52 45"
                fill="#FFE566"
                stroke="#FFD700"
                strokeWidth="1"
                animate={{
                    opacity: [0, 1, 1, 0, 0, 0],
                    scale: [0.9, 1.1, 1, 0.9, 0.9, 0.9],
                }}
                transition={{
                    duration: flashDuration,
                    repeat: Infinity,
                    times: [0, 0.1, 0.15, 0.2, 0.5, 1],
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Flash glow effect */}
            <motion.circle
                cx="50"
                cy="55"
                r="15"
                fill="rgba(255, 230, 100, 0.4)"
                animate={{
                    opacity: [0, 0.6, 0, 0],
                    scale: [0.5, 1.5, 1, 0.5],
                }}
                transition={{
                    duration: flashDuration,
                    repeat: Infinity,
                    times: [0, 0.1, 0.2, 1],
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Rain drops */}
            {[...Array(4)].map((_, i) => (
                <motion.line
                    key={i}
                    x1={32 + i * 12}
                    y1={75}
                    x2={30 + i * 12}
                    y2={82}
                    stroke="rgba(150, 180, 255, 0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{
                        opacity: [0, 0.7, 0],
                        y: [0, 12, 18],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </motion.svg>
    );
}
