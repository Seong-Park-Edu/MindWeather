import type {
    CreateEmotionRequest,
    SendMessageRequest,
    EmotionResponse,
    MessageResponse,
    StatsResponse,
    ComfortStatsResponse,
} from '../types/emotion';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5015/api';

// Supabase 세션에서 JWT 토큰을 가져오는 헬퍼
async function getAuthToken(): Promise<string | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[authHeaders] getSession error:', error);
            return null;
        }
        if (!session) {
            console.warn('[authHeaders] No session found');
            return null;
        }
        if (!session.access_token) {
            console.warn('[authHeaders] Session exists but no access_token');
            return null;
        }
        return session.access_token;
    } catch (e) {
        console.error('[authHeaders] Exception:', e);
        return null;
    }
}

// 인증 헤더를 생성하는 헬퍼
async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken();
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    console.warn('[authHeaders] No token available, request will be unauthenticated');
    return {};
}

// Notifications API
export interface NotificationCount {
    newMessages: number;
    newThanks: number;
    total: number;
}

export async function getNotificationCount(userId: string, since?: string): Promise<NotificationCount> {
    try {
        const params = since ? `?since=${encodeURIComponent(since)}` : '';
        const headers = await authHeaders();
        const response = await fetch(`${API_BASE_URL}/comfort-messages/notifications/${userId}${params}`, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch notification count');
        }

        return response.json();
    } catch {
        return { newMessages: 0, newThanks: 0, total: 0 };
    }
}

// Emotions API
export async function postEmotion(request: CreateEmotionRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/emotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Failed to post emotion');
    }

    return response.json();
}

export async function getEmotionsForMap(): Promise<EmotionResponse[]> {
    const response = await fetch(`${API_BASE_URL}/emotions/map`);

    if (!response.ok) {
        throw new Error('Failed to fetch emotions');
    }

    return response.json();
}

export async function getEmotionStats(): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE_URL}/emotions/stats`);

    if (!response.ok) {
        throw new Error('Failed to fetch stats');
    }

    return response.json();
}

// Comfort Messages API
export async function sendComfortMessage(request: SendMessageRequest): Promise<{ message: string; id: number }> {
    const response = await fetch(`${API_BASE_URL}/comfort-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
}

export async function getReceivedMessages(userId: string): Promise<MessageResponse[]> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/comfort-messages/received/${userId}`, { headers });

    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }

    return response.json();
}

export async function getSentMessages(userId: string): Promise<MessageResponse[]> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/comfort-messages/sent/${userId}`, { headers });

    if (!response.ok) {
        throw new Error('Failed to fetch sent messages');
    }

    return response.json();
}

export async function thankMessage(messageId: number, userId: string): Promise<{ message: string }> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/comfort-messages/${messageId}/thank?userId=${userId}`, {
        method: 'PUT',
        headers,
    });

    if (!response.ok) {
        throw new Error('Failed to thank message');
    }

    return response.json();
}

export async function getComfortStats(): Promise<ComfortStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/comfort-messages/stats`);

    if (!response.ok) {
        throw new Error('Failed to fetch comfort stats');
    }

    return response.json();
}

// Admin API
export interface AdminEmotionStat {
    emotion: number;
    count: number;
    totalLogs: number;
}

export interface BroadcastResponse {
    message: string;
    count: number;
}

export interface UserProfile {
    userId: string;
    isAdmin: boolean;
    isBanned: boolean;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return response.json();
}

export async function getAdminStats(token: string): Promise<AdminEmotionStat[]> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
    }

    return response.json();
}

export async function broadcastComfort(
    targetEmotion: number,
    content: string,
    token: string
): Promise<BroadcastResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/broadcast`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetEmotion, content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to broadcast message');
    }

    return response.json();
}

// 내 감정 기록 가져오기
export async function getMyEmotions(userId: string, year: number, month: number): Promise<EmotionResponse[]> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/emotions/my?userId=${userId}&year=${year}&month=${month}`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch my emotions');
    }
    return response.json();
}

// Public Messages (Community Board)
export interface PublicMessage {
    id: number;
    userId: string;
    content: string;
    likeCount: number;
    createdAt: string;
}

export async function postPublicMessage(userId: string, content: string): Promise<{ id: number }> {
    const response = await fetch(`${API_BASE_URL}/public-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
    });
    if (!response.ok) throw new Error('Failed to post public message');
    return response.json();
}

export async function getPublicMessages(sort: 'latest' | 'top' = 'latest'): Promise<PublicMessage[]> {
    const response = await fetch(`${API_BASE_URL}/public-messages?sort=${sort}`);
    if (!response.ok) throw new Error('Failed to fetch public messages');
    return response.json();
}

export async function likePublicMessage(id: number): Promise<{ likeCount: number }> {
    const response = await fetch(`${API_BASE_URL}/public-messages/${id}/like`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to like message');
    return response.json();
}

// Streak API
export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
}

export async function getUserStreak(userId: string): Promise<StreakData> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}/streak`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch streak');
    }
    return response.json();
}

// Weekly Insights API
export interface WeeklyInsightsData {
    hasData: boolean;
    totalEmotions: number;
    dominantEmotion: number;
    averageIntensity: number;
    positivePercentage: number;
    mostProductiveDay: string;
    dayOfWeekPattern: Record<string, number>;
    emotionBreakdown: Record<number, number>;
}

export async function getWeeklyInsights(userId: string): Promise<WeeklyInsightsData> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}/insights/weekly`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch weekly insights');
    }
    return response.json();
}

// Letters API
export interface Letter {
    id: number;
    content: string;
    generatedAt: string;
    isRead: boolean;
    readAt: string | null;
    analyzedFrom: string;
    analyzedTo: string;
}

export async function getLetters(userId: string): Promise<Letter[]> {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/letters/${userId}`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch letters');
    }
    return response.json();
}

export async function markLetterAsRead(letterId: number, userId: string): Promise<void> {
    const headers = await authHeaders();
    await fetch(`${API_BASE_URL}/letters/${letterId}/read?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
    });
}
