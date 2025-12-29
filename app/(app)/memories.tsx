import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Heart, MapPin, X, ChevronLeft, ChevronRight, Camera, Download } from 'lucide-react-native';
import { uploadToSupabase } from '../../lib/storage';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { useGroup } from '../../contexts/GroupContext';
import ImageViewing from "react-native-image-viewing";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

interface Memory {
    id: string;
    image_url: string;
    caption: string;
    location: string | null;
    taken_at: string | null;
    is_favorite: boolean;
    trip_id: string | null;
    event_id: string | null;
}

interface Trip {
    id: string;
    destination: string;
    country: string;
    start_date: string;
    end_date: string;
}

interface Album {
    id: string;
    title: string;
    type: 'trip' | 'favorites' | 'unlinked' | 'all';
    coverImage: string | null;
    photoCount: number;
    trip?: Trip;
}

export default function MemoriesScreen() {
    const router = useRouter();
    const { currentGroup } = useGroup();
    const [loading, setLoading] = useState(true);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);

    // View state
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

    // Viewer state
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Upload state
    const [showAddPhoto, setShowAddPhoto] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Refetch data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        if (memories.length > 0 && trips.length >= 0) {
            buildAlbums();
        }
    }, [memories, trips]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/auth/login');
                return;
            }

            if (currentGroup) {
                // Fetch memories
                const { data: memoriesData } = await supabase
                    .from('memories')
                    .select('*')
                    .eq('group_id', currentGroup.id)
                    .order('taken_at', { ascending: false });
                setMemories(memoriesData || []);

                // Fetch trips
                const { data: tripsData } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('group_id', currentGroup.id)
                    .order('start_date', { ascending: false });
                setTrips(tripsData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildAlbums = () => {
        const albumsList: Album[] = [];

        // All Memories
        if (memories.length > 0) {
            albumsList.push({
                id: 'all',
                title: 'All Memories',
                type: 'all',
                coverImage: memories[0]?.image_url || null,
                photoCount: memories.length,
            });
        }

        // Favorites
        const favoriteMemories = memories.filter(m => m.is_favorite);
        if (favoriteMemories.length > 0) {
            albumsList.push({
                id: 'favorites',
                title: 'Favorites',
                type: 'favorites',
                coverImage: favoriteMemories[0]?.image_url || null,
                photoCount: favoriteMemories.length,
            });
        }

        // Trip albums
        trips.forEach(trip => {
            const tripMemories = memories.filter(m => m.trip_id === trip.id);
            if (tripMemories.length > 0) {
                albumsList.push({
                    id: trip.id,
                    title: trip.destination,
                    type: 'trip',
                    coverImage: tripMemories[0]?.image_url || null,
                    photoCount: tripMemories.length,
                    trip,
                });
            }
        });

        // Unlinked
        const unlinkedMemories = memories.filter(m => !m.trip_id);
        if (unlinkedMemories.length > 0) {
            albumsList.push({
                id: 'unlinked',
                title: 'Unlinked',
                type: 'unlinked',
                coverImage: unlinkedMemories[0]?.image_url || null,
                photoCount: unlinkedMemories.length,
            });
        }

        setAlbums(albumsList);
    };

    const getAlbumPhotos = (album: Album): Memory[] => {
        switch (album.type) {
            case 'all':
                return memories;
            case 'favorites':
                return memories.filter(m => m.is_favorite);
            case 'unlinked':
                return memories.filter(m => !m.trip_id);
            case 'trip':
                return memories.filter(m => m.trip_id === album.id);
            default:
                return [];
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setSelectedImages(result.assets.map(asset => asset.uri));
            suggestTrip();
            setShowAddPhoto(true);
        }
    };

    const suggestTrip = () => {
        const now = new Date();
        const currentTrip = trips.find(t => {
            const start = parseISO(t.start_date);
            const end = parseISO(t.end_date);
            return isWithinInterval(now, { start, end });
        });

        if (currentTrip) {
            setSelectedTripId(currentTrip.id);
        } else if (trips.length > 0) {
            setSelectedTripId(trips[0].id);
        }
    };

    const handleUploadPhoto = async () => {
        if (selectedImages.length === 0 || !currentGroup) return;

        setUploading(true);
        try {
            const uploadPromises = selectedImages.map(async (imageUri, index) => {
                const timestamp = Date.now() + index;
                const path = `${currentGroup.id}/${timestamp}.jpg`;
                const publicUrl = await uploadToSupabase(imageUri, 'memories', path);

                return supabase.from('memories').insert({
                    group_id: currentGroup?.id,
                    image_url: publicUrl,
                    caption,
                    location,
                    trip_id: selectedTripId,
                    taken_at: new Date().toISOString(),
                });
            });

            await Promise.all(uploadPromises);

            const photoText = selectedImages.length === 1 ? 'Photo' : `${selectedImages.length} photos`;
            Alert.alert('Success', `${photoText} added successfully! ✨`);
            setShowAddPhoto(false);
            setSelectedImages([]);
            setCaption('');
            setLocation('');
            setSelectedTripId(null);
            fetchData();
        } catch (error) {
            console.error('Error uploading photos:', error);
            Alert.alert('Error', 'Failed to upload photos');
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
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const downloadImage = async (url: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to save photos');
                return;
            }

            const fileUri = FileSystem.documentDirectory + 'temp_download.jpg';
            const { uri } = await FileSystem.downloadAsync(url, fileUri);

            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Saved!', 'Photo saved to your gallery 📸');
        } catch (error) {
            console.error('Error downloading image:', error);
            Alert.alert('Error', 'Failed to save photo');
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    const AlbumCard = ({ album }: { album: Album }) => (
        <TouchableOpacity
            onPress={() => setSelectedAlbum(album)}
            style={{ width: '48%', marginBottom: 16 }}
        >
            <View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#f3f4f6' }}>
                    {album.coverImage ? (
                        <Image
                            source={{ uri: album.coverImage }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={32} color="#d1d5db" />
                        </View>
                    )}
                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{album.photoCount}</Text>
                    </View>
                </View>
                <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }} numberOfLines={1}>{album.title}</Text>
                    {album.trip && (
                        <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                            {format(parseISO(album.trip.start_date), 'MMM d')} - {format(parseISO(album.trip.end_date), 'MMM d, yyyy')}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Albums Grid View
    if (!selectedAlbum) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Memories</Text>
                            <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                                {memories.length} photos • {albums.length} albums
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={{ backgroundColor: '#e07a5f', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Plus size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {albums.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                            <Camera size={64} color="#d1d5db" />
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 16 }}>No memories yet</Text>
                            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
                                Start capturing your travel moments!
                            </Text>
                            <TouchableOpacity
                                onPress={pickImage}
                                style={{ marginTop: 24, backgroundColor: '#e07a5f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <Camera size={20} color="white" />
                                <Text style={{ color: 'white', fontWeight: '600' }}>Add Your First Photo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {albums.map(album => (
                                <AlbumCard key={album.id} album={album} />
                            ))}
                        </View>
                    )}
                </ScrollView>
                {renderAddPhotoModal()}
            </LinearGradient>
        );
    }

    // Album Detail View
    const albumPhotos = getAlbumPhotos(selectedAlbum);
    const galleryImages = albumPhotos.map(p => ({ uri: p.image_url }));

    const renderFooter = ({ imageIndex }: { imageIndex: number }) => {
        const photo = albumPhotos[imageIndex];
        if (!photo) return null;

        return (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                        {photo.caption ? (
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{photo.caption}</Text>
                        ) : null}
                        {photo.location ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MapPin size={14} color="#d1d5db" />
                                <Text style={{ color: '#d1d5db', fontSize: 14 }}>{photo.location}</Text>
                            </View>
                        ) : null}
                        {photo.taken_at && (
                            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                                {format(parseISO(photo.taken_at), 'MMM d, yyyy • h:mm a')}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => toggleFavorite(photo)}
                        style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}
                    >
                        <Heart size={24} color={photo.is_favorite ? "#e07a5f" : "white"} fill={photo.is_favorite ? "#e07a5f" : "transparent"} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1, paddingVertical: 16 }}>
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                    <TouchableOpacity
                        onPress={() => setSelectedAlbum(null)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                    >
                        <ChevronLeft size={20} color="#6b7280" />
                        <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>Albums</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>{selectedAlbum.title}</Text>
                    {selectedAlbum.trip && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MapPin size={12} color="#6b7280" />
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>{selectedAlbum.trip.country}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                {format(parseISO(selectedAlbum.trip.start_date), 'MMM d')} - {format(parseISO(selectedAlbum.trip.end_date), 'MMM d, yyyy')}
                            </Text>
                        </View>
                    )}
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{albumPhotos.length} photos</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 }}>
                    {albumPhotos.map((memory, index) => (
                        <TouchableOpacity
                            key={memory.id}
                            onPress={() => {
                                setCurrentImageIndex(index);
                                setViewerVisible(true);
                            }}
                            style={{ width: '33.33%', padding: 2 }}
                        >
                            <View style={{ aspectRatio: 1, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                <Image
                                    source={{ uri: memory.image_url }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                                {memory.is_favorite && (
                                    <View style={{ position: 'absolute', top: 4, right: 4 }}>
                                        <Heart size={14} color="white" fill="#e07a5f" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ImageViewing
                images={galleryImages}
                imageIndex={currentImageIndex}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
                FooterComponent={renderFooter}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                ImageComponent={(props: any) => (
                    <Image
                        {...props}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                )}
            />

            {renderAddPhotoModal()}
        </LinearGradient>
    );

    function renderAddPhotoModal() {
        return (
            <Modal visible={showAddPhoto} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Add Memory</Text>
                            <TouchableOpacity onPress={() => setShowAddPhoto(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }}>
                            {selectedImages.length > 0 && (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>Selected Photos ({selectedImages.length})</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8 }}>
                                        {selectedImages.map((uri, index) => (
                                            <View key={index} style={{ marginRight: 8, position: 'relative' }}>
                                                <Image
                                                    source={{ uri }}
                                                    style={{ width: 100, height: 100, borderRadius: 8 }}
                                                    contentFit="cover"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                                                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <X size={16} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>Link to Trip (Optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                <TouchableOpacity
                                    onPress={() => setSelectedTripId(null)}
                                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: !selectedTripId ? '#e07a5f' : '#f3f4f6' }}
                                >
                                    <Text style={{ color: !selectedTripId ? 'white' : '#6b7280', fontSize: 12 }}>No Trip</Text>
                                </TouchableOpacity>
                                {trips.map(trip => (
                                    <TouchableOpacity
                                        key={trip.id}
                                        onPress={() => setSelectedTripId(trip.id)}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: selectedTripId === trip.id ? '#e07a5f' : '#f3f4f6' }}
                                    >
                                        <Text style={{ color: selectedTripId === trip.id ? 'white' : '#6b7280', fontSize: 12 }}>{trip.destination}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TextInput
                                value={caption}
                                onChangeText={setCaption}
                                placeholder="Add a caption..."
                                style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, fontSize: 14 }}
                                multiline
                            />

                            <TextInput
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Add location..."
                                style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, fontSize: 14 }}
                            />

                            <TouchableOpacity
                                onPress={handleUploadPhoto}
                                disabled={uploading}
                                style={{ backgroundColor: '#e07a5f', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: '600' }}>Add Photo</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    }
}
