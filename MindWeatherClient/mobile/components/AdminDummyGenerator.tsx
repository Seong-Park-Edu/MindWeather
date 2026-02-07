import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { postEmotion } from '../services/api';
import { EmotionType } from '../types/emotion';
import { RegionCoordinates } from './KoreaMap';
import { useAuth } from '../contexts/AuthContext';

interface AdminDummyGeneratorProps {
    onGenerated?: () => void;
}

const DUMMY_TAGS = ['#출근', '#퇴근', '#야근', '#운동', '#산책', '#데이트', '#시험', '#공부', '#휴식', '#여행', '#맛집', '#커피', '#투자', '#비옴', '#맑음'];

const DUMMY_SUB_REGIONS: Record<string, string[]> = {
    '서울': ['강남구 역삼동', '관악구 신림동', '종로구 가회동', '마포구 서교동', '송파구 잠실동'],
    '부산': ['해운대구 우동', '부산진구 부전동', '수영구 망미동', '사하구 하단동'],
    '대구': ['수성구 범어동', '중구 삼덕동', '달서구 상인동'],
    '인천': ['연수구 송도동', '남동구 구월동', '부평구 부평동'],
    '경기': ['수원시 영통동', '성남시 분당동', '고양시 일산동', '용인시 수지동', '안양시 평촌동'],
    '전남': ['목포시 상동', '여수시 학동', '순천시 조례동'],
    '경북': ['포항시 남구', '경주시 황남동', '구미시 송정동'],
    '제주': ['제주시 노형동', '서귀포시 강정동'],
};

export default function AdminDummyGenerator({ onGenerated }: AdminDummyGeneratorProps) {
    const { user } = useAuth();
    const [count, setCount] = useState('10');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleGenerate = async () => {
        if (!user || isGenerating) return;

        const numCount = parseInt(count);
        if (isNaN(numCount) || numCount <= 0 || numCount > 100) {
            Alert.alert('오류', '1에서 100 사이의 숫자를 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        const provinces = Object.keys(RegionCoordinates);
        const emotionTypes = Object.values(EmotionType).filter((v): v is EmotionType => typeof v === 'number');

        try {
            for (let i = 0; i < numCount; i++) {
                const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
                const subRegions = DUMMY_SUB_REGIONS[randomProvince] || [];
                const randomSub = subRegions.length > 0 ? subRegions[Math.floor(Math.random() * subRegions.length)] : '';

                const fullRegion = randomSub ? `${randomProvince} ${randomSub}` : randomProvince;
                const randomEmotion = emotionTypes[Math.floor(Math.random() * emotionTypes.length)];
                const randomIntensity = Math.floor(Math.random() * 5) + 1;
                const randomTag = DUMMY_TAGS[Math.floor(Math.random() * DUMMY_TAGS.length)];

                await postEmotion({
                    userId: user.id,
                    emotion: randomEmotion,
                    intensity: randomIntensity,
                    region: fullRegion,
                    tags: randomTag,
                    latitude: 0,
                    longitude: 0
                });

                setProgress(i + 1);
            }
            Alert.alert('완료', `${numCount}개의 더미 데이터가 생성되었습니다.`);
            onGenerated?.();
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '데이터 생성 중 문제가 발생했습니다.');
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎲 더미 데이터 생성기</Text>
            <Text style={styles.subText}>실제와 유사한 상세 지역(읍면동) 데이터를 생성합니다.</Text>

            <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>생성 개수 (Max 100)</Text>
                    <TextInput
                        style={styles.input}
                        value={count}
                        onChangeText={setCount}
                        keyboardType="number-pad"
                        placeholder="10"
                        placeholderTextColor="#666"
                        editable={!isGenerating}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, isGenerating && styles.buttonDisabled]}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>생성하기 ✨</Text>
                    )}
                </TouchableOpacity>
            </View>

            {isGenerating && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(progress / parseInt(count)) * 100}%` }]} />
                    <Text style={styles.progressText}>{progress} / {count} 진행 중...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#374151' },
    title: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    subText: { color: '#9CA3AF', fontSize: 12, marginBottom: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    inputContainer: { flex: 1 },
    label: { color: '#9CA3AF', fontSize: 10, marginBottom: 4 },
    input: { backgroundColor: '#111827', color: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 16 },
    button: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, height: 44, justifyContent: 'center' },
    buttonDisabled: { backgroundColor: '#1D4ED8', opacity: 0.7 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    progressContainer: { marginTop: 16, backgroundColor: '#111827', height: 24, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' },
    progressBar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#3B82F6' },
    progressText: { color: 'white', fontSize: 10, alignSelf: 'center', fontWeight: 'bold' }
});
