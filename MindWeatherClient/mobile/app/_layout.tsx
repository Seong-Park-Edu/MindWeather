import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    console.log("RootLayout is rendering");
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="signup" />
                        <Stack.Screen name="map" />
                        <Stack.Screen name="diary" />
                        <Stack.Screen name="board" />
                        <Stack.Screen name="notifications" />
                    </Stack>
                    <StatusBar style="light" />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
