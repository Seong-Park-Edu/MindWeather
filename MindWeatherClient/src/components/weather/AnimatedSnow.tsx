import { motion } from 'framer-motion';

interface AnimatedSnowProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedSnow({ size, color, glowColor: _glowColor, intensity: _intensity = 5 }: AnimatedSnowProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <defs>
                <radialGradient id="snowGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Snowflakes */}
            {Array.from({ length: 6 }).map((_, i) => (
                <motion.circle
                    key={i}
                    r={2 + Math.random() * 2}
                    fill="url(#snowGlow)"
                    initial={{
                        cx: 20 + Math.random() * 60,
                        cy: -10
                    }}
                    animate={{
                        cy: 110,
                        cx: [
                            20 + Math.random() * 60,
                            20 + Math.random() * 60 + (i % 2 === 0 ? 10 : -10),
                            20 + Math.random() * 60
                        ]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "linear"
                    }}
                />
            ))}

            {/* Center abstract cold core */}
            <motion.circle
                cx="50"
                cy="50"
                r="15"
                fill={color}
                opacity="0.3"
                filter="blur(5px)"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.svg>
    );
}
