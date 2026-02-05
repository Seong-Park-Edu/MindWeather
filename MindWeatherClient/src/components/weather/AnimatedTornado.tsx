import { motion } from 'framer-motion';

interface AnimatedTornadoProps {
    size: number;
    color: string;
    glowColor: string;
    intensity?: number;
}

export function AnimatedTornado({ size, color, glowColor: _glowColor, intensity = 5 }: AnimatedTornadoProps) {
    // Speed based on intensity
    const duration = Math.max(0.5, 1.5 - intensity * 0.1);

    const layerCount = 5;
    const layers = Array.from({ length: layerCount }).map((_, i) => {
        const width = 40 - i * 6; // Tapers down
        const height = 10;
        const y = 30 + i * 12;
        // Alternate oscillation direction
        const initialX = i % 2 === 0 ? -3 : 3;

        return { width, height, y, initialX };
    });

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            overflow="visible"
        >
            <defs>
                <filter id="tornadoGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="tornadoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                </linearGradient>
            </defs>

            <motion.g
                style={{ transformOrigin: '50% 100%' }}
                animate={{ skewX: [-5, 5, -5] }}
                transition={{ duration: duration * 2, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Tornado body layers (oscillating ellipses) */}
                {layers.map((layer, i) => (
                    <motion.ellipse
                        key={i}
                        cx="50"
                        cy={layer.y}
                        rx={layer.width}
                        ry={layer.height}
                        fill="url(#tornadoGradient)"
                        animate={{
                            x: [layer.initialX, -layer.initialX, layer.initialX],
                            scaleX: [1, 0.9, 1]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                        }}
                    />
                ))}

                {/* Tornado swirl lines (path) */}
                <motion.path
                    d="M30,30 Q50,40 70,30 Q50,50 40,60 Q50,70 50,90"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    filter="url(#tornadoGlow)"
                    animate={{
                        d: [
                            "M30,30 Q50,40 70,30 Q50,50 40,60 Q50,70 50,90",
                            "M25,30 Q45,40 75,30 Q55,50 45,60 Q45,70 50,90",
                            "M30,30 Q50,40 70,30 Q50,50 40,60 Q50,70 50,90"
                        ]
                    }}
                    transition={{
                        duration: duration * 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </motion.g>

            {/* Debris particles orbiting */}
            {[...Array(5)].map((_, i) => (
                <motion.circle
                    key={`debris-${i}`}
                    r={1.5 + Math.random()}
                    fill={color}
                    animate={{
                        cx: [50 - 20, 50 + 20, 50 - 20],
                        cy: [40 + i * 10, 45 + i * 10 - 5, 40 + i * 10],
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                        duration: duration * 1.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.3,
                        repeatType: "reverse"
                    }}
                />
            ))}
        </motion.svg>
    );
}
