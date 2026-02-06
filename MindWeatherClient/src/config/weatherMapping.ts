import { EmotionType } from '../types/emotion';

export type WeatherType = 'Sun' | 'Cloud' | 'Storm' | 'Tornado' | 'Fog' | 'PartlyCloudy' | 'Sparkles' | 'Dust' | 'Snow' | 'Abyss' | 'Rain' | 'Breeze' | 'Rainbow' | 'Snail';

export interface WeatherConfig {
    icon: WeatherType;
    color: string;
    glowColor: string;
    animationVariant: 'pulsing' | 'wavering' | 'flashing' | 'swirling' | 'fading' | 'floating' | 'sparkling' | 'spinning_slow' | 'drifting' | 'contracting';
    description: string;
}

// Map each emotion type to its weather visual representation
// Colors are carefully chosen to represent the emotional state and weather metaphor
export const WEATHER_CONFIG: Record<EmotionType, WeatherConfig> = {
    // Joy (기쁨) -> Bright pulsing sun with warm golden glow
    [EmotionType.Joy]: {
        icon: 'Sun',
        color: '#FFD93D',
        glowColor: 'rgba(255, 217, 61, 0.7)',
        animationVariant: 'pulsing',
        description: '맑은 햇살',
    },

    // Sadness (슬픔) -> Rain clouds
    [EmotionType.Sadness]: {
        icon: 'Rain',
        color: '#60A5FA', // Light Blue rain
        glowColor: 'rgba(96, 165, 250, 0.5)',
        animationVariant: 'wavering',
        description: '비',
    },

    // Anger (분노) -> Red/orange storm with intense lightning
    [EmotionType.Anger]: {
        icon: 'Storm',
        color: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.7)',
        animationVariant: 'flashing',
        description: '폭풍우',
    },

    // Anxiety (불안) -> Purple swirling tornado representing chaos
    [EmotionType.Anxiety]: {
        icon: 'Tornado',
        color: '#A855F7',
        glowColor: 'rgba(168, 85, 247, 0.6)',
        animationVariant: 'swirling',
        description: '회오리',
    },

    // Fatigue (피로) -> Slow moving snail
    [EmotionType.Fatigue]: {
        icon: 'Snail',
        color: '#94A3B8', // Slate-400
        glowColor: 'rgba(148, 163, 184, 0.5)',
        animationVariant: 'wavering',
        description: '달팽이',
    },

    // Calm (평온) -> Gentle Breeze
    [EmotionType.Calm]: {
        icon: 'Breeze',
        color: '#34D399', // Emerald Green
        glowColor: 'rgba(52, 211, 153, 0.5)',
        animationVariant: 'floating',
        description: '산들바람',
    },

    // Excitement (설렘) -> Rainbow and sparkles
    [EmotionType.Excitement]: {
        icon: 'Rainbow',
        color: '#F472B6',
        glowColor: 'rgba(244, 114, 182, 0.6)',
        animationVariant: 'sparkling',
        description: '무지개',
    },

    // Boredom (무료함) -> Muted beige slow spinning dust/spiral
    // Reusing Cloud or Fog if Dust isn't implemented, or keeping Dust if we make it later
    // Let's us Cloud for now as a fallback or keep Dust if user wants distinct
    [EmotionType.Boredom]: {
        icon: 'Cloud', // Fallback to Cloud for now, or Dust
        color: '#A8A29E',
        glowColor: 'rgba(168, 162, 158, 0.5)',
        animationVariant: 'spinning_slow',
        description: '흐림',
    },

    // Loneliness (외로움) -> Cold indigo drifting snowflake/leaf
    [EmotionType.Loneliness]: {
        icon: 'Snow',
        color: '#6366F1',
        glowColor: 'rgba(99, 102, 241, 0.5)',
        animationVariant: 'drifting',
        description: '눈',
    },

    // Depression (우울) -> Dark slate contracting abyss
    [EmotionType.Depression]: {
        icon: 'Abyss',
        color: '#1E293B',
        glowColor: 'rgba(30, 41, 59, 0.8)',
        animationVariant: 'contracting',
        description: '심연',
    },
};

// Get size multiplier based on intensity (1-10)
// Returns size in pixels for the weather icon
export function getIntensitySize(intensity: number): number {
    // Base size 45px, scales up to 90px at max intensity
    const minSize = 45;
    const maxSize = 90;
    return minSize + ((intensity - 1) / 9) * (maxSize - minSize);
}

// Get animation speed multiplier based on intensity
// Higher intensity = faster animations
export function getAnimationSpeed(intensity: number): number {
    // Returns a multiplier between 0.5 (slow) and 1.5 (fast)
    return 0.5 + (intensity / 10);
}

// Get opacity based on intensity
export function getIntensityOpacity(intensity: number): number {
    // Returns opacity between 0.6 and 1.0
    return 0.6 + (intensity / 25);
}
