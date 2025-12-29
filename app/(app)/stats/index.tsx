import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Globe, MapPin, Camera, CalendarDays, Heart, TrendingUp, ArrowLeft, Trophy } from 'lucide-react-native';
import { differenceInDays, differenceInYears } from 'date-fns';
import AchievementNotification from '../../../components/AchievementNotification';
import { getSeenAchievements, getNewlyUnlocked, markAchievementAsSeen, Achievement } from '../../../lib/achievementStorage';
import { isTripCompleted, isTripPlanned } from '../../../lib/tripUtils';

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

    // Achievement notification state
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    // Mark achievements as seen when visiting stats screen
    useFocusEffect(
        React.useCallback(() => {
            const markAllAsSeen = async () => {
                // When user visits stats screen, mark all visible achievements as seen
                const seenIds = await getSeenAchievements();
                // We'll mark them after showing notification
            };
            markAllAsSeen();
        }, [])
    );

    // Check for newly unlocked achievements
    const checkAchievements = async (currentStats: {
        trips: number;
        countries: number;
        photos: number;
        bucketCompleted: number;
        daysTogether: number;
    }) => {
        try {
            // Calculate which achievements are unlocked
            const unlockedAchievements: Achievement[] = [];
            achievementDefinitions.forEach((def) => {
                let progress = 0;
                switch (def.metric) {
                    case 'trips':
                        progress = currentStats.trips;
                        break;
                    case 'countries':
                        progress = currentStats.countries;
                        break;
                    case 'photos':
                        progress = currentStats.photos;
                        break;
                    case 'bucketCompleted':
                        progress = currentStats.bucketCompleted;
                        break;
                    case 'daysTogether':
                        progress = currentStats.daysTogether;
                        break;
                }

                if (progress >= def.target) {
                    unlockedAchievements.push({
                        ...def,
                        progress,
                        unlocked: true,
                    });
                }
            });

            // Get seen achievements
            const seenIds = await getSeenAchievements();
            const newlyUnlocked = getNewlyUnlocked(unlockedAchievements, seenIds);

            if (newlyUnlocked.length > 0) {
                // Add to queue and show first one
                setAchievementQueue(newlyUnlocked);
                setCurrentAchievement(newlyUnlocked[0]);
                setShowNotification(true);
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    };

    // Handle dismissing achievement notification
    const handleDismissAchievement = async () => {
        if (currentAchievement) {
            // Mark as seen
            await markAchievementAsSeen(currentAchievement.id);

            // Hide notification
            setShowNotification(false);

            // Show next achievement in queue after a brief delay
            setTimeout(() => {
                const remainingQueue = achievementQueue.slice(1);
                if (remainingQueue.length > 0) {
                    setCurrentAchievement(remainingQueue[0]);
                    setAchievementQueue(remainingQueue);
                    setShowNotification(true);
                } else {
                    setCurrentAchievement(null);
                    setAchievementQueue([]);
                }
            }, 500);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.replace('/auth/login');
                return;
            }

            // Get user's group
            const { data: groupMember } = await supabase
                .from('group_members')
                .select('group_id, groups(*)')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single();

            if (!groupMember || !groupMember.groups) {
                setLoading(false);
                return;
            }

            const group: any = groupMember.groups;
            setCouple(group);

            // Fetch trips for this group
            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .eq('group_id', group.id);

            // Fetch memories for this group  
            const { data: memories } = await supabase
                .from('memories')
                .select('*')
                .eq('group_id', group.id);

            // Fetch bucket list for this group
            const { data: bucketList } = await supabase
                .from('bucket_list')
                .select('*')
                .eq('group_id', group.id);

            // Fetch events for this group
            const { data: events } = await supabase
                .from('events')
                .select('*')
                .eq('group_id', group.id);

            if (trips) {
                const completed = trips.filter((t: any) => isTripCompleted(t.end_date));
                const planned = trips.filter((t: any) => isTripPlanned(t.end_date));
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

                // Check for newly unlocked achievements
                await checkAchievements({
                    trips: completed.length,
                    countries: countries.length,
                    photos: memories?.length || 0,
                    bucketCompleted: bucketList?.filter((b: any) => b.status === 'completed').length || 0,
                    daysTogether: group.anniversary_date ? differenceInDays(new Date(), new Date(group.anniversary_date)) : 0,
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/profile')} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Journey Stats</Text>
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>
                        {yearsTogether > 0 ? `${yearsTogether}+ years` : `${daysTogether} days`} of adventures
                    </Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 16, paddingTop: 10 }}>
                {/* Main Stats Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
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
                <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={16} color="#e07a5f" />
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>Time Traveling Together</Text>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e07a5f' }}>{travelPercentage}%</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                        <LinearGradient
                            colors={['#e07a5f', '#f59e0b']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ height: '100%', width: `${travelPercentage}%` }}
                        />
                    </View>
                    <Text style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 8 }}>
                        {stats.daysAdventuring} days out of {daysTogether} together
                    </Text>
                </View>

                {/* Achievements */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Trophy size={16} color="#e07a5f" />
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Achievements</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#4b5563' }}>
                            {unlockedCount}/{achievements.length} unlocked
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {achievements.map((achievement) => (
                            <View
                                key={achievement.id}
                                style={{ width: '23%', padding: 8, borderRadius: 12, alignItems: 'center', backgroundColor: achievement.unlocked ? 'rgba(224, 122, 95, 0.1)' : '#f3f4f6', opacity: achievement.unlocked ? 1 : 0.5 }}
                            >
                                <Text style={{ fontSize: 30, opacity: achievement.unlocked ? 1 : 0.3 }}>
                                    {achievement.icon}
                                </Text>
                                <Text style={{ fontSize: 9, textAlign: 'center', color: '#1f2937', marginTop: 4, fontWeight: '500' }} numberOfLines={1}>
                                    {achievement.name}
                                </Text>
                                {!achievement.unlocked && (
                                    <View style={{ width: '100%', marginTop: 4 }}>
                                        <View style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                                            <View
                                                style={{ height: '100%', backgroundColor: '#e07a5f', width: `${(achievement.progress / achievement.target) * 100}%` }}
                                            />
                                        </View>
                                        <Text style={{ fontSize: 8, color: '#6b7280', textAlign: 'center', marginTop: 2 }}>
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
                    colors={['rgba(224, 122, 95, 0.1)', 'rgba(129, 178, 154, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Heart size={16} color="#e07a5f" fill="#e07a5f" />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>Fun Facts</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, color: '#4b5563' }}>Longest trip:</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                                {stats.longestTrip > 0 ? `${stats.longestTrip} days` : 'No trips yet'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, color: '#4b5563' }}>Favorite country:</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>{stats.favoriteCountry}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, color: '#4b5563' }}>Bucket list progress:</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                                {stats.bucketListCompleted}/{stats.bucketListTotal} completed
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, color: '#4b5563' }}>Events planned:</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>{stats.eventsCount}</Text>
                        </View>
                        {stats.countriesVisited.length > 0 && (
                            <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: '#d1d5db' }}>
                                <Text style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>Countries visited:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1f2937' }}>
                                    {stats.countriesVisited.join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </ScrollView>

            {/* Achievement Notification Modal */}
            <AchievementNotification
                achievement={currentAchievement}
                visible={showNotification}
                onDismiss={handleDismissAchievement}
            />
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
        <View style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: bgColor }}>
                <Icon size={24} color={color} />
            </View>
            <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#1f2937' }}>{value}</Text>
            <Text style={{ fontSize: 12, color: '#4b5563' }}>{label}</Text>
            {sublabel && <Text style={{ fontSize: 10, color: '#e07a5f', marginTop: 2 }}>{sublabel}</Text>}
        </View>
    );
}
