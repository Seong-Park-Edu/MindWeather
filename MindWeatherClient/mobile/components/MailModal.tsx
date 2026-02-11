import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Letter, getLetters, markLetterAsRead } from '../services/api';

interface MailModalProps {
    onClose: () => void;
}

export function MailModal({ onClose }: MailModalProps) {
    const { user } = useAuth();
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);


    useEffect(() => {
        if (user) {
            fetchLetters();
        }
    }, [user]);

    const fetchLetters = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getLetters(user.id);
            setLetters(data);
        } catch (error) {
            console.error('Failed to fetch letters:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLetter = async (letter: Letter) => {
        setSelectedLetter(letter);

        if (!letter.isRead && user) {
            try {
                await markLetterAsRead(letter.id, user.id);
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        return `${month}월 ${day}일 오후 ${hours}시`;
    };

    return (
        <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                {selectedLetter ? (
                    <TouchableOpacity onPress={() => setSelectedLetter(null)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 목록</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.title}>편지함 🌱</Text>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>
                {loading ? (
                    <ActivityIndicator size="large" color="#A78BFA" />
                ) : selectedLetter ? (
                    <ScrollView contentContainerStyle={styles.letterScroll}>
                        <Text style={styles.letterDate}>{formatDate(selectedLetter.generatedAt)}</Text>
                        <Text style={styles.letterTitle}>마음의 정원에서 온 편지</Text>
                        <View style={styles.divider} />
                        <Text style={styles.letterContent}>{selectedLetter.content}</Text>
                    </ScrollView>
                ) : letters.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🌱</Text>
                        <Text style={styles.emptyText}>아직 도착한 편지가 없어요</Text>
                        <Text style={styles.emptySubText}>매일 저녁 7시에 따뜻한 편지가 도착할 거예요</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.listScroll}>
                        {letters.map((letter) => (
                            <TouchableOpacity
                                key={letter.id}
                                style={styles.letterItem}
                                onPress={() => openLetter(letter)}
                            >
                                <View style={styles.letterHeader}>
                                    <Text style={styles.itemTitle}>마음의 정원에서 온 편지</Text>
                                    {!letter.isRead && (
                                        <View style={styles.newBadge}>
                                            <Text style={styles.newBadgeText}>NEW</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.itemDate}>{formatDate(letter.generatedAt)}</Text>
                                <Text numberOfLines={2} style={styles.itemPreview}>
                                    {letter.content}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    content: {
        width: '90%',
        height: '80%',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#A78BFA', // Purple-400
        fontSize: 16,
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        color: '#9CA3AF', // Gray-400
        fontSize: 24,
    },
    body: {
        flex: 1,
        justifyContent: 'center',
    },
    letterScroll: {
        padding: 24,
    },
    letterDate: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 8,
    },
    letterTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(167, 139, 250, 0.3)', // Purple with opacity
        marginBottom: 24,
    },
    letterContent: {
        color: '#E2E8F0', // Slate-200
        fontSize: 16,
        lineHeight: 28,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubText: {
        color: '#9CA3AF',
        textAlign: 'center',
    },
    listScroll: {
        padding: 16,
    },
    letterItem: {
        backgroundColor: 'rgba(55, 65, 81, 0.5)', // Gray-700/50
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    letterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    newBadge: {
        backgroundColor: '#8B5CF6', // Violet-500
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    newBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    itemDate: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 8,
    },
    itemPreview: {
        color: '#CBD5E1', // Slate-300
        fontSize: 14,
        lineHeight: 20,
    },
});
