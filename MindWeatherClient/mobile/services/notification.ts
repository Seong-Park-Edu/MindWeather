import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// 푸시 알림이 도착했을 때 어떻게 처리할지 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Expo Push Token을 가져오는 함수
 * 참고: Android에서는 Firebase(FCM) 설정이 필요합니다.
 * google-services.json이 없으면 푸시 알림이 비활성화됩니다.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    try {
        // 실제 기기가 아니면 푸시 알림을 지원하지 않음
        if (!Device.isDevice) {
            console.log('[Push] 실제 기기에서만 푸시 알림을 지원합니다');
            return null;
        }

        // 알림 권한 요청
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] 알림 권한이 거부되었습니다');
            return null;
        }

        // Expo Push Token 가져오기
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
            console.log('[Push] Project ID를 찾을 수 없습니다. 푸시 알림을 건너뜁니다.');
            return null;
        }

        // Android 채널 설정 (토큰 요청 전에 설정)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        console.log('[Push] Expo Push Token:', tokenData.data);
        return tokenData.data;
    } catch (error: any) {
        // Firebase 미설정 시 발생하는 오류를 조용히 처리
        const msg = error?.message || '';
        if (msg.includes('FirebaseApp') || msg.includes('FCM') || msg.includes('firebase')) {
            console.log('[Push] Firebase(FCM)가 아직 설정되지 않았습니다. 푸시 알림이 비활성화됩니다.');
            console.log('[Push] 설정 방법: https://docs.expo.dev/push-notifications/fcm-credentials/');
        } else {
            console.warn('[Push] 푸시 토큰 가져오기 실패:', msg);
        }
        return null;
    }
}

/**
 * 서버에 Push Token을 저장하는 함수
 */
export async function savePushTokenToServer(userId: string, token: string): Promise<boolean> {
    try {
        const response = await api.post(`/users/${userId}/push-token`, { token });
        console.log('Push token saved to server successfully:', response.data);
        return true;
    } catch (error) {
        console.error('Error saving push token to server:', error);
        return false;
    }
}

/**
 * 푸시 알림 설정 및 서버 등록을 한 번에 처리하는 함수
 */
export async function setupPushNotifications(userId: string): Promise<void> {
    try {
        const token = await registerForPushNotifications();

        if (token) {
            await savePushTokenToServer(userId, token);
        }
    } catch (error) {
        console.error('Error setting up push notifications:', error);
    }
}

/**
 * 알림 리스너 추가 (알림을 탭했을 때 처리)
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * 포그라운드에서 알림 수신 리스너
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}
