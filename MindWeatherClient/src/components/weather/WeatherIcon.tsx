import { motion } from 'framer-motion';
import type { EmotionType } from '../../types/emotion';
import { WEATHER_CONFIG, getIntensitySize } from '../../config/weatherMapping';
import { AnimatedSun } from './AnimatedSun';
import { AnimatedCloud } from './AnimatedCloud';
import { AnimatedStorm } from './AnimatedStorm';
import { AnimatedTornado } from './AnimatedTornado';
import { AnimatedFog } from './AnimatedFog';
import { AnimatedPartlyCloudy } from './AnimatedPartlyCloudy';
import { AnimatedRain } from './AnimatedRain';
import { AnimatedSnow } from './AnimatedSnow';
import { AnimatedAbyss } from './AnimatedAbyss';
import { AnimatedBreeze } from './AnimatedBreeze';
import { AnimatedRainbow } from './AnimatedRainbow';
import { AnimatedStones } from './AnimatedStones';

interface WeatherIconProps {
    emotion: EmotionType;
    intensity: number;
    region: string;
    size?: number;
    onClick?: () => void;
}

export function WeatherIcon({ emotion, intensity, region, size: propSize, onClick }: WeatherIconProps) {
    const config = WEATHER_CONFIG[emotion];
    const size = propSize || getIntensitySize(intensity);

    const renderWeatherComponent = () => {
        const props = {
            size,
            color: config.color,
            glowColor: config.glowColor,
            intensity,
        };

        switch (config.icon) {
            case 'Sun':
                return <AnimatedSun {...props} />;
            case 'Cloud':
                return <AnimatedCloud {...props} />;
            case 'Storm':
                return <AnimatedStorm {...props} />;
            case 'Tornado':
                return <AnimatedTornado {...props} />;
            case 'Fog':
                return <AnimatedFog {...props} />;
            case 'PartlyCloudy':
                return <AnimatedPartlyCloudy {...props} />;
            case 'Rain':
                return <AnimatedRain {...props} />;
            case 'Snow':
                return <AnimatedSnow {...props} />;
            case 'Abyss':
                return <AnimatedAbyss {...props} />;
            case 'Breeze':
                return <AnimatedBreeze {...props} />;
            case 'Rainbow':
                return <AnimatedRainbow {...props} />;
            case 'Stones':
                return <AnimatedStones {...props} />;
            default:
                return <AnimatedCloud {...props} />;
        }
    };

    return (
        <motion.div
            onClick={onClick}
            className="cursor-pointer"
            whileHover={{ scale: 1.15, zIndex: 20 }}
            whileTap={{ scale: 0.95 }}
            style={{
                width: size,
                height: size,
            }}
        >
            {renderWeatherComponent()}

            {/* Region tooltip on hover */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {region}
            </div>
        </motion.div>
    );
}
