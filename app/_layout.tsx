import "../global.css";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/login/index" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="auth/sign-up/index" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
        </View>
    );
}
