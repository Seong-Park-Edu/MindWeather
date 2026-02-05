import { motion } from 'framer-motion';

interface AnimatedFogProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedFog({ size, color, glowColor: _glowColor, intensity: _intensity = 5 }: AnimatedFogProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <defs>
                <filter id="fogBlur">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
            </defs>

            {/* Fog layers */}
            {[1, 2, 3].map((i) => (
                <motion.rect
                    key={i}
                    x="-20"
                    y={30 + i * 15}
                    width="140"
                    height="12"
                    rx="6"
                    fill={color}
                    opacity="0.6"
                    filter="url(#fogBlur)"
                    animate={{
                        x: [0, -10, 0],
                        opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5
                    }}
                />
            ))}
        </motion.svg>
    );
}
