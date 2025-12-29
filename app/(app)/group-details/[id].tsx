import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Copy, Check, Users, Crown, UserX } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useGroup } from '../../../contexts/GroupContext';
import { leaveGroup } from '../../../lib/groups';

interface GroupMember {
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    profile: {
        display_name: string;
        avatar_url: string | null;
    };
}

interface GroupDetails {
    id: string;
    name: string;
    join_code: string;
    group_type: string;
    created_at: string;
}

export default function GroupDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentGroup, refreshGroup, switchGroup, allGroups } = useGroup();
    const [group, setGroup] = useState<GroupDetails | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        loadGroupDetails();
    }, [id]);

    const loadGroupDetails = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            if (user) setCurrentUserId(user.id);

            if (!id || id === 'undefined') {
                console.error('Invalid group ID:', id);
                setLoading(false);
                return;
            }

            // Load group info
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('id, name, join_code, group_type, created_at')
                .eq('id', id)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            // Load members
            const { data: membersData, error: membersError } = await supabase
                .from('group_members')
                .select(`
                    id,
                    user_id,
                    role,
                    joined_at
                `)
                .eq('group_id', id)
                .eq('is_active', true)
                .order('joined_at', { ascending: true });

            if (membersError) throw membersError;

            // Fetch profiles for each member
            const memberUserIds = membersData?.map(m => m.user_id).filter(id => id && id !== 'undefined') || [];

            if (memberUserIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url')
                    .in('id', memberUserIds);

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

                const membersWithProfiles = membersData?.map(member => ({
                    ...member,
                    profile: profilesMap.get(member.user_id) || { display_name: 'Unknown', avatar_url: null }
                })) || [];

                setMembers(membersWithProfiles);
            } else {
                setMembers([]);
            }
        } catch (error) {
            console.error('Error loading group details:', error);
            Alert.alert('Error', 'Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (group?.join_code) {
            // TODO: Use Clipboard API
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeaveGroup = async () => {
        if (!group) return;

        Alert.alert(
            'Leave Group',
            `Are you sure you want to leave "${group.name}"? You will need the join code to rejoin.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        const { success, error } = await leaveGroup(group.id);

                        if (error) {
                            if (error.message?.includes('only group')) {
                                Alert.alert('Cannot Leave', 'You cannot leave your only group. Create or join another group first.');
                            } else {
                                Alert.alert('Error', 'Failed to leave group');
                            }
                            return;
                        }

                        if (success) {
                            await refreshGroup();

                            // If we left the current group, switch to another one
                            if (currentGroup?.id === group.id && allGroups && allGroups.length > 0) {
                                const nextGroup = allGroups.find(g => g.id !== group.id);
                                if (nextGroup) {
                                    await switchGroup(nextGroup.id);
                                }
                            }

                            router.back();
                            Alert.alert('Success', `You have left ${group.name}`);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </View>
        );
    }

    if (!group) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>Group not found</Text>
            </View>
        );
    }

    const isCurrentUserAdmin = members.some(m => m.user_id === currentUserId && m.role === 'admin');

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <View style={{ backgroundColor: 'white', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f2937', marginBottom: 4 }}>
                    {group.name}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', textTransform: 'capitalize' }}>
                    {group.group_type.replace('_', ' ')}
                </Text>
            </View>

            <ScrollView style={{ flex: 1 }}>
                {/* Join Code Card */}
                <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Join Code
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 24, fontWeight: '700', fontFamily: 'monospace', color: '#1f2937', letterSpacing: 2 }}>
                            {group.join_code}
                        </Text>
                        <TouchableOpacity
                            onPress={handleCopyCode}
                            style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8 }}
                        >
                            {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} color="#6b7280" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members Section */}
                <View style={{ backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Users size={20} color="#6b7280" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginLeft: 8 }}>
                            Members ({members.length})
                        </Text>
                    </View>

                    {members.map((member, index) => (
                        <View
                            key={member.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderTopWidth: index === 0 ? 0 : 1,
                                borderTopColor: '#f3f4f6'
                            }}
                        >
                            {/* Avatar */}
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                {member.profile.avatar_url ? (
                                    <Image
                                        source={{ uri: member.profile.avatar_url }}
                                        style={{ width: 40, height: 40, borderRadius: 20 }}
                                    />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#9ca3af' }}>
                                        {member.profile.display_name?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                )}
                            </View>

                            {/* Name */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937' }}>
                                    {member.profile.display_name || 'Unknown User'}
                                    {member.user_id === currentUserId && (
                                        <Text style={{ fontWeight: '400', color: '#6b7280' }}> (You)</Text>
                                    )}
                                </Text>
                            </View>

                            {/* Role Badge */}
                            {member.role === 'admin' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Crown size={14} color="#f59e0b" />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#f59e0b', marginLeft: 4 }}>
                                        Admin
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Leave Group Button */}
                {!isCurrentUserAdmin && (
                    <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
                        <TouchableOpacity
                            onPress={handleLeaveGroup}
                            style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <UserX size={20} color="#dc2626" />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626', marginLeft: 8 }}>
                                Leave Group
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
