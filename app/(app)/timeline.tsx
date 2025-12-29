import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Calendar, MapPin, Heart, Plane, Camera, Star } from 'lucide-react-native';
import { format, parseISO, compareDesc } from 'date-fns';
import { useGroup } from '../../contexts/GroupContext';
import ImageViewing from "react-native-image-viewing";
interface TimelineEvent {
    id: string;
    type: 'trip' | 'anniversary' | 'milestone' | 'joined';
    date: string;
    title: string;
    description?: string;
    image_url?: string;
    icon: any;
    color: string;
}

export default function TimelineScreen() {
    const router = useRouter();
    const { currentGroup } = useGroup();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<TimelineEvent[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchTimelineData();
        }, [currentGroup])
    );

    const fetchTimelineData = async () => {
        if (!currentGroup) return;

        setLoading(true);
        try {
            const timelineEvents: TimelineEvent[] = [];

            // 1. Anniversary / Start
            if (currentGroup.anniversary_date) {
                timelineEvents.push({
                    id: 'anniversary-start',
                    type: 'anniversary',
                    date: currentGroup.anniversary_date,
                    title: 'Our Journey Began',
                    description: 'The day we started our adventure together ❤️',
                    icon: Heart,
                    color: '#e07a5f',
                });
            } else {
                timelineEvents.push({
                    id: 'joined-app',
                    type: 'joined',
                    date: currentGroup.created_at,
                    title: `Joined ${currentGroup.name}`,
                    description: 'We started planning our future together',
                    icon: Star,
                    color: '#f2cc8f',
                });
            }

            // 2. Fetch Trips
            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .eq('group_id', currentGroup.id)
                .order('start_date', { ascending: false });

            if (trips && trips.length > 0) {
                // Feature: Fetch Cover Photos from Memories
                // 1. Get all trip IDs
                const tripIds = trips.map(t => t.id);

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
                    // Since we iterate in order (fav/newest), the first one we see for a trip is the 'best' one
                    // Only set if not already set
                    if (!coverPhotoMap[photo.trip_id]) {
                        coverPhotoMap[photo.trip_id] = photo.image_url;
                    }
                });

                trips.forEach((trip: any) => {
                    const isPast = new Date(trip.end_date) < new Date();
                    timelineEvents.push({
                        id: `trip-${trip.id}`,
                        type: 'trip',
                        date: trip.start_date,
                        title: trip.destination,
                        description: `${trip.country} • ${format(parseISO(trip.start_date), 'MMM d, yyyy')}`,
                        // Use fetched cover photo, fallback to existing logic if any
                        image_url: trip.cover_image || coverPhotoMap[trip.id],
                        icon: isPast ? MapPin : Plane,
                        color: isPast ? '#2a9d8f' : '#3d405b',
                    });
                });
            }

            // Sort: Newest first
            timelineEvents.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

            setEvents(timelineEvents);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    // Gallery Logic
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Extract all images for the gallery
    const galleryImages = events
        .filter(e => e.image_url)
        .map(e => ({ uri: e.image_url! }));


    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent', zIndex: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Our Story</Text>
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>The chapters of {currentGroup?.name || 'Us'}</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
                <View style={{ position: 'relative', paddingLeft: 16 }}>
                    {/* Vertical Line */}
                    <View style={{ position: 'absolute', left: 19, top: 24, bottom: 0, width: 2, backgroundColor: '#d1d5db' }} />

                    {events.map((event, index) => {
                        const isLast = index === events.length - 1;
                        const EventIcon = event.icon;

                        return (
                            <View key={event.id} style={{ flexDirection: 'row', gap: 16, marginBottom: 32, position: 'relative' }}>
                                {/* Timeline Node */}
                                <View
                                    style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 4, borderColor: '#fffbf0', alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, backgroundColor: event.color }}
                                >
                                    <EventIcon size={16} color="white" />
                                </View>

                                {/* Content Card */}
                                <View style={{ flex: 1 }}>
                                    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 12, color: '#e07a5f', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                {format(parseISO(event.date), 'MMMM yyyy')}
                                            </Text>
                                        </View>

                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>{event.title}</Text>
                                        <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 12 }}>{event.description}</Text>

                                        {event.image_url && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    // Find index in galleryImages
                                                    const imgIndex = galleryImages.findIndex(img => img.uri === event.image_url);
                                                    if (imgIndex !== -1) {
                                                        setCurrentImageIndex(imgIndex);
                                                        setViewerVisible(true);
                                                    }
                                                }}
                                                activeOpacity={0.9}
                                                style={{ height: 128, width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f3f4f6', marginTop: 4 }}
                                            >
                                                <Image
                                                    source={{ uri: event.image_url }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    resizeMode="cover"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {/* Start Node */}
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 4, borderColor: '#fffbf0', backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#9ca3af' }} />
                        </View>
                        <View style={{ paddingTop: 8 }}>
                            <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500', fontStyle: 'italic' }}>And the story continues...</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <ImageViewing
                images={galleryImages}
                imageIndex={currentImageIndex}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
            />
        </LinearGradient>
    );
}
