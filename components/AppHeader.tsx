import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Heart, Search } from 'lucide-react-native';

interface Profile {
    id: string;
    display_name: string;
    avatar_url: string | null;
}

interface Couple {
    id: string;
    partner1_id: string;
    partner2_id: string | null;
}

export default function AppHeader() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
    const [couple, setCouple] = useState<Couple | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        setProfile(userProfile);

        // Fetch couple
        const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .single();
        setCouple(coupleData);

        // Fetch partner profile
        if (coupleData) {
            const partnerId = coupleData.partner1_id === user.id
                ? coupleData.partner2_id
                : coupleData.partner1_id;

            if (partnerId) {
                const { data: partner } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', partnerId)
                    .single();
                setPartnerProfile(partner);
            }
        }
    };

    const getInitial = (name?: string) => {
        return name?.[0]?.toUpperCase() || '?';
    };

    return (
        <View className="bg-[#fffbf0] border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                {/* Logo/Title */}
                <TouchableOpacity
                    onPress={() => router.push('/')}
                    className="flex-row items-center gap-2"
                >
                    <View className="w-7 h-7 rounded-full bg-terracotta items-center justify-center">
                        <Text className="text-white text-sm">✈️</Text>
                    </View>
                    <Text className="font-bold text-lg text-gray-800">WonderTogether</Text>
                </TouchableOpacity>

                {/* Right Side - Search + Avatars */}
                <View className="flex-row items-center gap-2">
                    {/* Search Icon */}
                    <TouchableOpacity className="w-9 h-9 items-center justify-center">
                        <Search size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {/* Couple Avatars */}
                    <TouchableOpacity
                        onPress={() => router.push('/profile')}
                        className="flex-row items-center"
                    >
                        {/* User Avatar */}
                        <View className="w-8 h-8 rounded-full border-2 border-terracotta bg-terracotta/10 overflow-hidden items-center justify-center">
                            {profile?.avatar_url ? (
                                <Image
                                    source={{ uri: profile.avatar_url }}
                                    className="w-full h-full"
                                />
                            ) : (
                                <Text className="text-terracotta text-xs font-semibold">
                                    {getInitial(profile?.display_name)}
                                </Text>
                            )}
                        </View>

                        {/* Heart Icon */}
                        <View className="w-5 h-5 -mx-1.5 z-10 rounded-full bg-[#fffbf0] border-2 border-terracotta items-center justify-center">
                            <Heart size={10} color="#e07a5f" fill="#e07a5f" />
                        </View>

                        {/* Partner Avatar */}
                        <View className="w-8 h-8 rounded-full border-2 border-terracotta bg-gray-200 overflow-hidden items-center justify-center">
                            {partnerProfile?.avatar_url ? (
                                <Image
                                    source={{ uri: partnerProfile.avatar_url }}
                                    className="w-full h-full"
                                />
                            ) : (
                                <Text className="text-gray-600 text-xs font-semibold">
                                    {couple?.partner2_id ? getInitial(partnerProfile?.display_name) : '+'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
