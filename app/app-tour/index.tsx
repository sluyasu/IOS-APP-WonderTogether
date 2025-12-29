import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Calendar, Camera, MapPin, Users, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TOUR_STEPS = [
    {
        icon: Heart,
        title: 'Welcome to WonderTogether!',
        description: 'Track your adventures together, plan trips, and create lasting memories with your travel partner.',
        color: '#e07a5f',
    },
    {
        icon: MapPin,
        title: 'Your Travel Home',
        description: 'See your upcoming trips, shared memories count, and countries visited. Upload a beautiful cover photo to personalize your space.',
        color: '#fb7185',
    },
    {
        icon: Calendar,
        title: 'Plan & Organize',
        description: 'Keep track of your trips and special events. View everything in a beautiful timeline and calendar view.',
        color: '#f59e0b',
    },
    {
        icon: Camera,
        title: 'Capture Memories',
        description: 'Upload photos from your adventures and organize them into beautiful albums. Relive your favorite moments together.',
        color: '#8b5cf6',
    },
    {
        icon: Users,
        title: 'Travel Together',
        description: 'Share everything with your partner. Both of you can add trips, upload photos, and track your adventures.',
        color: '#10b981',
    },
];

export default function AppTourScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const handleSkip = async () => {
        await completeTour();
    };

    const completeTour = async () => {
        try {
            await AsyncStorage.setItem('app_tour_completed', 'true');
            router.replace('/(app)');
        } catch (error) {
            console.error('Error saving tour completion:', error);
            router.replace('/(app)');
        }
    };

    const step = TOUR_STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
                {/* Skip button */}
                {!isLastStep && (
                    <View style={{ alignItems: 'flex-end', paddingTop: 40 }}>
                        <TouchableOpacity onPress={handleSkip}>
                            <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '500' }}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Content */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                    {/* Icon */}
                    <View
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            backgroundColor: `${step.color}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 40,
                        }}
                    >
                        <Icon color={step.color} size={60} />
                    </View>

                    {/* Title */}
                    <Text
                        style={{
                            fontSize: 28,
                            fontWeight: 'bold',
                            color: '#1f2937',
                            textAlign: 'center',
                            marginBottom: 16,
                        }}
                    >
                        {step.title}
                    </Text>

                    {/* Description */}
                    <Text
                        style={{
                            fontSize: 16,
                            color: '#6b7280',
                            textAlign: 'center',
                            lineHeight: 24,
                            maxWidth: 320,
                        }}
                    >
                        {step.description}
                    </Text>
                </View>

                {/* Bottom controls */}
                <View style={{ paddingBottom: 40 }}>
                    {/* Progress dots */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 }}>
                        {TOUR_STEPS.map((_, index) => (
                            <View
                                key={index}
                                style={{
                                    width: currentStep === index ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: currentStep === index ? step.color : '#d1d5db',
                                }}
                            />
                        ))}
                    </View>

                    {/* Next/Get Started button */}
                    <TouchableOpacity onPress={handleNext}>
                        <LinearGradient
                            colors={[step.color, `${step.color}dd`]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{
                                height: 56,
                                borderRadius: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                                {isLastStep ? "Let's Go!" : 'Next'}
                            </Text>
                            <ArrowRight color="white" size={20} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}
