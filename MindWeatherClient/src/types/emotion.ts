// Emotion types matching backend EmotionType enum
// Using const objects instead of enums for better compatibility with verbatimModuleSyntax
export const EmotionType = {
    Joy: 0,
    Sadness: 1,
    Anger: 2,
    Anxiety: 3,
    Fatigue: 4,
    Calm: 5,
    Excitement: 6,
    Boredom: 7,
    Loneliness: 8,
    Depression: 9,
} as const;

export type EmotionType = typeof EmotionType[keyof typeof EmotionType];

// String labels for emotions (Korean)
export const EmotionLabels: Record<EmotionType, string> = {
    [EmotionType.Joy]: '기쁨',
    [EmotionType.Sadness]: '슬픔',
    [EmotionType.Anger]: '분노',
    [EmotionType.Anxiety]: '불안',
    [EmotionType.Fatigue]: '피로',
    [EmotionType.Calm]: '평온',
    [EmotionType.Excitement]: '설렘',
    [EmotionType.Boredom]: '무료함',
    [EmotionType.Loneliness]: '외로움',
    [EmotionType.Depression]: '우울',
};

// Emotion icons (emoji)
export const EmotionIcons: Record<EmotionType, string> = {
    [EmotionType.Joy]: '☀️',
    [EmotionType.Sadness]: '🌧️',
    [EmotionType.Anger]: '⛈️',
    [EmotionType.Anxiety]: '🌪️',
    [EmotionType.Fatigue]: '🌫️',
    [EmotionType.Calm]: '🌤️',
    [EmotionType.Excitement]: '✨',
    [EmotionType.Boredom]: '😶',
    [EmotionType.Loneliness]: '🍂',
    [EmotionType.Depression]: '🕳️',
};

// Whether emotion is considered "negative" (weather = bad)
export const IsNegativeEmotion: Record<EmotionType, boolean> = {
    [EmotionType.Joy]: false,
    [EmotionType.Sadness]: true,
    [EmotionType.Anger]: true,
    [EmotionType.Anxiety]: true,
    [EmotionType.Fatigue]: true,
    [EmotionType.Calm]: false,
    [EmotionType.Excitement]: false,
    [EmotionType.Boredom]: true,
    [EmotionType.Loneliness]: true,
    [EmotionType.Depression]: true,
};

// Colors for each emotion
export const EmotionColors: Record<EmotionType, string> = {
    [EmotionType.Joy]: '#FFD93D',
    [EmotionType.Sadness]: '#6B7FDE',
    [EmotionType.Anger]: '#FF6B6B',
    [EmotionType.Anxiety]: '#9B59B6',
    [EmotionType.Fatigue]: '#95A5A6',
    [EmotionType.Calm]: '#4ECDC4',
    [EmotionType.Excitement]: '#F472B6', // Pink-400
    [EmotionType.Boredom]: '#A8A29E',     // Stone-400
    [EmotionType.Loneliness]: '#6366F1',  // Indigo-500
    [EmotionType.Depression]: '#1E293B',  // Slate-800
};

// All emotion values as array
export const AllEmotionTypes: EmotionType[] = [
    EmotionType.Joy,
    EmotionType.Sadness,
    EmotionType.Anger,
    EmotionType.Anxiety,
    EmotionType.Fatigue,
    EmotionType.Calm,
    EmotionType.Excitement,
    EmotionType.Boredom,
    EmotionType.Loneliness,
    EmotionType.Depression,
];

// Request DTOs
export interface CreateEmotionRequest {
    userId: string;
    emotion: EmotionType;
    intensity: number;
    region: string;
    tags: string;
    latitude?: number;
    longitude?: number;
}

export interface SendMessageRequest {
    senderId: string;
    receiverId: string;
    targetLogId?: number;
    content: string;
}

// Response DTOs
export interface EmotionResponse {
    userId: string; // 위로 메시지 전송용 (실제 유저 ID)
    emotion: EmotionType;
    intensity: number;
    region: string;
    tags?: string; // 태그 정보 추가
    createdAt: string;
    latitude?: number;
    longitude?: number;
}

export interface MessageResponse {
    id: number;
    senderId: string;
    receiverId: string;
    targetLogId?: number;
    content: string;
    status: string;
    isThanked: boolean;
    sentAt: string;
    thankedAt?: string;
}

export interface StatsResponse {
    todayCount: number;
}

export interface ComfortStatsResponse {
    totalComforts: number;
    totalThanks: number;
}

// Korean regions
export const KoreanRegions = [
    '서울',
    '부산',
    '대구',
    '인천',
    '광주',
    '대전',
    '울산',
    '세종',
    '경기',
    '강원',
    '충북',
    '충남',
    '전북',
    '전남',
    '경북',
    '경남',
    '제주',
] as const;

export type KoreanRegion = typeof KoreanRegions[number];

// Common tags
export const CommonTags = [
    '#출근',
    '#퇴근',
    '#학교',
    '#운동',
    '#연애',
    '#가족',
    '#친구',
    '#날씨',
    '#월요일',
    '#주말',
] as const;
