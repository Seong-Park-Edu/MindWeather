import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
import { useTheme, ThemeName } from '../contexts/ThemeContext';

const themeInfo = {
    purple: { icon: '🔮', name: '퍼플', description: '신비로운 테마' },
    dark: { icon: '🌙', name: '다크', description: '어두운 테마' },
    light: { icon: '☀️', name: '라이트', description: '밝은 테마' },
    ocean: { icon: '🌊', name: '오션', description: '바다 테마' },
};

interface ThemeSwitcherProps {
    compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
    const { theme, setTheme } = useTheme();
    const [showModal, setShowModal] = useState(false);

    const handleThemeSelect = (newTheme: ThemeName) => {
        setTheme(newTheme);
        setShowModal(false);
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                style={compact ? { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
                className={compact ? undefined : "w-14 h-14 bg-gray-800/80 border border-gray-700 rounded-full items-center justify-center"}
            >
                <Text style={{ fontSize: compact ? 18 : 24 }}>{themeInfo[theme].icon}</Text>
            </TouchableOpacity>

            {/* Theme Selection Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowModal(false);
                }}
            >
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                    <Pressable
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onPress={() => setShowModal(false)}
                    />
                    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', padding: 24 }} pointerEvents="box-none">
                    <View style={{ backgroundColor: '#1f2937', borderRadius: 24, padding: 24, width: '100%', maxWidth: 448, borderWidth: 1, borderColor: '#374151' }}>
                        {/* Header */}
                        <View className="items-center mb-6">
                            <Text className="text-2xl mb-2">🎨</Text>
                            <Text className="text-white text-xl font-bold">테마 선택</Text>
                            <Text className="text-gray-400 text-xs mt-1">원하는 테마를 골라보세요</Text>
                        </View>

                        {/* Theme Options */}
                        <View className="gap-3">
                            {(Object.keys(themeInfo) as ThemeName[]).map((themeName) => {
                                const info = themeInfo[themeName];
                                const isSelected = theme === themeName;

                                return (
                                    <TouchableOpacity
                                        key={themeName}
                                        onPress={() => handleThemeSelect(themeName)}
                                        className={`rounded-2xl p-4 border-2 ${isSelected
                                            ? 'bg-purple-500/20 border-purple-500'
                                            : 'bg-gray-700/50 border-gray-600'
                                            }`}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <Text className="text-4xl">{info.icon}</Text>
                                            <View className="flex-1">
                                                <Text className="text-white text-lg font-bold">{info.name}</Text>
                                                <Text className="text-gray-400 text-xs">{info.description}</Text>
                                            </View>
                                            {isSelected && (
                                                <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                                                    <Text className="text-white text-xs">✓</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            className="mt-6 bg-gray-700 py-3 rounded-xl"
                        >
                            <Text className="text-white text-center font-medium">닫기</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
