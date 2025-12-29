import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Calendar, Heart, Users, Plane, UserCircle } from 'lucide-react-native';
import { createGroup } from '../../lib/groups';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useGroup } from '../../contexts/GroupContext';

export default function GroupCreationScreen() {
    const router = useRouter();
    const { refreshGroup } = useGroup();
    const [loading, setLoading] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'couples' | 'family' | 'friends' | 'travel_buddies' | 'other'>('couples');
    const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const groupTypes = [
        { id: 'couples' as const, label: 'Couples', icon: Heart, color: '#e07a5f', description: 'For you and your partner' },
        { id: 'family' as const, label: 'Family', icon: Users, color: '#81b29a', description: 'Family adventures' },
        { id: 'friends' as const, label: 'Friends', icon: UserCircle, color: '#f2cc8f', description: 'Friend group trips' },
        { id: 'travel_buddies' as const, label: 'Travel', icon: Plane, color: '#3d5a80', description: 'Travel buddies' },
    ];

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        setLoading(true);
        try {
            const { group, error } = await createGroup({
                name: groupName.trim(),
                group_type: groupType,
                anniversary_date: anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : undefined,
            });

            if (error) throw error;

            // Refresh the group context
            await refreshGroup();

            // Show success with join code
            Alert.alert(
                '🎉 Group Created!',
                `Your group "${group?.name}" has been created!\n\nYour join code is:\n${group?.join_code}\n\nShare this code with your partner so they can join.`,
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/app-tour'),
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setAnniversaryDate(selectedDate);
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
                        Create Group
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
                        backgroundColor: 'rgba(224,122,95,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Heart size={40} color="#e07a5f" fill="#e07a5f" />
                    </View>
                </View>

                {/* Group Name */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: 8
                    }}>
                        Group Name *
                    </Text>
                    <TextInput
                        value={groupName}
                        onChangeText={setGroupName}
                        placeholder="e.g., John & Jane, The Smiths"
                        placeholderTextColor="#9ca3af"
                        maxLength={50}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 16,
                            fontSize: 16,
                            color: '#1f2937',
                            borderWidth: 1,
                            borderColor: '#e5e7eb'
                        }}
                    />
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        {groupName.length}/50
                    </Text>
                </View>

                {/* Group Type */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: 8
                    }}>
                        Group Type *
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                        What kind of group is this?
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {groupTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = groupType === type.id;
                            const isDisabled = type.id !== 'couples';
                            return (
                                <TouchableOpacity
                                    key={type.id}
                                    onPress={() => !isDisabled && setGroupType(type.id)}
                                    disabled={isDisabled}
                                    style={{
                                        flex: 1,
                                        minWidth: '45%',
                                        backgroundColor: isSelected ? type.color : 'white',
                                        borderRadius: 12,
                                        padding: 16,
                                        borderWidth: 2,
                                        borderColor: isSelected ? type.color : '#e5e7eb',
                                        alignItems: 'center',
                                        opacity: isDisabled ? 0.5 : 1,
                                    }}
                                >
                                    {isDisabled && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            backgroundColor: '#f59e0b',
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 4,
                                            zIndex: 1
                                        }}>
                                            <Text style={{ fontSize: 9, color: 'white', fontWeight: '600' }}>
                                                SOON
                                            </Text>
                                        </View>
                                    )}
                                    <Icon
                                        size={24}
                                        color={isSelected ? 'white' : type.color}
                                        fill={isSelected ? 'white' : type.color}
                                    />
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: isSelected ? 'white' : '#1f2937',
                                        marginTop: 8
                                    }}>
                                        {type.label}
                                    </Text>
                                    <Text style={{
                                        fontSize: 11,
                                        color: isSelected ? 'rgba(255,255,255,0.9)' : '#6b7280',
                                        marginTop: 4,
                                        textAlign: 'center'
                                    }}>
                                        {type.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Anniversary Date */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: 8
                    }}>
                        Anniversary Date (Optional)
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                        When did your adventure begin?
                    </Text>

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12
                        }}
                    >
                        <Calendar size={20} color="#6b7280" />
                        <Text style={{
                            fontSize: 16,
                            color: anniversaryDate ? '#1f2937' : '#9ca3af',
                            flex: 1
                        }}>
                            {anniversaryDate
                                ? format(anniversaryDate, 'MMMM d, yyyy')
                                : 'Select a date'
                            }
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={anniversaryDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Info Card */}
                <View style={{
                    backgroundColor: 'rgba(224,122,95,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24
                }}>
                    <Text style={{ fontSize: 14, color: '#92400e', lineHeight: 20 }}>
                        💡 After creating your group, you'll receive a unique join code to share with your partner.
                    </Text>
                </View>
            </ScrollView>

            {/* Create Button */}
            <View style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6'
            }}>
                <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={loading || !groupName.trim()}
                    style={{
                        backgroundColor: groupName.trim() ? '#e07a5f' : '#d1d5db',
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
                                Create Group
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}
