import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Image as RNImage, Alert, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Heart, MapPin, Calendar, X, ChevronLeft, ChevronRight, FolderPlus, ImageIcon, Plane, CalendarDays, Camera, Upload } from 'lucide-react-native';
import { format } from 'date-fns';

interface Memory {
    id: string;
    image_url: string;
    caption: string;
    location: string | null;
    taken_at: string | null;
    is_favorite: boolean;
    trip_id: string | null;
    event_id: string | null;
    trip?: { destination: string };
}

export default function MemoriesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [couple, setCouple] = useState<any>(null);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<Memory | null>(null);
    const [showAddPhoto, setShowAddPhoto] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

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
                const { data: memoriesData } = await supabase
                    .from('memories')
                    .select(`
                        *,
                        trip:trips(destination)
                    `)
                    .eq('couple_id', coupleData.id)
                    .order('taken_at', { ascending: false });

                setMemories(memoriesData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setShowAddPhoto(true);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera permissions');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setShowAddPhoto(true);
        }
    };

    const uploadPhoto = async () => {
        if (!selectedImage || !couple) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // In a real app, you'd upload to Supabase Storage here
            // For now, we'll just insert with the local URI (this won't work in production)
            const { error } = await supabase.from('memories').insert({
                couple_id: couple.id,
                uploaded_by: user.id,
                image_url: selectedImage, // In production, this should be the Supabase Storage URL
                caption: caption || 'Untitled',
                location: location || null,
                taken_at: new Date().toISOString().split('T')[0],
                is_favorite: false,
            });

            if (!error) {
                setShowAddPhoto(false);
                setSelectedImage(null);
                setCaption('');
                setLocation('');
                fetchData();
                Alert.alert('Success', 'Photo uploaded!');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            Alert.alert('Error', 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const toggleFavorite = async (memory: Memory) => {
        try {
            await supabase
                .from('memories')
                .update({ is_favorite: !memory.is_favorite })
                .eq('id', memory.id);

            setMemories(prev => prev.map(m =>
                m.id === memory.id ? { ...m, is_favorite: !m.is_favorite } : m
            ));
            if (selectedPhoto?.id === memory.id) {
                setSelectedPhoto({ ...selectedPhoto, is_favorite: !memory.is_favorite });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const currentIndex = selectedPhoto ? memories.findIndex(p => p.id === selectedPhoto.id) : -1;

    const handlePrev = () => {
        if (currentIndex > 0) {
            setSelectedPhoto(memories[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        if (currentIndex < memories.length - 1) {
            setSelectedPhoto(memories[currentIndex + 1]);
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            <View className="flex-1 px-4 py-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-xl font-bold text-gray-800">Our Memories</Text>
                        <Text className="text-xs text-gray-600">{memories.length} photos</Text>
                    </View>
                    <TouchableOpacity
                        onPress={pickImage}
                        className="bg-terracotta px-3 py-2 rounded-lg flex-row items-center gap-1"
                    >
                        <Plus size={14} color="white" />
                        <Text className="text-xs text-white">Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Photo Grid */}
                {memories.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ImageIcon size={48} color="#d1d5db" />
                        <Text className="text-sm text-gray-600 mt-2">No photos yet</Text>
                        <Text className="text-xs text-gray-500">Add your first memory!</Text>
                        <TouchableOpacity
                            onPress={pickImage}
                            className="mt-4 bg-terracotta px-6 py-3 rounded-xl flex-row items-center gap-2"
                        >
                            <Camera size={20} color="white" />
                            <Text className="text-white font-semibold">Add Photo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={memories}
                        numColumns={3}
                        keyExtractor={(item) => item.id}
                        columnWrapperStyle={{ gap: 2 }}
                        contentContainerStyle={{ gap: 2 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedPhoto(item)}
                                className="flex-1 aspect-square relative"
                                style={{ maxWidth: '33.33%' }}
                            >
                                <RNImage
                                    source={{ uri: item.image_url }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                {item.is_favorite && (
                                    <View className="absolute top-1 right-1">
                                        <Heart size={14} color="white" fill="#e07a5f" />
                                    </View>
                                )}
                                {item.trip_id && (
                                    <View className="absolute bottom-1 left-1">
                                        <Plane size={12} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Photo Detail Modal */}
            {selectedPhoto && (
                <Modal visible={true} animationType="fade" transparent={true}>
                    <View className="flex-1 bg-black/95">
                        {/* Header */}
                        <View className="absolute top-12 left-0 right-0 z-10 flex-row items-center justify-between px-4">
                            <Text className="text-white/70 text-xs">
                                {currentIndex + 1} / {memories.length}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelectedPhoto(null)}
                                className="w-8 h-8 bg-white/10 rounded-full items-center justify-center"
                            >
                                <X size={16} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Image */}
                        <View className="flex-1 items-center justify-center">
                            <RNImage
                                source={{ uri: selectedPhoto.image_url }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />

                            {/* Navigation */}
                            {currentIndex > 0 && (
                                <TouchableOpacity
                                    onPress={handlePrev}
                                    className="absolute left-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                                >
                                    <ChevronLeft size={20} color="white" />
                                </TouchableOpacity>
                            )}
                            {currentIndex < memories.length - 1 && (
                                <TouchableOpacity
                                    onPress={handleNext}
                                    className="absolute right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                                >
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Details */}
                        <View className="bg-white rounded-t-3xl p-4">
                            <Text className="text-base font-bold text-gray-800 mb-2">
                                {selectedPhoto.caption || 'Untitled'}
                            </Text>
                            <View className="flex-row items-center gap-3 mb-3">
                                {selectedPhoto.location && (
                                    <View className="flex-row items-center gap-1">
                                        <MapPin size={12} color="#9ca3af" />
                                        <Text className="text-xs text-gray-600">{selectedPhoto.location}</Text>
                                    </View>
                                )}
                                {selectedPhoto.taken_at && (
                                    <View className="flex-row items-center gap-1">
                                        <Calendar size={12} color="#9ca3af" />
                                        <Text className="text-xs text-gray-600">
                                            {format(new Date(selectedPhoto.taken_at), 'MMM d, yyyy')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {selectedPhoto.trip && (
                                <View className="bg-blue-100 px-2 py-1 rounded-full self-start flex-row items-center gap-1 mb-3">
                                    <Plane size={12} color="#3b82f6" />
                                    <Text className="text-xs text-blue-700">{selectedPhoto.trip.destination}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => toggleFavorite(selectedPhoto)}
                                className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2"
                            >
                                <Heart
                                    size={16}
                                    color={selectedPhoto.is_favorite ? '#e07a5f' : '#9ca3af'}
                                    fill={selectedPhoto.is_favorite ? '#e07a5f' : 'transparent'}
                                />
                                <Text className={`text-sm font-semibold ${selectedPhoto.is_favorite ? 'text-terracotta' : 'text-gray-600'
                                    }`}>
                                    {selectedPhoto.is_favorite ? 'Favorited' : 'Favorite'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Add Photo Modal */}
            <Modal visible={showAddPhoto} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-gray-800">Add Photo</Text>
                            <TouchableOpacity onPress={() => { setShowAddPhoto(false); setSelectedImage(null); }}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Image Preview */}
                            {selectedImage && (
                                <View className="mb-4">
                                    <RNImage
                                        source={{ uri: selectedImage }}
                                        className="w-full aspect-square rounded-xl"
                                        resizeMode="cover"
                                    />
                                </View>
                            )}

                            {/* Caption */}
                            <View className="mb-4">
                                <Text className="text-xs text-gray-600 mb-1">Caption</Text>
                                <TextInput
                                    value={caption}
                                    onChangeText={setCaption}
                                    placeholder="What's this memory about?"
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    multiline
                                />
                            </View>

                            {/* Location */}
                            <View className="mb-4">
                                <Text className="text-xs text-gray-600 mb-1">Location</Text>
                                <TextInput
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Where was this?"
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                />
                            </View>

                            {/* Upload Button */}
                            <TouchableOpacity
                                onPress={uploadPhoto}
                                disabled={uploading || !selectedImage}
                                className="bg-terracotta rounded-xl px-4 py-3 items-center flex-row justify-center gap-2"
                            >
                                <Upload size={16} color="white" />
                                <Text className="text-white font-semibold">
                                    {uploading ? 'Uploading...' : 'Upload Photo'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
