import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, LogIn } from 'lucide-react-native';
import { joinGroup, isValidJoinCode } from '../../lib/groups';
import { useGroup } from '../../contexts/GroupContext';

export default function GroupJoinScreen() {
    const router = useRouter();
    const { refreshGroup } = useGroup();
    const [loading, setLoading] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const handleJoinCode = (text: string) => {
        // Auto-uppercase and remove spaces
        const cleaned = text.toUpperCase().replace(/\s/g, '');
        setJoinCode(cleaned);
    };

    const handleJoinGroup = async () => {
        if (!joinCode.trim()) {
            Alert.alert('Error', 'Please enter a join code');
            return;
        }

        if (!isValidJoinCode(joinCode)) {
            Alert.alert('Invalid Code', 'Join code must be 8 characters (letters and numbers only)');
            return;
        }

        setLoading(true);
        try {
            const { group, error } = await joinGroup(joinCode);

            if (error) {
                throw new Error('Invalid join code');
            }

            // Refresh the group context
            await refreshGroup();

            // Show success
            Alert.alert(
                '🎉 Joined Successfully!',
                `You've joined "${group?.name}"!\n\nYou can now share trips and memories together.`,
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/app-tour'),
                    }
                ]
            );
        } catch (error: any) {
            console.error('Error joining group:', error);
            Alert.alert(
                'Error',
                error.message === 'Invalid join code'
                    ? 'This code is not valid. Please check and try again.'
                    : 'Failed to join group. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            style={{ flex: 1 }}
        >
            {/* Header */}
            <View style={{
                paddingTop: 60,
                paddingHorizontal: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6'
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ padding: 8, marginLeft: -8 }}
                    >
                        <ArrowLeft size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>
                        Join Group
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
            >
                {/* Icon */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: 'rgba(107,114,128,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={40} color="#6b7280" />
                    </View>
                </View>

                {/* Instructions */}
                <Text style={{
                    fontSize: 16,
                    color: '#6b7280',
                    textAlign: 'center',
                    marginBottom: 32,
                    lineHeight: 24
                }}>
                    Ask your partner for their 8-character join code to start sharing your adventures together.
                </Text>

                {/* Join Code Input */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Enter Join Code
                    </Text>
                    <TextInput
                        value={joinCode}
                        onChangeText={handleJoinCode}
                        placeholder="XXXXXXXX"
                        placeholderTextColor="#cbd5e1"
                        maxLength={8}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                            padding: 20,
                            fontSize: 32,
                            fontWeight: 'bold',
                            color: '#e07a5f',
                            textAlign: 'center',
                            letterSpacing: 8,
                            borderWidth: 2,
                            borderColor: joinCode.length === 8 ? '#e07a5f' : '#e5e7eb'
                        }}
                    />
                    <Text style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginTop: 8,
                        textAlign: 'center'
                    }}>
                        {joinCode.length}/8 characters
                    </Text>
                </View>

                {/* Example Card */}
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    marginBottom: 24
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: 8
                    }}>
                        💡 How to find the code:
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af', lineHeight: 18 }}>
                        Your partner can find their join code on their profile screen after creating a group.
                    </Text>
                </View>
            </ScrollView>

            {/* Join Button */}
            <View style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6'
            }}>
                <TouchableOpacity
                    onPress={handleJoinGroup}
                    disabled={loading || joinCode.length !== 8}
                    style={{
                        backgroundColor: joinCode.length === 8 ? '#e07a5f' : '#d1d5db',
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <LogIn size={20} color="white" />
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: 'white'
                            }}>
                                Join Group
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}
