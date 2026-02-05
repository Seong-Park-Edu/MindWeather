import { motion } from 'framer-motion';

interface AnimatedPartlyCloudyProps {
    size: number;
    color: string;
    glowColor: string;
}

export function AnimatedPartlyCloudy({ size, color, glowColor: _glowColor }: AnimatedPartlyCloudyProps) {
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
                <filter id="pcGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id="pcSunGradient" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#FFF7CC" />
                    <stop offset="60%" stopColor="#FFD93D" />
                    <stop offset="100%" stopColor="#E6A800" />
                </radialGradient>
                <linearGradient id="pcCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
            </defs>

            {/* Sun in background with gentle pulse */}
            <motion.g
                filter="url(#pcGlow)"
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{ transformOrigin: '35px 35px' }}
            >
                {/* Sun rays */}
                {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * (Math.PI / 180);
                    return (
                        <motion.line
                            key={i}
                            x1={35 + Math.cos(angle) * 15}
                            y1={35 + Math.sin(angle) * 15}
                            x2={35 + Math.cos(angle) * 22}
                            y2={35 + Math.sin(angle) * 22}
                            stroke="#FFD93D"
                            strokeWidth="2"
                            strokeLinecap="round"
                            animate={{
                                opacity: [0.5, 0.9, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.15,
                            }}
                        />
                    );
                })}

                {/* Sun core */}
                <circle cx="35" cy="35" r="12" fill="url(#pcSunGradient)" />
                <circle cx="31" cy="31" r="3" fill="rgba(255,255,255,0.5)" />
            </motion.g>

            {/* Cloud floating in front */}
            <motion.g
                filter="url(#pcGlow)"
                animate={{
                    x: [-3, 3, -3],
                    y: [-1, 1, -1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <ellipse cx="60" cy="55" rx="22" ry="14" fill="url(#pcCloudGradient)" />
                <ellipse cx="48" cy="53" rx="14" ry="11" fill="url(#pcCloudGradient)" />
                <ellipse cx="72" cy="53" rx="14" ry="11" fill="url(#pcCloudGradient)" />
                <ellipse cx="55" cy="46" rx="12" ry="9" fill="url(#pcCloudGradient)" />
                <ellipse cx="65" cy="48" rx="10" ry="8" fill="url(#pcCloudGradient)" />

                {/* Cloud highlight */}
                <ellipse cx="52" cy="45" rx="6" ry="4" fill="rgba(255,255,255,0.4)" />
            </motion.g>
        </motion.svg>
    );
}
