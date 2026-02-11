import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_KEY = 'mindweather_onboarding_completed';

const slides = [
    {
        emoji: '🌤️',
        title: 'Mind Weather에 오신 것을 환영합니다!',
        desc: '마음의 날씨를 기록하고, 서로를 위로하는 따뜻한 공간이에요.',
    },
    {
        emoji: '🗺️',
        title: '감정 지도',
        desc: '전국 각지의 감정을 실시간으로 확인하세요.\n지역을 클릭하면 더 자세한 정보를 볼 수 있어요.',
    },
    {
        emoji: '✏️',
        title: '감정 기록하기',
        desc: '오른쪽 하단의 ✏️ 버튼으로 지금 느끼는 감정을 기록하세요.\n강도, 태그, 위치 정보를 함께 남길 수 있어요.',
    },
    {
        emoji: '💌',
        title: '위로와 커뮤니티',
        desc: '게시판에서 따뜻한 한마디를 나누고,\n정원에서 감정 식물을 키워보세요!\n매일 저녁 7시에 AI 편지도 도착해요.',
    },
];

interface OnboardingModalProps {
    onComplete: () => void;
}

export function isOnboardingCompleted(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingCompleted() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            setOnboardingCompleted();
            onComplete();
        }
    };

    const handleSkip = () => {
        setOnboardingCompleted();
        onComplete();
    };

    const slide = slides[step];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="text-7xl mb-6">{slide.emoji}</div>
                        <h2 className="text-xl font-bold text-white mb-3">{slide.title}</h2>
                        <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm">
                            {slide.desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-8 mb-6">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                i === step ? 'bg-purple-500' : 'bg-white/20'
                            }`}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10"
                    >
                        건너뛰기
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                        {step < slides.length - 1 ? '다음' : '시작하기!'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
