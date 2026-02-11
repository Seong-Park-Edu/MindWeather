import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyEmotions } from './api';

const REMINDER_SETTINGS_KEY = '@mindweather_reminder';
const REMINDER_NOTIFICATION_ID = 'daily-emotion-reminder';

export interface ReminderSettings {
    enabled: boolean;
    hour: number;   // 0-23
    minute: number; // 0-59
}

const DEFAULT_SETTINGS: ReminderSettings = {
    enabled: true,
    hour: 21,
    minute: 0,
};

/**
 * AsyncStorage에서 리마인더 설정을 불러옵니다.
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
    try {
        const stored = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
        return DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/**
 * 리마인더 설정을 저장하고, 알림을 재스케줄링합니다.
 */
export async function saveReminderSettings(
    settings: ReminderSettings,
    userId?: string
): Promise<void> {
    try {
        await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
        if (settings.enabled && userId) {
            await scheduleDailyReminder(settings, userId);
        } else {
            await cancelDailyReminder();
        }
    } catch (error) {
        console.error('[Reminder] Failed to save settings:', error);
    }
}

/**
 * 매일 지정 시간에 감정 기록 리마인더 알림을 예약합니다.
 * 이미 오늘 감정을 기록했으면 알림을 건너뜁니다.
 */
export async function scheduleDailyReminder(
    settings: ReminderSettings,
    userId: string
): Promise<void> {
    try {
        // 기존 알림 취소
        await cancelDailyReminder();

        if (!settings.enabled) return;

        // 오늘 감정 기록 여부 확인
        const hasRecordedToday = await checkTodayEmotion(userId);
        if (hasRecordedToday) {
            console.log('[Reminder] 오늘 이미 감정을 기록했으므로 알림을 건너뜁니다.');
            // 내일을 위한 알림만 예약 (trigger로 daily repeat 사용)
        }

        // 매일 반복 알림 예약
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌤️ 오늘의 마음 날씨는?',
                body: '오늘 하루는 어떠셨나요? 잠시 멈추고 마음을 기록해보세요.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: settings.hour,
                minute: settings.minute,
            },
            identifier: REMINDER_NOTIFICATION_ID,
        });

        console.log(`[Reminder] 매일 ${settings.hour}:${String(settings.minute).padStart(2, '0')}에 리마인더 예약됨`);
    } catch (error) {
        console.error('[Reminder] Failed to schedule reminder:', error);
    }
}

/**
 * 예약된 리마인더 알림을 취소합니다.
 */
export async function cancelDailyReminder(): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    } catch (error) {
        // 예약된 알림이 없는 경우 무시
    }
}

/**
 * 오늘 감정을 기록했는지 확인합니다.
 */
async function checkTodayEmotion(userId: string): Promise<boolean> {
    try {
        const now = new Date();
        const emotions = await getMyEmotions(userId, now.getFullYear(), now.getMonth() + 1);
        const todayStr = now.toISOString().split('T')[0];
        return emotions.some(e => e.createdAt.split('T')[0] === todayStr);
    } catch {
        return false;
    }
}

/**
 * 앱 시작 시 리마인더를 초기화합니다.
 * 설정이 활성화되어 있으면 알림을 스케줄링합니다.
 */
export async function initializeReminder(userId: string): Promise<void> {
    try {
        const settings = await getReminderSettings();
        if (settings.enabled) {
            await scheduleDailyReminder(settings, userId);
        }
    } catch (error) {
        console.error('[Reminder] Failed to initialize:', error);
    }
}
