import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Heart, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
    const insets = useSafeAreaInsets();
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



    return (
        <View style={{ paddingTop: insets.top }} className="bg-[#fffbf0] border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                {/* Logo/Title */}
                <TouchableOpacity
                    onPress={() => router.push('/')}
                    className="flex-row items-center gap-3"
                >
                    <LinearGradient
                        colors={['#e07a5f', '#fb7185']}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text style={{ fontFamily: 'Pacifico_400Regular', fontSize: 14, color: 'white', marginTop: 4 }}>WT</Text>
                    </LinearGradient>
                    <View>
                        <Text style={{ fontFamily: 'Pacifico_400Regular', fontSize: 24, color: '#1f2937' }}>
                            WonderTogether
                        </Text>
                        <Text style={{ fontFamily: 'Pacifico_400Regular', fontSize: 12, color: '#e07a5f', marginTop: -4, transform: [{ rotate: '-2deg' }] }}>
                            for couples
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
