import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { InboxModal } from '../../components/InboxModal';

export default function InboxScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <InboxModal onClose={() => router.back()} />
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
