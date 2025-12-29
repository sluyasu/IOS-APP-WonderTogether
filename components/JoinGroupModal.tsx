import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { joinGroup } from '../lib/groups';
import { useGroup } from '../contexts/GroupContext';

interface JoinGroupModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function JoinGroupModal({ visible, onClose }: JoinGroupModalProps) {
    const { refreshGroup } = useGroup();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!joinCode.trim() || joinCode.length !== 8) {
            Alert.alert('Invalid Code', 'Please enter a valid 8-character join code');
            return;
        }

        setLoading(true);
        try {
            const { group, error } = await joinGroup(joinCode.toUpperCase().trim());

            if (error) {
                if (error.message?.includes('not found')) {
                    Alert.alert('Invalid Code', 'No group found with this code');
                } else if (error.message?.includes('already a member')) {
                    Alert.alert('Already Joined', 'You are already a member of this group');
                } else {
                    Alert.alert('Error', 'Failed to join group. Please try again.');
                }
                return;
            }

            await refreshGroup();
            setJoinCode('');
            onClose();
            Alert.alert('Success!', `Welcome to ${group?.name}! 🎉`);
        } catch (error) {
            console.error('Error joining group:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'flex-end'
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 24,
                        paddingBottom: 40
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 24
                        }}>
                            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937' }}>
                                Join a Group
                            </Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                            Enter the 8-character code shared by your group
                        </Text>

                        {/* Join Code Input */}
                        <TextInput
                            value={joinCode}
                            onChangeText={(text) => setJoinCode(text.toUpperCase())}
                            placeholder="XXXXXXXX"
                            placeholderTextColor="#9ca3af"
                            maxLength={8}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            style={{
                                backgroundColor: '#f9fafb',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 20,
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                letterSpacing: 4,
                                textAlign: 'center',
                                color: '#1f2937',
                                borderWidth: 2,
                                borderColor: joinCode.length === 8 ? '#10b981' : '#e5e7eb',
                                marginBottom: 24
                            }}
                        />

                        {/* Join Button */}
                        <TouchableOpacity
                            onPress={handleJoin}
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
                                    <Check size={20} color="white" />
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
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
