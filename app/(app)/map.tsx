import { View, Text, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Heart, Plane, Star, MapPin, Calendar, X, ChevronDown } from 'lucide-react-native';
import { format } from 'date-fns';

interface Location {
    id: string;
    name: string;
    country: string;
    emoji: string;
    type: 'visited' | 'planned' | 'bucket';
    date?: string;
    left: number;
    top: number;
    lat?: number;
    lng?: number;
}

type FilterType = 'all' | 'visited' | 'planned' | 'bucket';

// Continent/Region filters
const REGIONS = [
    { id: 'world', name: 'World', emoji: '🌍' },
    { id: 'europe', name: 'Europe', emoji: '🇪🇺' },
    { id: 'asia', name: 'Asia', emoji: '🌏' },
    { id: 'americas', name: 'Americas', emoji: '🌎' },
    { id: 'africa', name: 'Africa', emoji: '🌍' },
    { id: 'oceania', name: 'Oceania', emoji: '🇦🇺' },
];

const countryEmojis: Record<string, string> = {
    France: '🇫🇷', Spain: '🇪🇸', Italy: '🇮🇹', USA: '🇺🇸', Japan: '🇯🇵',
    Greece: '🇬🇷', UK: '🇬🇧', Germany: '🇩🇪', Portugal: '🇵🇹', Iceland: '🇮🇸',
    Thailand: '🇹🇭', Mexico: '🇲🇽', Brazil: '🇧🇷', Australia: '🇦🇺', Canada: '🇨🇦',
    Indonesia: '🇮🇩', Morocco: '🇲🇦', Egypt: '🇪🇬', 'South Africa': '🇿🇦', India: '🇮🇳',
    China: '🇨🇳', Argentina: '🇦🇷', Peru: '🇵🇪', 'New Zealand': '🇳🇿', Vietnam: '🇻🇳',
    'South Korea': '🇰🇷', Turkey: '🇹🇷', Croatia: '🇭🇷', Netherlands: '🇳🇱', Switzerland: '🇨🇭',
};

// Convert lat/lng to percentage position on map
function coordsToPosition(lat: number | null, lng: number | null): { left: string; top: string } {
    if (lat === null || lng === null) {
        return { left: '50%', top: '50%' };
    }
    const left = ((lng + 180) / 360) * 100;
    const top = ((90 - lat) / 180) * 100;
    return { left: `${left}%`, top: `${top}%` };
}

// Default positions for common cities
const cityPositions: Record<string, { left: string; top: string }> = {
    Paris: { left: '48.5%', top: '31%' },
    Barcelona: { left: '47%', top: '35%' },
    Rome: { left: '50%', top: '36%' },
    'New York': { left: '24%', top: '33%' },
    Tokyo: { left: '84%', top: '36%' },
    Reykjavik: { left: '40%', top: '20%' },
    Bali: { left: '77%', top: '53%' },
    Sydney: { left: '87%', top: '68%' },
    London: { left: '48%', top: '28%' },
    Santorini: { left: '53%', top: '38%' },
    Maldives: { left: '65%', top: '52%' },
};

export default function MapScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [couple, setCouple] = useState<any>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

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
                .or(`partner1_id.eq.${user.id}, partner2_id.eq.${user.id} `)
                .single();
            setCouple(coupleData);

            if (coupleData) {
                const mappedLocations: Location[] = [];

                const { data: trips } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('couple_id', coupleData.id);

                const { data: bucketItems } = await supabase
                    .from('bucket_list')
                    .select('*')
                    .eq('couple_id', coupleData.id);

                const { data: memories } = await supabase
                    .from('memories')
                    .select('trip_id')
                    .eq('couple_id', coupleData.id)
                    .not('trip_id', 'is', null);

                const memoryCountByTrip: Record<string, number> = {};
                memories?.forEach((m: any) => {
                    if (m.trip_id) {
                        memoryCountByTrip[m.trip_id] = (memoryCountByTrip[m.trip_id] || 0) + 1;
                    }
                });

                trips?.forEach((trip: any) => {
                    const pos = trip.lat && trip.lng
                        ? coordsToPosition(trip.lat, trip.lng)
                        : cityPositions[trip.destination] || { left: '50%', top: '40%' };

                    const type = trip.status === 'completed' ? 'visited' : 'planned';

                    mappedLocations.push({
                        id: trip.id,
                        name: trip.destination,
                        country: trip.country || '',
                        emoji: countryEmojis[trip.country] || '🌍',
                        left: pos.left,
                        top: pos.top,
                        type,
                        photos: memoryCountByTrip[trip.id] || 0,
                        date: trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined,
                    });
                });

                bucketItems?.forEach((item: any) => {
                    if (item.status === 'wishlist') {
                        const pos = item.lat && item.lng
                            ? coordsToPosition(item.lat, item.lng)
                            : cityPositions[item.destination] || { left: '50%', top: '40%' };

                        mappedLocations.push({
                            id: item.id,
                            name: item.destination,
                            country: item.country,
                            emoji: countryEmojis[item.country] || '🌍',
                            left: pos.left,
                            top: pos.top,
                            type: 'bucket',
                        });
                    }
                });

                setLocations(mappedLocations);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLocations = filter === 'all'
        ? locations
        : locations.filter(loc => loc.type === filter);

    const stats = {
        visited: locations.filter(l => l.type === 'visited').length,
        planned: locations.filter(l => l.type === 'planned').length,
        bucket: locations.filter(l => l.type === 'bucket').length,
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            {/* Header */}
            <View className="px-4 pt-4 pb-3">
                <View className="flex-row items-center justify-between mb-2">
                    <View>
                        <Text className="text-3xl font-bold text-gray-800">Our Travel Map</Text>
                        <Text className="text-sm text-gray-600 mt-0.5">
                            {stats.visited} visited • {stats.planned} planned • {stats.bucket} dreaming
                        </Text>
                    </View>
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                    className="mt-3"
                >
                    {[
                        { key: 'all' as FilterType, label: 'All', emoji: '🌍', count: locations.length },
                        { key: 'visited' as FilterType, label: 'Visited', emoji: '❤️', count: stats.visited },
                        { key: 'planned' as FilterType, label: 'Planned', emoji: '✈️', count: stats.planned },
                        { key: 'bucket' as FilterType, label: 'Bucket', emoji: '⭐', count: stats.bucket },
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            onPress={() => setFilter(f.key)}
                            className={`px - 5 py - 2.5 rounded - full ${filter === f.key ? 'bg-terracotta' : 'bg-white'
                                } `}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: filter === f.key ? 0.2 : 0.05,
                                shadowRadius: 4,
                                elevation: filter === f.key ? 4 : 1,
                            }}
                        >
                            <Text className={`text - sm font - semibold ${filter === f.key ? 'text-white' : 'text-gray-700'
                                } `}>
                                {f.emoji} {f.label} ({f.count})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Map Container */}
            <View className="flex-1 mx-3 mb-3 bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* World Map Background */}
                <View className="absolute inset-0 p-6 items-center justify-center">
                    <Image
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/2560px-World_map_-_low_resolution.svg.png' }}
                        style={{ width: '100%', height: '100%', opacity: 0.22 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Gradient overlay */}
                <LinearGradient
                    colors={['#fffbf050', '#00000000', '#fff1f250']}
                    className="absolute inset-0 pointer-events-none"
                />

                {/* Location Pins */}
                <View className="absolute inset-0">
                    {filteredLocations.map((location) => (
                        <TouchableOpacity
                            key={location.id}
                            onPress={() => setSelectedLocation(location)}
                            style={{
                                position: 'absolute',
                                left: location.left,
                                top: location.top,
                                transform: [{ translateX: -18 }, { translateY: -18 }],
                            }}
                            activeOpacity={0.7}
                        >
                            {/* Pin Icon */}
                            <View className="items-center justify-center">
                                {location.type === 'visited' && (
                                    <Heart size={36} color="#e07a5f" fill="#e07a5f" />
                                )}
                                {location.type === 'planned' && (
                                    <Plane size={34} color="#f2cc8f" fill="#f2cc8f" />
                                )}
                                {location.type === 'bucket' && (
                                    <Star size={32} color="#81b29a" fill="#81b29a" />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Empty State */}
                {locations.length === 0 && (
                    <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-7xl mb-3">🗺️</Text>
                        <Text className="text-lg font-semibold text-gray-700">No places yet</Text>
                        <Text className="text-sm text-gray-500 mt-1">Start adding your adventures!</Text>
                    </View>
                )}
            </View>

            {/* Selected Location Detail Modal */}
            {selectedLocation && (
                <Modal visible={true} animationType="slide" transparent={true}>
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '50%' }}>
                            <TouchableOpacity
                                onPress={() => setSelectedLocation(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full items-center justify-center z-10"
                            >
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>

                            <View className="flex-row items-start gap-4 mb-5">
                                <View className={`w - 20 h - 20 rounded - 3xl items - center justify - center ${selectedLocation.type === 'visited' ? 'bg-terracotta/20' :
                                    selectedLocation.type === 'planned' ? 'bg-amber-100' :
                                        'bg-emerald-100'
                                    } `}>
                                    <Text className="text-5xl">
                                        {selectedLocation.emoji}
                                    </Text>
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <MapPin size={18} color="#e07a5f" />
                                        <Text className="text-2xl font-bold text-gray-800 flex-1">
                                            {selectedLocation.name}
                                        </Text>
                                    </View>
                                    <Text className="text-base text-gray-600 mb-2">{selectedLocation.country}</Text>

                                    {selectedLocation.type === 'visited' && selectedLocation.photos && (
                                        <View className="flex-row items-center gap-2">
                                            <PhotoIcon size={16} color="#6b7280" />
                                            <Text className="text-sm text-gray-600">
                                                {selectedLocation.photos} photos
                                            </Text>
                                        </View>
                                    )}
                                    {selectedLocation.date && (
                                        <View className="flex-row items-center gap-2 mt-1">
                                            <Calendar size={16} color="#6b7280" />
                                            <Text className="text-sm text-gray-600">
                                                {selectedLocation.date}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                {selectedLocation.type === 'visited' && (
                                    <>
                                        <TouchableOpacity className="flex-1 bg-terracotta rounded-xl px-4 py-4 items-center">
                                            <Text className="text-white font-bold text-base">View Photos</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-4 items-center">
                                            <Text className="text-gray-700 font-bold text-base">Details</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {selectedLocation.type === 'planned' && (
                                    <TouchableOpacity className="flex-1 bg-amber-500 rounded-xl px-4 py-4 items-center">
                                        <Text className="text-white font-bold text-base">View Trip</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedLocation.type === 'bucket' && (
                                    <TouchableOpacity className="flex-1 bg-emerald-500 rounded-xl px-4 py-4 items-center">
                                        <Text className="text-white font-bold text-base">Plan This Trip</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </LinearGradient>
    );
}
