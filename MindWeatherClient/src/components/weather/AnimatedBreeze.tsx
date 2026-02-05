import { motion } from 'framer-motion';

interface AnimatedBreezeProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedBreeze({ size, color, glowColor: _glowColor, intensity: _intensity = 5 }: AnimatedBreezeProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Gentle wind lines */}
            <motion.path
                d="M20,40 Q40,30 60,40 T90,30"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, x: -10 }}
                animate={{ pathLength: 1, x: 10, opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
                d="M10,60 Q30,50 50,60 T80,50"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, x: -10 }}
                animate={{ pathLength: 1, x: 10, opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Floating Leaves */}
            {[1, 2].map((i) => (
                <motion.path
                    key={i}
                    d="M0,0 Q5,-5 10,0 Q5,5 0,0"
                    fill="#4ADE80" // Green leaf
                    initial={{ x: 20, y: 40 + i * 20, opacity: 0, scale: 0 }}
                    animate={{
                        x: 80,
                        y: 30 + i * 20 + Math.random() * 10,
                        rotate: 360,
                        opacity: [0, 1, 0],
                        scale: 1
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 1.5,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </motion.svg>
    );
}
