import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Calendar } from 'lucide-react-native';
import CountryPicker from '../../../components/CountryPicker';
import { COUNTRIES } from '../../../constants/countries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function AddTripScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form state
    const [destination, setDestination] = useState('');
    const [country, setCountry] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [couple, setCouple] = useState<any>(null);

    // Date picker state
    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

    useEffect(() => {
        fetchCouple();
    }, []);

    const fetchCouple = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .single();
            setCouple(data);
        }
    };

    const handleConfirmStartDate = (event: any, selectedDate?: Date) => {
        setStartDatePickerVisibility(false);
        if (selectedDate) {
            setStartDate(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const handleConfirmEndDate = (event: any, selectedDate?: Date) => {
        setEndDatePickerVisibility(false);
        if (selectedDate) {
            setEndDate(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const handleSaveTrip = async () => {
        if (!destination.trim() || !country.trim() || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await supabase.from('trips').insert({
                couple_id: couple.id,
                destination: destination.trim(),
                country: country.trim(),
                start_date: startDate,
                end_date: endDate,
                status: 'planned',
                notes: notes.trim() || null,
                highlights: [],
            });

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

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-800">Plan a Trip</Text>
                    <Text className="text-xs text-gray-600">Step {step} of 2</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="px-4 mb-4">
                <View className="flex-row gap-2">
                    <View className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-terracotta' : 'bg-gray-300'}`} />
                    <View className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-terracotta' : 'bg-gray-300'}`} />
                </View>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {step === 1 && (
                    <View className="gap-4">
                        <View>
                            <Text className="text-lg font-bold text-gray-800 mb-1">Where are you going?</Text>
                            <Text className="text-xs text-gray-600">Let's start with the basics</Text>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-1 font-medium">Destination *</Text>
                            <TextInput
                                value={destination}
                                onChangeText={setDestination}
                                placeholder="e.g., Barcelona"
                                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white"
                            />
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-1 font-medium">Country *</Text>
                            <CountryPicker
                                countries={COUNTRIES}
                                selectedCountry={country}
                                onSelect={setCountry}
                                placeholder="Select a country"
                            />
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-1 font-medium">Start Date *</Text>
                            <TouchableOpacity
                                onPress={() => setStartDatePickerVisibility(true)}
                                className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
                            >
                                <Text className={startDate ? "text-gray-800" : "text-gray-400"}>
                                    {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Select start date'}
                                </Text>
                                <Calendar size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-1 font-medium">End Date *</Text>
                            <TouchableOpacity
                                onPress={() => setEndDatePickerVisibility(true)}
                                className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
                            >
                                <Text className={endDate ? "text-gray-800" : "text-gray-400"}>
                                    {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Select end date'}
                                </Text>
                                <Calendar size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {getDayCount() > 0 && (
                            <View className="bg-terracotta/10 border border-terracotta/20 rounded-xl p-4 items-center">
                                <Text className="text-sm font-semibold text-terracotta">
                                    📅 {getDayCount()} days in {destination || 'your destination'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {step === 2 && (
                    <View className="gap-4">
                        <View>
                            <Text className="text-lg font-bold text-gray-800 mb-1">Add trip details</Text>
                            <Text className="text-xs text-gray-600">Optional information</Text>
                        </View>

                        <View className="bg-white rounded-xl shadow p-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm font-medium text-gray-700">Destination</Text>
                                <Text className="text-sm font-bold text-gray-800">{destination}</Text>
                            </View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm font-medium text-gray-700">Country</Text>
                                <Text className="text-sm font-bold text-gray-800">{country}</Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-sm font-medium text-gray-700">Duration</Text>
                                <Text className="text-sm font-bold text-terracotta">{getDayCount()} days</Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-1 font-medium">Trip Notes (Optional)</Text>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add any notes about this trip..."
                                multiline
                                numberOfLines={5}
                                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <Text className="text-xs text-blue-800 mb-1 font-semibold">💡 Pro Tip</Text>
                            <Text className="text-xs text-blue-700">
                                After creating this trip, you can add memories, photos, and more details from the trip detail view!
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer Buttons */}
            <View className="px-4 py-4 flex-row gap-3">
                {step > 1 && (
                    <TouchableOpacity
                        onPress={() => setStep(step - 1)}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 items-center"
                    >
                        <Text className="text-gray-700 font-semibold">Back</Text>
                    </TouchableOpacity>
                )}

                {step === 1 ? (
                    <TouchableOpacity
                        onPress={() => setStep(2)}
                        disabled={!destination.trim() || !country.trim() || !startDate || !endDate}
                        className={`flex-1 rounded-xl px-4 py-3 items-center ${!destination.trim() || !country.trim() || !startDate || !endDate
                            ? 'bg-gray-300'
                            : 'bg-terracotta'
                            }`}
                    >
                        <Text className="text-white font-semibold">Next</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handleSaveTrip}
                        disabled={loading}
                        className={`flex-1 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 ${loading ? 'bg-gray-300' : 'bg-terracotta'
                            }`}
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator size="small" color="white" />
                                <Text className="text-white font-semibold">Saving...</Text>
                            </>
                        ) : (
                            <>
                                <Check size={16} color="white" />
                                <Text className="text-white font-semibold">Create Trip</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Date Picker Modals */}
            {isStartDatePickerVisible && (
                <DateTimePicker
                    value={startDate ? new Date(startDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleConfirmStartDate}
                    minimumDate={new Date()}
                />
            )}
            {isEndDatePickerVisible && (
                <DateTimePicker
                    value={endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date())}
                    mode="date"
                    display="default"
                    onChange={handleConfirmEndDate}
                    minimumDate={startDate ? new Date(startDate) : new Date()}
                />
            )}
        </LinearGradient>
    );
}
