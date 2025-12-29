import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Map } from 'lucide-react-native';

export default function MapScreen() {
    const router = useRouter();

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Map View</Text>
                </View>
            </View>

            {/* Coming Soon Message */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, alignItems: 'center', width: '100%', maxWidth: 400 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(224,122,95,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Map size={40} color="#e07a5f" />
                    </View>

                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 }}>
                        Coming Soon!
                    </Text>

                    <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                        We're working on an amazing interactive map to visualize all your travel adventures. Stay tuned!
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: '#e07a5f', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}
