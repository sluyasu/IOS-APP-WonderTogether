import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, TextInput, Modal } from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Camera, Calendar as CalendarIcon, MapPin, Plus, Heart, Edit2, TrendingUp, Mail, Send, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { isTripPlanned } from '../../lib/tripUtils';
import * as ImagePicker from 'expo-image-picker';
import { uploadGroupAvatar } from '../../lib/storage';
import { useGroup } from '../../contexts/GroupContext';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function HomeScreen() {
    const router = useRouter();
    const { currentGroup, refreshGroup } = useGroup();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [trips, setTrips] = useState<any[]>([]);
    const [memories, setMemories] = useState<any[]>([]);
    const [stats, setStats] = useState({ countries: 0, trips: 0, photos: 0, days: 0 });
    const [countdown, setCountdown] = useState({ days: 0, hours: 0 });
    const [tripPhotos, setTripPhotos] = useState<any[]>([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // All trips slideshow state
    const [allTripPhotos, setAllTripPhotos] = useState<any[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Image cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Love Notes state
    const [loveNote, setLoveNote] = useState<any>(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [noteTheme, setNoteTheme] = useState('love_red');
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiRef = useRef<any>(null);

    const nextTrip = trips.find((t) => isTripPlanned(t.end_date));
    const todayMemory = memories.find((m) => m.is_favorite) || memories[0];

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // No session - redirect to landing/login
                router.replace('/auth/login');
                setLoading(false);
                return;
            }
            setUser(session.user);

            if (!currentGroup) return;

            // Fetch trips (filtered by group_id)
            const { data: tripsData } = await supabase
                .from("trips")
                .select("*")
                .eq("group_id", currentGroup.id)
                .order("start_date", { ascending: true });

            if (tripsData) {
                setTrips(tripsData);

                // Calc stats
                const completedTrips = tripsData.filter((t: any) => {
                    if (!t.end_date) return false;
                    const endDate = new Date(t.end_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    return endDate < today;
                });


                const countries = new Set(completedTrips.map((t: any) => t.country)).size;
                const daysTogether = currentGroup.anniversary_date
                    ? differenceInDays(new Date(), new Date(currentGroup.anniversary_date))
                    : 0;

                setStats(prev => ({
                    ...prev,
                    countries,
                    trips: completedTrips.length,
                    days: daysTogether,
                }));
            }

            // Fetch memories (for display, filtered by group_id)
            const { data: memoriesData } = await supabase
                .from("memories")
                .select("*")
                .eq("group_id", currentGroup.id)
                .order("taken_at", { ascending: false })
                .limit(10);

            if (memoriesData) {
                setMemories(memoriesData);
            }

            // Get total photo count for stats (filtered by group_id)
            const { count: photoCount } = await supabase
                .from("memories")
                .select("*", { count: 'exact', head: true })
                .eq("group_id", currentGroup.id);

            if (photoCount !== null) {
                setStats(prev => ({ ...prev, photos: photoCount }));
            }

            // Fetch photos for next trip if it exists
            const plannedTrip = tripsData?.find((t: any) => isTripPlanned(t.end_date));
            if (plannedTrip) {
                const { data: tripMemories } = await supabase
                    .from("memories")
                    .select("*")
                    .eq("trip_id", plannedTrip.id)
                    .order("taken_at", { ascending: false })
                    .limit(5);

                if (tripMemories && tripMemories.length > 0) {
                    setTripPhotos(tripMemories);
                }
            }

            // Fetch ALL photos from ALL albums for slideshow
            const { data: allPhotosData } = await supabase
                .from("memories")
                .select("*, trips!inner(destination, country)")
                .eq("group_id", currentGroup.id);

            if (allPhotosData && allPhotosData.length > 0) {
                // Shuffle the photos randomly
                const shuffled = [...allPhotosData].sort(() => Math.random() - 0.5);

                // Map to include trip info
                const photosWithTripInfo = shuffled.map(photo => ({
                    ...photo,
                    tripName: photo.trips?.destination || 'Unknown',
                    tripCountry: photo.trips?.country || 'Unknown'
                }));

                setAllTripPhotos(photosWithTripInfo);
                setAllTripPhotos(photosWithTripInfo);
            }

            // Fetch latest love note
            const { data: noteData } = await supabase
                .from('love_notes')
                .select('*')
                .eq('group_id', currentGroup.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setLoveNote(noteData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router, currentGroup]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to upload photos!');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await handleUploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };

    const handleUploadImage = async (uri: string) => {
        setUploading(true);

        try {
            if (!currentGroup?.id) return;

            // Upload using dedicated group avatar function (handles resizing & compression)
            const { url: publicUrl, error: uploadError } = await uploadGroupAvatar(currentGroup.id, uri);

            if (uploadError) throw uploadError;
            if (!publicUrl) throw new Error('No URL returned from upload');

            // Update groups record
            const { error: dbError } = await supabase
                .from('groups')
                .update({ group_avatar_url: publicUrl })
                .eq('id', currentGroup.id);

            if (dbError) throw dbError;

            // Trigger context refresh to update UI with new photo
            await refreshGroup();
        } catch (error) {
            console.error('Error updating group cover photo:', error);
            alert('Failed to update cover photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSendLoveNote = async () => {
        if (!noteContent.trim() || !currentGroup || !user) return;

        setUploading(true);
        try {
            const { error } = await supabase
                .from('love_notes')
                .insert({
                    group_id: currentGroup.id,
                    sender_id: user.id,
                    content: noteContent.trim(),
                    theme: noteTheme,
                });

            if (error) throw error;

            alert('Love note sent! 💌');
            setShowNoteModal(false);
            setNoteContent('');
            fetchData();
        } catch (error) {
            console.error('Error sending love note:', error);
            alert('Failed to send note');
        } finally {
            setUploading(false);
        }
    };

    const handleRevealNote = async () => {
        if (!loveNote) return;

        // Trigger confetti
        setShowConfetti(true);
        if (confettiRef.current) confettiRef.current.start();

        // Mark as read if not already (and if I'm not the sender, ideally, but simpler for now to just mark read on reveal)
        // Actually, let's only mark as read if it's currently unread
        if (!loveNote.is_read) {
            try {
                await supabase
                    .from('love_notes')
                    .update({ is_read: true })
                    .eq('id', loveNote.id);

                // Update local state to reflect read status after a delay so the "Unread" UI doesn't vanish instantly
                setTimeout(() => {
                    setLoveNote((prev: any) => prev ? { ...prev, is_read: true } : prev);
                }, 2000);

            } catch (error) {
                console.error('Error marking note read:', error);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-rotate slideshow every 5 seconds
    useEffect(() => {
        if (allTripPhotos.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlideIndex((prev) => (prev + 1) % allTripPhotos.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [allTripPhotos.length]);

    useEffect(() => {
        if (nextTrip) {
            const tripDate = new Date(nextTrip.start_date);
            const now = new Date();
            const days = differenceInDays(tripDate, now);
            const hours = differenceInHours(tripDate, now) % 24;
            setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours) });
        }
    }, [nextTrip]);

    // Auto-rotate trip photos every 3 seconds
    useEffect(() => {
        if (tripPhotos.length > 1) {
            const interval = setInterval(() => {
                setCurrentPhotoIndex((prev) => (prev + 1) % tripPhotos.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [tripPhotos]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Auto-rotate slideshow every 5 seconds
    useEffect(() => {
        if (allTripPhotos.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlideIndex((prev) => (prev + 1) % allTripPhotos.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [allTripPhotos.length]);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbf0' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                style={{ flex: 1, paddingHorizontal: 16 }}
            >
                {/* Couple Cover Photo - With Image Picker */}
                <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, marginBottom: 16, marginTop: 16 }}>
                    <View style={{ position: 'relative', height: 256 }}>
                        {currentGroup?.group_avatar_url ? (
                            <Image
                                key={currentGroup.group_avatar_url}
                                source={{ uri: currentGroup.group_avatar_url }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={['#e07a5f', '#f59e88', '#f0b8a0']}
                                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Heart size={64} color="white" opacity={0.4} />
                                <Text style={{ color: 'white', fontSize: 16, marginTop: 16, fontWeight: '600' }}>Add your group photo</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Tap the camera icon to upload</Text>
                            </LinearGradient>
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.75)']}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            locations={[0, 0.5, 1]}
                        />

                        {/* Upload Button */}
                        <TouchableOpacity
                            onPress={handlePickImage}
                            disabled={uploading}
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 4,
                                elevation: 5,
                            }}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Camera size={20} color="white" />
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', height: 16, width: 1, marginHorizontal: 4 }} />
                                    <Edit2 size={14} color="white" />
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Heart size={20} color="white" fill="white" />
                                <Text style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                                    {currentGroup?.name || "Your Group"}
                                </Text>
                            </View>
                            {currentGroup?.anniversary_date && (
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' }}>
                                    Together since {format(new Date(currentGroup.anniversary_date), 'MMMM d, yyyy')}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>




                {/* Next Adventure Card */}
                {nextTrip ? (
                    <TouchableOpacity
                        onPress={() => router.push(`/trip/${nextTrip.id}`)}
                        style={{ marginBottom: 24, opacity: 1 }}
                        activeOpacity={0.9}
                    >
                        <View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, backgroundColor: 'white', elevation: 5, borderRadius: 16 }}>
                            <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                                <View style={{ height: 140, backgroundColor: '#e5e7eb', position: 'relative' }}>
                                    {/* Show trip photos carousel if available */}
                                    {tripPhotos.length > 0 ? (
                                        <>
                                            <Image
                                                source={{ uri: tripPhotos[currentPhotoIndex].image_url }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                            {/* Photo counter indicator */}
                                            {tripPhotos.length > 1 && (
                                                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', gap: 4 }}>
                                                    {tripPhotos.map((_, idx) => (
                                                        <View
                                                            key={idx}
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: idx === currentPhotoIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                                            }}
                                                        />
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    ) : nextTrip.cover_image ? (
                                        <Image
                                            source={{ uri: nextTrip.cover_image }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        /* Beautiful themed gradient based on destination */
                                        <LinearGradient
                                            colors={[
                                                nextTrip.country?.toLowerCase().includes('japan') ? '#e07a5f' :
                                                    nextTrip.country?.toLowerCase().includes('italy') ? '#2a9d8f' :
                                                        nextTrip.country?.toLowerCase().includes('france') ? '#e76f51' :
                                                            nextTrip.country?.toLowerCase().includes('spain') ? '#f4a261' :
                                                                nextTrip.country?.toLowerCase().includes('greece') ? '#457b9d' :
                                                                    nextTrip.country?.toLowerCase().includes('thailand') ? '#e63946' :
                                                                        nextTrip.country?.toLowerCase().includes('iceland') ? '#a8dadc' :
                                                                            '#8338ec',
                                                '#6930c3',
                                                '#5390d9'
                                            ]}
                                            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <MapPin size={48} color="white" opacity={0.3} />
                                        </LinearGradient>
                                    )}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(30, 41, 59, 0.8)']}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 16 }}
                                    >
                                        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#e07a5f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Next Adventure</Text>
                                        </View>
                                        <Text style={{ color: 'white', fontFamily: 'serif', fontSize: 20, fontWeight: 'bold' }}>
                                            {nextTrip.destination}, {nextTrip.country}
                                        </Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            {format(new Date(nextTrip.start_date), "MMM d")} - {format(new Date(nextTrip.end_date), "MMM d, yyyy")}
                                        </Text>
                                    </LinearGradient>
                                </View>
                                <View style={{ flexDirection: 'row', paddingVertical: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e07a5f', fontFamily: 'serif' }}>{countdown.days}</Text>
                                        <Text style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Days</Text>
                                    </View>
                                    <View style={{ width: 1, height: 32, backgroundColor: '#e5e7eb' }} />
                                    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e07a5f', fontFamily: 'serif' }}>{countdown.hours}</Text>
                                        <Text style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Hours</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}
                        onPress={() => router.push('/add-trip')}
                    >
                        <PlaneIcon size={32} color="#9ca3af" />
                        <Text style={{ color: '#6b7280', fontWeight: '500' }}>No details planned yet</Text>
                        <Text style={{ color: '#e07a5f', fontWeight: 'bold', marginTop: 8 }}>Plan your first trip</Text>
                    </TouchableOpacity>
                )}



                {/* Love Note Widget */}
                {loveNote && (
                    <TouchableOpacity
                        onPress={() => {
                            if (!loveNote.is_read && loveNote.sender_id !== user?.id) {
                                handleRevealNote();
                            }
                        }}
                        activeOpacity={0.9}
                        style={{ marginBottom: 24 }}
                    >
                        <LinearGradient
                            colors={
                                loveNote.theme === 'ocean' ? ['#4facfe', '#00f2fe'] :
                                    loveNote.theme === 'sunset' ? ['#fa709a', '#fee140'] :
                                        loveNote.theme === 'midnight' ? ['#30cfd0', '#330867'] :
                                            ['#ff9a9e', '#fad0c4'] // love_red default
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
                        >
                            {!loveNote.is_read && loveNote.sender_id !== user?.id ? (
                                // Unread State (For Receiver)
                                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 40, marginBottom: 12 }}>
                                        <Mail size={32} color="white" />
                                    </View>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>You have a Love Note! 💌</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Tap to reveal</Text>
                                </View>
                            ) : (
                                // Read State or Sender View
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Heart size={20} color="white" fill="white" />
                                            <Text style={{ color: 'white', fontWeight: 'bold', opacity: 0.9 }}>Love Note</Text>
                                        </View>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                            {differenceInHours(new Date(), new Date(loveNote.created_at)) < 24
                                                ? format(new Date(loveNote.created_at), 'h:mm a')
                                                : format(new Date(loveNote.created_at), 'MMM d')}
                                        </Text>
                                    </View>
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', lineHeight: 28 }}>
                                        "{loveNote.content}"
                                    </Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {!loveNote && (
                    <TouchableOpacity
                        onPress={() => setShowNoteModal(true)}
                        style={{ marginBottom: 24, backgroundColor: '#fff0f2', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed', borderWidth: 1, borderColor: '#fca5a5' }}
                    >
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#e11d48' }}>Send a Love Note 💌</Text>
                            <Text style={{ fontSize: 12, color: '#be123c', marginTop: 2 }}>Make their day special</Text>
                        </View>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={16} color="#e11d48" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Floating "Send Note" Button (Mini) if note exists */}
                {loveNote && (
                    <TouchableOpacity
                        onPress={() => setShowNoteModal(true)}
                        style={{ alignSelf: 'center', marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'white', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                        <Edit2 size={14} color="#e07a5f" />
                        <Text style={{ color: '#e07a5f', fontWeight: '600', fontSize: 14 }}>Write a new note</Text>
                    </TouchableOpacity>
                )}

                {/* Explore Grid */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#1f2937', fontSize: 18, marginBottom: 12 }}>Explore</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {/* Row 1 */}
                        <TouchableOpacity onPress={() => router.push('/(app)/trips-list')} style={{ width: '48%' }}>
                            <StatCard icon={Globe} value="All Trips" label="" color="bg-blue-100" iconColor="#2563eb" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(app)/memories')} style={{ width: '48%' }}>
                            <StatCard icon={Camera} value="Memories" label="" color="bg-rose-100" iconColor="#e11d48" />
                        </TouchableOpacity>

                        {/* Row 2 */}
                        <TouchableOpacity onPress={() => router.push('/(app)/bucket-list')} style={{ width: '48%' }}>
                            <StatCard icon={Heart} value="Bucket List" label="" color="bg-orange-100" iconColor="#f97316" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(app)/wishlist')} style={{ width: '48%' }}>
                            <StatCard icon={require('lucide-react-native').Gift} value="Wishlist" label="" color="bg-violet-100" iconColor="#7c3aed" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Journey Stats Button - explicit request */}
                <TouchableOpacity
                    onPress={() => router.push('/(app)/stats')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        padding: 16,
                        borderRadius: 16,
                        marginBottom: 24,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        gap: 8
                    }}
                >
                    <TrendingUp size={20} color="#e07a5f" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>View Full Journey Stats</Text>
                </TouchableOpacity>

                {/* Today's Memory */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#1f2937', fontSize: 18 }}>Trip Memories</Text>
                        <TouchableOpacity onPress={() => router.push('/(app)/memories')}>
                            <Text style={{ color: '#e07a5f', fontSize: 12, fontWeight: 'bold' }}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {allTripPhotos.length > 0 ? (
                        <TouchableOpacity onPress={() => router.push('/(app)/memories')} activeOpacity={0.9}>
                            <View style={{ backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: 'hidden' }}>
                                <View style={{ width: '100%', height: 500, backgroundColor: '#f3f4f6', position: 'relative' }}>
                                    {allTripPhotos[currentSlideIndex]?.image_url && (
                                        <>
                                            <Image source={{ uri: allTripPhotos[currentSlideIndex].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }} />
                                            <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                                                    {allTripPhotos[currentSlideIndex].tripName}
                                                </Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                                                    {allTripPhotos[currentSlideIndex].tripCountry}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#9ca3af' }}>No trip photos yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB for New Trip (Using position absolute) */}
            <TouchableOpacity
                onPress={() => router.push('/add-trip')}
                activeOpacity={0.8}
                style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    backgroundColor: '#e07a5f',
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                }}
            >
                <Plus color="white" size={28} />
            </TouchableOpacity>
            {showConfetti && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} pointerEvents="none">
                    <ConfettiCannon
                        ref={confettiRef}
                        count={100}
                        origin={{ x: -10, y: 0 }}
                        autoStart={false}
                        fadeOut={true}
                        onAnimationEnd={() => setShowConfetti(false)}
                    />
                </View>
            )}

            {/* Send Note Modal */}
            <Modal visible={showNoteModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Send Love Note</Text>
                            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 }}>Choose Theme</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {[
                                    { id: 'love_red', colors: ['#ff9a9e', '#fad0c4'] },
                                    { id: 'sunset', colors: ['#fa709a', '#fee140'] },
                                    { id: 'ocean', colors: ['#4facfe', '#00f2fe'] },
                                    { id: 'midnight', colors: ['#30cfd0', '#330867'] },
                                ].map((theme) => (
                                    <TouchableOpacity
                                        key={theme.id}
                                        onPress={() => setNoteTheme(theme.id)}
                                        style={{ width: 48, height: 48, borderRadius: 24, padding: 2, borderWidth: 2, borderColor: noteTheme === theme.id ? '#1f2937' : 'transparent' }}
                                    >
                                        <LinearGradient
                                            colors={theme.colors}
                                            style={{ flex: 1, borderRadius: 22 }}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TextInput
                            value={noteContent}
                            onChangeText={setNoteContent}
                            placeholder="Type your sweet message..."
                            multiline
                            style={{ backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, height: 120, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 }}
                        />

                        <TouchableOpacity
                            onPress={handleSendLoveNote}
                            disabled={uploading || !noteContent.trim()}
                            style={{ backgroundColor: '#e07a5f', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !noteContent.trim() ? 0.5 : 1 }}
                        >
                            {uploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Send size={20} color="white" />
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Send Note</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

function StatCard({ icon: Icon, value, label, color, iconColor }: any) {
    // Map Tailwind class names to actual colors
    const colorMap: { [key: string]: string } = {
        'bg-orange-100': '#ffedd5',
        'bg-rose-100': '#ffe4e6',
        'bg-violet-100': '#ede9fe',
        'bg-blue-100': '#dbeafe',
    };

    const bgColor = colorMap[color] || '#f3f4f6';

    return (
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, height: 100 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={20} color={iconColor} />
            </View>
            <Text style={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: 14, color: '#1f2937', textAlign: 'center' }}>{value}</Text>
            {label ? <Text numberOfLines={1} style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>{label}</Text> : null}
        </View>
    );
}

// Placeholder for PlaneIcon since it wasn't imported
function PlaneIcon({ size, color, style, className }: any) {
    return <MapPin size={size} color={color} />; // Fallback
}
