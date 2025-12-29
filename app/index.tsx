import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Plane, MapPin, Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LandingPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        console.log('LandingPage: Starting auth check...');
        // Check if user is already authenticated
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('LandingPage: Session check result:', session ? 'Logged in' : 'Not logged in');
                if (session) {
                    // User is logged in, check if they have any groups
                    console.log('LandingPage: Checking for groups...');

                    const { data: userGroups, error: groupsError } = await supabase
                        .from('group_members')
                        .select('group_id')
                        .eq('user_id', session.user.id)
                        .eq('is_active', true);

                    if (groupsError) {
                        console.error('LandingPage: Error fetching groups:', groupsError);
                        // On error, still redirect to app and let it handle
                        router.replace('/(app)');
                    } else if (!userGroups || userGroups.length === 0) {
                        // No groups, go directly to onboarding
                        console.log('LandingPage: No groups found, redirecting to onboarding');
                        router.replace('/group-onboarding');
                    } else {
                        // Has groups, go to app
                        console.log('LandingPage: Groups found, redirecting to app');
                        router.replace('/(app)');
                    }
                } else {
                    // Not logged in, show landing page
                    console.log('LandingPage: Showing landing page');
                    setChecking(false);
                }
            } catch (error: any) {
                console.error('LandingPage: Error checking auth:', error);
                // On any error, show landing page
                setChecking(false);
            }
        };
        checkAuth();
    }, [router]);

    console.log('LandingPage: Rendering, checking=', checking);

    if (checking) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbf0' }}>
                <ActivityIndicator size="large" color="#e07a5f" />
                <Text style={{ marginTop: 20, color: '#000' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                {/* Logo */}
                <LinearGradient
                    colors={['#e07a5f', '#fb7185']}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 24,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Heart color="white" size={40} fill="white" />
                </LinearGradient>

                <Text style={{ fontSize: 36, color: '#1f2937', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                    WanderTogether
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 18, marginBottom: 32, textAlign: 'center', maxWidth: 300 }}>
                    Plan romantic adventures, discover destinations, and create memories with your travel partner.
                </Text>

                {/* Features */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 350, marginBottom: 40, gap: 16 }}>
                    <View style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <Plane color="#e07a5f" size={24} />
                        </View>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Discover</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin color="#e07a5f" size={24} />
                        </View>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Explore</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <Camera color="#e07a5f" size={24} />
                        </View>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Remember</Text>
                    </View>
                </View>

                {/* CTA Buttons */}
                <View style={{ width: '100%', maxWidth: 300, gap: 12 }}>
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity>
                            <LinearGradient
                                colors={['#e07a5f', '#fb7185']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{ height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: 'white', fontWeight: '500', fontSize: 18 }}>Get Started</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/auth/login" asChild>
                        <TouchableOpacity style={{ height: 48, borderRadius: 12, borderWidth: 2, borderColor: '#e07a5f', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
                            <Text style={{ color: '#e07a5f', fontWeight: '500', fontSize: 18 }}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <Text style={{ fontSize: 12, color: '#a8a29e', marginTop: 32 }}>
                    Made with love for couples who love to travel
                </Text>
            </View>
        </LinearGradient>
    );
}
