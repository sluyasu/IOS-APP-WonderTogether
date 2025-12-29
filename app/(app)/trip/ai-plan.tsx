import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Sparkles, Utensils, Heart, Palmtree, Landmark, Check } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

// Temporary fallback if env var issue
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export default function AIPlanScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Trip context
    const tripId = params.tripId as string;

    // Initial State from params or default
    const [destination, setDestination] = useState(params.destination as string || '');
    const [duration, setDuration] = useState(params.duration as string || '3'); // Fallback duration if calculation fails

    // Preferences
    const [budget, setBudget] = useState<'Budget' | 'Standard' | 'Luxury'>('Standard');
    const [vibe, setVibe] = useState<'Romantic' | 'Adventure' | 'Relaxed' | 'Cultural' | 'Foodie'>('Romantic');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (!tripId) {
            Alert.alert('Error', 'No trip ID provided');
            router.back();
            return;
        }

        // If we didn't receive destination/dates via params, fetch them
        if (!destination) {
            fetchTripDetails();
        }
    }, [tripId]);

    const fetchTripDetails = async () => {
        const { data, error } = await supabase
            .from('trips')
            .select('destination, start_date, end_date')
            .eq('id', tripId)
            .single();

        if (data) {
            setDestination(data.destination);
            if (data.start_date && data.end_date) {
                const start = new Date(data.start_date);
                const end = new Date(data.end_date);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setDuration(diffDays.toString());
            }
        }
    };

    const generateItinerary = async () => {
        if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
            Alert.alert('Configuration Error', 'OpenAI API Key is missing from .env');
            return;
        }

        setLoading(true);
        try {
            const prompt = `
                Act as a travel expert. Plan a ${duration}-day trip to ${destination} for a couple.
                Vibe: ${vibe}. Budget: ${budget}.
                
                Return ONLY valid JSON with this structure:
                {
                    "summary": "A short, exciting summary of what to expect (max 2 sentences).",
                    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
                    "notes": "A detailed day-by-day plan. Format: 'Day 1: ... \\nDay 2: ...'"
                }
            `;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const aiContent = data.choices[0].message.content;
            const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleanJson);

            setResult(parsedResult);

        } catch (error: any) {
            console.error('AI Error:', error);
            Alert.alert('AI Planning Failed', error.message || 'Could not generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const savePlan = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    notes: result.notes,
                    highlights: result.highlights
                })
                .eq('id', tripId);

            if (error) throw error;

            Alert.alert('Success', 'Itinerary saved to your trip!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Save Error:', error);
            Alert.alert('Error', 'Failed to save itinerary.');
        } finally {
            setSaving(false);
        }
    };

    const VibeItem = ({ label, icon: Icon, value }: any) => (
        <TouchableOpacity
            onPress={() => setVibe(value)}
            className={`items-center justify-center p-3 rounded-2xl border-2 flex-1 min-w-[30%] mb-3 ${vibe === value ? 'border-terracotta bg-terracotta/10' : 'border-gray-100 bg-white'}`}
        >
            <Icon size={24} color={vibe === value ? '#e07a5f' : '#9ca3af'} />
            <Text className={`text-xs mt-2 font-medium ${vibe === value ? 'text-terracotta' : 'text-gray-500'}`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-800">AI Trip Planner</Text>
                    <Text className="text-xs text-gray-600">Planning for {destination}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Inputs */}
                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3">Vibe</Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                        <VibeItem label="Romantic" icon={Heart} value="Romantic" />
                        <VibeItem label="Adventure" icon={Palmtree} value="Adventure" />
                        <VibeItem label="Cultural" icon={Landmark} value="Cultural" />
                        <VibeItem label="Foodie" icon={Utensils} value="Foodie" />
                        <VibeItem label="Relaxed" icon={Sparkles} value="Relaxed" />
                    </View>

                    <Text className="text-lg font-bold text-gray-800 mb-3">Budget</Text>
                    <View className="flex-row bg-white rounded-xl p-1 border border-gray-200 mb-6">
                        {['Budget', 'Standard', 'Luxury'].map((b) => (
                            <TouchableOpacity
                                key={b}
                                onPress={() => setBudget(b as any)}
                                className={`flex-1 py-3 items-center rounded-lg ${budget === b ? 'bg-terracotta shadow-sm' : 'bg-transparent'}`}
                            >
                                <Text className={`font-semibold text-xs ${budget === b ? 'text-white' : 'text-gray-500'}`}>{b}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={generateItinerary}
                        disabled={loading}
                        className="bg-gray-900 rounded-xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Sparkles size={18} color="#FFD700" />
                                <Text className="text-white font-bold text-base">Generate Itinerary</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results Preview */}
                {result && (
                    <View className="bg-white rounded-3xl p-5 shadow-lg border border-terracotta/20 animate-fade-in">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Sparkles size={20} color="#e07a5f" />
                            <Text className="text-xl font-bold text-gray-800">Your Plan</Text>
                        </View>

                        <Text className="text-gray-600 italic mb-4 leading-5">{result.summary}</Text>

                        <Text className="text-sm font-bold text-gray-800 mb-2">Highlights</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {result.highlights.map((h: string, i: number) => (
                                <View key={i} className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                                    <Text className="text-xs text-orange-700 font-medium">{h}</Text>
                                </View>
                            ))}
                        </View>

                        <Text className="text-sm font-bold text-gray-800 mb-2">Itinerary</Text>
                        <Text className="text-gray-600 text-sm leading-6 mb-6">{result.notes}</Text>

                        <TouchableOpacity
                            onPress={savePlan}
                            disabled={saving}
                            className="bg-terracotta rounded-xl py-3 flex-row items-center justify-center gap-2"
                        >
                            {saving ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Check size={18} color="white" />
                                    <Text className="text-white font-bold">Save to Trip</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}
