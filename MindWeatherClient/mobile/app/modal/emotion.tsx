import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { EmotionInputModal } from '../../components/EmotionInputModal';

export default function EmotionScreen() {
    const router = useRouter();

    const handleClose = () => {
        router.back();
    };

    const handleSuccess = () => {
        // We can emit an event or just go back. 
        // The parent screen should listen for focus to refresh.
        router.back();
    };

    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            <EmotionInputModal onClose={handleClose} onSuccess={handleSuccess} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // The real backdrop is the Pressable
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
});
