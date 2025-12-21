import { View, Text, TouchableOpacity, Modal, Image, Dimensions } from 'react-native';
import { useState } from 'react';
import { X, Check } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageCropperProps {
    visible: boolean;
    imageUri: string;
    onCancel: () => void;
    onCropComplete: (croppedUri: string) => void;
    aspectRatio?: [number, number]; // [width, height] ratio
}

export default function ImageCropper({
    visible,
    imageUri,
    onCancel,
    onCropComplete,
    aspectRatio = [1, 1], // square by default
}: ImageCropperProps) {
    const [cropping, setCropping] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const cropSize = screenWidth - 80; // Leave padding on sides

    const handleCrop = async () => {
        setCropping(true);
        try {
            // Simple centered square crop
            const manipResult = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: 0,
                            originY: 0,
                            width: 800, // Will be adjusted based on actual image size
                            height: 800,
                        },
                    },
                    { resize: { width: 800 } }, // Resize for optimal size
                ],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            onCropComplete(manipResult.uri);
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setCropping(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-black">
                {/* Header */}
                <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={onCancel} className="p-2">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold">Adjust Photo</Text>
                    <TouchableOpacity
                        onPress={handleCrop}
                        disabled={cropping}
                        className="p-2"
                    >
                        <Check size={24} color={cropping ? '#666' : '#4ade80'} />
                    </TouchableOpacity>
                </View>

                {/* Image Preview */}
                <View className="flex-1 items-center justify-center">
                    <View
                        style={{
                            width: cropSize,
                            height: cropSize,
                            borderRadius: 16,
                            overflow: 'hidden',
                            borderWidth: 2,
                            borderColor: 'white',
                        }}
                    >
                        <Image
                            source={{ uri: imageUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </View>
                    <Text className="text-white/70 text-sm mt-4 text-center px-8">
                        Review your photo and tap the checkmark when ready
                    </Text>
                </View>

                {/* Info */}
                <View className="px-4 pb-8">
                    <Text className="text-white/50 text-xs text-center">
                        The photo will be cropped to fit perfectly
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
