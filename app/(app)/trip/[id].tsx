import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image, Modal, FlatList, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, Edit2, Trash2, Clock, Sparkles, Check, Hotel, Plane, CloudRain, FileText, Sun, Cloud, CloudDrizzle, Camera, X, Image as ImageIcon } from 'lucide-react-native';
import { format, differenceInDays } from 'date-fns';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { uploadToSupabase } from '../../../lib/storage';

type TabType = 'overview' | 'planning' | 'reservations' | 'weather' | 'notes';

export default function TripDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [saving, setSaving] = useState(false);

    // Cover Image Logic
    const [showPhotoPicker, setShowPhotoPicker] = useState(false);
    const [tripPhotos, setTripPhotos] = useState<any[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    // Adjust Logic
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedImageForAdjust, setSelectedImageForAdjust] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchTrip();
            fetchTripPhotos(); // Fetch fallbacks
        }
    }, [params.id]);

    const fetchTrip = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('trips')
                .select('*')
                .eq('id', params.id)
                .single();
            setTrip(data);
        } catch (error) {
            console.error('Error fetching trip:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTripPhotos = async () => {
        setLoadingPhotos(true);
        try {
            const { data } = await supabase
                .from('memories')
                .select('*')
                .eq('trip_id', params.id)
                .order('is_favorite', { ascending: false })
                .order('taken_at', { ascending: false });
            setTripPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handleOpenPhotoPicker = () => {
        setShowPhotoPicker(true);
        fetchTripPhotos();
    };

    const handleUpdateCover = async (imageUrl: string) => {
        // Optimistic update
        const oldCover = trip.cover_image;
        setTrip({ ...trip, cover_image: imageUrl });
        setShowPhotoPicker(false);

        try {
            const { error } = await supabase
                .from('trips')
                .update({ cover_image: imageUrl })
                .eq('id', trip.id);

            if (error) throw error;
        } catch (error) {
            // Revert
            setTrip({ ...trip, cover_image: oldCover });
            Alert.alert('Error', 'Failed to update cover photo');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Trip',
            'Are you sure you want to delete this trip? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('trips').delete().eq('id', params.id);
                        router.back();
                    },
                },
            ]
        );
    };

    const getDayCount = () => {
        if (!trip?.start_date || !trip?.end_date) return 0;
        return differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;
    };

    const getDaysUntil = () => {
        if (!trip?.start_date) return 0;
        return differenceInDays(new Date(trip.start_date), new Date());
    };

    const statusConfig = {
        planned: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', label: '📅 Planned' },
        confirmed: { bg: 'rgba(129, 178, 154, 0.1)', text: '#81b29a', label: '✓ Confirmed' },
        completed: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', label: '✅ Completed' },
    };

    const getAutoStatus = () => {
        if (!trip?.end_date) return 'planned';
        const endDate = new Date(trip.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today ? 'completed' : 'planned';
    };

    const autoStatus = getAutoStatus();
    const currentStatus = statusConfig[autoStatus as keyof typeof statusConfig] || statusConfig.planned;

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: MapPin },
        { id: 'planning' as TabType, label: 'Planning', icon: Sparkles },
        { id: 'reservations' as TabType, label: 'Bookings', icon: Hotel },
        { id: 'weather' as TabType, label: 'Weather', icon: Sun },
        { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    ];

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    if (!trip) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>Trip not found</Text>
            </LinearGradient>
        );
    }

    // Determine cover to show
    const displayCover = trip?.cover_image || (tripPhotos.length > 0 ? tripPhotos[0].image_url : null);

    return (
        <View style={{ flex: 1, backgroundColor: '#fffbf0' }}>
            {/* Header w/ Image Background */}
            <View style={{ height: 240, width: '100%', position: 'relative' }}>
                {displayCover ? (
                    <Image
                        source={{ uri: displayCover }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={['#e07a5f', '#f2cc8f']}
                        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plane size={64} color="rgba(255,255,255,0.5)" />
                    </LinearGradient>
                )}

                {/* Gradient Overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Navbar */}
                <View style={{ position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleOpenPhotoPicker} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                        <Camera size={16} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Change Cover</Text>
                    </TouchableOpacity>
                </View>

                {/* Title Content */}
                <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <MapPin size={14} color="#f2cc8f" />
                        <Text style={{ color: '#f2cc8f', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{trip.country}</Text>
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{trip.destination}</Text>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                        {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                    </Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    marginRight: 8,
                                    borderRadius: 20,
                                    backgroundColor: isActive ? '#e07a5f' : '#f3f4f6',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <Icon size={14} color={isActive ? 'white' : '#6b7280'} />
                                <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: isActive ? 'white' : '#6b7280' }}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Tab Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {activeTab === 'overview' && <OverviewTab trip={trip} getDayCount={getDayCount} getDaysUntil={getDaysUntil} currentStatus={currentStatus} onDelete={handleDelete} />}
                {activeTab === 'planning' && <PlanningTab trip={trip} router={router} />}
                {activeTab === 'reservations' && <ReservationsTab trip={trip} />}
                {activeTab === 'weather' && <WeatherTab trip={trip} />}
                {activeTab === 'notes' && <NotesTab trip={trip} setTrip={setTrip} />}
            </ScrollView>

            {/* Photo Picker Modal */}
            <Modal visible={showPhotoPicker} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: 'white' }}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Select Cover Photo</Text>
                        <TouchableOpacity onPress={() => setShowPhotoPicker(false)} style={{ padding: 4 }}>
                            <X size={24} color="#1f2937" />
                        </TouchableOpacity>
                    </View>

                    {loadingPhotos ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color="#e07a5f" />
                        </View>
                    ) : (
                        <FlatList
                            data={tripPhotos}
                            numColumns={3}
                            contentContainerStyle={{ padding: 2 }}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                                    <ImageIcon size={48} color="#d1d5db" />
                                    <Text style={{ marginTop: 16, color: '#6b7280', textAlign: 'center' }}>No photos found for this trip yet.</Text>
                                    <Text style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Add photos to your Memories and link them to this trip!</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedImageForAdjust(item.image_url);
                                        setShowPhotoPicker(false);
                                        setShowAdjustModal(true);
                                    }}
                                    style={{ flex: 1 / 3, aspectRatio: 1, padding: 2 }}
                                >
                                    <Image source={{ uri: item.image_url }} style={{ flex: 1, borderRadius: 4 }} />
                                    {item.is_favorite && (
                                        <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 999 }}>
                                            <Sparkles size={10} color="#FFD700" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            keyExtractor={item => item.id}
                        />
                    )}
                </View>
            </Modal>

            {/* Adjust Cover Modal */}
            <AdjustCoverModal
                visible={showAdjustModal}
                imageUri={selectedImageForAdjust}
                onClose={() => {
                    setShowAdjustModal(false);
                    setSelectedImageForAdjust(null);
                    setShowPhotoPicker(true);
                }}
                onSave={(newUri) => {
                    handleUpdateCover(newUri);
                    setShowAdjustModal(false);
                    setSelectedImageForAdjust(null);
                }}
            />
        </View>
    );
}

// Helper: Adjust Cover Modal
function AdjustCoverModal({
    visible,
    imageUri,
    onClose,
    onSave
}: {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onSave: (uri: string) => void;
}) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [saving, setSaving] = useState(false);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { width: screenWidth } = Dimensions.get('window');
    const VIEWPORT_HEIGHT = 240;

    useEffect(() => {
        if (imageUri) {
            Image.getSize(imageUri, (width, height) => {
                setImageSize({ width, height });
            });
        }
    }, [imageUri]);

    const handleSave = async () => {
        if (!imageUri || !imageSize || saving) return;

        setSaving(true);
        try {
            // Calculate Crop
            const ratio = imageSize.width / screenWidth;
            const cropY = Math.max(0, offset.y * ratio); // Y offset in original image coords

            // Calculate height to crop (VIEWPORT_HEIGHT scaled up)
            let cropHeight = VIEWPORT_HEIGHT * ratio;

            // Validate bounds
            if (cropY + cropHeight > imageSize.height) {
                cropHeight = imageSize.height - cropY;
            }

            const actions = [
                {
                    crop: {
                        originX: 0,
                        originY: cropY,
                        width: imageSize.width,
                        height: cropHeight
                    }
                },
                // Resize for efficiency (2x retina)
                { resize: { width: 1080 } }
            ];

            let localUri = imageUri;

            // Fix: If remote, download first
            if (imageUri.startsWith('http')) {
                const filename = imageUri.split('/').pop() || 'temp.jpg';
                const downloadDest = `${FileSystem.cacheDirectory}${filename}`;
                const { uri } = await FileSystem.downloadAsync(imageUri, downloadDest);
                localUri = uri;
            }

            const result = await ImageManipulator.manipulateAsync(
                localUri,
                actions,
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            // Upload
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            // Unique path
            const filename = `covers/${user.id}_${Date.now()}.jpg`;
            const publicUrl = await uploadToSupabase(result.uri, 'memories', filename);

            onSave(publicUrl);
        } catch (error) {
            console.error('Error saving cover:', error);
            Alert.alert('Error', 'Failed to save cropped image.');
        } finally {
            setSaving(false);
        }
    };

    if (!visible || !imageUri || !imageSize) return null;

    // Height of the image when rendered at screen width
    const renderedHeight = (imageSize.height / imageSize.width) * screenWidth;

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                {/* Header */}
                <View style={{ height: 100, paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <TouchableOpacity onPress={onClose} disabled={saving}>
                        <Text style={{ color: 'white', fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Adjust Cover</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#e07a5f" />
                        ) : (
                            <Text style={{ color: '#e07a5f', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Editor Area */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#9ca3af', marginBottom: 20, fontSize: 14 }}>Drag vertical to reposition</Text>

                    {/* Viewport Frame */}
                    <View style={{ height: VIEWPORT_HEIGHT, width: screenWidth, overflow: 'hidden', borderWidth: 1, borderColor: 'white', position: 'relative' }}>
                        <ScrollView
                            ref={scrollViewRef}
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            scrollEventThrottle={16}
                            onScroll={(e) => setOffset(e.nativeEvent.contentOffset)}
                            contentContainerStyle={{ height: renderedHeight }}
                        >
                            <Image
                                source={{ uri: imageUri }}
                                style={{ width: screenWidth, height: renderedHeight }}
                            />
                        </ScrollView>

                        {/* Grid Overlay for visual aid */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                            <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' }} />
                            <View style={{ flex: 1 }} />
                            <View style={{ position: 'absolute', top: 0, bottom: 0, left: '33%', width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <View style={{ position: 'absolute', top: 0, bottom: 0, right: '33%', width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Subcomponents
function OverviewTab({ trip, getDayCount, getDaysUntil, currentStatus, onDelete }: any) {
    return (
        <View style={{ gap: 20 }}>
            {/* Status Badges */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: currentStatus.bg }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: currentStatus.text }}>{currentStatus.label}</Text>
                </View>
                {trip.status === 'planned' && getDaysUntil() > 0 && (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(224, 122, 95, 0.1)' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#e07a5f' }}>{getDaysUntil()} days away</Text>
                    </View>
                )}
            </View>

            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Start</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{format(new Date(trip.start_date), 'EEE, MMM d')}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: '#f3f4f6' }} />
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>End</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{format(new Date(trip.end_date), 'EEE, MMM d')}</Text>
                    </View>
                </View>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', gap: 8 }}>
                    <Clock size={24} color="#e07a5f" />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>{getDayCount()}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Days</Text>
                    </View>
                </View>
                <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', gap: 8 }}>
                    <Hotel size={24} color="#81b29a" />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>0</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Hotels</Text>
                    </View>
                </View>
                <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', gap: 8 }}>
                    <Sparkles size={24} color="#f2cc8f" />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>0</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Plans</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity onPress={onDelete} style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
                <Trash2 size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Delete Trip</Text>
            </TouchableOpacity>
        </View>
    );
}

function PlanningTab({ trip, router }: any) {
    const hasPlanning = trip.planning && Object.keys(trip.planning).length > 0;
    return (
        <View style={{ gap: 16 }}>
            {!hasPlanning ? (
                <TouchableOpacity onPress={() => router.push({ pathname: '/trip/ai-plan', params: { tripId: trip.id } })} style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
                    <Sparkles size={32} color="#f2cc8f" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>AI Trip Planner</Text>
                    <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>Generate a complete itinerary in seconds.</Text>
                </TouchableOpacity>
            ) : (
                <View><Text>Itinerary Layout Here</Text></View>
            )}
        </View>
    );
}

function ReservationsTab({ trip }: any) {
    return (
        <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>Accommodation</Text>
                <Text style={{ color: '#6b7280' }}>No bookings yet.</Text>
            </View>
        </View>
    );
}

function WeatherTab({ trip }: any) {
    return (
        <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>Forecast</Text>
                <Text style={{ color: '#6b7280' }}>Weather data unavailable.</Text>
            </View>
        </View>
    );
}

function NotesTab({ trip, setTrip }: any) {
    const [notes, setNotes] = useState(trip.notes || '');
    return (
        <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
                <TextInput value={notes} onChangeText={setNotes} multiline style={{ height: 200, fontSize: 16 }} placeholder="Write your notes here..." />
            </View>
        </View>
    );
}
