import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Edit2, Trash2, Utensils, Heart, Bell, Star, CalendarDays, Plane } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

const eventTypeIcons: any = {
    dinner: Utensils,
    anniversary: Heart,
    reminder: Bell,
    activity: Star,
    other: CalendarDays,
};

const eventTypeColors: any = {
    dinner: '#f97316',
    anniversary: '#ec4899',
    reminder: '#8b5cf6',
    activity: '#06b6d4',
    other: '#6b7280',
};

export default function EventDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<any>(null);
    const [trip, setTrip] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            fetchEvent();
        }
    }, [params.id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const { data: eventData } = await supabase
                .from('events')
                .select('*')
                .eq('id', params.id)
                .single();

            setEvent(eventData);

            // Fetch associated trip if trip_id exists
            if (eventData?.trip_id) {
                const { data: tripData } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('id', eventData.trip_id)
                    .single();
                setTrip(tripData);
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('events').delete().eq('id', params.id);
                        router.back();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    if (!event) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>Event not found</Text>
            </LinearGradient>
        );
    }

    const Icon = eventTypeIcons[event.type] || CalendarDays;
    const eventColor = eventTypeColors[event.type] || '#6b7280';

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
                        <ArrowLeft size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>Event Details</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 20 }}>
                {/* Event Icon & Type */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${eventColor}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Icon size={40} color={eventColor} />
                    </View>
                    <View style={{ backgroundColor: `${eventColor}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: eventColor, textTransform: 'uppercase' }}>
                            {event.type}
                        </Text>
                    </View>
                </View>

                {/* Event Title */}
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 32 }}>
                    {event.name}
                </Text>

                {/* Details Card */}
                <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 20, marginBottom: 20, gap: 16 }}>
                    {/* Date */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={20} color="#6b7280" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Date</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                                {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
                            </Text>
                        </View>
                    </View>

                    {/* Time */}
                    {event.time && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={20} color="#6b7280" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Time</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{event.time}</Text>
                            </View>
                        </View>
                    )}

                    {/* Reminder */}
                    {event.reminder && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fed7aa', alignItems: 'center', justifyContent: 'center' }}>
                                <Bell size={20} color="#ea580c" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>Reminder set</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Associated Trip */}
                {trip && (
                    <TouchableOpacity
                        onPress={() => router.push(`/trip/${trip.id}`)}
                        style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    >
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(224,122,95,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <Plane size={24} color="#e07a5f" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Part of trip</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{trip.destination}</Text>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{trip.country}</Text>
                        </View>
                        <ArrowLeft size={20} color="#9ca3af" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                )}

                {/* Notes */}
                {event.notes && (
                    <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 20, marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>Notes</Text>
                        <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 20 }}>{event.notes}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer Actions */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => router.push(`/event-edit/${event.id}`)}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#e07a5f', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white' }}
                >
                    <Edit2 size={16} color="#e07a5f" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#e07a5f' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleDelete}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white' }}
                >
                    <Trash2 size={16} color="#ef4444" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>Delete</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}
