import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Camera, Calendar as CalendarIcon, MapPin, Plus, Heart, Edit2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import ImageCropper from '../../components/ImageCropper';

export default function HomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [couple, setCouple] = useState<any>(null);
    const [trips, setTrips] = useState<any[]>([]);
    const [memories, setMemories] = useState<any[]>([]);
    const [stats, setStats] = useState({ countries: 0, trips: 0, photos: 0, days: 0 });
    const [countdown, setCountdown] = useState({ days: 0, hours: 0 });

    // Image cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const nextTrip = trips.find((t) => t.status === "planned");
    const todayMemory = memories.find((m) => m.is_favorite) || memories[0];

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, wait a bit and try again or redirect
                // Ideally this check happens in a context provider or middleware
                return;
            }
            setUser(session.user);

            // Fetch couple data
            const { data: coupleData } = await supabase
                .from("couples")
                .select("*")
                .or(`partner1_id.eq.${session.user.id},partner2_id.eq.${session.user.id}`)
                .single();

            if (coupleData) {
                setCouple(coupleData);

                // Fetch trips
                const { data: tripsData } = await supabase
                    .from("trips")
                    .select("*")
                    .eq("couple_id", coupleData.id)
                    .order("start_date", { ascending: true });

                if (tripsData) {
                    setTrips(tripsData);

                    // Calc stats
                    const completedTrips = tripsData.filter((t: any) => t.status === "completed");
                    const countries = new Set(completedTrips.map((t: any) => t.country)).size;
                    const totalDays = completedTrips.reduce((acc: number, t: any) => {
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

                // Fetch memories
                const { data: memoriesData } = await supabase
                    .from("memories")
                    .select("*")
                    .eq("couple_id", coupleData.id)
                    .order("taken_at", { ascending: false })
                    .limit(10);

                if (memoriesData) {
                    setMemories(memoriesData);
                    setStats(prev => ({ ...prev, photos: memoriesData.length }));
                }
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to upload photos!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // We'll use our custom cropper
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImageUri(result.assets[0].uri);
            setShowCropper(true);
        }
    };

    const handleCropComplete = async (croppedUri: string) => {
        setShowCropper(false);
        setUploading(true);

        try {
            // In a real implementation, you would:
            // 1. Upload the cropped image to Supabase Storage
            // 2. Get the public URL
            // 3. Update the couple record with the new cover_photo_url

            // For now, we'll just update the local state with the URI
            // TODO: Implement Supabase Storage upload
            await supabase
                .from('couples')
                .update({ cover_photo_url: croppedUri })
                .eq('id', couple.id);

            setCouple({ ...couple, cover_photo_url: croppedUri });
        } catch (error) {
            console.error('Error updating cover photo:', error);
        } finally {
            setUploading(false);
            setSelectedImageUri(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (nextTrip) {
            const tripDate = new Date(nextTrip.start_date);
            const now = new Date();
            const days = differenceInDays(tripDate, now);
            const hours = differenceInHours(tripDate, now) % 24;
            setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours) });
        }
    }, [nextTrip]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#fffbf0]">
                <ActivityIndicator size="large" color="#e07a5f" />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            className="flex-1"
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                className="flex-1 px-4"
            >
                {/* Couple Cover Photo - With Image Picker */}
                <View className="rounded-3xl overflow-hidden shadow-2xl mb-4 mt-4">
                    <View className="relative h-64">
                        {couple?.cover_photo_url ? (
                            <Image
                                source={{ uri: couple.cover_photo_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={['#e07a5f', '#f59e88', '#f0b8a0']}
                                className="w-full h-full items-center justify-center"
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Heart size={64} color="white" opacity={0.4} />
                                <Text className="text-white text-base mt-4 font-semibold">Add your couple photo</Text>
                                <Text className="text-white/70 text-xs mt-1">Tap the camera icon to upload</Text>
                            </LinearGradient>
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.75)']}
                            className="absolute inset-0"
                            locations={[0, 0.5, 1]}
                        />

                        {/* Upload Button */}
                        <TouchableOpacity
                            onPress={handlePickImage}
                            disabled={uploading}
                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/30 items-center justify-center backdrop-blur"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 4,
                                elevation: 5,
                            }}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Camera size={24} color="white" />
                            )}
                        </TouchableOpacity>

                        <View className="absolute bottom-0 left-0 right-0 p-6">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Heart size={20} color="white" fill="white" />
                                <Text className="font-serif text-3xl font-bold text-white">
                                    {couple?.couple_name || "You & Your Partner"}
                                </Text>
                            </View>
                            {couple?.anniversary_date && (
                                <Text className="text-white/90 text-sm font-medium">
                                    Together since {format(new Date(couple.anniversary_date), 'MMMM d, yyyy')}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Image Cropper Modal */}
                {showCropper && selectedImageUri && (
                    <ImageCropper
                        visible={showCropper}
                        imageUri={selectedImageUri}
                        onCancel={() => {
                            setShowCropper(false);
                            setSelectedImageUri(null);
                        }}
                        onCropComplete={handleCropComplete}
                        aspectRatio={[16, 9]} // Landscape ratio for cover photo
                    />
                )}


                {/* Next Adventure Card */}
                {nextTrip ? (
                    <TouchableOpacity
                        onPress={() => router.push(`/trip/${nextTrip.id}`)}
                        className="mb-6 active:opacity-90"
                    >
                        <View className="rounded-2xl overflow-hidden shadow-sm bg-white elevation-5">
                            <View className="h-40 bg-gray-200 relative">
                                {nextTrip.cover_image && (
                                    <Image
                                        source={{ uri: nextTrip.cover_image }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                )}
                                <LinearGradient
                                    colors={['transparent', 'rgba(30, 41, 59, 0.8)']}
                                    className="absolute inset-0 justify-end p-4"
                                >
                                    <View className="absolute top-3 left-3 bg-terracotta px-2 py-1 rounded-full">
                                        <Text className="text-white text-[10px] font-bold uppercase">Next Adventure</Text>
                                    </View>
                                    <Text className="text-white font-serif text-xl font-bold">
                                        {nextTrip.destination}, {nextTrip.country}
                                    </Text>
                                    <Text className="text-white/80 text-xs">
                                        {format(new Date(nextTrip.start_date), "MMM d")} - {format(new Date(nextTrip.end_date), "MMM d, yyyy")}
                                    </Text>
                                </LinearGradient>
                            </View>
                            <View className="flex-row py-4 bg-white items-center justify-center">
                                <View className="items-center px-6">
                                    <Text className="text-2xl font-bold text-terracotta font-serif">{countdown.days}</Text>
                                    <Text className="text-[10px] text-gray-400 uppercase font-bold">Days</Text>
                                </View>
                                <View className="w-[1px] h-8 bg-gray-200" />
                                <View className="items-center px-6">
                                    <Text className="text-2xl font-bold text-terracotta font-serif">{countdown.hours}</Text>
                                    <Text className="text-[10px] text-gray-400 uppercase font-bold">Hours</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        className="bg-white p-6 rounded-2xl shadow-sm mb-6 border-dashed border-2 border-gray-200 items-center justify-center py-10"
                        onPress={() => router.push('/add-trip')}
                    >
                        <PlaneIcon size={32} color="#9ca3af" className="mb-2" />
                        <Text className="text-gray-500 font-medium">No details planned yet</Text>
                        <Text className="text-terracotta font-bold mt-2">Plan your first trip</Text>
                    </TouchableOpacity>
                )}

                {/* Stats Grid */}
                <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
                    <TouchableOpacity onPress={() => router.push('/(app)/stats')} className="w-[23%]">
                        <StatCard icon={Globe} value={stats.countries} label="Countries" color="bg-orange-100" iconColor="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(app)/map')} className="w-[23%]">
                        <StatCard icon={MapPin} value={stats.trips} label="Trips" color="bg-rose-100" iconColor="#e11d48" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(app)/memories')} className="w-[23%]">
                        <StatCard icon={Camera} value={stats.photos} label="Photos" color="bg-violet-100" iconColor="#7c3aed" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(app)/calendar')} className="w-[23%]">
                        <StatCard icon={CalendarIcon} value={stats.days} label="Days" color="bg-blue-100" iconColor="#2563eb" />
                    </TouchableOpacity>
                </View>

                {/* Today's Memory */}
                <View className="mb-20">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-serif font-bold text-gray-800 text-lg">Memory of the Day</Text>
                        <TouchableOpacity onPress={() => router.push('/(app)/memories')}>
                            <Text className="text-terracotta text-xs font-bold">See all</Text>
                        </TouchableOpacity>
                    </View>

                    {todayMemory ? (
                        <TouchableOpacity
                            onPress={() => router.push('/(app)/memories')}
                            activeOpacity={0.9}
                        >
                            <View className="bg-white p-3 rounded-2xl shadow-sm pb-4">
                                <View className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                                    {todayMemory.image_url && (
                                        <Image
                                            source={{ uri: todayMemory.image_url }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    )}
                                    {todayMemory.is_favorite && (
                                        <View className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                                            <Heart size={12} color="white" fill="white" />
                                        </View>
                                    )}
                                </View>
                                <View className="items-center">
                                    <Text className="text-gray-800 font-medium text-center">{todayMemory.caption}</Text>
                                    <Text className="text-gray-400 text-xs mt-1">
                                        {todayMemory.location} • {format(new Date(todayMemory.taken_at), "MMM d, yyyy")}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-white/50 p-6 rounded-2xl border border-white items-center justify-center">
                            <Text className="text-gray-400">No memories yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB for New Trip (Using position absolute) */}
            <TouchableOpacity
                onPress={() => router.push('/add-trip')}
                className="absolute bottom-6 right-6 w-14 h-14 bg-terracotta rounded-full items-center justify-center shadow-lg elevation-5"
                activeOpacity={0.8}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}
            >
                <Plus color="white" size={28} />
            </TouchableOpacity>
        </LinearGradient>
    );
}

function StatCard({ icon: Icon, value, label, color, iconColor }: any) {
    return (
        <View className="bg-white rounded-2xl p-2 items-center shadow-sm">
            <View className={`w-8 h-8 rounded-full ${color} items-center justify-center mb-2`}>
                <Icon size={16} color={iconColor} />
            </View>
            <Text className="font-serif font-bold text-lg text-gray-800">{value}</Text>
            <Text className="text-[9px] text-gray-400 uppercase font-bold text-center">{label}</Text>
        </View>
    );
}

// Placeholder for PlaneIcon since it wasn't imported
function PlaneIcon({ size, color, style, className }: any) {
    return <MapPin size={size} color={color} />; // Fallback
}
