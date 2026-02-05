import { motion } from 'framer-motion';

interface AnimatedAbyssProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedAbyss({ size, color, glowColor: _glowColor, intensity: _intensity = 5 }: AnimatedAbyssProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <defs>
                <radialGradient id="abyssGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="black" stopOpacity="1" />
                    <stop offset="70%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Rotating dark background */}
            <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="url(#abyssGradient)"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Contracting rings */}
            {[1, 2, 3].map((i) => (
                <motion.ellipse
                    key={i}
                    cx="50"
                    cy="50"
                    rx={40 - i * 5}
                    ry={35 - i * 5}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                    animate={{
                        rotate: [0, 180, 360],
                        scale: [1, 0.8, 1],
                        strokeOpacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{
                        duration: 4 - i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5
                    }}
                />
            ))}

            {/* Core */}
            <motion.circle
                cx="50"
                cy="50"
                r="10"
                fill="black"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.svg>
    );
}
