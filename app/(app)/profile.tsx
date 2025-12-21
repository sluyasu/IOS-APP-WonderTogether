import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LogOut, Copy, Check, Heart, Settings, MapPin, Camera as CameraIcon, CalendarDays, Globe, Star, BarChart3, Gift, ChevronRight, Pencil } from 'lucide-react-native';
import { differenceInDays, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

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
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [couple, setCouple] = useState<Couple | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState({ countries: 0, trips: 0, photos: 0, days: 0 });
    const [copied, setCopied] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        avatar_url: '',
    });
    const [saving, setSaving] = useState(false);

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

            // Get couple info
            const { data: coupleData } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .single();
            setCouple(coupleData);

            if (coupleData) {
                // Get partner profile
                const partnerId = coupleData.partner1_id === user.id
                    ? coupleData.partner2_id
                    : coupleData.partner1_id;

                if (partnerId) {
                    const { data: partnerData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', partnerId)
                        .single();
                    setPartnerProfile(partnerData);
                }

                // Fetch stats
                const { data: tripsData } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('couple_id', coupleData.id);

                if (tripsData) {
                    const completedTrips = tripsData.filter(t => t.status === 'completed');
                    const countries = new Set(completedTrips.map(t => t.country)).size;
                    const totalDays = completedTrips.reduce((acc, t) => {
                        const start = new Date(t.start_date);
                        const end = new Date(t.end_date);
                        return acc + differenceInDays(end, start);
                    }, 0);

                    setStats(prev => ({
                        ...prev,
                        countries,
                        trips: completedTrips.length,
                        days: totalDays,
                    }));
                }

                const { count } = await supabase
                    .from('memories')
                    .select('*', { count: 'exact', head: true })
                    .eq('couple_id', coupleData.id);

                if (count) setStats(prev => ({ ...prev, photos: count }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('wandertogether_demo_mode');
        router.replace('/');
    };

    const copyInviteCode = async () => {
        if (!couple?.invite_code) return;
        await Clipboard.setStringAsync(couple.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: editForm.display_name,
                    avatar_url: editForm.avatar_url || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

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

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
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
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            <ScrollView className="flex-1 px-4 py-4">
                {/* Profile Header */}
                <View className="items-center space-y-3 mb-5">
                    {/* Avatars */}
                    <View className="flex-row items-center justify-center gap-2">
                        <TouchableOpacity
                            onPress={() => {
                                setEditForm({
                                    display_name: profile?.display_name || '',
                                    avatar_url: profile?.avatar_url || '',
                                });
                                setShowEditProfile(true);
                            }}
                            className="relative"
                        >
                            <View className="w-16 h-16 rounded-full bg-terracotta items-center justify-center border-4 border-terracotta">
                                {profile?.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full rounded-full" />
                                ) : (
                                    <Text className="text-white text-xl font-bold">{userName[0]}</Text>
                                )}
                            </View>
                            <View className="absolute inset-0 rounded-full bg-black/40 items-center justify-center opacity-80">
                                <Pencil size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Heart size={24} color="#e07a5f" fill="#e07a5f" className="-mx-1" />
                        <View className="w-16 h-16 rounded-full bg-terracotta items-center justify-center border-4 border-terracotta">
                            {partnerProfile?.avatar_url ? (
                                <Image source={{ uri: partnerProfile.avatar_url }} className="w-full h-full rounded-full" />
                            ) : (
                                <Text className="text-white text-xl font-bold">
                                    {couple?.partner2_id ? partnerName[0] : '?'}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Couple Name */}
                    <View className="items-center">
                        <Text className="text-xl font-bold text-gray-800">
                            {couple?.couple_name || `${userName} & ${couple?.partner2_id ? partnerName : '...'}`}
                        </Text>
                        {couple?.anniversary_date && (
                            <View className="mt-1">
                                <Text className="text-gray-600 text-xs">
                                    Together since {format(new Date(couple.anniversary_date), 'MMMM d, yyyy')}
                                </Text>
                                <Text className="text-terracotta font-semibold text-xs text-center mt-0.5">
                                    {relationshipDays.toLocaleString()} days of adventures
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Invite Code (if no partner) */}
                    {!couple?.partner2_id && couple?.invite_code && (
                        <View className="border-2 border-dashed border-terracotta/30 bg-terracotta/5 rounded-xl p-3 w-full">
                            <Text className="text-xs text-gray-600 mb-2 text-center">Share this code with your partner:</Text>
                            <View className="flex-row items-center justify-center gap-2">
                                <Text className="text-xl font-mono font-bold tracking-widest text-terracotta">
                                    {couple.invite_code}
                                </Text>
                                <TouchableOpacity onPress={copyInviteCode} className="p-1.5">
                                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#9ca3af" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View className="bg-white rounded-2xl shadow p-3 mb-5">
                    <View className="flex-row justify-around">
                        <StatItem icon={Globe} value={stats.countries} label="Countries" />
                        <StatItem icon={MapPin} value={stats.trips} label="Trips" />
                        <StatItem icon={CameraIcon} value={stats.photos} label="Photos" />
                        <StatItem icon={CalendarDays} value={stats.days} label="Days" />
                    </View>
                </View>

                {/* Explore Section */}
                <View className="mb-5">
                    <Text className="text-base font-bold text-gray-800 mb-2">Explore</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <ExploreButton icon={CameraIcon} label="Memories" color="#e07a5f" onPress={() => router.push('/memories')} />
                        <ExploreButton icon={Star} label="Bucket List" color="#f4a261" onPress={() => router.push('/bucket-list')} />
                        <ExploreButton icon={BarChart3} label="Stats" color="#2a9d8f" onPress={() => router.push('/stats')} />
                        <ExploreButton icon={Gift} label="Wishlist" color="#e76f51" />
                    </View>
                </View>

                {/* Settings Section */}
                <View className="mb-5">
                    <Text className="text-base font-bold text-gray-800 mb-2">Settings</Text>
                    <View className="bg-white rounded-2xl shadow overflow-hidden">
                        <SettingsItem icon={Settings} label="All Settings" onPress={() => router.push('/settings')} />
                        <View className="h-px bg-gray-200" />
                        <SettingsItem icon={Heart} label="Our Story Timeline" />
                        <View className="h-px bg-gray-200" />
                        <SettingsItem icon={Globe} label="Currency & Units" />
                    </View>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="w-full mt-4 h-11 rounded-xl border-2 border-rose-300 bg-transparent items-center justify-center flex-row"
                    >
                        <LogOut size={16} color="#ef4444" className="mr-2" />
                        <Text className="text-rose-500 font-bold">Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfile} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Edit Profile</Text>

                        <View className="items-center mb-4">
                            <View className="w-24 h-24 rounded-full bg-terracotta items-center justify-center">
                                {editForm.avatar_url ? (
                                    <Image source={{ uri: editForm.avatar_url }} className="w-full h-full rounded-full" />
                                ) : (
                                    <Text className="text-white text-2xl font-bold">
                                        {editForm.display_name?.[0] || 'U'}
                                    </Text>
                                )}
                            </View>
                            <Text className="text-xs text-gray-600 mt-2">Tap to change photo</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-1">Display Name</Text>
                            <TextInput
                                value={editForm.display_name}
                                onChangeText={(text) => setEditForm({ ...editForm, display_name: text })}
                                placeholder="Your name"
                                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-1">Avatar URL</Text>
                            <TextInput
                                value={editForm.avatar_url}
                                onChangeText={(text) => setEditForm({ ...editForm, avatar_url: text })}
                                placeholder="https://example.com/photo.jpg"
                                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                            />
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => setShowEditProfile(false)}
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 items-center"
                            >
                                <Text className="text-gray-700 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={saving || !editForm.display_name}
                                className="flex-1 bg-terracotta rounded-xl px-4 py-3 items-center"
                            >
                                <Text className="text-white font-semibold">
                                    {saving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

function StatItem({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
    return (
        <View className="items-center">
            <Icon size={16} color="#e07a5f" />
            <Text className="text-lg font-bold text-gray-800 mt-1">{value}</Text>
            <Text className="text-[9px] text-gray-600">{label}</Text>
        </View>
    );
}

function ExploreButton({ icon: Icon, label, color, onPress }: { icon: any; label: string; color: string; onPress?: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-1 min-w-[48%] bg-white rounded-xl shadow p-3 items-center"
        >
            <View className="w-10 h-10 rounded-full items-center justify-center mb-1" style={{ backgroundColor: `${color}20` }}>
                <Icon size={20} color={color} />
            </View>
            <Text className="text-xs font-medium text-gray-800">{label}</Text>
        </TouchableOpacity>
    );
}

function SettingsItem({ icon: Icon, label, onPress }: { icon: any; label: string; onPress?: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-3">
            <View className="flex-row items-center gap-2">
                <Icon size={16} color="#9ca3af" />
                <Text className="text-sm text-gray-800">{label}</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
        </TouchableOpacity>
    );
}
