import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getReceivedMessages, thankMessage } from '../services/api';
import { MessageResponse } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getReceivedMessages(user.id);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleThank = async (messageId: number) => {
        if (!user) return;
        try {
            await thankMessage(messageId, user.id);
            Alert.alert('Sent!', 'You sent a thank you note.');
            // Optimistic update
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, isThanked: true } : msg
            ));
        } catch (error) {
            Alert.alert('Error', 'Failed to send thank you.');
        }
    };

    const renderItem = ({ item }: { item: MessageResponse }) => (
        <View className={`p-5 mb-4 rounded-xl border ${item.isThanked ? 'bg-gray-800 border-gray-700' : 'bg-purple-900/30 border-purple-500'}`}>
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-400 text-xs">
                    From: {item.senderId.substring(0, 8)}...
                </Text>
                <Text className="text-gray-500 text-xs">
                    {new Date(item.sentAt).toLocaleDateString()}
                </Text>
            </View>

            <Text className="text-white text-lg font-medium mb-4">"{item.content}"</Text>

            {!item.isThanked ? (
                <TouchableOpacity
                    onPress={() => handleThank(item.id)}
                    className="bg-purple-600 py-2 px-4 rounded-full self-start"
                >
                    <Text className="text-white font-bold text-sm">Send Thanks ❤️</Text>
                </TouchableOpacity>
            ) : (
                <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text className="text-gray-400 text-sm">Thanked</Text>
                </View>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView edges={['top']} className="bg-gray-900 z-10">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Inbox</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="purple" />
                </View>
            ) : (
                <FlatList
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Text className="text-gray-500">No messages received yet.</Text>
                            <Text className="text-gray-600 text-xs mt-2">Share your emotions to receive comfort!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
