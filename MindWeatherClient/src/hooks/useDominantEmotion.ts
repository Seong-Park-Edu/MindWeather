import { useState, useEffect } from 'react';
import { EmotionType } from '../types/emotion';
import { getEmotionsForMap } from '../services/api';

export function useDominantEmotion() {
    const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const emotions = await getEmotionsForMap();
                if (emotions && emotions.length > 0) {
                    const emotionCounts = new Map<EmotionType, number>();
                    emotions.forEach(e => {
                        emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) || 0) + 1);
                    });

                    let maxCount = 0;
                    let domEmotion: EmotionType = EmotionType.Calm;

                    emotionCounts.forEach((count, emotion) => {
                        if (count > maxCount) {
                            maxCount = count;
                            domEmotion = emotion;
                        }
                    });
                    setDominantEmotion(domEmotion);
                } else {
                    setDominantEmotion(null);
                }
            } catch (error) {
                console.error('Failed to load emotion stats', error);
            }
        };

        load();
        const interval = setInterval(load, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return dominantEmotion;
}
