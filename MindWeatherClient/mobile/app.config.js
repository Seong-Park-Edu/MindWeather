import 'dotenv/config';

export default {
    name: "MindWeather",
    slug: "mind-weather",
    version: "1.0.0",
    orientation: "portrait",
    newArchEnabled: true,
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
        "**/*"
    ],
    ios: {
        supportsTablet: true
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        package: "com.jongseong.park.mindweather",
        googleServicesFile: "./google-services.json"
    },
    web: {
        favicon: "./assets/favicon.png",
        bundler: "metro"
    },
    plugins: [
        "expo-router",
        "expo-font",
        "expo-dev-client",
        [
            "expo-notifications",
            {
                icon: "./assets/icon.png",
                color: "#ffffff"
            }
        ]
    ],
    scheme: "mindweather",
    extra: {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        kakaoRestKey: process.env.EXPO_PUBLIC_KAKAO_REST_KEY,
        router: {
            origin: false
        },
        eas: {
            projectId: "cce5b31c-b8f6-4898-94fd-a58e984f5a0a"
        }
    }
};
