import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useGroup } from '../contexts/GroupContext';
import { Heart, Users, Plane, UserCircle, Check, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupSwitcherProps {
    visible: boolean;
    onClose: () => void;
}

export default function GroupSwitcher({ visible, onClose }: GroupSwitcherProps) {
    const { currentGroup, allGroups, switchGroup } = useGroup();

    const getGroupIcon = (type: string) => {
        switch (type) {
            case 'couples': return Heart;
            case 'family': return Users;
            case 'friends': return UserCircle;
            case 'travel_buddies': return Plane;
            default: return Users;
        }
    };

    const getGroupColor = (type: string) => {
        switch (type) {
            case 'couples': return '#e07a5f';
            case 'family': return '#81b29a';
            case 'friends': return '#f2cc8f';
            case 'travel_buddies': return '#3d5a80';
            default: return '#6b7280';
        }
    };

    const handleSwitchGroup = async (groupId: string) => {
        await switchGroup(groupId);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
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
                    maxHeight: '70%',
                }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6'
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                            Switch Group
                        </Text>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Groups List */}
                    <ScrollView style={{ padding: 20 }}>
                        {allGroups.map((group) => {
                            const Icon = getGroupIcon(group.group_type || 'couples');
                            const color = getGroupColor(group.group_type || 'couples');
                            const isActive = currentGroup?.id === group.id;

                            return (
                                <TouchableOpacity
                                    key={group.id}
                                    onPress={() => handleSwitchGroup(group.id)}
                                    style={{
                                        marginBottom: 12,
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        borderWidth: 2,
                                        borderColor: isActive ? color : '#e5e7eb',
                                    }}
                                >
                                    <LinearGradient
                                        colors={isActive ? [color + '20', color + '10'] : ['#ffffff', '#ffffff']}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 16,
                                            gap: 12
                                        }}
                                    >
                                        <View style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 24,
                                            backgroundColor: color + '20',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Icon size={24} color={color} fill={color} />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: '#1f2937',
                                                marginBottom: 4
                                            }}>
                                                {group.name}
                                            </Text>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#6b7280',
                                                textTransform: 'capitalize'
                                            }}>
                                                {group.group_type?.replace('_', ' ') || 'Couples'}
                                            </Text>
                                        </View>

                                        {isActive && (
                                            <View style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: color,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Check size={18} color="white" strokeWidth={3} />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
