import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Switch, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, DateData } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Plane, CalendarDays, MapPin, Clock, Utensils, Heart, Bell, Star, X, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react-native';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGroup } from '../../contexts/GroupContext';

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
    is_all_day?: boolean;
    color?: string;
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
    const groupContext = useGroup();
    // Debug log to check context state

    // Safeguard against undefined context
    const currentGroup = groupContext?.currentGroup;

    if (!groupContext) {
        console.error('[Calendar] GroupContext is undefined! Check Provider wrapping.');
    }
    const [loading, setLoading] = useState(true);
    // Remove couple state as we use currentGroup
    const [trips, setTrips] = useState<Trip[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [markedDates, setMarkedDates] = useState<any>({});
    const [filter, setFilter] = useState<'all' | 'trips' | 'events'>('all');

    // Add Event State
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [savingEvent, setSavingEvent] = useState(false);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [eventTime, setEventTime] = useState(new Date());
    const [eventType, setEventType] = useState('activity');
    const [customTypeName, setCustomTypeName] = useState(''); // New state for custom type input
    const [isCustomType, setIsCustomType] = useState(false); // Toggle for custom type flow
    const [eventNotes, setEventNotes] = useState('');
    const [eventReminder, setEventReminder] = useState(false);
    const [eventIsAllDay, setEventIsAllDay] = useState(false);
    const [eventColor, setEventColor] = useState('#e07a5f');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDayTimeline, setShowDayTimeline] = useState(false); // Day Zoom Modal State

    const presetColors = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#9c6644'];

    // Initial fetch on mount
    useEffect(() => {
        fetchData();
    }, [currentGroup]);

    // Refetch when screen comes into focus (e.g., after adding a trip)
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [currentGroup])
    );

    // Update marked dates when trips/events change
    useEffect(() => {
        const newMarkedDates: any = {};

        // 1. Process Trips (Base Layer)
        trips.forEach(trip => {
            if (!trip.start_date || !trip.end_date) return;

            const startDate = parseISO(trip.start_date);
            const endDate = parseISO(trip.end_date);
            const isPast = new Date(trip.end_date) < new Date();
            const color = isPast ? '#2a9d8f' : '#e07a5f';

            let current = new Date(startDate);
            while (current <= endDate) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const isStart = isSameDay(current, startDate);
                const isEnd = isSameDay(current, endDate);

                // Determine trip position type for unambiguous styling
                let position = 'middle';
                if (isStart && isEnd) position = 'single';
                else if (isStart) position = 'start';
                else if (isEnd) position = 'end';

                if (!newMarkedDates[dateStr]) newMarkedDates[dateStr] = { events: [] };

                newMarkedDates[dateStr].trip = {
                    startingDay: isStart,
                    endingDay: isEnd,
                    position: position, // New explicit position property
                    color: color,
                    active: true
                };

                current.setDate(current.getDate() + 1);
            }
        });

        // 2. Process Events (Overlay Layer - Aggregate!)
        events.forEach(event => {
            if (!event.date) return;
            const eventColor = event.color || '#3d405b';

            // Format event date consistently
            const eventDateStr = format(new Date(event.date), 'yyyy-MM-dd');

            if (!newMarkedDates[eventDateStr]) newMarkedDates[eventDateStr] = { events: [] };

            // Push event color to array
            newMarkedDates[eventDateStr].events.push({
                color: eventColor
            });
        });

        // 3. Handle Selected Date
        if (selectedDate) {
            if (!newMarkedDates[selectedDate]) newMarkedDates[selectedDate] = { events: [] };
            newMarkedDates[selectedDate].selected = true;
        }

        setMarkedDates(newMarkedDates);
    }, [trips, events, selectedDate]);

    const fetchData = async () => {
        if (!currentGroup) return;

        setLoading(true);
        try {
            const [tripsRes, eventsRes] = await Promise.all([
                supabase
                    .from('trips')
                    .select('*')
                    .eq('group_id', currentGroup.id)
                    .order('start_date', { ascending: true }),
                supabase
                    .from('events')
                    .select('*')
                    .eq('group_id', currentGroup.id)
                    .order('date', { ascending: true }),
            ]);



            if (tripsRes.data) setTrips(tripsRes.data);
            if (eventsRes.data) setEvents(eventsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddEventModal = () => {
        // Pre-fill date if a day is selected
        if (selectedDate) {
            setEventDate(parseISO(selectedDate));
        } else {
            setEventDate(new Date());
        }
        setShowAddEvent(true);
    };

    const handleAddEvent = async () => {
        if (!eventName.trim()) {
            Alert.alert('Error', 'Please enter an event name');
            return;
        }

        // Validate custom type if selected
        if (isCustomType && !customTypeName.trim()) {
            Alert.alert('Error', 'Please enter a name for your custom event type');
            return;
        }

        if (!currentGroup) return;

        setSavingEvent(true);
        try {
            // Determine final type
            const finalType = isCustomType ? customTypeName.trim() : eventType;

            const { error } = await supabase
                .from('events')
                .insert({
                    group_id: currentGroup.id,
                    name: eventName.trim(),
                    date: format(eventDate, 'yyyy-MM-dd'),
                    time: eventIsAllDay ? null : format(eventTime, 'HH:mm'),
                    type: finalType,
                    notes: eventNotes.trim() || null,
                    reminder: eventReminder,
                    is_all_day: eventIsAllDay,
                    color: eventColor,
                });

            if (error) throw error;

            // Refund/Reload data
            await fetchData();

            // Close and reset
            setShowAddEvent(false);
            setEventName('');
            setEventNotes('');
            setEventReminder(false);
            setEventType('activity');
            setIsCustomType(false);
            setCustomTypeName('');
            setEventIsAllDay(false);
            setEventColor('#e07a5f');

        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'Failed to save event');
        } finally {
            setSavingEvent(false);
        }
    };

    // Date/Time picker handlers
    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setEventDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedDate) {
            setEventTime(selectedDate);
        }
    };

    // Filter Logic
    const upcomingTrips = trips
        .filter(t => t.status === 'planned' && new Date(t.start_date) > new Date())
        .slice(0, 3);

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .slice(0, 3);

    const selectedDayTrips = selectedDate ? trips.filter(trip => {
        const start = parseISO(trip.start_date);
        const end = parseISO(trip.end_date);
        const selected = parseISO(selectedDate);
        // Reset times for date comparison
        const d = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        return d(selected) >= d(start) && d(selected) <= d(end);
    }) : [];

    const selectedDayEvents = selectedDate ? events.filter(event => event.date === selectedDate).sort((a, b) => {
        // Sort by All Day first
        if (a.is_all_day && !b.is_all_day) return -1;
        if (!a.is_all_day && b.is_all_day) return 1;

        // Then by Time
        if (a.time && b.time) return a.time.localeCompare(b.time);

        return 0;
    }) : [];

    const clearSelection = () => {
        setSelectedDate('');
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Calendar</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={openAddEventModal}
                            style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#e5e7eb' }}
                        >
                            <CalendarDays size={14} color="#e07a5f" />
                            <Text style={{ fontSize: 12, color: '#374151' }}>Event</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/add-trip')}
                            style={{ backgroundColor: '#e07a5f', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                            <Plane size={14} color="white" />
                            <Text style={{ fontSize: 12, color: 'white' }}>Trip</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {(['all', 'trips', 'events'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                backgroundColor: filter === f ? '#e07a5f' : '#e5e7eb'
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                color: filter === f ? 'white' : '#4b5563'
                            }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calendar */}
                <View style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                    <Calendar
                        // Remaning just basic settings, we take over rendering
                        monthFormat={'MMMM yyyy'}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        markingType={'custom'}
                        markedDates={markedDates}
                        theme={{
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#9ca3af',
                            textMonthFontWeight: 'bold',
                            monthTextColor: '#1f2937',
                            arrowColor: '#e07a5f',
                            // IMPORTANT: Ensure today text color doesn't conflict
                            todayTextColor: '#e07a5f',
                        }}
                        dayComponent={({ date, state, marking }: { date?: DateData, state?: any, marking?: any }) => {
                            if (!date) return <View />;

                            const isSelected = marking?.selected;
                            const trip = marking?.trip;
                            const dayEvents = marking?.events || [];
                            const isToday = state === 'today';

                            // Text Color Logic
                            const textColor = isSelected ? 'white' : (trip?.active ? 'white' : (isToday ? '#e07a5f' : (state === 'disabled' ? '#d1d5db' : '#1f2937')));

                            return (
                                <TouchableOpacity
                                    onPress={() => setSelectedDate(date.dateString)}
                                    activeOpacity={0.7}
                                    style={{
                                        width: '100%',
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'visible'
                                    }}
                                >
                                    {/* 1. Trip Background Layer (Absolute) */}
                                    {trip?.active && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 4, bottom: 4,
                                            backgroundColor: trip.color,
                                            zIndex: 5,
                                            ...(trip.position === 'start' ? { left: 2, width: '120%', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 } :
                                                trip.position === 'end' ? { right: 2, left: '-20%', width: '120%', borderTopRightRadius: 20, borderBottomRightRadius: 20 } :
                                                    trip.position === 'single' ? { left: 2, right: 2, borderRadius: 20 } :
                                                        { left: '-20%', width: '140%', borderRadius: 0 })
                                        }} />
                                    )}

                                    {/* 2. Selection Ring (Absolute) */}
                                    {isSelected && (
                                        <View style={{
                                            position: 'absolute',
                                            width: 38, height: 38,
                                            borderRadius: 19,
                                            borderWidth: 2,
                                            borderColor: '#1f2937',
                                            zIndex: 10,
                                            backgroundColor: trip?.active ? 'transparent' : '#1f2937'
                                        }} />
                                    )}

                                    {/* 3. Date Text (Relative Center) */}
                                    <View style={{ zIndex: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: isSelected || isToday ? 'bold' : '400',
                                            color: textColor
                                        }}>
                                            {date.day}
                                        </Text>
                                    </View>

                                    {/* 4. Event Dots (Absolute Bottom) */}
                                    {dayEvents.length > 0 && (
                                        <View style={{ position: 'absolute', bottom: 6, flexDirection: 'row', gap: 3, zIndex: 21 }}>
                                            {dayEvents.slice(0, 4).map((evt: any, i: number) => (
                                                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: trip?.active ? 'white' : evt.color }} />
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Legend */}
                {!selectedDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#2a9d8f' }} />
                            <Text style={{ fontSize: 10, color: '#4b5563' }}>Past</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#e07a5f' }} />
                            <Text style={{ fontSize: 10, color: '#4b5563' }}>Future</Text>
                        </View>
                    </View>
                )}

                {/* VIEW FOR SELECTED DATE */}
                {selectedDate ? (
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e07a5f', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>On This Day</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
                                    {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setShowDayTimeline(true)}
                                    style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Maximize2 size={16} color="#e07a5f" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={clearSelection}
                                    style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                >
                                    <ChevronLeft size={14} color="#4b5563" />
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4b5563' }}>View All</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Trips on Selected Day - Robust String Comparison */}
                        {trips.filter(trip =>
                            trip.start_date <= selectedDate && trip.end_date >= selectedDate
                        ).length > 0 && (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Trip in Progress</Text>
                                    {trips.filter(trip =>
                                        trip.start_date <= selectedDate && trip.end_date >= selectedDate
                                    ).map(trip => (
                                        <TouchableOpacity
                                            key={trip.id}
                                            onPress={() => router.push(`/trip/${trip.id}`)}
                                            style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#e07a5f' }}
                                        >
                                            <View style={{ width: 40, height: 40, backgroundColor: 'rgba(224,122,95,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                                <Plane size={20} color="#e07a5f" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>{trip.destination}</Text>
                                                <Text style={{ fontSize: 12, color: '#4b5563' }}>{trip.country}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                        {/* Events on Selected Day */}
                        {selectedDayEvents.length > 0 && (filter === 'all' || filter === 'events') ? (
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Scheduled Events</Text>
                                {selectedDayEvents.map((event) => {
                                    const isCustom = !eventTypeIcons[event.type];
                                    const Icon = eventTypeIcons[event.type] || Star; // Use Star for custom types by default
                                    const displayColor = event.color || '#e07a5f';
                                    return (
                                        <TouchableOpacity key={event.id} onPress={() => router.push(`/event/${event.id}`)} activeOpacity={0.7}>
                                            <View style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderLeftWidth: 4, borderLeftColor: displayColor }}>
                                                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: `${displayColor}15`, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                                                    <Icon size={20} color={displayColor} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>{event.name}</Text>
                                                        {event.is_all_day ? (
                                                            <View style={{ backgroundColor: `${displayColor}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 10, fontWeight: '600', color: displayColor }}>ALL DAY</Text>
                                                            </View>
                                                        ) : event.time ? (
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9fafb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                                                <Clock size={10} color="#6b7280" />
                                                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#4b5563' }}>{event.time?.slice(0, 5)}</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                    {event.notes && (
                                                        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 16 }}>{event.notes}</Text>
                                                    )}
                                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                                        <View style={{ backgroundColor: `${displayColor}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '500', color: displayColor, textTransform: 'uppercase' }}>{event.type}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            // No events empty state (only show if also no trips, or specifically filtered to events)
                            (!selectedDayTrips.length || filter === 'events') && (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db' }}>
                                    <Text style={{ color: '#9ca3af', fontWeight: '500', marginBottom: 8 }}>No plans for this day</Text>
                                    <TouchableOpacity
                                        onPress={openAddEventModal}
                                        style={{ backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(224,122,95,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 }}
                                    >
                                        <Text style={{ color: '#e07a5f', fontWeight: 'bold', fontSize: 12 }}>+ Add Event</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        )}
                    </View>
                ) : (
                    // DEFAULT VIEW (Upcoming)
                    <>
                        {/* Upcoming Trips */}
                        {(filter === 'all' || filter === 'trips') && (
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>Upcoming Trips</Text>
                                    <TouchableOpacity
                                        onPress={() => router.push('/add-trip')}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Plus size={12} color="#e07a5f" />
                                        <Text style={{ fontSize: 12, color: '#e07a5f' }}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                                {upcomingTrips.length === 0 ? (
                                    <View style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 16, alignItems: 'center' }}>
                                        <Plane size={32} color="#d1d5db" />
                                        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>No trips planned yet</Text>
                                    </View>
                                ) : (
                                    <View style={{ gap: 8 }}>
                                        {upcomingTrips.map((trip) => {
                                            const daysUntil = Math.ceil(
                                                (new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={trip.id}
                                                    onPress={() => router.push(`/trip/${trip.id}`)}
                                                    style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: 'hidden' }}
                                                >
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <View style={{ width: 64, height: 64, backgroundColor: 'rgba(224,122,95,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Plane size={24} color="#e07a5f" />
                                                        </View>
                                                        <View style={{ flex: 1, padding: 10 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>{trip.destination}</Text>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                                        <MapPin size={10} color="#9ca3af" />
                                                                        <Text style={{ fontSize: 10, color: '#4b5563' }}>{trip.country}</Text>
                                                                    </View>
                                                                </View>
                                                                <View style={{ alignItems: 'flex-end' }}>
                                                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#e07a5f' }}>{daysUntil}</Text>
                                                                    <Text style={{ fontSize: 9, color: '#4b5563' }}>days</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                                <Clock size={10} color="#9ca3af" />
                                                                <Text style={{ fontSize: 10, color: '#4b5563' }}>
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
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>Upcoming Events</Text>
                                    <TouchableOpacity
                                        onPress={openAddEventModal}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Plus size={12} color="#e07a5f" />
                                        <Text style={{ fontSize: 12, color: '#e07a5f' }}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                                {upcomingEvents.length === 0 ? (
                                    <View style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 16, alignItems: 'center' }}>
                                        <CalendarDays size={32} color="#d1d5db" />
                                        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>No events scheduled</Text>
                                    </View>
                                ) : (
                                    <View style={{ gap: 12 }}>
                                        {upcomingEvents.map((event) => {
                                            const Icon = eventTypeIcons[event.type] || Star;
                                            const eventDate = new Date(event.date);
                                            const eventColor = event.color || '#e07a5f';

                                            return (
                                                <TouchableOpacity key={event.id} onPress={() => router.push(`/event/${event.id}`)} activeOpacity={0.9}>
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        {/* Date Badge */}
                                                        <View style={{ alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 4, width: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, justifyContent: 'center' }}>
                                                            <Text style={{ fontSize: 10, color: eventColor, fontWeight: 'bold', textTransform: 'uppercase' }}>{format(eventDate, 'MMM')}</Text>
                                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>{format(eventDate, 'd')}</Text>
                                                            <Text style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase' }}>{format(eventDate, 'EEE')}</Text>
                                                        </View>

                                                        {/* Event Card */}
                                                        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: eventColor }}>
                                                            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: `${eventColor}15`, alignItems: 'center', justifyContent: 'center' }}>
                                                                <Icon size={20} color={eventColor} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>{event.name}</Text>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                                    {event.is_all_day ? (
                                                                        <View style={{ backgroundColor: `${eventColor}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                            <Text style={{ fontSize: 10, fontWeight: '600', color: eventColor }}>ALL DAY</Text>
                                                                        </View>
                                                                    ) : event.time ? (
                                                                        <Text style={{ fontSize: 11, color: '#4b5563' }}>{event.time?.slice(0, 5)}</Text>
                                                                    ) : null}
                                                                </View>
                                                            </View>
                                                            {event.reminder && <Bell size={14} color="#9ca3af" />}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Add Event Modal */}
            <Modal visible={showAddEvent} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', width: '100%' }}>
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <TouchableOpacity onPress={() => setShowAddEvent(false)} style={{ padding: 8 }}>
                                <Text style={{ color: '#6b7280' }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>New Event</Text>
                            <TouchableOpacity onPress={handleAddEvent} disabled={savingEvent} style={{ padding: 8 }}>
                                {savingEvent ? (
                                    <ActivityIndicator size="small" color="#e07a5f" />
                                ) : (
                                    <Text style={{ color: '#e07a5f', fontWeight: 'bold' }}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1, padding: 24 }}>
                            {/* Basics */}
                            <View style={{ gap: 16, marginBottom: 24 }}>
                                <View>
                                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Event Name</Text>
                                    <TextInput
                                        style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                                        placeholder="Dinner, Anniversary, etc."
                                        value={eventName}
                                        onChangeText={setEventName}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Date</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker(true)}
                                            style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
                                        >
                                            <Text style={{ fontSize: 16, color: '#1f2937' }}>{format(eventDate, 'MMM d, yyyy')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Time</Text>
                                        {!eventIsAllDay ? (
                                            <TouchableOpacity
                                                onPress={() => setShowTimePicker(true)}
                                                style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
                                            >
                                                <Text style={{ fontSize: 16, color: '#1f2937' }}>{format(eventTime, 'HH:mm')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', opacity: 0.7 }}>
                                                <Text style={{ fontSize: 16, color: '#9ca3af' }}>-- : --</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* All Day Toggle Row */}
                                <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Clock size={16} color="#6b7280" />
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>All Day Event</Text>
                                    </View>
                                    <Switch
                                        value={eventIsAllDay}
                                        onValueChange={setEventIsAllDay}
                                        trackColor={{ false: '#d1d5db', true: '#e07a5f' }}
                                        thumbColor="#ffffff"
                                    />
                                </View>
                            </View>

                            {/* Type & Color Selection */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 12, textTransform: 'uppercase' }}>Event Style</Text>

                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {Object.keys(eventTypeIcons).map((type) => {
                                        const Icon = eventTypeIcons[type];
                                        const isSelected = !isCustomType && eventType === type;
                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => {
                                                    setEventType(type);
                                                    setIsCustomType(false);
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 9999,
                                                    borderWidth: 1,
                                                    backgroundColor: isSelected ? eventColor : 'white',
                                                    borderColor: isSelected ? eventColor : '#e5e7eb'
                                                }}
                                            >
                                                <Icon size={14} color={isSelected ? 'white' : '#4b5563'} />
                                                <Text style={{ fontSize: 12, fontWeight: '500', color: isSelected ? 'white' : '#4b5563' }}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* Custom Toggle Box */}
                                    <TouchableOpacity
                                        onPress={() => setIsCustomType(true)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 9999,
                                            borderWidth: 1,
                                            backgroundColor: isCustomType ? eventColor : 'white',
                                            borderColor: isCustomType ? eventColor : '#e5e7eb',
                                            borderStyle: isCustomType ? 'solid' : 'dashed'
                                        }}
                                    >
                                        <Plus size={14} color={isCustomType ? 'white' : '#4b5563'} />
                                        <Text style={{ fontSize: 12, fontWeight: '500', color: isCustomType ? 'white' : '#4b5563' }}>
                                            Custom...
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Custom Type Input - Only if Selected */}
                                {isCustomType && (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Custom Category Name</Text>
                                        <TextInput
                                            style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                                            placeholder="Sasou, Date Night, Flight..."
                                            value={customTypeName}
                                            onChangeText={setCustomTypeName}
                                            autoFocus
                                        />
                                    </View>
                                )}

                                <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Color Code</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                    {presetColors.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            onPress={() => setEventColor(color)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: color,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 2,
                                                borderColor: eventColor === color ? 'white' : 'transparent',
                                                shadowColor: '#000',
                                                shadowOpacity: 0.1,
                                                shadowRadius: 4,
                                                elevation: eventColor === color ? 4 : 0
                                            }}
                                        >
                                            {eventColor === color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Notes */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Notes</Text>
                                <TextInput
                                    style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, minHeight: 100 }}
                                    placeholder="Add details, location, etc."
                                    multiline
                                    textAlignVertical="top"
                                    value={eventNotes}
                                    onChangeText={setEventNotes}
                                />
                            </View>

                            {/* Reminder Switch */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 32 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fed7aa', alignItems: 'center', justifyContent: 'center' }}>
                                        <Bell size={16} color="#ea580c" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>Set Reminder</Text>
                                </View>
                                <Switch
                                    value={eventReminder}
                                    onValueChange={setEventReminder}
                                    trackColor={{ false: '#d1d5db', true: '#e07a5f' }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Embedded Date Picker Logic - Platform Specific */}
                {(showDatePicker || showTimePicker) && (
                    (Platform.OS === 'ios' || Platform.OS === 'web') ? (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 16, zIndex: 50, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 8, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <TouchableOpacity onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
                                    <Text style={{ color: '#e07a5f', fontWeight: 'bold', fontSize: 18 }}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={showDatePicker ? eventDate : eventTime}
                                mode={showDatePicker ? 'date' : 'time'}
                                display="spinner"
                                onChange={(e, date) => {
                                    if (date) {
                                        if (showDatePicker) setEventDate(date);
                                        else setEventTime(date);
                                    }
                                }}
                            />
                        </View>
                    ) : (
                        <DateTimePicker
                            value={showDatePicker ? eventDate : eventTime}
                            mode={showDatePicker ? 'date' : 'time'}
                            display="default"
                            onChange={showDatePicker ? onDateChange : onTimeChange}
                        />
                    )
                )}
            </Modal>

            {/* Day Zoom / Timeline Modal */}
            <Modal visible={showDayTimeline} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                    {/* Header */}
                    <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#e07a5f', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Timeline</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
                                {selectedDate ? format(parseISO(selectedDate), 'EEEE, MMM d') : 'Select a Date'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowDayTimeline(false)} style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 }}>
                            <X size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, padding: 24 }}>
                        {selectedDate && (
                            <>
                                {/* All Day Section */}
                                {selectedDayEvents.some(e => e.is_all_day) && (
                                    <View style={{ marginBottom: 32 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase' }}>All Day</Text>
                                        <View style={{ gap: 8 }}>
                                            {selectedDayEvents.filter(e => e.is_all_day).map(event => {
                                                const Icon = eventTypeIcons[event.type] || Star;
                                                const color = event.color || '#e07a5f';
                                                return (
                                                    <View key={event.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderLeftWidth: 4, borderLeftColor: color }}>
                                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
                                                            <Icon size={16} color={color} />
                                                        </View>
                                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{event.name}</Text>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Timeline Section */}
                                <View style={{ position: 'relative' }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 16, textTransform: 'uppercase' }}>Schedule</Text>

                                    {/* Vertical Line */}
                                    <View style={{ position: 'absolute', left: 23, top: 40, bottom: 0, width: 2, backgroundColor: '#e5e7eb' }} />

                                    <View style={{ gap: 24 }}>
                                        {selectedDayEvents.filter(e => !e.is_all_day).sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((event, index) => {
                                            const Icon = eventTypeIcons[event.type] || Star;
                                            const color = event.color || '#e07a5f';
                                            return (
                                                <View key={event.id} style={{ flexDirection: 'row', gap: 16 }}>
                                                    {/* Time Column */}
                                                    <View style={{ width: 48, alignItems: 'center' }}>
                                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4b5563' }}>{event.time?.slice(0, 5)}</Text>
                                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginTop: 4, borderWidth: 2, borderColor: '#f9fafb', zIndex: 10 }} />
                                                    </View>

                                                    {/* Card */}
                                                    <TouchableOpacity
                                                        onPress={() => { setShowDayTimeline(false); router.push(`/event/${event.id}`); }}
                                                        style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>{event.name}</Text>
                                                            <Icon size={16} color={color} />
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                            <Text style={{ fontSize: 12, color: color, fontWeight: '500', textTransform: 'uppercase' }}>{event.type}</Text>
                                                            {event.notes && (
                                                                <Text numberOfLines={1} style={{ fontSize: 12, color: '#9ca3af', flex: 1 }}>{event.notes}</Text>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}

                                        {selectedDayEvents.filter(e => !e.is_all_day).length === 0 && (
                                            <View style={{ padding: 32, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>No scheduled activities</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Floating Add Button */}
                    <TouchableOpacity
                        onPress={() => { setShowDayTimeline(false); openAddEventModal(); }}
                        style={{ position: 'absolute', bottom: 32, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#e07a5f', alignItems: 'center', justifyContent: 'center', shadowColor: '#e07a5f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </LinearGradient>
    );
}
