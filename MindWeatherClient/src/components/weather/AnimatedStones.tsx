import { motion } from 'framer-motion';

interface AnimatedStonesProps {
    size: number;
    color: string;
    glowColor: string;
    intensity: number;
}

export function AnimatedStones({ size, color, glowColor, intensity }: AnimatedStonesProps) {
    // Intensity affects wobble speed and range
    const duration = 4 - (intensity * 0.2); // Faster wobble with higher intensity (nervous/heavy)
    const wobbleRange = 2 + (intensity * 0.5); // More wobble with higher intensity

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                style={{
                    filter: `drop-shadow(0 0 ${10 + intensity}px ${glowColor})`,
                }}
            >
                {/* Bottom Stone (Largest) */}
                <motion.ellipse
                    cx="50"
                    cy="85"
                    rx="35"
                    ry="12"
                    fill={color}
                    opacity={0.9}
                    animate={{
                        rotate: [0, 1, 0, -1, 0],
                        x: [0, 1, 0, -1, 0]
                    }}
                    transition={{
                        duration: duration * 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Middle Stone */}
                <motion.ellipse
                    cx="50"
                    cy="68"
                    rx="25"
                    ry="10"
                    fill={color}
                    opacity={0.8}
                    animate={{
                        rotate: [0, -2, 0, 2, 0],
                        x: [0, -2, 0, 2, 0]
                    }}
                    transition={{
                        duration: duration * 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2 // Lag behind bottom stone
                    }}
                />

                {/* Top Stone (Smallest) */}
                <motion.ellipse
                    cx="50"
                    cy="52"
                    rx="15"
                    ry="8"
                    fill={color}
                    opacity={0.7}
                    animate={{
                        rotate: [0, wobbleRange, 0, -wobbleRange, 0],
                        x: [0, wobbleRange / 2, 0, -wobbleRange / 2, 0]
                    }}
                    transition={{
                        duration: duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4 // Lag behind middle stone
                    }}
                />

                {/* Optional "Heavy" particles falling slightly? Or just static static feeling? 
                    Let's add a few heavy droplets/particles drifting down lazily if high intensity 
                */}
                {[...Array(Math.floor(intensity / 2))].map((_, i) => (
                    <motion.circle
                        key={i}
                        cx={30 + Math.random() * 40}
                        cy={40 + Math.random() * 20}
                        r={1.5}
                        fill={color}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            y: [0, 20]
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </motion.svg>
        </div>
    );
}
