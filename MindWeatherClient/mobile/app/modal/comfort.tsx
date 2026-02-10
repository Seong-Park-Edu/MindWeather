import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ComfortModal } from '../../components/ComfortModal';

export default function ComfortScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const cluster = useMemo(() => {
        if (params.cluster && typeof params.cluster === 'string') {
            try {
                return JSON.parse(params.cluster);
            } catch (e) {
                console.error('Failed to parse cluster', e);
                return null;
            }
        }
        return null;
    }, [params.cluster]);

    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <ComfortModal cluster={cluster} onClose={() => router.back()} />
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
