import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface Letter {
    id: number;
    content: string;
    generatedAt: string;
    isRead: boolean;
    readAt: string | null;
    analyzedFrom: string;
    analyzedTo: string;
}

export default function LettersScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

    const fetchLetters = async () => {
        if (!user?.id) return;

        try {
            const response = await api.get(`/letters/${user.id}`);
            setLetters(response.data);
        } catch (error) {
            console.error('Failed to fetch letters:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLetters();
    };

    const openLetter = async (letter: Letter) => {
        setSelectedLetter(letter);

        // Mark as read if not already
        if (!letter.isRead) {
            try {
                await api.put(`/letters/${letter.id}/read?userId=${user?.id}`);
                // Update local state
                setLetters(prev =>
                    prev.map(l =>
                        l.id === letter.id ? { ...l, isRead: true, readAt: new Date().toISOString() } : l
                    )
                );
            } catch (error) {
                console.error('Failed to mark letter as read:', error);
            }
        }
    };

    const closeLetter = () => {
        setSelectedLetter(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        return `${month}월 ${day}일 오후 ${hours}시`;
    };

    const renderLetterItem = ({ item }: { item: Letter }) => (
        <TouchableOpacity
            style={[styles.letterCard, { backgroundColor: colors.card }]}
            onPress={() => openLetter(item)}
        >
            <View style={styles.letterHeader}>
                <Text style={[styles.letterIcon, { color: colors.primary }]}>🌱</Text>
                <View style={styles.letterInfo}>
                    <Text style={[styles.letterTitle, { color: colors.text }]}>
                        마음의 정원에서 온 편지
                    </Text>
                    <Text style={[styles.letterDate, { color: colors.textSecondary }]}>
                        {formatDate(item.generatedAt)}
                    </Text>
                </View>
                {!item.isRead && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.unreadText}>NEW</Text>
                    </View>
                )}
            </View>
            <Text
                style={[styles.letterPreview, { color: colors.textSecondary }]}
                numberOfLines={2}
            >
                {item.content}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (selectedLetter) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.letterDetailHeader}>
                    <TouchableOpacity onPress={closeLetter} style={styles.backButton}>
                        <Text style={[styles.backButtonText, { color: colors.primary }]}>← 목록</Text>
                    </TouchableOpacity>
                    <Text style={[styles.letterDetailDate, { color: colors.textSecondary }]}>
                        {formatDate(selectedLetter.generatedAt)}
                    </Text>
                </View>

                <View style={[styles.letterDetail, { backgroundColor: colors.card }]}>
                    <Text style={[styles.letterDetailIcon, { color: colors.primary }]}>🌱</Text>
                    <Text style={[styles.letterDetailTitle, { color: colors.text }]}>
                        마음의 정원에서 온 편지
                    </Text>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.letterContent, { color: colors.text }]}>
                        {selectedLetter.content}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.primary }]}>← 뒤로</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>편지함</Text>
                <View style={{ width: 60 }} />
            </View>

            {letters.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>🌱</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        아직 도착한 편지가 없어요
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        매일 저녁 7시에 따뜻한 편지가 도착할 거예요
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={letters}
                    renderItem={renderLetterItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 60,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: 20,
        paddingTop: 10,
    },
    letterCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    letterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    letterIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    letterInfo: {
        flex: 1,
    },
    letterTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    letterDate: {
        fontSize: 13,
    },
    unreadBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    unreadText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    letterPreview: {
        fontSize: 14,
        lineHeight: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    letterDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    letterDetailDate: {
        fontSize: 14,
    },
    letterDetail: {
        margin: 20,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    letterDetailIcon: {
        fontSize: 40,
        textAlign: 'center',
        marginBottom: 16,
    },
    letterDetailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        marginBottom: 20,
    },
    letterContent: {
        fontSize: 16,
        lineHeight: 28,
    },
});
