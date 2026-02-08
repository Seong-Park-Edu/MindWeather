import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getNotificationCount } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECKED_KEY = 'notificationLastChecked';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
    onInboxPress?: () => void;
}

export function Header({ onInboxPress }: HeaderProps) {
    const { user, isAdmin, isGuest, signOut } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    const getLastCheckedAt = useCallback(async () => {
        if (!user) return null;
        try {
            const stored = await AsyncStorage.getItem(`${LAST_CHECKED_KEY}_${user.id}`);
            return stored || null;
        } catch {
            return null;
        }
    }, [user]);

    const setLastCheckedAt = useCallback(async () => {
        if (!user) return;
        try {
            const now = new Date().toISOString();
            await AsyncStorage.setItem(`${LAST_CHECKED_KEY}_${user.id}`, now);
        } catch (e) {
            console.error('Failed to save lastCheckedAt', e);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const poll = async () => {
            try {
                const since = await getLastCheckedAt();
                const result = await getNotificationCount(user.id, since || undefined);
                setUnreadCount(result.total);
            } catch (e) {
                console.error('Failed to get notification count', e);
            }
        };

        poll();
        const interval = setInterval(poll, 10000);
        return () => clearInterval(interval);
    }, [user, getLastCheckedAt]);

    const handleBellClick = async () => {
        await setLastCheckedAt();
        setUnreadCount(0);
        onInboxPress?.();
    };

    return (
        <View style={{ backgroundColor: colors.bg.secondary + 'CC' }}>
            <View className="flex-row justify-between items-center px-4 py-3">
                {/* Title */}
                <View className="flex-1">
                    <Text style={{ color: colors.text.primary }} className="text-2xl font-bold">
                        🌤️ Mind Weather
                    </Text>
                    <Text style={{ color: colors.text.secondary }} className="text-xs mt-0.5">
                        마음의 날씨를 나누고, 서로를 위로해요
                    </Text>
                </View>

                {/* Right controls */}
                <View className="flex-row items-center gap-3">
                    {/* Guest Badge */}
                    {isGuest && (
                        <View className="px-3 py-1.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                            <Text className="text-yellow-400 text-xs font-bold">👀 게스트</Text>
                        </View>
                    )}

                    {/* Admin Icon */}
                    {!isGuest && isAdmin && (
                        <TouchableOpacity
                            onPress={() => router.push('/admin')}
                            className="p-2 bg-purple-600/20 rounded-full border border-purple-500/30 items-center justify-center"
                        >
                            <Text style={{ fontSize: 18 }}>🛡️</Text>
                        </TouchableOpacity>
                    )}

                    {/* Notification Bell - Hide for guests */}
                    {!isGuest && (
                        <TouchableOpacity
                            onPress={handleBellClick}
                            className="relative p-2 bg-white/10 rounded-full"
                        >
                            <Text className="text-xl">🔔</Text>
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                                    <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Login/Logout */}
                    <TouchableOpacity
                        onPress={() => {
                            if (isGuest) {
                                router.push('/login');
                            } else {
                                signOut();
                            }
                        }}
                        style={{ backgroundColor: colors.bg.tertiary }}
                        className="px-3 py-1.5 rounded-full"
                    >
                        <Text style={{ color: colors.text.primary }} className="text-xs">{isGuest ? '로그인' : '로그아웃'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
