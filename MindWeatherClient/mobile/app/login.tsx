import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // Correct import for expo-router v3
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            // AuthContext listener will pick up the session change
            // We just need to navigate to home
            router.replace('/');
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-gray-800">Mind Weather</Text>
                <Text className="text-gray-500 mt-2">Sign in to continue</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="bg-gray-100 p-4 rounded-lg text-gray-800"
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    className="bg-gray-100 p-4 rounded-lg text-gray-800"
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    className="bg-blue-600 p-4 rounded-lg items-center"
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">Login</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text className="text-blue-600 font-semibold">Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
