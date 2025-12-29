import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAutoTripStatus } from '../../../lib/tripUtils';
import { ArrowLeft, MapPin, Plane } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useGroup } from '../../../contexts/GroupContext';

const { width } = Dimensions.get('window');

interface Trip {
    id: string;
    destination: string;
    country: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string;
    cover_image?: string; // Optional cover image
}

export default function TripsListScreen() {
    const router = useRouter();
    const { currentGroup } = useGroup();
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState<Trip[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchTrips();
        }, [])
    );

    const fetchTrips = async () => {
        setLoading(true);
        try {
            if (currentGroup) {
                const { data: tripsData, error } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('group_id', currentGroup.id)
                    .order('start_date', { ascending: false });

                if (error) throw error;

                if (tripsData && tripsData.length > 0) {
                    // Feature: Fetch Cover Photos from Memories
                    // 1. Get all trip IDs
                    const tripIds = tripsData.map(t => t.id);

                    // 2. Fetch relevant memories (favorites first, then latest)
                    const { data: tripPhotos } = await supabase
                        .from('memories')
                        .select('trip_id, image_url, is_favorite, taken_at')
                        .in('trip_id', tripIds)
                        .order('is_favorite', { ascending: false }) // Favorites first
                        .order('taken_at', { ascending: false });   // Then newest

                    // 3. Map trip_id -> best photo URL
                    const coverPhotoMap: Record<string, string> = {};
                    tripPhotos?.forEach((photo: any) => {
                        if (!coverPhotoMap[photo.trip_id]) {
                            coverPhotoMap[photo.trip_id] = photo.image_url;
                        }
                    });

                    // 4. Merge into trips
                    const enrichedTrips = tripsData.map(trip => ({
                        ...trip,
                        // Priority: Manual Cover (DB) -> Auto Cover (Best Memory) -> Placeholder
                        cover_image: trip.cover_image || coverPhotoMap[trip.id]
                    }));

                    setTrips(enrichedTrips);
                } else {
                    setTrips([]);
                }
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
            Alert.alert('Error', 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    // Group trips by year
    const groupedTrips = trips.reduce((acc: { [key: string]: Trip[] }, trip) => {
        const year = format(parseISO(trip.start_date), 'yyyy');
        if (!acc[year]) acc[year] = [];
        acc[year].push(trip);
        return acc;
    }, {});

    const years = Object.keys(groupedTrips).sort((a, b) => parseInt(b) - parseInt(a));

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3d405b', textTransform: 'uppercase', letterSpacing: 1 }}>My Journey</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {years.length === 0 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                        <Text style={{ fontSize: 16, color: '#6b7280' }}>No trips found yet.</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/add-trip')}
                            style={{ marginTop: 20, backgroundColor: '#e07a5f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Start Your Journey</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 0 }}>
                        {years.map((year, yearIndex) => (
                            <View key={year}>
                                {/* Year Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: yearIndex === 0 ? 0 : 40 }}>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#e07a5f' }}>{year}</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#e07a5f', marginLeft: 16, opacity: 0.3 }} />
                                </View>

                                {/* Trips for Year */}
                                <View style={{ paddingLeft: 40, paddingRight: 20 }}>
                                    {/* Vertical Timeline Line */}
                                    <View style={{ position: 'absolute', left: 20, top: 0, bottom: -40, width: 2, backgroundColor: '#e07a5f', opacity: 0.2 }} />

                                    {groupedTrips[year].map((trip, index) => {
                                        const isCompleted = getAutoTripStatus(trip.end_date) === 'completed';
                                        return (
                                            <TouchableOpacity
                                                key={trip.id}
                                                onPress={() => router.push(`/trip/${trip.id}`)}
                                                activeOpacity={0.9}
                                                style={{ marginBottom: 32 }}
                                            >
                                                {/* Timeline Node */}
                                                <View style={{ position: 'absolute', left: -29, top: 20, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 4, borderColor: '#e07a5f', zIndex: 5 }} />

                                                {/* Card */}
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    borderRadius: 24,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 10 },
                                                    shadowOpacity: 0.08,
                                                    shadowRadius: 20,
                                                    elevation: 5,
                                                    overflow: 'hidden'
                                                }}>
                                                    {/* Image or Gradient */}
                                                    <View style={{ height: 180, width: '100%', backgroundColor: '#eee' }}>
                                                        {trip.cover_image ? (
                                                            <Image source={{ uri: trip.cover_image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                        ) : (
                                                            <LinearGradient
                                                                colors={['#e07a5f', '#f2cc8f']}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 1 }}
                                                                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Plane size={48} color="white" />
                                                            </LinearGradient>
                                                        )}
                                                        {/* Status Badge overlay */}
                                                        {isCompleted && (
                                                            <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' }}>Completed</Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Content */}
                                                    <View style={{ padding: 20 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                            <MapPin size={14} color="#e07a5f" />
                                                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#e07a5f', textTransform: 'uppercase' }}>{trip.country}</Text>
                                                        </View>
                                                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>{trip.destination}</Text>
                                                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                                            {format(parseISO(trip.start_date), 'MMM d')} - {format(parseISO(trip.end_date), 'MMM d')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating FAB for Add */}
            <TouchableOpacity
                onPress={() => router.push('/add-trip')}
                style={{
                    position: 'absolute',
                    bottom: 30,
                    right: 20,
                    backgroundColor: '#1f2937',
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#e07a5f',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                }}
            >
                <Plane size={24} color="white" />
            </TouchableOpacity>
        </LinearGradient>
    );
}
