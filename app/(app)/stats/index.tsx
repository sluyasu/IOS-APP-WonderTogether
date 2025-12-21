import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { Globe, MapPin, Camera, CalendarDays, Heart, TrendingUp, ArrowLeft, Trophy } from 'lucide-react-native';
import { differenceInDays, differenceInYears } from 'date-fns';

const achievementDefinitions = [
    { id: 'first-trip', name: 'First Trip', icon: '✈️', target: 1, metric: 'trips' },
    { id: 'globetrotter', name: 'Globetrotter', icon: '🌍', target: 5, metric: 'countries' },
    { id: 'memory-maker', name: 'Memory Maker', icon: '📸', target: 50, metric: 'photos' },
    { id: 'adventurer', name: 'Adventurer', icon: '🏔️', target: 10, metric: 'trips' },
    { id: 'world-explorer', name: 'World Explorer', icon: '🗺️', target: 10, metric: 'countries' },
    { id: 'bucket-crusher', name: 'Bucket Crusher', icon: '✅', target: 5, metric: 'bucketCompleted' },
    { id: 'photo-pro', name: 'Photo Pro', icon: '🎞️', target: 100, metric: 'photos' },
    { id: 'year-together', name: '1 Year', icon: '💕', target: 365, metric: 'daysTogether' },
];

export default function StatsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [couple, setCouple] = useState<any>(null);
    const [stats, setStats] = useState({
        tripsCompleted: 0,
        tripsPlanned: 0,
        countriesVisited: [] as string[],
        photosCount: 0,
        daysAdventuring: 0,
        bucketListTotal: 0,
        bucketListCompleted: 0,
        eventsCount: 0,
        longestTrip: 0,
        favoriteCountry: 'None yet',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/auth/login');
                return;
            }

            const { data: coupleData } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .single();
            setCouple(coupleData);

            if (coupleData) {
                const { data: trips } = await supabase.from('trips').select('*').eq('couple_id', coupleData.id);
                const { data: memories } = await supabase.from('memories').select('*').eq('couple_id', coupleData.id);
                const { data: bucketList } = await supabase.from('bucket_list').select('*').eq('couple_id', coupleData.id);
                const { data: events } = await supabase.from('events').select('*').eq('couple_id', coupleData.id);

                if (trips) {
                    const completed = trips.filter((t: any) => t.status === 'completed');
                    const planned = trips.filter((t: any) => t.status === 'planned' || t.status === 'confirmed');
                    const countries = [...new Set(trips.map((t: any) => t.country).filter(Boolean))];

                    let totalDays = 0;
                    let longestTrip = 0;
                    completed.forEach((trip: any) => {
                        const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;
                        totalDays += days;
                        if (days > longestTrip) longestTrip = days;
                    });

                    const countryCount: Record<string, number> = {};
                    trips.forEach((t: any) => {
                        if (t.country) {
                            countryCount[t.country] = (countryCount[t.country] || 0) + 1;
                        }
                    });
                    const favoriteCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

                    setStats({
                        tripsCompleted: completed.length,
                        tripsPlanned: planned.length,
                        countriesVisited: countries,
                        photosCount: memories?.length || 0,
                        daysAdventuring: totalDays,
                        bucketListTotal: bucketList?.length || 0,
                        bucketListCompleted: bucketList?.filter((b: any) => b.status === 'completed').length || 0,
                        eventsCount: events?.length || 0,
                        longestTrip,
                        favoriteCountry,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    const relationshipStart = couple?.anniversary_date || new Date().toISOString();
    const daysTogether = differenceInDays(new Date(), new Date(relationshipStart));
    const yearsTogether = differenceInYears(new Date(), new Date(relationshipStart));
    const travelPercentage = daysTogether > 0 ? Math.round((stats.daysAdventuring / daysTogether) * 100) : 0;

    const achievements = achievementDefinitions.map((def) => {
        let progress = 0;
        switch (def.metric) {
            case 'trips':
                progress = stats.tripsCompleted;
                break;
            case 'countries':
                progress = stats.countriesVisited.length;
                break;
            case 'photos':
                progress = stats.photosCount;
                break;
            case 'bucketCompleted':
                progress = stats.bucketListCompleted;
                break;
            case 'daysTogether':
                progress = daysTogether;
                break;
        }
        return {
            ...def,
            progress,
            unlocked: progress >= def.target,
        };
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View>
                    <Text className="text-2xl font-bold text-gray-800">Journey Stats</Text>
                    <Text className="text-xs text-gray-600">
                        {yearsTogether > 0 ? `${yearsTogether}+ years` : `${daysTogether} days`} of adventures
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pb-4">
                {/* Main Stats Grid */}
                <View className="flex-row flex-wrap gap-3 mb-5">
                    <StatCard
                        icon={Globe}
                        value={stats.countriesVisited.length}
                        label="Countries"
                        color="#e07a5f"
                        bgColor="#e07a5f20"
                    />
                    <StatCard
                        icon={MapPin}
                        value={stats.tripsCompleted}
                        label="Trips Taken"
                        sublabel={stats.tripsPlanned > 0 ? `+${stats.tripsPlanned} planned` : undefined}
                        color="#81b29a"
                        bgColor="#81b29a20"
                    />
                    <StatCard
                        icon={Camera}
                        value={stats.photosCount}
                        label="Memories"
                        color="#f2cc8f"
                        bgColor="#f2cc8f30"
                    />
                    <StatCard
                        icon={CalendarDays}
                        value={stats.daysAdventuring}
                        label="Days Exploring"
                        color="#3d405b"
                        bgColor="#3d405b20"
                    />
                </View>

                {/* Travel Percentage */}
                <View className="bg-white rounded-2xl shadow-md p-4 mb-5">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                            <TrendingUp size={16} color="#e07a5f" />
                            <Text className="text-sm font-medium text-gray-800">Time Traveling Together</Text>
                        </View>
                        <Text className="text-2xl font-bold text-terracotta">{travelPercentage}%</Text>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-gradient-to-r from-terracotta to-amber-500"
                            style={{ width: `${travelPercentage}%` }}
                        />
                    </View>
                    <Text className="text-xs text-gray-600 text-center mt-2">
                        {stats.daysAdventuring} days out of {daysTogether} together
                    </Text>
                </View>

                {/* Achievements */}
                <View className="mb-5">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                            <Trophy size={16} color="#e07a5f" />
                            <Text className="text-lg font-bold text-gray-800">Achievements</Text>
                        </View>
                        <Text className="text-xs text-gray-600">
                            {unlockedCount}/{achievements.length} unlocked
                        </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {achievements.map((achievement) => (
                            <View
                                key={achievement.id}
                                className={`w-[23%] p-2 rounded-xl items-center ${achievement.unlocked ? 'bg-terracotta/10' : 'bg-gray-100 opacity-50'
                                    }`}
                            >
                                <Text className={`text-3xl ${achievement.unlocked ? '' : 'opacity-30'}`}>
                                    {achievement.icon}
                                </Text>
                                <Text className="text-[9px] text-center text-gray-800 mt-1 font-medium" numberOfLines={1}>
                                    {achievement.name}
                                </Text>
                                {!achievement.unlocked && (
                                    <View className="w-full mt-1">
                                        <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <View
                                                className="h-full bg-terracotta"
                                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                            />
                                        </View>
                                        <Text className="text-[8px] text-gray-500 text-center mt-0.5">
                                            {achievement.progress}/{achievement.target}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Fun Facts */}
                <LinearGradient
                    colors={['#e07a5f10', '#81b29a10']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl p-4 shadow"
                >
                    <View className="flex-row items-center gap-2 mb-3">
                        <Heart size={16} color="#e07a5f" fill="#e07a5f" />
                        <Text className="text-base font-bold text-gray-800">Fun Facts</Text>
                    </View>
                    <View className="gap-2">
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-gray-600">Longest trip:</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {stats.longestTrip > 0 ? `${stats.longestTrip} days` : 'No trips yet'}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-gray-600">Favorite country:</Text>
                            <Text className="text-sm font-semibold text-gray-800">{stats.favoriteCountry}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-gray-600">Bucket list progress:</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {stats.bucketListCompleted}/{stats.bucketListTotal} completed
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-gray-600">Events planned:</Text>
                            <Text className="text-sm font-semibold text-gray-800">{stats.eventsCount}</Text>
                        </View>
                        {stats.countriesVisited.length > 0 && (
                            <View className="pt-2 border-t border-gray-300">
                                <Text className="text-xs text-gray-600 mb-1">Countries visited:</Text>
                                <Text className="text-xs font-medium text-gray-800">
                                    {stats.countriesVisited.join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </ScrollView>
        </LinearGradient>
    );
}

interface StatCardProps {
    icon: any;
    value: number;
    label: string;
    sublabel?: string;
    color: string;
    bgColor: string;
}

function StatCard({ icon: Icon, value, label, sublabel, color, bgColor }: StatCardProps) {
    return (
        <View className="w-[48%] bg-white rounded-2xl shadow-md p-4 items-center">
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: bgColor }}>
                <Icon size={24} color={color} />
            </View>
            <Text className="text-3xl font-bold text-gray-800">{value}</Text>
            <Text className="text-xs text-gray-600">{label}</Text>
            {sublabel && <Text className="text-[10px] text-terracotta mt-0.5">{sublabel}</Text>}
        </View>
    );
}
