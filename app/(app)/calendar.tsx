import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, DateData } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Plus, Plane, CalendarDays, MapPin, Clock, Utensils, Heart, Bell, Star, X } from 'lucide-react-native';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';

interface Trip {
    id: string;
    destination: string;
    country: string;
    start_date: string;
    end_date: string;
    status: string;
}

interface Event {
    id: string;
    name: string;
    date: string;
    time: string | null;
    type: string;
    notes: string | null;
    reminder: boolean;
}

const eventTypeIcons: any = {
    dinner: Utensils,
    anniversary: Heart,
    reminder: Bell,
    activity: Star,
    other: CalendarDays,
};

export default function CalendarScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [couple, setCouple] = useState<any>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [markedDates, setMarkedDates] = useState<any>({});
    const [filter, setFilter] = useState<'all' | 'trips' | 'events'>('all');
    const [showAddEvent, setShowAddEvent] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Update marked dates when trips/events change
        const marks: any = {};

        trips.forEach(trip => {
            if (!trip.start_date || !trip.end_date) return;
            const start = parseISO(trip.start_date);
            const end = parseISO(trip.end_date);

            let current = new Date(start);
            while (current <= end) {
                const dateStr = format(current, 'yyyy-MM-dd');
                marks[dateStr] = {
                    ...marks[dateStr],
                    marked: true,
                    dotColor: trip.status === 'completed' ? '#2a9d8f' : '#e07a5f',
                    selected: dateStr === selectedDate,
                    selectedColor: dateStr === selectedDate ? '#e07a5f' : undefined,
                };
                current.setDate(current.getDate() + 1);
            }
        });

        events.forEach(event => {
            const dateStr = event.date;
            marks[dateStr] = {
                ...marks[dateStr],
                marked: true,
                dotColor: marks[dateStr]?.dotColor || '#3d405b',
                selected: dateStr === selectedDate,
                selectedColor: dateStr === selectedDate ? '#e07a5f' : undefined,
            };
        });

        setMarkedDates(marks);
    }, [trips, events, selectedDate]);

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
                const [tripsRes, eventsRes] = await Promise.all([
                    supabase
                        .from('trips')
                        .select('*')
                        .eq('couple_id', coupleData.id)
                        .order('start_date', { ascending: true }),
                    supabase
                        .from('events')
                        .select('*')
                        .eq('couple_id', coupleData.id)
                        .order('date', { ascending: true }),
                ]);

                if (tripsRes.data) setTrips(tripsRes.data);
                if (eventsRes.data) setEvents(eventsRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const upcomingTrips = trips
        .filter(t => t.status === 'planned' && new Date(t.start_date) > new Date())
        .slice(0, 3);

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .slice(0, 3);

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            <ScrollView className="flex-1 px-4 py-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-800">Calendar</Text>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => setShowAddEvent(true)}
                            className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-1 border border-gray-200"
                        >
                            <CalendarDays size={14} color="#e07a5f" />
                            <Text className="text-xs text-gray-700">Event</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/add-trip')}
                            className="bg-terracotta px-3 py-2 rounded-lg flex-row items-center gap-1"
                        >
                            <Plane size={14} color="white" />
                            <Text className="text-xs text-white">Trip</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Pills */}
                <View className="flex-row gap-2 mb-4">
                    {(['all', 'trips', 'events'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-terracotta' : 'bg-gray-200'
                                }`}
                        >
                            <Text className={`text-xs font-medium ${filter === f ? 'text-white' : 'text-gray-600'
                                }`}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calendar */}
                <View className="bg-white rounded-xl shadow mb-4 overflow-hidden">
                    <Calendar
                        markedDates={markedDates}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        theme={{
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#9ca3af',
                            selectedDayBackgroundColor: '#e07a5f',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#e07a5f',
                            dayTextColor: '#1f2937',
                            textDisabledColor: '#d1d5db',
                            dotColor: '#e07a5f',
                            monthTextColor: '#1f2937',
                            textMonthFontWeight: 'bold',
                        }}
                    />
                </View>

                {/* Legend */}
                <View className="flex-row items-center justify-center gap-4 mb-4">
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-sm bg-[#2a9d8f]" />
                        <Text className="text-[10px] text-gray-600">Past Trip</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-sm bg-terracotta" />
                        <Text className="text-[10px] text-gray-600">Upcoming</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-[#3d405b]" />
                        <Text className="text-[10px] text-gray-600">Event</Text>
                    </View>
                </View>

                {/* Upcoming Trips */}
                {(filter === 'all' || filter === 'trips') && (
                    <View className="mb-5">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-bold text-gray-800">Upcoming Trips</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/add-trip')}
                                className="flex-row items-center gap-1"
                            >
                                <Plus size={12} color="#e07a5f" />
                                <Text className="text-xs text-terracotta">Add</Text>
                            </TouchableOpacity>
                        </View>
                        {upcomingTrips.length === 0 ? (
                            <View className="bg-white rounded-xl shadow p-4 items-center">
                                <Plane size={32} color="#d1d5db" />
                                <Text className="text-xs text-gray-600 mt-2">No trips planned yet</Text>
                            </View>
                        ) : (
                            <View className="space-y-2">
                                {upcomingTrips.map((trip) => {
                                    const daysUntil = Math.ceil(
                                        (new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                    );
                                    return (
                                        <TouchableOpacity
                                            key={trip.id}
                                            onPress={() => router.push(`/trip/${trip.id}`)}
                                            className="bg-white rounded-xl shadow overflow-hidden"
                                        >
                                            <View className="flex-row">
                                                <View className="w-16 h-16 bg-terracotta/20 items-center justify-center">
                                                    <Plane size={24} color="#e07a5f" />
                                                </View>
                                                <View className="flex-1 p-2.5">
                                                    <View className="flex-row items-start justify-between">
                                                        <View className="flex-1">
                                                            <Text className="text-sm font-bold text-gray-800">{trip.destination}</Text>
                                                            <View className="flex-row items-center gap-1 mt-0.5">
                                                                <MapPin size={10} color="#9ca3af" />
                                                                <Text className="text-[10px] text-gray-600">{trip.country}</Text>
                                                            </View>
                                                        </View>
                                                        <View className="items-end">
                                                            <Text className="text-base font-bold text-terracotta">{daysUntil}</Text>
                                                            <Text className="text-[9px] text-gray-600">days</Text>
                                                        </View>
                                                    </View>
                                                    <View className="flex-row items-center gap-1 mt-1">
                                                        <Clock size={10} color="#9ca3af" />
                                                        <Text className="text-[10px] text-gray-600">
                                                            {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* Upcoming Events */}
                {(filter === 'all' || filter === 'events') && (
                    <View className="mb-5">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-bold text-gray-800">Upcoming Events</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddEvent(true)}
                                className="flex-row items-center gap-1"
                            >
                                <Plus size={12} color="#e07a5f" />
                                <Text className="text-xs text-terracotta">Add</Text>
                            </TouchableOpacity>
                        </View>
                        {upcomingEvents.length === 0 ? (
                            <View className="bg-white rounded-xl shadow p-4 items-center">
                                <CalendarDays size={32} color="#d1d5db" />
                                <Text className="text-xs text-gray-600 mt-2">No events scheduled</Text>
                            </View>
                        ) : (
                            <View className="space-y-2">
                                {upcomingEvents.map((event) => {
                                    const Icon = eventTypeIcons[event.type] || CalendarDays;
                                    return (
                                        <View key={event.id} className="bg-white rounded-xl shadow p-3 flex-row items-center gap-3">
                                            <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center">
                                                <Icon size={20} color="#e07a5f" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-800">{event.name}</Text>
                                                <Text className="text-[10px] text-gray-600">
                                                    {format(new Date(event.date), 'EEE, MMM d')}
                                                    {event.time && ` at ${event.time}`}
                                                </Text>
                                            </View>
                                            {event.reminder && <Bell size={16} color="#e07a5f" />}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Add Event Modal (Simplified) */}
            <Modal visible={showAddEvent} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-800">Add Event</Text>
                            <TouchableOpacity onPress={() => setShowAddEvent(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-gray-600 mb-4">Event creation coming soon!</Text>
                        <TouchableOpacity
                            onPress={() => setShowAddEvent(false)}
                            className="bg-terracotta rounded-xl px-4 py-3 items-center"
                        >
                            <Text className="text-white font-semibold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
