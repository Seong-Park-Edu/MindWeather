import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { EmotionType } from '../types/emotion';

interface BackgroundMusicProps {
    dominantEmotion: EmotionType | null;
}

const SOUND_MAPPING: Record<number, any> = {
    [EmotionType.Joy]: require('../assets/sounds/joy.mp3'),
    [EmotionType.Excitement]: require('../assets/sounds/joy.mp3'),
    [EmotionType.Sadness]: require('../assets/sounds/rain.mp3'),
    [EmotionType.Fatigue]: require('../assets/sounds/rain.mp3'),
    [EmotionType.Loneliness]: require('../assets/sounds/rain.mp3'),
    [EmotionType.Depression]: require('../assets/sounds/rain.mp3'),
    [EmotionType.Anger]: require('../assets/sounds/wind.mp3'),
    [EmotionType.Anxiety]: require('../assets/sounds/wind.mp3'),
};

const DEFAULT_SOUND = require('../assets/sounds/neutral.mp3');

export default function BackgroundMusic({ dominantEmotion }: BackgroundMusicProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        // Configure audio for background playback
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const loadAndPlay = async (soundFile: any) => {
        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                soundFile,
                { shouldPlay: isPlaying, isLooping: true, volume: 0.3 }
            );
            soundRef.current = sound;
        } catch (error) {
            console.error('Failed to load sound', error);
        }
    };

    useEffect(() => {
        const targetSound = dominantEmotion !== null && SOUND_MAPPING[dominantEmotion]
            ? SOUND_MAPPING[dominantEmotion]
            : DEFAULT_SOUND;

        loadAndPlay(targetSound);
    }, [dominantEmotion]);

    const toggleSound = async () => {
        if (!soundRef.current) return;

        try {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            } else {
                await soundRef.current.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Failed to toggle sound', error);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={toggleSound}
                style={[styles.button, isPlaying ? styles.buttonActive : styles.buttonInactive]}
            >
                <Ionicons
                    name={isPlaying ? "volume-high" : "volume-mute"}
                    size={24}
                    color={isPlaying ? "white" : "rgba(255,255,255,0.5)"}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 100,
    },
    button: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    buttonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.4)',
        borderColor: 'rgba(139, 92, 246, 0.6)',
    },
    buttonInactive: {
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
});
