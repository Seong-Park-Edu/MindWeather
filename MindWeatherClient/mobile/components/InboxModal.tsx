import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Alert,
    Switch,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getReceivedMessages, getSentMessages, thankMessage } from '../services/api';
import { MessageResponse } from '../types/emotion';

interface InboxModalProps {
    onClose: () => void;
}

export function InboxModal({ onClose }: InboxModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [thankingId, setThankingId] = useState<number | null>(null);
    const [showOnlyToday, setShowOnlyToday] = useState(false);


    useEffect(() => {
        if (!user) return;
        loadMessages();
    }, [user, activeTab]);

    const loadMessages = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = activeTab === 'received'
                ? await getReceivedMessages(user.id)
                : await getSentMessages(user.id);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleThank = async (messageId: number) => {
        if (!user) return;

        setThankingId(messageId);
        try {
            await thankMessage(messageId, user.id);

            // Optimistic update
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, isThanked: true, thankedAt: new Date().toISOString() }
                    : m
            ));
            Alert.alert('성공', '감사의 마음을 전했습니다 ❤️');
        } catch (error) {
            console.error('Failed to thank:', error);
            Alert.alert('실패', '감사 전송에 실패했습니다.');
        } finally {
            setThankingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayedMessages = messages.filter(msg => {
        if (!showOnlyToday) return true;
        const msgDate = new Date(msg.sentAt);
        const today = new Date();
        return msgDate.getDate() === today.getDate() &&
            msgDate.getMonth() === today.getMonth() &&
            msgDate.getFullYear() === today.getFullYear();
    });

    return (
        <View style={{ backgroundColor: '#111827', width: '100%', maxWidth: 512, borderRadius: 16, height: '80%', borderWidth: 1, borderColor: '#374151', margin: 16 }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-gray-800">
                <Text className="text-xl font-bold text-white">📬 마음 우체통</Text>
                <TouchableOpacity onPress={onClose} className="p-2 bg-gray-800 rounded-full">
                    <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="flex-row p-4 gap-3">
                <TouchableOpacity
                    onPress={() => setActiveTab('received')}
                    className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'received'
                        ? 'bg-purple-600'
                        : 'bg-gray-800'
                        }`}
                >
                    <Text className={activeTab === 'received' ? 'text-white font-bold' : 'text-gray-400'}>
                        받은 위로 💌
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('sent')}
                    className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'sent'
                        ? 'bg-blue-600'
                        : 'bg-gray-800'
                        }`}
                >
                    <Text className={activeTab === 'sent' ? 'text-white font-bold' : 'text-gray-400'}>
                        보낸 위로 🛫
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filter Toggle */}
            <View className="flex-row justify-end px-6 mb-2 items-center gap-2">
                <Text className="text-gray-400 text-xs">오늘만 보기</Text>
                <Switch
                    value={showOnlyToday}
                    onValueChange={setShowOnlyToday}
                    trackColor={{ false: "#374151", true: "#8B5CF6" }}
                    thumbColor={showOnlyToday ? "#fff" : "#f4f3f4"}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {displayedMessages.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <Text className="text-4xl mb-4 opacity-50">
                                {activeTab === 'received' ? '📭' : '📝'}
                            </Text>
                            <Text className="text-gray-500 text-center">
                                {showOnlyToday
                                    ? '오늘 주고받은 위로가 없어요.'
                                    : activeTab === 'received'
                                        ? '아직 받은 위로가 없어요.'
                                        : '아직 보낸 위로가 없어요.'}
                            </Text>
                        </View>
                    ) : (
                        displayedMessages.map((msg) => (
                            <View
                                key={msg.id}
                                className="bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700"
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-row items-center gap-2">
                                        <View className="bg-gray-700 px-2 py-1 rounded-md">
                                            <Text className="text-xs text-gray-300">
                                                {activeTab === 'received' ? 'From. 익명' : 'To. 누군가에게'}
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-gray-500">
                                            {formatDate(msg.sentAt)}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-white text-base leading-6 mb-4">
                                    {msg.content}
                                </Text>

                                {activeTab === 'received' && (
                                    <View className="flex-row justify-end">
                                        {msg.isThanked ? (
                                            <View className="flex-row items-center gap-1 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                                                <Text className="text-xs text-pink-400 font-bold">
                                                    ❤️ 감사를 전했습니다
                                                </Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handleThank(msg.id)}
                                                disabled={thankingId === msg.id}
                                                className="bg-pink-600 px-3 py-2 rounded-lg"
                                            >
                                                <Text className="text-white text-xs font-bold">
                                                    {thankingId === msg.id ? '전송 중...' : '고마워요 보내기 💕'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {activeTab === 'sent' && msg.isThanked && (
                                    <View className="flex-row justify-end">
                                        <Text className="text-xs font-bold text-pink-400">
                                            ❤️ 감사를 받았어요!
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>

    );
}
