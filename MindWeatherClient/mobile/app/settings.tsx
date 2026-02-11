import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import {
    getReminderSettings,
    saveReminderSettings,
    ReminderSettings,
} from '../services/reminder';

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];

    const [reminderEnabled, setReminderEnabled] = useState(true);
    const [hour, setHour] = useState(21);
    const [minute, setMinute] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getReminderSettings();
        setReminderEnabled(settings.enabled);
        setHour(settings.hour);
        setMinute(settings.minute);
        setLoaded(true);
    };

    const handleToggle = async (value: boolean) => {
        setReminderEnabled(value);
        await saveReminderSettings(
            { enabled: value, hour, minute },
            user?.id
        );
    };

    const adjustHour = async (delta: number) => {
        const newHour = (hour + delta + 24) % 24;
        setHour(newHour);
        if (reminderEnabled) {
            await saveReminderSettings(
                { enabled: true, hour: newHour, minute },
                user?.id
            );
        }
    };

    const adjustMinute = async (delta: number) => {
        const newMinute = (minute + delta + 60) % 60;
        setMinute(newMinute);
        if (reminderEnabled) {
            await saveReminderSettings(
                { enabled: true, hour, minute: newMinute },
                user?.id
            );
        }
    };

    if (!loaded) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.bg.secondary + 'CC',
                }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.text.primary, fontSize: 24 }}>←</Text>
                    </TouchableOpacity>
                    <Text style={{
                        color: colors.text.primary,
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginLeft: 12,
                    }}>설정</Text>
                </View>

                {/* Content */}
                <View style={{ padding: 16, gap: 16 }}>
                    {/* Reminder Section */}
                    <View style={{
                        backgroundColor: colors.bg.secondary,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <Text style={{
                            color: colors.text.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                            marginBottom: 16,
                        }}>감정 기록 리마인더</Text>

                        {/* Toggle */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.text.primary, fontSize: 14 }}>
                                    매일 알림 받기
                                </Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                                    설정한 시간에 감정 기록을 알려드려요
                                </Text>
                            </View>
                            <Switch
                                value={reminderEnabled}
                                onValueChange={handleToggle}
                                trackColor={{ false: colors.bg.tertiary, true: colors.accent.primary + '80' }}
                                thumbColor={reminderEnabled ? colors.accent.primary : '#ccc'}
                            />
                        </View>

                        {/* Time Picker */}
                        {reminderEnabled && (
                            <View style={{
                                backgroundColor: colors.bg.tertiary,
                                borderRadius: 12,
                                padding: 16,
                            }}>
                                <Text style={{
                                    color: colors.text.secondary,
                                    fontSize: 12,
                                    marginBottom: 12,
                                    textAlign: 'center',
                                }}>알림 시간</Text>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}>
                                    {/* Hour */}
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => adjustHour(1)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: colors.bg.secondary,
                                            }}
                                        >
                                            <Text style={{ color: colors.text.primary, fontSize: 18 }}>▲</Text>
                                        </TouchableOpacity>
                                        <Text style={{
                                            color: colors.text.primary,
                                            fontSize: 36,
                                            fontWeight: 'bold',
                                            marginVertical: 4,
                                            minWidth: 60,
                                            textAlign: 'center',
                                        }}>
                                            {String(hour).padStart(2, '0')}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => adjustHour(-1)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: colors.bg.secondary,
                                            }}
                                        >
                                            <Text style={{ color: colors.text.primary, fontSize: 18 }}>▼</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={{
                                        color: colors.text.primary,
                                        fontSize: 36,
                                        fontWeight: 'bold',
                                    }}>:</Text>

                                    {/* Minute */}
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => adjustMinute(5)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: colors.bg.secondary,
                                            }}
                                        >
                                            <Text style={{ color: colors.text.primary, fontSize: 18 }}>▲</Text>
                                        </TouchableOpacity>
                                        <Text style={{
                                            color: colors.text.primary,
                                            fontSize: 36,
                                            fontWeight: 'bold',
                                            marginVertical: 4,
                                            minWidth: 60,
                                            textAlign: 'center',
                                        }}>
                                            {String(minute).padStart(2, '0')}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => adjustMinute(-5)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: colors.bg.secondary,
                                            }}
                                        >
                                            <Text style={{ color: colors.text.primary, fontSize: 18 }}>▼</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={{
                                    color: colors.text.tertiary,
                                    fontSize: 11,
                                    textAlign: 'center',
                                    marginTop: 8,
                                }}>분은 5분 단위로 조절됩니다</Text>
                            </View>
                        )}
                    </View>

                    {/* App Info */}
                    <View style={{
                        backgroundColor: colors.bg.secondary,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <Text style={{
                            color: colors.text.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                            marginBottom: 12,
                        }}>앱 정보</Text>

                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: colors.text.secondary, fontSize: 14 }}>버전</Text>
                                <Text style={{ color: colors.text.tertiary, fontSize: 14 }}>1.0.0</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: colors.text.secondary, fontSize: 14 }}>테마</Text>
                                <Text style={{ color: colors.text.tertiary, fontSize: 14 }}>
                                    {theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : theme === 'ocean' ? '오션' : '퍼플'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
