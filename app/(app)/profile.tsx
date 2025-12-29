import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LogOut, Copy, Check, Heart, Settings, MapPin, Camera as CameraIcon, CalendarDays, Globe, Star, BarChart3, Gift, ChevronRight, Pencil, Briefcase, Users as UsersIcon, Trash2 } from 'lucide-react-native';
import { differenceInDays, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { uploadToSupabase } from '../../lib/storage';
import { useGroup } from '../../contexts/GroupContext';
import { getUserProfile, updateProfile, deleteGroup } from '../../lib/groups';
import GroupSwitcher from '../../components/GroupSwitcher';
import JoinGroupModal from '../../components/JoinGroupModal';

interface Profile {
    id: string;
    display_name: string;
    avatar_url: string | null;
}

interface Couple {
    id: string;
    invite_code: string;
    partner1_id: string;
    partner2_id: string | null;
    couple_name: string | null;
    anniversary_date: string | null;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { currentGroup, allGroups, groupMembers, switchGroup, refreshGroup } = useGroup();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [couple, setCouple] = useState<Couple | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState({ countries: 0, trips: 0, photos: 0, days: 0 });
    const [copied, setCopied] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showGroupSwitcher, setShowGroupSwitcher] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        avatar_url: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/auth/login');
                return;
            }

            // Get user's profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);


            // Get group info from context (already loaded by GroupProvider)
            if (currentGroup) {
                // Store group data in a couple-like structure for UI compatibility
                setCouple({
                    id: currentGroup.id,
                    invite_code: currentGroup.join_code,
                    partner1_id: user.id,
                    partner2_id: groupMembers?.find(m => m.id !== user.id)?.id || null,
                    couple_name: currentGroup.name,
                    anniversary_date: currentGroup.anniversary_date,
                });

                // Get partner profile from group members
                const partner = groupMembers?.find(m => m.id !== user.id);
                if (partner) {
                    setPartnerProfile(partner);
                }

                // Fetch stats (filtered by group_id)
                const { data: tripsData } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('group_id', currentGroup.id);

                if (tripsData) {
                    const allCountries = new Set(tripsData.map(t => t.country)).size;
                    const completedTrips = tripsData.filter((t: any) => {
                        if (!t.end_date) return false;
                        const endDate = new Date(t.end_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        endDate.setHours(0, 0, 0, 0);
                        return endDate < today;
                    });
                    const totalDays = completedTrips.reduce((acc, t) => {
                        const start = new Date(t.start_date);
                        const end = new Date(t.end_date);
                        return acc + differenceInDays(end, start);
                    }, 0);
                    setStats(prev => ({ ...prev, countries: allCountries, trips: tripsData.length, days: totalDays }));
                }

                const { count } = await supabase
                    .from('memories')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', currentGroup.id);

                if (count) setStats(prev => ({ ...prev, photos: count }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            // Sign out from Supabase and wait for it to complete
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
                return;
            }

            // Remove any local storage items
            await AsyncStorage.removeItem('wandertogether_demo_mode');

            // Wait a moment for auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            // Navigate to landing page (will show login/signup options)
            router.replace('/auth/login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    const copyInviteCode = async () => {
        if (!couple?.invite_code) return;
        await Clipboard.setStringAsync(couple.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteGroup = async (groupId: string, groupName: string) => {
        Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${groupName}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { success, error } = await deleteGroup(groupId);
                        if (error) {
                            Alert.alert('Error', 'Only admins can delete groups.');
                        } else {
                            Alert.alert('Success', 'Group deleted');
                            await refreshGroup();
                        }
                    }
                }
            ]
        );
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: editForm.display_name,
                    avatar_url: editForm.avatar_url || null,
                    updated_at: new Date().toISOString(),
                });

            if (!error) {
                setProfile({
                    id: user.id,
                    display_name: editForm.display_name,
                    avatar_url: editForm.avatar_url || null,
                });
                setShowEditProfile(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setUploading(true);
                const uri = result.assets[0].uri;

                // Get current user ID for the path
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const path = `${user.id}/${Date.now()}.jpg`;
                const publicUrl = await uploadToSupabase(uri, 'avatars', path);

                setEditForm(prev => ({ ...prev, avatar_url: publicUrl || prev.avatar_url }));
            }
        } catch (error) {
            console.error('Error picking/uploading image:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    const userName = profile?.display_name || 'You';
    const partnerName = partnerProfile?.display_name || 'Your Partner';
    const relationshipDays = couple?.anniversary_date
        ? differenceInDays(new Date(), new Date(couple.anniversary_date))
        : 0;

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}>
                {/* Profile Header */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    {/* Avatars */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                setEditForm({
                                    display_name: profile?.display_name || '',
                                    avatar_url: profile?.avatar_url || '',
                                });
                                setShowEditProfile(true);
                            }}
                            style={{ position: 'relative' }}
                        >
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e07a5f', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#e07a5f' }}>
                                {profile?.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 32 }} />
                                ) : (
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{userName[0]}</Text>
                                )}
                            </View>
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                                <Pencil size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Heart size={24} color="#e07a5f" fill="#e07a5f" style={{ marginHorizontal: -4 }} />
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e07a5f', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#e07a5f' }}>
                            {partnerProfile?.avatar_url ? (
                                <Image source={{ uri: partnerProfile.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 32 }} />
                            ) : (
                                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                                    {couple?.partner2_id ? partnerName[0] : '?'}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Couple Name */}
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
                            {couple?.couple_name || `${userName} & ${couple?.partner2_id ? partnerName : '...'}`}
                        </Text>
                        {couple?.anniversary_date && (
                            <View style={{ marginTop: 4 }}>
                                <Text style={{ color: '#4b5563', fontSize: 12 }}>
                                    Together since {format(new Date(couple.anniversary_date), 'MMMM d, yyyy')}
                                </Text>
                                <Text style={{ color: '#e07a5f', fontWeight: '600', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                                    {relationshipDays.toLocaleString()} days of adventures
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Invite Code (if no partner) */}
                    {!couple?.partner2_id && couple?.invite_code && (
                        <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(224,122,95,0.3)', backgroundColor: 'rgba(224,122,95,0.05)', borderRadius: 12, padding: 12, width: '100%', marginTop: 12 }}>
                            <Text style={{ fontSize: 12, color: '#4b5563', marginBottom: 8, textAlign: 'center' }}>Share this code with your partner:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2, color: '#e07a5f' }}>
                                    {couple.invite_code}
                                </Text>
                                <TouchableOpacity onPress={copyInviteCode} style={{ padding: 6 }}>
                                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#9ca3af" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, padding: 12, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <StatItem icon={Globe} value={stats.countries} label="Countries" />
                        <StatItem icon={MapPin} value={stats.trips} label="Trips" />
                        <StatItem icon={CameraIcon} value={stats.photos} label="Photos" />
                        <StatItem icon={CalendarDays} value={stats.days} label="Days" />
                    </View>
                </View>

                {/* Explore Section */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Explore</Text>

                    {/* Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {/* Row 1 */}
                        <ExploreButton icon={Briefcase} label="All Trips" color="#2563eb" onPress={() => router.push('/(app)/trips-list')} />
                        <ExploreButton icon={CameraIcon} label="Memories" color="#e11d48" onPress={() => router.push('/(app)/memories')} />

                        {/* Row 2 */}
                        <ExploreButton icon={Star} label="Bucket List" color="#f97316" onPress={() => router.push('/(app)/bucket-list')} />
                        <ExploreButton icon={Gift} label="Wishlist" color="#7c3aed" onPress={() => router.push('/(app)/wishlist')} />
                    </View>

                    {/* Stats Button */}
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/stats')}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            padding: 16,
                            borderRadius: 16,
                            marginTop: 12,
                            marginBottom: 4,
                            shadowColor: '#000',
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            gap: 8
                        }}
                    >
                        <BarChart3 size={20} color="#e07a5f" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>View Full Journey Stats</Text>
                    </TouchableOpacity>
                </View>

                {/* My Groups Section */}
                <View style={{ marginTop: 24 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
                        My Groups ({allGroups.length})
                    </Text>

                    {/* Current Groups List */}
                    {allGroups.map((group) => (
                        <TouchableOpacity
                            key={group.id}
                            onPress={() => router.push(`/(app)/group-details/${group.id}`)}
                            style={{
                                backgroundColor: currentGroup?.id === group.id ? 'rgba(224,122,95,0.1)' : 'white',
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderWidth: 2,
                                borderColor: currentGroup?.id === group.id ? '#e07a5f' : '#f3f4f6'
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: currentGroup?.id === group.id ? '#e07a5f' : '#f3f4f6',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Heart
                                        size={16}
                                        color={currentGroup?.id === group.id ? 'white' : '#6b7280'}
                                        fill={currentGroup?.id === group.id ? 'white' : 'none'}
                                    />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                                        {group.name}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' }}>
                                        {group.group_type?.replace('_', ' ') || 'Group'}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {currentGroup?.id === group.id && (
                                    <View style={{
                                        backgroundColor: '#e07a5f',
                                        borderRadius: 12,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4
                                    }}>
                                        <Text style={{ fontSize: 10, fontWeight: '600', color: 'white' }}>ACTIVE</Text>
                                    </View>
                                )}
                                {/* Delete button for admins */}
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGroup(group.id, group.name);
                                    }}
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        backgroundColor: '#fee2e2'
                                    }}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Action Buttons */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
                        <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                            <SettingsItem
                                icon={UsersIcon}
                                label="Create New Group"
                                onPress={() => router.push('/group-creation')}
                            />
                            <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                            <SettingsItem
                                icon={Heart}
                                label="Join a Group"
                                onPress={() => setShowJoinGroup(true)}
                            />
                            {allGroups.length > 1 && (
                                <>
                                    <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                                    <SettingsItem
                                        icon={UsersIcon}
                                        label={`Switch Group (${allGroups.length})`}
                                        onPress={() => setShowGroupSwitcher(true)}
                                    />
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={{ marginTop: 32, marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>Settings</Text>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
                        <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                            <SettingsItem icon={Settings} label="All Settings" onPress={() => router.push('/settings')} />
                            <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                            <SettingsItem icon={Heart} label="Our Story Timeline" onPress={() => router.push('/timeline')} />
                            <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                            <SettingsItem icon={Globe} label="Currency & Units" />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={{ width: '100%', marginTop: 16, height: 44, borderRadius: 12, borderWidth: 2, borderColor: '#fecaca', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                    >
                        <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#f43f5e', fontWeight: 'bold' }}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfile} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>Edit Profile</Text>

                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <TouchableOpacity
                                onPress={handlePickImage}
                                disabled={uploading}
                                style={{ position: 'relative' }}
                            >
                                <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e07a5f', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, overflow: 'hidden' }}>
                                    {uploading ? (
                                        <ActivityIndicator color="white" />
                                    ) : editForm.avatar_url ? (
                                        <Image source={{ uri: editForm.avatar_url }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                                            {editForm.display_name?.[0] || 'U'}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#111827', borderRadius: 16, padding: 8, borderWidth: 2, borderColor: 'white' }}>
                                    <CameraIcon size={14} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Tap to change photo</Text>
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Display Name</Text>
                            <TextInput
                                value={editForm.display_name}
                                onChangeText={(text) => setEditForm({ ...editForm, display_name: text })}
                                placeholder="Your name"
                                style={{ borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#1f2937', fontSize: 16 }}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowEditProfile(false)}
                                style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={saving || uploading || !editForm.display_name}
                                style={{ flex: 1, backgroundColor: (saving || uploading || !editForm.display_name) ? 'rgba(224,122,95,0.5)' : '#e07a5f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Group Switcher Modal */}
            <GroupSwitcher
                visible={showGroupSwitcher}
                onClose={() => setShowGroupSwitcher(false)}
            />

            {/* Join Group Modal */}
            <JoinGroupModal
                visible={showJoinGroup}
                onClose={() => setShowJoinGroup(false)}
            />
        </LinearGradient>
    );
}

function StatItem({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <Icon size={16} color="#e07a5f" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 4 }}>{value}</Text>
            <Text style={{ fontSize: 9, color: '#4b5563' }}>{label}</Text>
        </View>
    );
}

function ExploreButton({ icon: Icon, label, color, onPress }: { icon: any; label: string; color: string; onPress?: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ flex: 1, minWidth: '48%', backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, padding: 12, alignItems: 'center' }}
        >
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4, backgroundColor: `${color}20` }}>
                <Icon size={20} color={color} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#1f2937' }}>{label}</Text>
        </TouchableOpacity>
    );
}

function SettingsItem({ icon: Icon, label, onPress }: { icon: any; label: string; onPress?: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon size={16} color="#9ca3af" />
                <Text style={{ fontSize: 14, color: '#1f2937' }}>{label}</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
        </TouchableOpacity>
    );
}

// Render JoinGroupModal
function RenderJoinGroupModal() {
    return null; // Placeholder - modal is imported at top
}
