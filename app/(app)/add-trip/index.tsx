import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plane, MapPin, Calendar as CalendarIcon, CheckCircle2, CircleDashed } from 'lucide-react-native';
import CountryPicker from '../../../components/CountryPicker';
import { COUNTRIES } from '../../../constants/countries';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { useGroup } from '../../../contexts/GroupContext';

export default function AddTripScreen() {
    const router = useRouter();
    const { currentGroup } = useGroup();
    const [loading, setLoading] = useState(false);

    // Form state
    const [destination, setDestination] = useState('');
    const [country, setCountry] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('upcoming');

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

    // No need for fetchCouple useEffect

    const openDatePicker = (mode: 'start' | 'end') => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    const handleDateSelect = (day: DateData) => {
        if (datePickerMode === 'start') {
            setStartDate(day.dateString);
        } else {
            setEndDate(day.dateString);
        }
    };

    const handleSaveTrip = async () => {
        if (!destination.trim() || !country.trim() || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!currentGroup) {
            Alert.alert('Error', 'No active group found');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('trips').insert({
                group_id: currentGroup.id,
                destination: destination.trim(),
                country: country.trim(),
                start_date: startDate,
                end_date: endDate,
                status: 'planned', // Valid values: 'planned', 'bucket_list'
                highlights: [],
                planning: {},
                accommodation: {},
                activities: [],
            });

            if (error) throw error;
            router.back();
        } catch (error) {
            console.error('Error saving trip:', error);
            Alert.alert('Error', 'Failed to save trip');
        } finally {
            setLoading(false);
        }
    };

    const getDayCount = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    const isValid = destination.trim() && country.trim() && startDate && endDate;

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Add New Trip</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Book your travel dates first, plan later</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16, paddingTop: 8 }}>
                    {/* Destination & Country */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>City</Text>
                            <TextInput
                                value={destination}
                                onChangeText={setDestination}
                                placeholder="Paris, Tokyo..."
                                placeholderTextColor="#9ca3af"
                                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, color: '#1f2937', backgroundColor: 'white' }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>Country</Text>
                            <CountryPicker
                                countries={COUNTRIES}
                                selectedCountry={country}
                                onSelect={setCountry}
                                placeholder="Select"
                            />
                        </View>
                    </View>

                    {/* Dates */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>Start Date</Text>
                            <TouchableOpacity
                                onPress={() => openDatePicker('start')}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' }}
                            >
                                <Text style={{ fontSize: 14, color: startDate ? '#1f2937' : '#9ca3af' }}>
                                    {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Select date'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>End Date</Text>
                            <TouchableOpacity
                                onPress={() => openDatePicker('end')}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' }}
                            >
                                <Text style={{ fontSize: 14, color: endDate ? '#1f2937' : '#9ca3af' }}>
                                    {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Select date'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Status Toggle */}
                    {/* Status Toggle */}
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Trip Status</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setStatus('planned')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 16,
                                    paddingHorizontal: 12,
                                    borderRadius: 16,
                                    backgroundColor: status === 'planned' ? 'white' : 'rgba(255,255,255,0.5)',
                                    borderWidth: 2,
                                    borderColor: status === 'planned' ? '#e07a5f' : 'transparent',
                                    alignItems: 'center',
                                    shadowColor: status === 'planned' ? '#e07a5f' : 'transparent',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: status === 'planned' ? 4 : 0
                                }}
                            >
                                <CircleDashed size={24} color={status === 'planned' ? '#e07a5f' : '#9ca3af'} style={{ marginBottom: 8 }} />
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: status === 'planned' ? '700' : '500',
                                    color: status === 'planned' ? '#e07a5f' : '#6b7280'
                                }}>
                                    Planned
                                </Text>
                                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Ideally, maybe</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setStatus('confirmed')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 16,
                                    paddingHorizontal: 12,
                                    borderRadius: 16,
                                    backgroundColor: status === 'confirmed' ? 'white' : 'rgba(255,255,255,0.5)',
                                    borderWidth: 2,
                                    borderColor: status === 'confirmed' ? '#81b29a' : 'transparent',
                                    alignItems: 'center',
                                    shadowColor: status === 'confirmed' ? '#81b29a' : 'transparent',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: status === 'confirmed' ? 4 : 0
                                }}
                            >
                                <CheckCircle2 size={24} color={status === 'confirmed' ? '#81b29a' : '#9ca3af'} style={{ marginBottom: 8 }} />
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: status === 'confirmed' ? '700' : '500',
                                    color: status === 'confirmed' ? '#81b29a' : '#6b7280'
                                }}>
                                    Confirmed
                                </Text>
                                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>It's happening!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Day Count Preview */}
                    {getDayCount() > 0 && (
                        <View style={{ backgroundColor: 'rgba(224, 122, 95, 0.1)', borderWidth: 1, borderColor: 'rgba(224, 122, 95, 0.2)', borderRadius: 12, padding: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#e07a5f', textAlign: 'center' }}>
                                {getDayCount()} days in {destination || 'your destination'}
                            </Text>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: 'white' }}
                >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSaveTrip}
                    disabled={!isValid || loading}
                    style={{
                        flex: 1,
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: !isValid || loading ? '#d1d5db' : '#e07a5f'
                    }}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Saving...</Text>
                        </>
                    ) : (
                        <>
                            <Plane size={16} color="white" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add Trip</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <Modal transparent animationType="slide" visible={true} onRequestClose={() => setShowDatePicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 32 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>
                                    {datePickerMode === 'start' ? 'Start Date' : 'End Date'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#e07a5f' }}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <Calendar
                                current={datePickerMode === 'start' ? (startDate || new Date().toISOString().split('T')[0]) : (endDate || new Date().toISOString().split('T')[0])}
                                onDayPress={handleDateSelect}
                                minDate={datePickerMode === 'end' && startDate ? startDate : undefined}
                                markedDates={{
                                    [startDate]: { selected: true, selectedColor: '#e07a5f' },
                                    [endDate]: { selected: true, selectedColor: '#e07a5f' }
                                }}
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
                                    arrowColor: '#e07a5f',
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </LinearGradient>
    );
}
