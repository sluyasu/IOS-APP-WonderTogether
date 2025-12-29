import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // If email confirmation is disabled, user is logged in immediately
            if (data.session) {
                // User is logged in, redirect to app (landing page will handle onboarding)
                router.replace('/');
            } else {
                // Email confirmation required
                Alert.alert('Success', 'Account created! Please check your email to verify.');
                router.replace('/auth/login');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ position: 'absolute', top: 50, left: 24, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)' }}
                    >
                        <ChevronLeft size={24} color="#3d405b" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <LinearGradient
                            colors={['#e07a5f', '#fb7185']}
                            style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                        >
                            <Heart color="white" size={36} fill="white" />
                        </LinearGradient>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937', fontFamily: 'serif', letterSpacing: 0.5 }}>Join Us</Text>
                        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 4 }}>Start your journey today</Text>
                    </View>

                    {/* Sign Up Form */}
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', width: '100%' }}>
                        <View style={{ gap: 20 }}>
                            {/* Email Input */}
                            <View>
                                <Text style={{ color: '#374151', marginBottom: 8, fontWeight: '600', fontSize: 14 }}>Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@example.com"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingHorizontal: 16, color: '#1f2937', fontSize: 16 }}
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Password Input */}
                            <View>
                                <Text style={{ color: '#374151', marginBottom: 8, fontWeight: '600', fontSize: 14 }}>Password</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholder="At least 6 characters"
                                    style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingHorizontal: 16, color: '#1f2937', fontSize: 16 }}
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                onPress={handleSignUp}
                                disabled={isLoading}
                                style={{ marginTop: 8 }}
                            >
                                <LinearGradient
                                    colors={['#e07a5f', '#fb7185']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={{ height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#e07a5f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                                >
                                    {isLoading ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator color="white" />
                                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Creating account...</Text>
                                        </View>
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 17 }}>Sign Up</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Sign In Link */}
                        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14, color: '#6b7280' }}>Already have an account? </Text>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity>
                                    <Text style={{ color: '#e07a5f', fontWeight: '600', fontSize: 14 }}>Sign in</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
