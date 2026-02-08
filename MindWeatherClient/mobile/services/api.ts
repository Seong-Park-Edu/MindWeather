import {
    CreateEmotionRequest,
    SendMessageRequest,
    EmotionResponse,
    MessageResponse,
    StatsResponse,
    ComfortStatsResponse,
    NotificationCount,
    AdminEmotionStat,
    BroadcastResponse,
    UserProfile,
    PublicMessage
} from '../types/emotion';

// Using the production URL directly for the mobile app
const API_BASE_URL = 'https://mindweather-production.up.railway.app/api';

// Axios-like API wrapper for consistent usage across the app
const api = {
    async get<T = any>(url: string): Promise<{ data: T }> {
        const response = await fetch(`${API_BASE_URL}${url}`);
        if (!response.ok) {
            throw new Error(`GET ${url} failed: ${response.statusText}`);
        }
        const data = await response.json();
        return { data };
    },

    async post<T = any>(url: string, body?: any): Promise<{ data: T }> {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`POST ${url} failed: ${response.status} ${errorBody}`);
        }
        const data = await response.json();
        return { data };
    },

    async put<T = any>(url: string, body?: any): Promise<{ data: T }> {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            throw new Error(`PUT ${url} failed: ${response.statusText}`);
        }
        const data = await response.json();
        return { data };
    },

    async delete<T = any>(url: string): Promise<{ data: T }> {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`DELETE ${url} failed: ${response.statusText}`);
        }
        const data = await response.json();
        return { data };
    },
};

export default api;

// Notifications API
export async function getNotificationCount(userId: string, since?: string): Promise<NotificationCount> {
    try {
        const params = since ? `?since=${encodeURIComponent(since)}` : '';
        const response = await fetch(`${API_BASE_URL}/comfort-messages/notifications/${userId}${params}`);

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
    const response = await fetch(`${API_BASE_URL}/comfort-messages/received/${userId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }

    return response.json();
}

export async function getSentMessages(userId: string): Promise<MessageResponse[]> {
    const response = await fetch(`${API_BASE_URL}/comfort-messages/sent/${userId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch sent messages');
    }

    return response.json();
}

export async function thankMessage(messageId: number, userId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/comfort-messages/${messageId}/thank?userId=${userId}`, {
        method: 'PUT',
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

export async function getMyEmotions(userId: string, year: number, month: number): Promise<EmotionResponse[]> {
    const response = await fetch(`${API_BASE_URL}/emotions/my?userId=${userId}&year=${year}&month=${month}`);
    if (!response.ok) {
        throw new Error('Failed to fetch my emotions');
    }
    return response.json();
}

// Public Messages
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
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/streak`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Streak API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                url: `${API_BASE_URL}/users/${userId}/streak`
            });
            throw new Error(`Failed to fetch streak data: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('getUserStreak error:', error);
        throw error;
    }
}

// Weekly Insights API
export interface WeeklyInsights {
    hasData: boolean;
    totalEmotions: number;
    dominantEmotion: number | null;
    averageIntensity: number;
    emotionBreakdown: Record<number, number>;
    dayOfWeekPattern: Record<string, number>;
    positivePercentage: number;
    mostProductiveDay: string | null;
}

export async function getWeeklyInsights(userId: string): Promise<WeeklyInsights> {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/insights/weekly`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Weekly Insights API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                url: `${API_BASE_URL}/users/${userId}/insights/weekly`
            });
            throw new Error(`Failed to fetch weekly insights: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('getWeeklyInsights error:', error);
        throw error;
    }
}
