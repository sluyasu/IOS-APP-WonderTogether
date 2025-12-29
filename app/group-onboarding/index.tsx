import { View, Text, TouchableOpacity, Image } from 'react-native';
import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Users, UserPlus, Heart } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function GroupOnboardingScreen() {
    const router = useRouter();

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('[GroupOnboarding] Not authenticated, redirecting to login');
                router.replace('/auth/login');
            }
        };
        checkAuth();
    }, [router]);

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
                {/* App Logo/Icon */}
                <View style={{ alignItems: 'center', marginBottom: 48 }}>
                    <View style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: 'rgba(224,122,95,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24
                    }}>
                        <Heart size={60} color="#e07a5f" fill="#e07a5f" />
                    </View>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: 8
                    }}>
                        Welcome to
                    </Text>
                    <Text style={{
                        fontSize: 36,
                        fontWeight: 'bold',
                        color: '#e07a5f'
                    }}>
                        WonderTogether
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginTop: 12,
                        textAlign: 'center'
                    }}>
                        Track your adventures together
                    </Text>
                </View>

                {/* Option Cards */}
                <View style={{ gap: 16 }}>
                    {/* Create New Group */}
                    <TouchableOpacity
                        onPress={() => router.push('/group-creation')}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 20,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            borderWidth: 2,
                            borderColor: '#e07a5f'
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: 'rgba(224,122,95,0.1)',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <UserPlus size={28} color="#e07a5f" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: '#1f2937',
                                    marginBottom: 4
                                }}>
                                    Create New Group
                                </Text>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                    Start tracking adventures together
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Join Existing Group */}
                    <TouchableOpacity
                        onPress={() => router.push('/group-join')}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 20,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            borderWidth: 2,
                            borderColor: 'transparent'
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: '#f3f4f6',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Users size={28} color="#6b7280" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: '#1f2937',
                                    marginBottom: 4
                                }}>
                                    Join Existing Group
                                </Text>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                    Enter your partner's code
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Helper Text */}
                <Text style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    textAlign: 'center',
                    marginTop: 32
                }}>
                    You can always change this later in settings
                </Text>
            </View>
        </LinearGradient>
    );
}
