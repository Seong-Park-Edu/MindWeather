import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingTutorialProps {
    visible: boolean;
    onComplete: () => void;
}

interface TutorialStep {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    emoji: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        icon: 'sunny',
        title: 'Mind Weather에 오신 것을 환영합니다',
        description: '당신의 마음 날씨를 기록하고,\n전국의 사람들과 감정을 나누어요.\n서로를 위로하며 함께 성장해요.',
        emoji: '🌈',
    },
    {
        icon: 'add-circle',
        title: '감정을 기록해보세요',
        description: '지금 느끼는 감정을 선택하고\n강도를 설정해보세요.\n당신의 감정이 지도에 표시됩니다.',
        emoji: '😊',
    },
    {
        icon: 'map',
        title: '지도에서 위로를 전하세요',
        description: '지도의 마커를 터치하면\n해당 지역의 감정을 볼 수 있어요.\n따뜻한 위로 메시지를 보내보세요.',
        emoji: '💌',
    },
    {
        icon: 'calendar',
        title: '감정 다이어리로 기록하세요',
        description: '매일 감정을 기록하면\n당신의 마음 패턴을 발견할 수 있어요.\n연속 기록으로 배지도 획득하세요!',
        emoji: '🔥',
    },
];

export function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <LinearGradient
                    colors={['#1F2937', '#111827']}
                    style={styles.gradient}
                >
                    {/* Skip Button */}
                    <TouchableOpacity
                        onPress={handleSkip}
                        style={styles.skipButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.skipText}>건너뛰기</Text>
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Icon/Emoji Display */}
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={step.icon} size={80} color="#A78BFA" />
                            </View>
                            <Text style={styles.emoji}>{step.emoji}</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>{step.title}</Text>

                        {/* Description */}
                        <Text style={styles.description}>{step.description}</Text>

                        {/* Pagination Dots */}
                        <View style={styles.pagination}>
                            {TUTORIAL_STEPS.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentStep && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Navigation Buttons */}
                    <View style={styles.navigation}>
                        {currentStep > 0 && (
                            <TouchableOpacity
                                onPress={handlePrevious}
                                style={styles.navButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
                                <Text style={styles.navButtonText}>이전</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity
                            onPress={handleNext}
                            style={[styles.navButton, styles.nextButton]}
                        >
                            <Text style={styles.nextButtonText}>
                                {isLastStep ? '시작하기' : '다음'}
                            </Text>
                            {!isLastStep && (
                                <Ionicons name="arrow-forward" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    skipButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 48,
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        position: 'absolute',
        fontSize: 48,
        bottom: -10,
        right: -10,
        backgroundColor: '#1F2937',
        borderRadius: 30,
        width: 60,
        height: 60,
        textAlign: 'center',
        lineHeight: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    description: {
        fontSize: 17,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 20,
        marginBottom: 48,
    },
    pagination: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#374151',
    },
    dotActive: {
        width: 32,
        backgroundColor: '#A78BFA',
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    navButtonText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 32,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
