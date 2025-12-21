import { Tabs } from 'expo-router';
import { Heart, Map as MapIcon, Calendar, Image as ImageIcon, User } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function AppLayout() {
    return (
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
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
