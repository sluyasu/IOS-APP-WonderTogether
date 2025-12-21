import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, CheckCircle, ArrowRight } from 'lucide-react-native';

export default function SignUpSuccessScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']} // amber-50 via rose-50 to sky-50
            className="flex-1 items-center justify-center p-6"
        >
            <LinearGradient
                colors={['#e07a5f', '#fb7185']}
                className="w-20 h-20 rounded-full mb-6 items-center justify-center shadow-lg"
            >
                <Heart color="white" size={40} fill="white" />
            </LinearGradient>

            <Text className="text-3xl font-bold text-gray-800 font-serif mb-2 text-center">
                Welcome to WanderTogether!
            </Text>

            <Text className="text-gray-600 text-center mb-6">
                Your account has been successfully created.
            </Text>

            <View className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 w-full max-w-sm items-center">
                <CheckCircle size={48} color="#e07a5f" className="mb-4" />

                <Text className="text-lg font-medium text-gray-800 mb-2">Check your email</Text>

                {email && <Text className="text-terracotta font-medium mb-6 text-center">{email}</Text>}

                <Text className="text-gray-500 text-center text-sm mb-8">
                    We've sent you a confirmation link to verify your account. Please check your inbox and click the link to get started.
                </Text>

                <Link href="/auth/login" asChild>
                    <TouchableOpacity>
                        <Text className="text-terracotta font-medium mb-4">I verified my email</Text>
                    </TouchableOpacity>
                </Link>

                <Link href="/auth/login" asChild>
                    <TouchableOpacity>
                        <LinearGradient
                            colors={['#e07a5f', '#fb7185']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            className="h-12 w-full px-8 rounded-xl items-center justify-center shadow-lg flex-row gap-2"
                        >
                            <Text className="text-white font-medium text-lg">Continue to Sign In</Text>
                            <ArrowRight size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Link>
            </View>
        </LinearGradient>
    );
}
