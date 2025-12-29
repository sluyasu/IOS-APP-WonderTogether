import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Switch, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Utensils, Heart, Bell, Star, CalendarDays, Plus, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const eventTypeIcons: any = {
    dinner: Utensils,
    anniversary: Heart,
    reminder: Bell,
    activity: Star,
    other: CalendarDays,
};

export default function EditEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [eventTime, setEventTime] = useState(new Date());
    const [eventType, setEventType] = useState('activity');
    const [eventNotes, setEventNotes] = useState('');
    const [eventReminder, setEventReminder] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // New Fields
    const [eventIsAllDay, setEventIsAllDay] = useState(false);
    const [eventColor, setEventColor] = useState('#e07a5f');
    const [customTypeName, setCustomTypeName] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);

    const presetColors = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#9c6644'];

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

            if (eventData) {
                setEventName(eventData.name || '');
                setEventDate(new Date(eventData.date));
                if (eventData.time) {
                    const [hours, minutes] = eventData.time.split(':');
                    const time = new Date();
                    time.setHours(parseInt(hours), parseInt(minutes));
                    setEventTime(time);
                }
                // Check if type is standard or custom
                const isStandard = eventTypeIcons[eventData.type];
                if (!isStandard) {
                    setIsCustomType(true);
                    setCustomTypeName(eventData.type);
                    setEventType(eventData.type); // Keep it for now, but UI will show custom input
                } else {
                    setEventType(eventData.type || 'activity');
                    setIsCustomType(false);
                }

                setEventNotes(eventData.notes || '');
                setEventReminder(eventData.reminder || false);
                setEventIsAllDay(eventData.is_all_day || false);
                setEventColor(eventData.color || '#e07a5f');
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!eventName.trim()) {
            Alert.alert('Error', 'Please enter an event name');
            return;
        }

        setSaving(true);
        try {
            // Determine final type
            const finalType = isCustomType ? customTypeName.trim() : eventType;
            // Validate custom
            if (isCustomType && !customTypeName.trim()) {
                Alert.alert('Error', 'Please enter a custom type name');
                return;
            }

            const { error } = await supabase
                .from('events')
                .update({
                    name: eventName.trim(),
                    date: format(eventDate, 'yyyy-MM-dd'),
                    time: eventIsAllDay ? null : format(eventTime, 'HH:mm'),
                    type: finalType,
                    notes: eventNotes.trim() || null,
                    reminder: eventReminder,
                    is_all_day: eventIsAllDay,
                    color: eventColor,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id);

            if (error) throw error;

            router.back(); // Navigate back to event detail
        } catch (error) {
            console.error('Error updating event:', error);
            Alert.alert('Error', 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

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
            <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
                        <ArrowLeft size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>Edit Event</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving} style={{ padding: 8 }}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#e07a5f" />
                        ) : (
                            <Check size={24} color="#e07a5f" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 20 }}>
                {/* Event Name */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Event Name</Text>
                    <TextInput
                        style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                        placeholder="Dinner, Anniversary, etc."
                        value={eventName}
                        onChangeText={setEventName}
                    />
                </View>

                {/* Date & Time */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
                        >
                            <Text style={{ fontSize: 16, color: '#1f2937' }}>{format(eventDate, 'MMM d, yyyy')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Time</Text>
                        {!eventIsAllDay ? (
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
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
                <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Clock size={18} color="#6b7280" />
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>All Day Event</Text>
                    </View>
                    <Switch
                        value={eventIsAllDay}
                        onValueChange={setEventIsAllDay}
                        trackColor={{ false: '#d1d5db', true: '#e07a5f' }}
                        thumbColor="#ffffff"
                    />
                </View>

                {/* Event Type */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 12, textTransform: 'uppercase' }}>Event Type</Text>
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
                                        gap: 8,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 9999,
                                        borderWidth: 1,
                                        backgroundColor: isSelected ? eventColor : 'white',
                                        borderColor: isSelected ? eventColor : '#e5e7eb'
                                    }}
                                >
                                    <Icon size={16} color={isSelected ? 'white' : '#4b5563'} />
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? 'white' : '#4b5563' }}>
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
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 9999,
                                borderWidth: 1,
                                backgroundColor: isCustomType ? eventColor : 'white',
                                borderColor: isCustomType ? eventColor : '#e5e7eb',
                                borderStyle: isCustomType ? 'solid' : 'dashed'
                            }}
                        >
                            <Plus size={16} color={isCustomType ? 'white' : '#4b5563'} />
                            <Text style={{ fontSize: 14, fontWeight: '500', color: isCustomType ? 'white' : '#4b5563' }}>
                                Custom...
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Custom Type Input */}
                    {isCustomType && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Custom Category Name</Text>
                            <TextInput
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                                placeholder="Sasou, Date Night, Flight..."
                                value={customTypeName}
                                onChangeText={setCustomTypeName}
                            />
                        </View>
                    )}

                    {/* Color Picker */}
                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 8, textTransform: 'uppercase' }}>Color Code</Text>
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
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Notes</Text>
                    <TextInput
                        style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, minHeight: 100 }}
                        placeholder="Add details, location, etc."
                        multiline
                        textAlignVertical="top"
                        value={eventNotes}
                        onChangeText={setEventNotes}
                    />
                </View>

                {/* Reminder Switch */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 32 }}>
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

            {/* Date/Time Pickers */}
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
        </LinearGradient>
    );
}
