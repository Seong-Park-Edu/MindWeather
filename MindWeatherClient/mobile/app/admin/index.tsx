import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminStats, broadcastComfort } from '../../services/api';
import { EmotionType, EmotionLabels, EmotionIcons, EmotionColors } from '../../types/emotion';
import { AdminEmotionStat } from '../../types/emotion';
import { RegionCoordinates } from '../../components/KoreaMap';
import AdminDummyGenerator from '../../components/AdminDummyGenerator';

interface EmotionPanel extends AdminEmotionStat {
    message: string;
    isSending: boolean;
}

export default function AdminDashboard() {
    const { session, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [panels, setPanels] = useState<EmotionPanel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            Alert.alert('권한 없음', '관리자만 접근할 수 있습니다.');
            router.replace('/');
        }
    }, [isAdmin, authLoading]);

    const loadStats = async () => {
        if (!session?.access_token) return;

        try {
            const stats = await getAdminStats(session.access_token);
            setPanels(prev => {
                return Object.values(EmotionType)
                    .filter((v): v is EmotionType => typeof v === 'number')
                    .map(emotion => {
                        const stat = stats.find(s => s.emotion === emotion);
                        const existing = prev.find(p => p.emotion === emotion);
                        return {
                            emotion,
                            count: stat?.count ?? 0,
                            totalLogs: stat?.totalLogs ?? 0,
                            message: existing?.message ?? '',
                            isSending: false,
                        };
                    });
            });
        } catch (error) {
            console.error('Failed to load admin stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin && session?.access_token) {
            loadStats();
        }
    }, [isAdmin, session]);

    const handleBroadcast = async (emotion: EmotionType) => {
        const panel = panels.find(p => p.emotion === emotion);
        if (!panel || !panel.message.trim() || !session?.access_token) return;

        setPanels(prev => prev.map(p => p.emotion === emotion ? { ...p, isSending: true } : p));

        try {
            const result = await broadcastComfort(emotion, panel.message, session.access_token);
            Alert.alert('전송 완료', `${result.count}명에게 메시지를 보냈습니다.`);
            setPanels(prev => prev.map(p => p.emotion === emotion ? { ...p, isSending: false, message: '' } : p));
        } catch (error) {
            Alert.alert('전송 실패', error instanceof Error ? error.message : '알 수 없는 오류');
            setPanels(prev => prev.map(p => p.emotion === emotion ? { ...p, isSending: false } : p));
        }
    };

    const updateMessage = (emotion: EmotionType, message: string) => {
        setPanels(prev => prev.map(p => p.emotion === emotion ? { ...p, message } : p));
    };

    if (authLoading || isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    const totalActive = panels.reduce((sum, p) => sum + p.count, 0);
    const totalLogs = panels.reduce((sum, p) => sum + p.totalLogs, 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🛡️ 관리자 대시보드</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalActive}</Text>
                        <Text style={styles.statLabel}>활성 사용자(24h)</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalLogs}</Text>
                        <Text style={styles.statLabel}>총 감정 기록</Text>
                    </View>
                </View>

                {/* Dummy Generator */}
                <AdminDummyGenerator onGenerated={loadStats} />

                {/* Emotion Panels */}
                <Text style={styles.sectionTitle}>감정별 위로 방송 📢</Text>
                {panels.map(panel => (
                    <View key={panel.emotion} style={[styles.panel, { borderLeftColor: EmotionColors[panel.emotion as EmotionType] }]}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelIcon}>{EmotionIcons[panel.emotion as EmotionType]}</Text>
                            <View style={styles.panelInfo}>
                                <Text style={styles.panelName}>{EmotionLabels[panel.emotion as EmotionType]}</Text>
                                <Text style={styles.panelSubText}>{panel.count}명 활성 • {panel.totalLogs}개 기록</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: EmotionColors[panel.emotion as EmotionType] + '33' }]}>
                                <Text style={[styles.badgeText, { color: EmotionColors[panel.emotion as EmotionType] }]}>{panel.count}</Text>
                            </View>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={`${EmotionLabels[panel.emotion as EmotionType]}을 느끼는 분들에게...`}
                            placeholderTextColor="#666"
                            value={panel.message}
                            onChangeText={(text) => updateMessage(panel.emotion as EmotionType, text)}
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.broadcastButton, (!panel.message.trim() || panel.isSending || panel.count === 0) && styles.buttonDisabled]}
                            onPress={() => handleBroadcast(panel.emotion as EmotionType)}
                            disabled={!panel.message.trim() || panel.isSending || panel.count === 0}
                        >
                            <Text style={styles.buttonText}>
                                {panel.isSending ? '전송 중...' : panel.count === 0 ? '대상 없음' : `${panel.count}명에게 일괄 전송`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backButton: { padding: 8 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 16 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: { flex: 1, backgroundColor: '#1F2937', padding: 16, borderRadius: 12, alignItems: 'center' },
    statValue: { color: '#A78BFA', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 12 },
    panel: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4 },
    panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    panelIcon: { fontSize: 24, marginRight: 12 },
    panelInfo: { flex: 1 },
    panelName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    panelSubText: { color: '#9CA3AF', fontSize: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    input: { backgroundColor: '#111827', color: 'white', padding: 12, borderRadius: 8, height: 80, textAlignVertical: 'top', marginBottom: 12 },
    broadcastButton: { backgroundColor: '#8B5CF6', padding: 12, borderRadius: 8, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#374151', opacity: 0.5 },
    buttonText: { color: 'white', fontWeight: 'bold' }
});
