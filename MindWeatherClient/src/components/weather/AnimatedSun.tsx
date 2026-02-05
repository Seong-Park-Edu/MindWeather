import { motion } from 'framer-motion';

interface AnimatedSunProps {
    size: number;
    color: string;
    glowColor: string;
}

export function AnimatedSun({ size, color, glowColor: _glowColor }: AnimatedSunProps) {
    const rayCount = 8;
    const rayLength = size * 0.35;
    const coreRadius = size * 0.28;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            {/* Glow effect */}
            <defs>
                <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id="sunGradient" cx="40%" cy="40%">
                    <stop offset="0%" stopColor="#FFF7CC" />
                    <stop offset="50%" stopColor={color} />
                    <stop offset="100%" stopColor="#E6A800" />
                </radialGradient>
            </defs>

            {/* Animated rays */}
            {[...Array(rayCount)].map((_, i) => {
                const angle = (i * 360) / rayCount;
                const x1 = 50 + Math.cos((angle * Math.PI) / 180) * (coreRadius + 5);
                const y1 = 50 + Math.sin((angle * Math.PI) / 180) * (coreRadius + 5);
                const x2 = 50 + Math.cos((angle * Math.PI) / 180) * (coreRadius + rayLength);
                const y2 = 50 + Math.sin((angle * Math.PI) / 180) * (coreRadius + rayLength);

                return (
                    <motion.line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        animate={{
                            opacity: [0.6, 1, 0.6],
                            strokeWidth: [2, 4, 2],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: 'easeInOut',
                        }}
                    />
                );
            })}

            {/* Core sun circle with pulsing animation */}
            <motion.circle
                cx="50"
                cy="50"
                r={coreRadius}
                fill="url(#sunGradient)"
                filter="url(#sunGlow)"
                animate={{
                    scale: [1, 1.08, 1],
                    filter: ['url(#sunGlow)', 'url(#sunGlow)', 'url(#sunGlow)'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Inner highlight */}
            <circle
                cx="42"
                cy="42"
                r={coreRadius * 0.25}
                fill="rgba(255,255,255,0.6)"
            />
        </motion.svg>
    );
}
