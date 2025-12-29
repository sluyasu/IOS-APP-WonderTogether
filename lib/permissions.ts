import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionType = 'camera' | 'photos' | 'location';

export interface PermissionStatus {
    granted: boolean;
    canAskAgain: boolean;
}

/**
 * Request camera permission with user-friendly messaging
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
    try {
        const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();

        if (status === 'granted') {
            return { granted: true, canAskAgain: true };
        }

        if (!canAskAgain) {
            showPermissionDeniedAlert('Camera', 'capture beautiful travel moments');
        }

        return { granted: false, canAskAgain };
    } catch (error) {
        console.error('Error requesting camera permission:', error);
        return { granted: false, canAskAgain: false };
    }
}

/**
 * Request photo library permission with user-friendly messaging
 */
export async function requestPhotoLibraryPermission(): Promise<PermissionStatus> {
    try {
        const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status === 'granted') {
            return { granted: true, canAskAgain: true };
        }

        if (!canAskAgain) {
            showPermissionDeniedAlert('Photos', 'save and share your travel memories');
        }

        return { granted: false, canAskAgain };
    } catch (error) {
        console.error('Error requesting photo library permission:', error);
        return { granted: false, canAskAgain: false };
    }
}

/**
 * Request location permission with user-friendly messaging
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
    try {
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
            return { granted: true, canAskAgain: true };
        }

        if (!canAskAgain) {
            showPermissionDeniedAlert('Location', 'show your travels on the map and tag photos');
        }

        return { granted: false, canAskAgain };
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return { granted: false, canAskAgain: false };
    }
}

/**
 * Check if camera permission is already granted
 */
export async function checkCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
}

/**
 * Check if photo library permission is already granted
 */
export async function checkPhotoLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
}

/**
 * Check if location permission is already granted
 */
export async function checkLocationPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
}

/**
 * Show alert when permission is permanently denied
 */
function showPermissionDeniedAlert(permissionName: string, purpose: string) {
    Alert.alert(
        `${permissionName} Access Required`,
        `WonderTogether needs ${permissionName.toLowerCase()} access to ${purpose}. Please enable it in your device settings.`,
        [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Open Settings',
                onPress: () => {
                    if (Platform.OS === 'ios') {
                        Linking.openURL('app-settings:');
                    } else {
                        Linking.openSettings();
                    }
                },
            },
        ]
    );
}

/**
 * Request permission with automatic check
 * Returns true if permission is granted (either already or after requesting)
 */
export async function ensurePermission(type: PermissionType): Promise<boolean> {
    let hasPermission: boolean;

    // Check if we already have permission
    switch (type) {
        case 'camera':
            hasPermission = await checkCameraPermission();
            if (!hasPermission) {
                const result = await requestCameraPermission();
                hasPermission = result.granted;
            }
            break;
        case 'photos':
            hasPermission = await checkPhotoLibraryPermission();
            if (!hasPermission) {
                const result = await requestPhotoLibraryPermission();
                hasPermission = result.granted;
            }
            break;
        case 'location':
            hasPermission = await checkLocationPermission();
            if (!hasPermission) {
                const result = await requestLocationPermission();
                hasPermission = result.granted;
            }
            break;
    }

    return hasPermission;
}
