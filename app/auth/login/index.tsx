import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Plane, Sparkles, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Navigate to app home (tabs)
            router.replace('/(app)/');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoMode = async () => {
        await AsyncStorage.setItem('wandertogether_demo_mode', 'true');
        router.replace('/(app)/');
    };

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            className="flex-1 px-6 pt-12 pb-6 justify-center"
        >
            <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 z-10 p-2 rounded-full bg-white/50">
                <ChevronLeft size={24} color="#3d405b" />
            </TouchableOpacity>

            <View className="items-center mb-8">
                <LinearGradient
                    colors={['#e07a5f', '#fb7185']}
                    className="w-16 h-16 rounded-full mb-4 items-center justify-center shadow-lg"
                >
                    <Heart color="white" size={32} fill="white" />
                </LinearGradient>
                <Text className="text-3xl font-bold text-gray-800 font-serif">WanderTogether</Text>
                <Text className="text-gray-500 mt-1">Welcome back, travelers</Text>
            </View>

            <View className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 w-full">
                <View className="space-y-4">
                    <View>
                        <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-gray-800 focus:border-terracotta"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 mb-2 font-medium">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-gray-800 focus:border-terracotta"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        className="mt-2"
                    >
                        <LinearGradient
                            colors={['#e07a5f', '#fb7185']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            className="h-12 rounded-xl items-center justify-center shadow-lg flex-row gap-2"
                        >
                            {isLoading ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator color="white" />
                                    <Text className="text-white font-medium">Logging in...</Text>
                                </View>
                            ) : (
                                <Text className="text-white font-medium text-lg">Sign In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View className="mt-4">
                    <View className="relative items-center justify-center py-2">
                        <View className="absolute w-full border-t border-gray-200" />
                        <Text className="bg-white/80 px-2 text-xs uppercase text-gray-400">or</Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleDemoMode}
                        className="w-full h-11 mt-2 rounded-xl border border-terracotta/30 flex-row items-center justify-center bg-transparent active:bg-terracotta/5"
                    >
                        <Sparkles size={16} color="#e07a5f" className="mr-2" />
                        <Text className="text-terracotta font-medium ml-2">Try Demo Mode</Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-6 flex-row justify-center">
                    <Text className="text-sm text-gray-500">Don't have an account? </Text>
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity>
                            <Text className="text-terracotta font-medium underline">Sign up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </LinearGradient>
    );
}
