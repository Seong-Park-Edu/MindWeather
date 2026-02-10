import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Alert,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
import {
    EmotionType,
    EmotionLabels,
    EmotionIcons,
    EmotionColors,
    EmotionResponse,
} from '../types/emotion';
import { sendComfortMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RegionCluster {
    region: string;
    emotions: EmotionResponse[];
    dominantEmotion: EmotionType;
    avgIntensity: number;
}

interface ComfortModalProps {
    cluster: RegionCluster | null;
    onClose: () => void;
}

const comfortPhrases = [
    '오늘 하루도 수고했어요 💪',
    '힘내세요, 응원합니다! 🌟',
    '당신은 혼자가 아닙니다 🤗',
    '잘 될 거예요, 믿어요 ✨',
    '편안한 휴식 되세요 🌙',
    '좋은 일이 생길 거예요 🍀',
];

export function ComfortModal({ cluster, onClose }: ComfortModalProps) {
    const { user, isGuest } = useAuth();
    const [step, setStep] = useState<'intro' | 'compose' | 'success'>('intro');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!cluster) return null;

    const dominantCount = cluster.emotions.filter(e => e.emotion === cluster.dominantEmotion).length;
    const emotionColor = EmotionColors[cluster.dominantEmotion];

    const handleSend = async () => {
        if (!message.trim() || !user) return;

        setIsSending(true);
        setError(null);

        try {
            const eligibleReceivers = cluster.emotions.filter(e => e.userId !== user.id);

            if (eligibleReceivers.length === 0) {
                setError('이 지역에 위로를 보낼 다른 사용자가 없습니다.');
                return;
            }

            const randomReceiver = eligibleReceivers[Math.floor(Math.random() * eligibleReceivers.length)];

            await sendComfortMessage({
                senderId: user.id,
                receiverId: randomReceiver.userId,
                content: message,
            });

            setStep('success');

            setTimeout(() => {
                handleClose();
            }, 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : '전송에 실패했습니다');
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setStep('intro');
        setMessage('');
        setError(null);
        onClose();
    };

    const selectPhrase = (phrase: string) => {
        setMessage(phrase);
    };

    return (
        <View style={{ backgroundColor: '#111827', width: '100%', maxWidth: 448, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#374151' }}>
            {/* Step 1: Intro */}
            {step === 'intro' && (
                <View className="items-center gap-4">
                    <View
                        className="w-20 h-20 rounded-full items-center justify-center"
                        style={{ backgroundColor: emotionColor + '30' }}
                    >
                        <Text className="text-5xl">{EmotionIcons[cluster.dominantEmotion]}</Text>
                    </View>

                    <View className="items-center">
                        <Text className="text-white text-2xl font-bold mb-2">{cluster.region}</Text>
                        <Text className="text-gray-300 text-center">
                            이곳에는 지금{' '}
                            <Text style={{ color: emotionColor, fontWeight: 'bold' }}>
                                {EmotionLabels[cluster.dominantEmotion]}
                            </Text>
                            의{'\n'}날씨가 지나가고 있습니다.
                        </Text>
                    </View>

                    <View className="bg-gray-800 rounded-xl p-4 w-full">
                        <Text className="text-gray-300 text-center">
                            총 {cluster.emotions.length}명의 이웃 중{'\n'}
                            <Text className="text-white text-lg font-bold">{dominantCount}명</Text>이 이 감정을 느끼고 있어요.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            if (isGuest) {
                                Alert.alert(
                                    '로그인이 필요합니다',
                                    '위로 메시지를 보내려면 로그인이 필요합니다.',
                                    [{ text: '확인' }]
                                );
                            } else {
                                setStep('compose');
                            }
                        }}
                        className="w-full py-4 rounded-xl items-center"
                        style={{ backgroundColor: emotionColor }}
                    >
                        <Text className="text-white font-bold text-lg">
                            {isGuest ? '🔒 로그인하고 위로 건네기' : '💌 랜덤한 1명에게 위로 건네기'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Step 2: Compose */}
            {step === 'compose' && (
                <View className="gap-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => setStep('intro')}>
                            <Text className="text-gray-400">← 뒤로</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-400 text-sm">나의 따뜻한 한마디</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View className="bg-gray-800 rounded-xl p-4 flex-row items-center gap-3">
                        <Text className="text-2xl">{EmotionIcons[cluster.dominantEmotion]}</Text>
                        <Text className="text-gray-300 text-sm flex-1">
                            <Text style={{ color: emotionColor, fontWeight: 'bold' }}>
                                {EmotionLabels[cluster.dominantEmotion]}
                            </Text>
                            을(를) 느끼는 익명의 이웃에게
                        </Text>
                    </View>

                    {/* Quick phrases */}
                    <View>
                        <Text className="text-gray-500 text-xs mb-2 uppercase">추천 메세지</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {comfortPhrases.map((phrase) => (
                                    <TouchableOpacity
                                        key={phrase}
                                        onPress={() => selectPhrase(phrase)}
                                        className={`px-3 py-2 rounded-lg border ${message === phrase
                                            ? 'bg-purple-500/20 border-purple-500'
                                            : 'bg-gray-800 border-gray-700'
                                            }`}
                                    >
                                        <Text className={message === phrase ? 'text-purple-300' : 'text-gray-400'} style={{ fontSize: 12 }}>
                                            {phrase}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Text input */}
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="따뜻한 위로의 말을 적어주세요..."
                        placeholderTextColor="#6B7280"
                        maxLength={500}
                        multiline
                        className="bg-gray-800 p-4 rounded-xl text-white min-h-[120px] border border-gray-700"
                        style={{ textAlignVertical: 'top' }}
                    />
                    <Text className="text-gray-600 text-xs text-right">{message.length}/500</Text>

                    {error && (
                        <View className="bg-red-500/20 p-3 rounded-xl">
                            <Text className="text-red-400 text-center">{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!message.trim() || isSending}
                        className={`w-full py-4 rounded-xl items-center ${message.trim() && !isSending ? 'bg-purple-600' : 'bg-gray-700'
                            }`}
                    >
                        {isSending ? (
                            <View className="flex-row items-center gap-2">
                                <ActivityIndicator size="small" color="white" />
                                <Text className="text-white">전송 중...</Text>
                            </View>
                        ) : (
                            <Text className={message.trim() ? 'text-white font-bold' : 'text-gray-500'}>
                                위로 보내기 🚀
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
                <View className="items-center py-8 gap-4">
                    <Text className="text-7xl">📬</Text>
                    <Text className="text-2xl font-bold text-purple-300">마음이 전송되었습니다!</Text>
                    <Text className="text-gray-400 text-center">
                        당신의 작은 위로가{'\n'}누군가에게 큰 힘이 될 거예요 ✨
                    </Text>
                </View>
            )}
        </View>
    );
}
