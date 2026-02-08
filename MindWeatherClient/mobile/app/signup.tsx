import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signUpWithEmail() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Signup Failed', error.message);
        } else {
            Alert.alert('Success', 'Account created successfully! Please log in.');
            router.back();
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-gray-800">Create Account</Text>
                <Text className="text-gray-500 mt-2">Sign up to get started</Text>
            </View>

            <View className="gap-4">
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-gray-800"
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-gray-800"
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    className="bg-green-600 p-4 rounded-xl items-center mt-2"
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-2">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-blue-600 font-semibold">Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
