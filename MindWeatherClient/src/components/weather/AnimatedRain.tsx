import { motion } from 'framer-motion';

interface AnimatedRainProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedRain({ size, color, glowColor: _glowColor, intensity = 5 }: AnimatedRainProps) {
    const rainCount = 3 + Math.floor(intensity / 2); // More rain with higher intensity

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <defs>
                <filter id="rainGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Cloud */}
            <motion.path
                d="M25,50 Q30,35 45,40 Q55,25 70,35 Q85,35 85,50 Q90,65 75,70 L35,70 Q15,65 25,50"
                fill={color}
                filter="url(#rainGlow)"
                initial={{ y: -5 }}
                animate={{ y: 0 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                }}
            />

            {/* Raindrops */}
            {Array.from({ length: rainCount }).map((_, i) => (
                <motion.line
                    key={i}
                    x1={35 + i * (40 / rainCount) + Math.random() * 5}
                    y1={70}
                    x2={35 + i * (40 / rainCount) + Math.random() * 5 - 2}
                    y2={80}
                    stroke="#60A5FA" // Blue rain
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 20, opacity: [0, 1, 0] }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "linear"
                    }}
                />
            ))}
        </motion.svg>
    );
}
