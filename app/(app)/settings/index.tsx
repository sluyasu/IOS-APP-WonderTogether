import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
    ArrowLeft, Bell, Globe, Heart, Lock, Palette, Trash2, User,
    Calendar, Copy, Check, ChevronRight, AlertTriangle
} from 'lucide-react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [couple, setCouple] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [coupleName, setCoupleName] = useState('');
    const [anniversaryDate, setAnniversaryDate] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [units, setUnits] = useState('metric');
    const [tripReminders, setTripReminders] = useState(true);
    const [partnerActivity, setPartnerActivity] = useState(true);
    const [flightDeals, setFlightDeals] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user: userData } } = await supabase.auth.getUser();
        setUser(userData);

        if (userData) {
            const { data: coupleData } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${userData.id},partner2_id.eq.${userData.id}`)
                .single();

            if (coupleData) {
                setCouple(coupleData);
                setCoupleName(coupleData.couple_name || '');
                setAnniversaryDate(coupleData.anniversary_date || '');
            }
        }
    };

    const copyInviteCode = async () => {
        if (couple?.invite_code) {
            await Clipboard.setStringAsync(couple.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSaveCouple = async () => {
        setLoading(true);
        await supabase
            .from('couples')
            .update({
                couple_name: coupleName.trim() || null,
                anniversary_date: anniversaryDate || null,
            })
            .eq('id', couple.id);

        setActiveSection(null);
        setLoading(false);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/auth/login');
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            id: 'couple',
            icon: Heart,
            label: 'Our Relationship',
            description: 'Couple name, anniversary, invite partner',
            color: '#f43f5e',
        },
        {
            id: 'notifications',
            icon: Bell,
            label: 'Notifications',
            description: 'Trip reminders, partner activity',
            color: '#f59e0b',
        },
        {
            id: 'preferences',
            icon: Globe,
            label: 'Preferences',
            description: 'Currency, units, language',
            color: '#3b82f6',
        },
        {
            id: 'account',
            icon: User,
            label: 'Account',
            description: 'Email, password, delete account',
            color: '#64748b',
        },
    ];

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View>
                    <Text className="text-2xl font-bold text-gray-800">Settings</Text>
                    <Text className="text-xs text-gray-600">Manage your preferences</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Menu Items */}
                <View className="gap-2 mb-6">
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => setActiveSection(item.id)}
                            className="bg-white rounded-xl shadow p-4 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center gap-3 flex-1">
                                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">{item.label}</Text>
                                    <Text className="text-xs text-gray-600">{item.description}</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View className="items-center pb-6">
                    <Text className="text-xs text-gray-600">WonderTogether v1.0.0</Text>
                    <Text className="text-xs text-gray-500">Made with love for couples who love to travel</Text>
                </View>
            </ScrollView>

            {/* Our Relationship Modal */}
            <Modal visible={activeSection === 'couple'} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
                        <View className="flex-row items-center gap-2 mb-4">
                            <Heart size={20} color="#f43f5e" />
                            <Text className="text-xl font-bold text-gray-800">Our Relationship</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm text-gray-700 mb-1 font-medium">Couple Name</Text>
                                    <TextInput
                                        value={coupleName}
                                        onChangeText={setCoupleName}
                                        placeholder="e.g., Alex & Jordan"
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    />
                                    <Text className="text-xs text-gray-500 mt-1">How you want to be referred to together</Text>
                                </View>

                                <View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <Calendar size={14} color="#6b7280" />
                                        <Text className="text-sm text-gray-700 font-medium">Anniversary Date</Text>
                                    </View>
                                    <TextInput
                                        value={anniversaryDate}
                                        onChangeText={setAnniversaryDate}
                                        placeholder="YYYY-MM-DD"
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    />
                                </View>

                                {couple && !couple.partner2_id && (
                                    <View className="border-2 border-dashed border-terracotta/30 bg-terracotta/5 rounded-xl p-3">
                                        <Text className="text-xs text-gray-600 mb-2 text-center">Invite your partner with this code:</Text>
                                        <View className="flex-row items-center justify-center gap-2">
                                            <Text className="text-2xl font-mono font-bold tracking-widest text-terracotta">
                                                {couple.invite_code}
                                            </Text>
                                            <TouchableOpacity onPress={copyInviteCode} className="p-2">
                                                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#9ca3af" />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row gap-3 mt-6">
                                <TouchableOpacity
                                    onPress={() => setActiveSection(null)}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 items-center"
                                >
                                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveCouple}
                                    disabled={loading}
                                    className="flex-1 bg-terracotta rounded-xl px-4 py-3 items-center"
                                >
                                    <Text className="text-white font-semibold">{loading ? 'Saving...' : 'Save'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Notifications Modal */}
            <Modal visible={activeSection === 'notifications'} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row items-center gap-2 mb-4">
                            <Bell size={20} color="#f59e0b" />
                            <Text className="text-xl font-bold text-gray-800">Notifications</Text>
                        </View>

                        <View className="gap-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">Trip Reminders</Text>
                                    <Text className="text-xs text-gray-600">Get notified before upcoming trips</Text>
                                </View>
                                <Switch value={tripReminders} onValueChange={setTripReminders} />
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">Partner Activity</Text>
                                    <Text className="text-xs text-gray-600">When your partner adds photos or trips</Text>
                                </View>
                                <Switch value={partnerActivity} onValueChange={setPartnerActivity} />
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">Flight Deals</Text>
                                    <Text className="text-xs text-gray-600">Alerts for matched destinations</Text>
                                </View>
                                <Switch value={flightDeals} onValueChange={setFlightDeals} />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            className="bg-terracotta rounded-xl px-4 py-3 items-center mt-6"
                        >
                            <Text className="text-white font-semibold">Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Preferences Modal */}
            <Modal visible={activeSection === 'preferences'} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row items-center gap-2 mb-4">
                            <Globe size={20} color="#3b82f6" />
                            <Text className="text-xl font-bold text-gray-800">Preferences</Text>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm text-gray-700 mb-2 font-medium">Currency</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {['USD', 'EUR', 'GBP', 'JPY'].map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            onPress={() => setCurrency(c)}
                                            className={`px-4 py-2 rounded-lg border-2 ${currency === c ? 'border-terracotta bg-terracotta/10' : 'border-gray-200'
                                                }`}
                                        >
                                            <Text className={`text-sm font-semibold ${currency === c ? 'text-terracotta' : 'text-gray-700'}`}>
                                                {c}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm text-gray-700 mb-2 font-medium">Units</Text>
                                <View className="flex-row gap-2">
                                    {['metric', 'imperial'].map((u) => (
                                        <TouchableOpacity
                                            key={u}
                                            onPress={() => setUnits(u)}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 items-center ${units === u ? 'border-terracotta bg-terracotta/10' : 'border-gray-200'
                                                }`}
                                        >
                                            <Text className={`text-sm font-semibold capitalize ${units === u ? 'text-terracotta' : 'text-gray-700'}`}>
                                                {u}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            className="bg-terracotta rounded-xl px-4 py-3 items-center mt-6"
                        >
                            <Text className="text-white font-semibold">Save Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Account Modal */}
            <Modal visible={activeSection === 'account'} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row items-center gap-2 mb-4">
                            <User size={20} color="#64748b" />
                            <Text className="text-xl font-bold text-gray-800">Account</Text>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm text-gray-700 mb-1 font-medium">Email</Text>
                                <TextInput
                                    value={user?.email || ''}
                                    editable={false}
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-500 bg-gray-100"
                                />
                            </View>

                            <TouchableOpacity
                                disabled
                                className="flex-row items-center justify-center gap-2 border border-gray-300 rounded-xl px-4 py-3 bg-gray-100"
                            >
                                <Lock size={16} color="#9ca3af" />
                                <Text className="text-gray-500 font-semibold">Change Password</Text>
                            </TouchableOpacity>

                            {/* Danger Zone */}
                            <View className="border-2 border-red-200 bg-red-50 rounded-xl p-4 mt-4">
                                <View className="flex-row items-start gap-3">
                                    <AlertTriangle size={20} color="#ef4444" />
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-red-700">Danger Zone</Text>
                                        <Text className="text-xs text-red-600 mt-1">
                                            Deleting your account will remove all your data permanently.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={handleDeleteAccount}
                                            className="bg-red-600 rounded-lg px-4 py-2 flex-row items-center gap-2 mt-3"
                                        >
                                            <Trash2 size={14} color="white" />
                                            <Text className="text-white font-semibold text-sm">Delete Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            className="border border-gray-300 rounded-xl px-4 py-3 items-center mt-6"
                        >
                            <Text className="text-gray-700 font-semibold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
