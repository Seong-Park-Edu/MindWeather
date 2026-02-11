import React from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, themes } from '../../contexts/ThemeContext';
import { EmotionLabels, EmotionIcons } from '../../types/emotion';
import { useStats, getStreakEmoji } from '../../hooks/useStats';

export default function StatsScreen() {
    const router = useRouter();
    const { isGuest } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];

    const {
        todayCount,
        totalComforts,
        dominantEmotion,
        currentStreak,
        totalDays,
        longestStreak,
        loading,
    } = useStats();

    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />

            <View style={[styles.content, { backgroundColor: colors.bg.secondary, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📊</Text>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>실시간 통계</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>현재 Mind Weather 현황</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#A78BFA" />
                ) : (
                    <View style={styles.grid}>
                        {/* Today's Emotions */}
                        <View style={[styles.card, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
                            <View style={styles.cardRow}>
                                <Text style={styles.cardIcon}>🎭</Text>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardLabel}>오늘 공유된 감정</Text>
                                    <Text style={styles.cardValue}>{todayCount.toLocaleString()}</Text>
                                    <Text style={styles.cardSubtext}>명이 마음을 공유했어요</Text>
                                </View>
                            </View>
                        </View>

                        {/* Dominant Emotion */}
                        {dominantEmotion !== null && (
                            <View style={[styles.card, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardIcon}>{EmotionIcons[dominantEmotion]}</Text>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardLabel}>가장 많은 감정</Text>
                                        <Text style={styles.cardValue}>{EmotionLabels[dominantEmotion]}</Text>
                                        <Text style={styles.cardSubtext}>지금 이 감정이 가장 많아요</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Total Comforts */}
                        <View style={[styles.card, { backgroundColor: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.2)' }]}>
                            <View style={styles.cardRow}>
                                <Text style={styles.cardIcon}>🤗</Text>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardLabel}>전달된 위로</Text>
                                    <Text style={styles.cardValue}>{totalComforts.toLocaleString()}</Text>
                                    <Text style={styles.cardSubtext}>번의 따뜻한 위로가 전해졌어요</Text>
                                </View>
                            </View>
                        </View>

                        {/* User Streak */}
                        {!isGuest && currentStreak !== null && totalDays !== null && (
                            <View style={[styles.card, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardIcon}>{getStreakEmoji(currentStreak)}</Text>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardLabel}>내 기록</Text>
                                        <View style={styles.streakRow}>
                                            <Text style={styles.cardValue}>{currentStreak}일 연속</Text>
                                            {longestStreak !== null && longestStreak > 0 && (
                                                <Text style={styles.streakSub}>(최고: {longestStreak}일)</Text>
                                            )}
                                        </View>
                                        <Text style={styles.cardSubtext}>총 {totalDays}일 기록했어요</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Close button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.closeButton, { backgroundColor: colors.bg.tertiary }]}
                >
                    <Text style={[styles.closeButtonText, { color: colors.text.primary }]}>닫기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    grid: {
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardInfo: {
        flex: 1,
    },
    cardLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 4,
    },
    cardValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardSubtext: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    streakSub: {
        color: '#6B7280',
        fontSize: 12,
    },
    closeButton: {
        marginTop: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    closeButtonText: {
        textAlign: 'center',
        fontWeight: '500',
    },
});
