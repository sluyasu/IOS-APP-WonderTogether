import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GroupProvider } from '../contexts/GroupContext';
import ErrorBoundary from '../components/ErrorBoundary';

import { StripeProvider } from '@stripe/stripe-react-native';

import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Pacifico_400Regular,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ErrorBoundary>
            <StripeProvider
                publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
                merchantIdentifier="merchant.com.wondertogether" // Optional, for Apple Pay
            >
                <SafeAreaProvider>
                    <GroupProvider>
                        <StatusBar style="dark" />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="auth/login/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="auth/sign-up/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="group-onboarding/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="group-creation/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="group-join/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="app-tour/index" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="(app)" options={{ headerShown: false }} />
                        </Stack>
                    </GroupProvider>
                </SafeAreaProvider>
            </StripeProvider>
        </ErrorBoundary>
    );
}
