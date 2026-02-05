import { motion } from 'framer-motion';

interface AnimatedRainbowProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedRainbow({ size, color: _color, glowColor: _glowColor, intensity: _intensity = 5 }: AnimatedRainbowProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <defs>
                <filter id="rainbowGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Rainbow Arcs */}
            {['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'].map((c, i) => (
                <motion.path
                    key={i}
                    d={`M${20 + i * 4},${70} Q50,${20 + i * 4} ${80 - i * 4},${70}`}
                    fill="none"
                    stroke={c}
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                />
            ))}

            {/* Sparkles */}
            {[1, 2, 3].map((i) => (
                <motion.path
                    key={`star-${i}`}
                    d="M50,0 L52,8 L60,10 L52,12 L50,20 L48,12 L40,10 L48,8 Z"
                    fill="#FFD93D"
                    filter="url(#rainbowGlow)"
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        rotate: 180
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        repeatDelay: 0.5
                    }}
                    style={{
                        transformOrigin: 'center',
                        translateX: (i === 1 ? 20 : i === 2 ? -20 : 0),
                        translateY: (i === 1 ? 30 : i === 2 ? 30 : 15)
                    }}
                />
            ))}
        </motion.svg>
    );
}
