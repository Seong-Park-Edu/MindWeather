import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, RefreshControl,
    ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    getPublicMessages, likePublicMessage,
    getPublicMessageDetail, postPublicReply,
} from '../services/api';
import { PublicMessage, PublicMessageReply } from '../types/emotion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getAnonymousNickname } from '../utils/nickname';

export default function BoardScreen() {
    const router = useRouter();
    const { user, isGuest } = useAuth();
    const { theme } = useTheme();
    // 게스트 유저의 ID('guest-user')는 서버 GUID 파라미터에 맞지 않으므로 제외
    const realUserId = isGuest ? undefined : user?.id;
    const colors = themes[theme];

    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sort, setSort] = useState<'latest' | 'top'>('latest');

    // 답글 관련 state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [replies, setReplies] = useState<PublicMessageReply[]>([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [replySuccess, setReplySuccess] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const data = await getPublicMessages(sort, realUserId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sort, realUserId]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLike = async (id: number) => {
        if (!user || isGuest) return;

        // Optimistic update: 즉시 UI 반영
        const prevMessages = messages;
        setMessages(prev => prev.map(msg =>
            msg.id === id
                ? {
                    ...msg,
                    isLikedByMe: !msg.isLikedByMe,
                    likeCount: msg.isLikedByMe ? msg.likeCount - 1 : msg.likeCount + 1,
                }
                : msg
        ));

        try {
            const result = await likePublicMessage(id, user.id);
            // 서버 실제 값으로 보정
            setMessages(prev => prev.map(msg =>
                msg.id === id
                    ? { ...msg, likeCount: result.likeCount, isLikedByMe: result.liked }
                    : msg
            ));
        } catch (error) {
            console.error('Like failed', error);
            // 실패 시 롤백
            setMessages(prevMessages);
        }
    };

    const handleToggleReplies = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
            setReplies([]);
            setReplyText('');
            setReplyError('');
            return;
        }

        setExpandedId(id);
        setRepliesLoading(true);
        setReplyError('');
        try {
            const detail = await getPublicMessageDetail(id, realUserId);
            setReplies(detail.replies);
        } catch (error) {
            console.error('Failed to load replies', error);
        } finally {
            setRepliesLoading(false);
        }
    };

    const handleSubmitReply = async (messageId: number) => {
        if (!replyText.trim() || !user || isGuest) return;

        setReplySubmitting(true);
        setReplyError('');
        setReplySuccess(false);
        try {
            const newReply = await postPublicReply(messageId, user.id, replyText.trim());
            setReplies(prev => [...prev, newReply]);
            setReplyText('');
            setMessages(prev => prev.map(msg =>
                msg.id === messageId
                    ? { ...msg, replyCount: msg.replyCount + 1 }
                    : msg
            ));
            setReplySuccess(true);
            setTimeout(() => setReplySuccess(false), 2000);
        } catch (e: any) {
            setReplyError(e.message || '답글 게시에 실패했습니다.');
        } finally {
            setReplySubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return '방금 전';
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 7) return `${diffDay}일 전`;
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const renderItem = ({ item }: { item: PublicMessage }) => {
        const isExpanded = expandedId === item.id;
        const nickname = getAnonymousNickname(item.userId);
        const isMyPost = user?.id === item.userId;

        return (
            <View style={{
                backgroundColor: colors.bg.secondary,
                padding: 16,
                marginBottom: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginHorizontal: 16,
            }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: colors.accent.primary + '30',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Text style={{ fontSize: 14 }}>🌿</Text>
                        </View>
                        <View>
                            <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '600' }}>
                                {nickname}{isMyPost ? ' (나)' : ''}
                            </Text>
                            <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>
                                {formatDate(item.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <Text style={{ color: colors.text.primary, fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                    {item.content}
                </Text>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => handleLike(item.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                        <Ionicons
                            name={item.isLikedByMe ? 'heart' : 'heart-outline'}
                            size={18}
                            color={item.isLikedByMe ? '#F87171' : colors.text.tertiary}
                        />
                        <Text style={{ color: item.isLikedByMe ? '#F87171' : colors.text.tertiary, fontSize: 13 }}>
                            {item.likeCount}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleToggleReplies(item.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                        <Ionicons
                            name={isExpanded ? 'chatbubble' : 'chatbubble-outline'}
                            size={16}
                            color={isExpanded ? colors.accent.primary : colors.text.tertiary}
                        />
                        <Text style={{ color: isExpanded ? colors.accent.primary : colors.text.tertiary, fontSize: 13 }}>
                            {item.replyCount > 0 ? `답글 ${item.replyCount}` : '답글'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Replies Section */}
                {isExpanded && (
                    <View style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    }}>
                        {repliesLoading ? (
                            <ActivityIndicator size="small" color={colors.accent.primary} />
                        ) : (
                            <>
                                {replies.map((reply) => {
                                    const replyNickname = getAnonymousNickname(reply.userId);
                                    const isMyReply = user?.id === reply.userId;
                                    return (
                                        <View key={reply.id} style={{
                                            marginBottom: 10,
                                            paddingLeft: 12,
                                            borderLeftWidth: 2,
                                            borderLeftColor: colors.accent.primary + '40',
                                        }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '600' }}>
                                                    {replyNickname}{isMyReply ? ' (나)' : ''}
                                                </Text>
                                                <Text style={{ color: colors.text.tertiary, fontSize: 10 }}>
                                                    {formatDate(reply.createdAt)}
                                                </Text>
                                            </View>
                                            <Text style={{ color: colors.text.primary, fontSize: 14, lineHeight: 20 }}>
                                                {reply.content}
                                            </Text>
                                        </View>
                                    );
                                })}

                                {replies.length === 0 && (
                                    <Text style={{ color: colors.text.tertiary, fontSize: 13, textAlign: 'center', marginBottom: 10 }}>
                                        아직 답글이 없어요. 첫 번째 위로를 남겨보세요.
                                    </Text>
                                )}

                                {/* Reply Input */}
                                {user && (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginTop: 4,
                                    }}>
                                        <TextInput
                                            value={replyText}
                                            onChangeText={setReplyText}
                                            placeholder="따뜻한 답글을 남겨주세요..."
                                            placeholderTextColor={colors.text.tertiary}
                                            maxLength={200}
                                            style={{
                                                flex: 1,
                                                backgroundColor: colors.bg.tertiary,
                                                borderRadius: 20,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                color: colors.text.primary,
                                                fontSize: 13,
                                            }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => handleSubmitReply(item.id)}
                                            disabled={!replyText.trim() || replySubmitting}
                                            style={{
                                                backgroundColor: replyText.trim() ? colors.accent.primary : colors.bg.tertiary,
                                                width: 36, height: 36,
                                                borderRadius: 18,
                                                alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            {replySubmitting ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Ionicons name="arrow-up" size={18} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {replySuccess && (
                                    <Text style={{ color: '#10B981', fontSize: 11, marginTop: 4 }}>답글이 등록되었어요 ✓</Text>
                                )}
                                {replyError ? (
                                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{replyError}</Text>
                                ) : null}
                            </>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg.primary, zIndex: 10 }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: 'bold' }}>
                        위로 게시판
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => setSort(prev => prev === 'latest' ? 'top' : 'latest')}>
                            <Text style={{
                                color: sort === 'top' ? colors.accent.primary : colors.text.secondary,
                                fontSize: 13,
                                fontWeight: sort === 'top' ? 'bold' : 'normal',
                            }}>
                                {sort === 'latest' ? '최신순' : '인기순'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <FlatList
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text.primary} />
                        }
                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 80 }}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>💌</Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 15 }}>
                                    아직 게시된 글이 없어요.
                                </Text>
                                <Text style={{ color: colors.text.tertiary, fontSize: 13, marginTop: 4 }}>
                                    첫 번째 위로의 글을 남겨보세요!
                                </Text>
                            </View>
                        }
                    />
                </KeyboardAvoidingView>
            )}

            {/* Floating Action Button - 글쓰기 */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 32,
                    right: 20,
                    backgroundColor: colors.accent.primary,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 6,
                    shadowColor: colors.accent.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    zIndex: 20,
                }}
                onPress={() => router.push('/modal/compose')}
            >
                <Ionicons name="pencil" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}
