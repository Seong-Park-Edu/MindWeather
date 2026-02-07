import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationCount } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECKED_KEY = 'notificationLastChecked';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
    onInboxPress?: () => void;
}

export function Header({ onInboxPress }: HeaderProps) {
    const { user, isAdmin, signOut } = useAuth();
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
        <View className="flex-row justify-between items-center px-4 py-3 bg-gray-900/80">
            {/* Title */}
            <View className="flex-1">
                <Text className="text-2xl font-bold text-white">
                    🌤️ Mind Weather
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                    마음의 날씨를 나누고, 서로를 위로해요
                </Text>
            </View>

            {/* Right controls */}
            <View className="flex-row items-center gap-3">
                {/* Admin Icon */}
                {isAdmin && (
                    <TouchableOpacity
                        onPress={() => router.push('/admin')}
                        className="p-2 bg-purple-600/20 rounded-full border border-purple-500/30 items-center justify-center"
                    >
                        <Text style={{ fontSize: 18 }}>🛡️</Text>
                    </TouchableOpacity>
                )}

                {/* Notification Bell */}
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

                {/* Logout */}
                <TouchableOpacity
                    onPress={signOut}
                    className="px-3 py-1.5 bg-white/10 rounded-full"
                >
                    <Text className="text-white text-xs">로그아웃</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
