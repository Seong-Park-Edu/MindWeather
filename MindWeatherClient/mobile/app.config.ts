import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name || 'MindWeather',
    slug: config.slug || 'mind-weather',
    extra: {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        kakaoRestKey: process.env.EXPO_PUBLIC_KAKAO_REST_KEY,
        eas: {
            projectId: "your-project-id"
        }
    },
});
