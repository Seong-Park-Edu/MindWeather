import { Stack } from 'expo-router';

export default function ModalLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' },
            }}
        >
            <Stack.Screen name="emotion" />
            <Stack.Screen name="mail" />
            <Stack.Screen name="inbox" />
            <Stack.Screen name="comfort" />
            <Stack.Screen name="stats" />
        </Stack>
    );
}
