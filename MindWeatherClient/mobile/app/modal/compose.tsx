import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, themes } from '../../contexts/ThemeContext';
import { postPublicMessage } from '../../services/api';

export default function ComposeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = themes[theme];

    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!content.trim() || !user) return;

        setLoading(true);
        setError('');
        try {
            await postPublicMessage(user.id, content.trim());
            router.back();
        } catch (e: any) {
            setError(e.message || '게시에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={{
                    backgroundColor: colors.bg.primary,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: 20,
                    paddingBottom: 40,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderBottomWidth: 0,
                }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={{ color: colors.text.secondary, fontSize: 16 }}>취소</Text>
                        </TouchableOpacity>
                        <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: 'bold' }}>
                            위로의 글 남기기
                        </Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!content.trim() || loading}
                            style={{
                                backgroundColor: content.trim() ? colors.accent.primary : colors.bg.tertiary,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>게시</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Input */}
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="따뜻한 한마디를 남겨주세요..."
                        placeholderTextColor={colors.text.tertiary}
                        multiline
                        maxLength={200}
                        autoFocus
                        style={{
                            color: colors.text.primary,
                            fontSize: 16,
                            lineHeight: 24,
                            minHeight: 120,
                            textAlignVertical: 'top',
                        }}
                    />

                    {/* Footer */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 12,
                    }}>
                        {error ? (
                            <Text style={{ color: '#EF4444', fontSize: 12 }}>{error}</Text>
                        ) : (
                            <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                                익명으로 게시됩니다
                            </Text>
                        )}
                        <Text style={{
                            color: content.length >= 180 ? '#EF4444' : colors.text.tertiary,
                            fontSize: 12,
                        }}>
                            {content.length}/200
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
