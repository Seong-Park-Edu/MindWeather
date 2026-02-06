import { motion } from 'framer-motion';

interface AnimatedSnailProps {
    size: number;
    color: string;
    glowColor: string;
    intensity: number;
}

export function AnimatedSnail({ size, color, glowColor, intensity }: AnimatedSnailProps) {
    // Snail moves slower with higher intensity (more tired)
    const duration = 2 + (intensity * 0.5);

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                style={{
                    filter: `drop-shadow(0 0 ${5 + intensity}px ${glowColor})`,
                    overflow: 'visible'
                }}
            >
                <motion.g
                    initial={{ x: -2 }}
                    animate={{ x: 2 }}
                    transition={{
                        duration: duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                >
                    {/* Shell (Spiral) */}
                    <motion.path
                        d="M50 35 C65 35 75 45 75 60 C75 75 60 80 50 80 C40 80 35 70 35 60 C35 50 45 45 50 45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity={0.9}
                        animate={{
                            rotate: [-2, 2, -2],
                            y: [0, 1, 0]
                        }}
                        transition={{
                            duration: duration * 0.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Shell Inner Fill (Optional semi-transparent background for shell) */}
                    <circle cx="55" cy="60" r="18" fill={color} opacity={0.3} />

                    {/* Body */}
                    <motion.path
                        d="M20 85 Q50 85 80 85 Q90 85 92 75"
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity={0.8}
                        animate={{
                            d: [
                                "M20 85 Q50 85 80 85 Q90 85 92 75", // Normal
                                "M22 85 Q50 84 78 85 Q88 85 90 75", // Slightly contracted/moved
                                "M20 85 Q50 85 80 85 Q90 85 92 75"
                            ]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Head/Feelers */}
                    <motion.g
                        animate={{
                            rotate: [0, 5, 0],
                            x: [0, 1, 0]
                        }}
                        transition={{
                            duration: duration * 1.2,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        {/* Antenna 1 */}
                        <line x1="90" y1="75" x2="95" y2="65" stroke={color} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="95" cy="65" r="2" fill={color} />

                        {/* Antenna 2 */}
                        <line x1="88" y1="75" x2="88" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="88" cy="62" r="2" fill={color} />
                    </motion.g>
                </motion.g>

                {/* "Zzz" Sleep/Tired particles - only for high intensity */}
                {intensity > 3 && (
                    <motion.g>
                        <motion.text
                            x="80"
                            y="40"
                            fontSize="10"
                            fill={color}
                            opacity={0.7}
                            initial={{ y: 0, opacity: 0 }}
                            animate={{ y: -15, opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        >
                            z
                        </motion.text>
                        <motion.text
                            x="90"
                            y="30"
                            fontSize="14"
                            fill={color}
                            opacity={0.7}
                            initial={{ y: 0, opacity: 0 }}
                            animate={{ y: -20, opacity: [0, 1, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                        >
                            Z
                        </motion.text>
                    </motion.g>
                )}
            </motion.svg>
        </div>
    );
}
