import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MailModal } from '../../components/MailModal';

export default function MailScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <MailModal onClose={() => router.back()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
});
