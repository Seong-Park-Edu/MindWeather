import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPublicMessages, likePublicMessage } from '../services/api';
import { PublicMessage } from '../types/emotion';
import { EmotionInputModal } from '../components/EmotionInputModal';
import { useAuth } from '../contexts/AuthContext';

export default function BoardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [sort, setSort] = useState<'latest' | 'top'>('latest');

    const fetchData = useCallback(async () => {
        try {
            const data = await getPublicMessages(sort);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sort]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLike = async (id: number) => {
        try {
            const result = await likePublicMessage(id);
            // Optimistic update
            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, likeCount: result.likeCount } : msg
            ));
        } catch (error) {
            console.error('Like failed', error);
        }
    };

    const renderItem = ({ item }: { item: PublicMessage }) => (
        <View className="bg-gray-800 p-5 mb-4 rounded-2xl border border-gray-700 mx-4">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-purple-900/50 items-center justify-center">
                        <Text className="text-purple-300 font-bold">{item.userId.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs">
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleLike(item.id)} className="flex-row items-center gap-1 bg-gray-700/50 px-3 py-1 rounded-full">
                    <Ionicons name="heart" size={16} color="#F87171" />
                    <Text className="text-gray-300 text-xs font-bold">{item.likeCount}</Text>
                </TouchableOpacity>
            </View>

            <Text className="text-white text-lg leading-6">{item.content}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView edges={['top']} className="bg-gray-900 z-10">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Community Board</Text>
                    <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => setSort(prev => prev === 'latest' ? 'top' : 'latest')}>
                            <Text className={`text-sm ${sort === 'latest' ? 'text-gray-400' : 'text-purple-400 font-bold'}`}>
                                {sort === 'latest' ? 'Latest' : 'Top'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Text className="text-gray-500">No messages found.</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute bottom-10 right-6 bg-purple-600 p-4 rounded-full shadow-lg shadow-purple-600/50 z-20"
                onPress={() => setShowInput(true)}
            >
                <Ionicons name="pencil" size={28} color="white" />
            </TouchableOpacity>

            <EmotionInputModal
                visible={showInput}
                onClose={() => setShowInput(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </View>
    );
}
