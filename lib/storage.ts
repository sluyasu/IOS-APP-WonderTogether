import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';


// ============================================
// Avatar Upload
// ============================================

/**
 * Upload user avatar to Supabase Storage
 * Resizes image to 512x512 and compresses before upload
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: any }> {
    try {
        // Resize and compress image
        const manipResult = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 512, height: 512 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload to storage
        const filePath = `${userId}.jpg`;

        // Create FormData for file upload (React Native compatible)
        const formData = new FormData();
        formData.append('file', {
            uri: manipResult.uri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
        } as any);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, formData, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return { url: null, error };
    }
}

/**
 * Upload group avatar to Supabase Storage
 */
export async function uploadGroupAvatar(groupId: string, imageUri: string): Promise<{ url: string | null; error: any }> {
    try {
        // Fetch image as blob (no manipulation to avoid empty file issue)
        const response = await fetch(imageUri);
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('Blob is empty! Size is 0 bytes.');
        }

        // Upload to covers bucket organized by group ID
        const filePath = `${groupId}/${Date.now()}.jpg`;

        // Create FormData for file upload (React Native compatible)
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        } as any);

        const { error: uploadError } = await supabase.storage
            .from('covers')
            .upload(filePath, formData, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('[uploadGroupAvatar] Upload error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
            .from('covers')
            .getPublicUrl(filePath);

        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('[uploadGroupAvatar] Error uploading group avatar:', error);
        return { url: null, error };
    }
}

// ============================================
// Existing Memory Upload (keep unchanged)
// ============================================

export async function uploadToSupabase(uri: string, bucket: string, path: string): Promise<string | null> {
    try {
        // Convert image to JPEG (handles HEIC and other formats)
        let processedUri = uri;

        // Check if image needs conversion (HEIC or other unsupported formats)
        if (uri.toLowerCase().includes('.heic') || uri.toLowerCase().includes('.heif')) {
            console.log('[uploadToSupabase] Converting HEIC to JPEG...');
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedUri = manipResult.uri;
        }

        // Create FormData for file upload (React Native compatible)
        const formData = new FormData();
        formData.append('file', {
            uri: processedUri,
            type: 'image/jpeg',
            name: path.split('/').pop() || 'image.jpg',
        } as any);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, formData, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        return null;
    }
}
