import { Tabs, useRouter, usePathname } from 'expo-router';
import { Heart, Map as MapIcon, Calendar, Image as ImageIcon, User, MessageCircle } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useGroup } from '../../contexts/GroupContext';

export default function AppLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const [currentTabIndex, setCurrentTabIndex] = useState(0);
    const { allGroups, isLoading } = useGroup();

    // Redirect to onboarding if user has no group
    useEffect(() => {
        if (!isLoading && allGroups.length === 0) {
            console.log('[AppLayout] No groups found, redirecting to onboarding');
            router.replace('/group-onboarding');
        }
    }, [isLoading, allGroups, router]);

    // Define tab order (only visible tabs in tab bar)
    const tabRoutes = [
        { name: 'index', path: '/' },
        { name: 'calendar', path: '/calendar' },
        { name: 'memories', path: '/memories' },
        { name: 'campfire', path: '/campfire' },
        { name: 'profile', path: '/profile' },
    ];

    // Update current tab index when pathname changes
    useEffect(() => {
        const index = tabRoutes.findIndex(tab => {
            if (tab.path === '/') return pathname === '/';
            return pathname.startsWith(tab.path);
        });
        if (index !== -1) {
            setCurrentTabIndex(index);
        }
    }, [pathname]);

    const navigateToTab = (direction: 'next' | 'previous') => {
        let newIndex = currentTabIndex;

        if (direction === 'next' && currentTabIndex < tabRoutes.length - 1) {
            newIndex = currentTabIndex + 1;
        } else if (direction === 'previous' && currentTabIndex > 0) {
            newIndex = currentTabIndex - 1;
        } else {
            // At edge, just return (no navigation)
            return;
        }

        // Navigate to new tab
        router.push(tabRoutes[newIndex].path);
    };

    // Create pan gesture
    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10]) // Require 10px movement to activate
        .failOffsetY([-10, 10]) // Fail if vertical movement is too much
        .onEnd((event) => {
            // Check if swipe was strong enough (velocity threshold)
            const SWIPE_VELOCITY_THRESHOLD = 500;

            if (Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD) {
                if (event.velocityX > 0) {
                    //Swipe right - go to previous tab
                    navigateToTab('previous');
                } else {
                    // Swipe left - go to next tab
                    navigateToTab('next');
                }
            }
        });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbf0' }}>
                    {/* Simple loading spinner while checking group status */}
                </View>
            ) : (
                <GestureDetector gesture={panGesture}>
                    <View collapsable={false} style={{ flex: 1 }}>
                        <Tabs
                            screenOptions={{
                                header: () => <AppHeader />,
                                headerShown: true,
                                tabBarActiveTintColor: '#e07a5f',
                                tabBarInactiveTintColor: '#9ca3af',
                                tabBarStyle: {
                                    borderTopWidth: 0,
                                    elevation: 0,
                                    height: 60,
                                    paddingBottom: 10,
                                    paddingTop: 10,
                                },
                            }}
                        >
                            <Tabs.Screen
                                name="index"
                                options={{
                                    title: 'Home',
                                    tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
                                }}
                            />

                            <Tabs.Screen
                                name="map"
                                options={{
                                    title: 'Map',
                                    tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
                                    href: null, // Hide from tab bar
                                }}
                            />
                            <Tabs.Screen
                                name="calendar"
                                options={{
                                    title: 'Calendar',
                                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
                                }}
                            />
                            <Tabs.Screen
                                name="memories"
                                options={{
                                    title: 'Memories',
                                    tabBarIcon: ({ color, size }) => <ImageIcon color={color} size={size} />,
                                }}
                            />
                            <Tabs.Screen
                                name="campfire"
                                options={{
                                    title: "Chat",
                                    tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
                                }}
                            />
                            <Tabs.Screen
                                name="profile"
                                options={{
                                    title: 'Profile',
                                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                                }}
                            />

                            {/* Hide all other routes from tab bar */}
                            <Tabs.Screen name="timeline" options={{ href: null }} />
                            <Tabs.Screen name="add-trip/index" options={{ href: null }} />
                            <Tabs.Screen name="bucket-list/index" options={{ href: null }} />
                            <Tabs.Screen name="settings/index" options={{ href: null }} />
                            <Tabs.Screen name="stats/index" options={{ href: null }} />
                            <Tabs.Screen name="trip/[id]" options={{ href: null }} />
                            <Tabs.Screen name="trip/ai-plan" options={{ href: null }} />
                            <Tabs.Screen name="trips-list/index" options={{ href: null }} />
                            <Tabs.Screen name="wishlist/index" options={{ href: null }} />
                            <Tabs.Screen name="group-details/[id]" options={{ href: null }} />
                        </Tabs>
                    </View>
                </GestureDetector>
            )}
        </GestureHandlerRootView>
    );
}
