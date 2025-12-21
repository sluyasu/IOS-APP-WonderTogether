import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Heart } from 'lucide-react-native';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';

interface CoupleCoverPhotoProps {
    coupleId: string;
    coupleName: string;
    coverUrl?: string | null;
    anniversaryDate?: string | null;
    onRefresh?: () => void;
}

export default function CoupleCoverPhoto({
    coupleId,
    coupleName,
    coverUrl,
    anniversaryDate,
    onRefresh,
}: CoupleCoverPhotoProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [localCoverUrl, setLocalCoverUrl] = useState(coverUrl);

    const handleImagePick = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to upload a cover photo!');
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setLocalCoverUrl(imageUri);

            // TODO: Upload to Supabase Storage
            // For now, just update the local state and database with URI
            try {
                setIsUploading(true);
                await supabase
                    .from('couples')
                    .update({ cover_photo_url: imageUri })
                    .eq('id', coupleId);
                onRefresh?.();
            } catch (error) {
                console.error('Error updating cover photo:', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const formatAnniversary = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, 'MMMM d, yyyy');
    };

    return (
        <View className="rounded-3xl overflow-hidden shadow-2xl mb-4 mt-4">
            {/* Cover Image - Much taller to match web design */}
            <View className="relative h-64">
                {localCoverUrl ? (
                    <Image
                        source={{ uri: localCoverUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={['#e07a5f', '#f59e88', '#f0b8a0']}
                        className="w-full h-full items-center justify-center"
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View className="items-center">
                            <Heart size={64} color="white" opacity={0.4} />
                            <Text className="text-white text-base mt-4 font-semibold">Add your couple photo</Text>
                            <Text className="text-white/70 text-xs mt-1">Tap the camera icon</Text>
                        </View>
                    </LinearGradient>
                )}

                {/* Dark Gradient Overlay - stronger at bottom */}
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.75)']}
                    className="absolute inset-0"
                    locations={[0, 0.5, 1]}
                />

                {/* Edit Button - top right corner */}
                <TouchableOpacity
                    onPress={handleImagePick}
                    disabled={isUploading}
                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md rounded-full p-3 shadow"
                    style={{ elevation: 5 }}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : localCoverUrl ? (
                        <Edit2 size={18} color="white" />
                    ) : (
                        <Camera size={18} color="white" />
                    )}
                </TouchableOpacity>

                {/* Couple Info - bottom left with better typography */}
                <View className="absolute bottom-0 left-0 right-0 p-6">
                    <View className="flex-row items-center gap-2 mb-2">
                        <Heart size={20} color="white" fill="white" />
                        <Text className="font-serif text-3xl font-bold text-white drop-shadow">
                            {coupleName}
                        </Text>
                    </View>
                    {anniversaryDate && (
                        <Text className="text-white/90 text-sm font-medium">
                            Together since {formatAnniversary(anniversaryDate)}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}
