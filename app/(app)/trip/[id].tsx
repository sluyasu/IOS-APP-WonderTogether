import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, Edit2, Trash2, Clock } from 'lucide-react-native';
import { format } from 'date-fns';

export default function TripDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            fetchTrip();
        }
    }, [params.id]);

    const fetchTrip = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('trips')
                .select('*')
                .eq('id', params.id)
                .single();
            setTrip(data);
        } catch (error) {
            console.error('Error fetching trip:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Trip',
            'Are you sure you want to delete this trip?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('trips').delete().eq('id', params.id);
                        router.back();
                    },
                },
            ]
        );
    };

    const getDayCount = () => {
        if (!trip?.start_date || !trip?.end_date) return 0;
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    const getDaysUntil = () => {
        if (!trip?.start_date) return 0;
        return Math.ceil((new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    if (!trip) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <Text className="text-gray-600">Trip not found</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-800">{trip.destination}</Text>
                    <Text className="text-sm text-gray-600">{trip.country}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View className="flex-row items-center gap-2 mb-4">
                    <View className={`px-3 py-1 rounded-full ${trip.status === 'completed' ? 'bg-green-100' :
                            trip.status === 'planned' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                        <Text className={`text-xs font-semibold ${trip.status === 'completed' ? 'text-green-700' :
                                trip.status === 'planned' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                            {trip.status === 'completed' ? '✓ Completed' :
                                trip.status === 'planned' ? '📅 Planned' : trip.status}
                        </Text>
                    </View>
                    {trip.status === 'planned' && getDaysUntil() > 0 && (
                        <View className="px-3 py-1 rounded-full bg-terracotta/10">
                            <Text className="text-xs font-semibold text-terracotta">
                                {getDaysUntil()} days away
                            </Text>
                        </View>
                    )}
                </View>

                {/* Trip Info Card */}
                <View className="bg-white rounded-xl shadow p-4 mb-4">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-10 h-10 rounded-lg bg-terracotta/10 items-center justify-center">
                            <Calendar size={20} color="#e07a5f" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-gray-600 mb-1">Duration</Text>
                            <Text className="text-sm font-bold text-gray-800">{getDayCount()} days</Text>
                        </View>
                    </View>

                    <View className="border-t border-gray-100 pt-3 mb-3">
                        <View className="flex-row items-start gap-2 mb-2">
                            <Clock size={14} color="#9ca3af" className="mt-0.5" />
                            <View className="flex-1">
                                <Text className="text-xs text-gray-600 mb-1">Start Date</Text>
                                <Text className="text-sm font-semibold text-gray-800">
                                    {format(new Date(trip.start_date), 'EEEE, MMMM d, yyyy')}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row items-start gap-2">
                            <Clock size={14} color="#9ca3af" className="mt-0.5" />
                            <View className="flex-1">
                                <Text className="text-xs text-gray-600 mb-1">End Date</Text>
                                <Text className="text-sm font-semibold text-gray-800">
                                    {format(new Date(trip.end_date), 'EEEE, MMMM d, yyyy')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="border-t border-gray-100 pt-3">
                        <View className="flex-row items-start gap-2">
                            <MapPin size={14} color="#9ca3af" className="mt-0.5" />
                            <View className="flex-1">
                                <Text className="text-xs text-gray-600 mb-1">Location</Text>
                                <Text className="text-sm font-semibold text-gray-800">
                                    {trip.destination}, {trip.country}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {trip.notes && (
                    <View className="bg-white rounded-xl shadow p-4 mb-4">
                        <Text className="text-sm font-bold text-gray-800 mb-2">Notes</Text>
                        <Text className="text-sm text-gray-700 leading-5">{trip.notes}</Text>
                    </View>
                )}

                {/* Highlights */}
                {trip.highlights && trip.highlights.length > 0 && (
                    <View className="bg-white rounded-xl shadow p-4 mb-4">
                        <Text className="text-sm font-bold text-gray-800 mb-2">Highlights</Text>
                        <View className="gap-2">
                            {trip.highlights.map((highlight: string, index: number) => (
                                <View key={index} className="flex-row items-start gap-2">
                                    <Text className="text-terracotta text-xs mt-0.5">✓</Text>
                                    <Text className="flex-1 text-sm text-gray-700">{highlight}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View className="h-4" />
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-4 py-4 bg-white border-t border-gray-200">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push(`/add-trip?edit=${trip.id}`)}
                        className="flex-1 border border-terracotta rounded-xl px-4 py-3 flex-row items-center justify-center gap-2"
                    >
                        <Edit2 size={16} color="#e07a5f" />
                        <Text className="text-terracotta font-semibold">Edit Trip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleDelete}
                        className="flex-1 border border-red-500 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2"
                    >
                        <Trash2 size={16} color="#ef4444" />
                        <Text className="text-red-500 font-semibold">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}
