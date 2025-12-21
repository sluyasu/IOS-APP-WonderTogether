import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Plane, MapPin, Camera } from "lucide-react-native";

export default function LandingPage() {
    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']} // approximate amber-50, rose-50, sky-50
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
        >
            <View className="flex-1 items-center justify-center p-6 bg-transparent">
                {/* Logo */}
                <LinearGradient
                    colors={['#e07a5f', '#fb7185']} // terracotta to rose-400
                    className="w-20 h-20 rounded-full mb-6 items-center justify-center shadow-lg"
                >
                    <Heart color="white" size={40} fill="white" />
                </LinearGradient>

                <Text className="text-4xl text-gray-800 font-bold mb-4 text-center">
                    WanderTogether
                </Text>
                <Text className="text-gray-500 text-lg mb-8 text-center max-w-xs">
                    Plan romantic adventures, discover destinations, and create memories with your travel partner.
                </Text>

                {/* Features */}
                <View className="flex-row justify-between w-full max-w-sm mb-10 gap-4">
                    <View className="items-center gap-2 flex-1">
                        <View className="w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
                            <Plane color="#e07a5f" size={24} />
                        </View>
                        <Text className="text-xs text-gray-500">Discover</Text>
                    </View>
                    <View className="items-center gap-2 flex-1">
                        <View className="w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
                            <MapPin color="#e07a5f" size={24} />
                        </View>
                        <Text className="text-xs text-gray-500">Explore</Text>
                    </View>
                    <View className="items-center gap-2 flex-1">
                        <View className="w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
                            <Camera color="#e07a5f" size={24} />
                        </View>
                        <Text className="text-xs text-gray-500">Remember</Text>
                    </View>
                </View>

                {/* CTA Buttons */}
                <View className="w-full max-w-xs gap-3">
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity>
                            <LinearGradient
                                colors={['#e07a5f', '#fb7185']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                className="h-12 rounded-xl items-center justify-center shadow-lg"
                            >
                                <Text className="text-white font-medium text-lg">Get Started</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/auth/login" asChild>
                        <TouchableOpacity className="h-12 rounded-xl border-2 border-terracotta items-center justify-center bg-transparent active:bg-terracotta/10">
                            <Text className="text-terracotta font-medium text-lg">Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <Text className="text-xs text-stone-400 mt-8">
                    Made with love for couples who love to travel
                </Text>
            </View>
        </LinearGradient>
    );
}
