import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
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
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color="#3d405b" />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Settings</Text>
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>Manage your preferences</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}>
                {/* Menu Items */}
                <View style={{ gap: 8, marginBottom: 24 }}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => setActiveSection(item.id)}
                            style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${item.color}20` }}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>{item.label}</Text>
                                    <Text style={{ fontSize: 12, color: '#4b5563' }}>{item.description}</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Legal Links */}
                <View style={{ gap: 8, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => {
                            WebBrowser.openBrowserAsync('https://heroic-biscochitos-1892b8.netlify.app/privacy-policy.html');
                        }}
                        style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Lock size={18} color="#6b7280" />
                            <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>Privacy Policy</Text>
                        </View>
                        <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            WebBrowser.openBrowserAsync('https://heroic-biscochitos-1892b8.netlify.app/terms-of-service.html');
                        }}
                        style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Heart size={18} color="#6b7280" />
                            <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>Terms of Service</Text>
                        </View>
                        <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={{ alignItems: 'center', paddingBottom: 24 }}>
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>WonderTogether v1.0.0</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Made with love for my Sassou ❤️</Text>
                </View>
            </ScrollView>

            {/* Our Relationship Modal */}
            <Modal visible={activeSection === 'couple'} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Heart size={20} color="#f43f5e" />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Our Relationship</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 16 }}>
                                <View>
                                    <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: '500' }}>Couple Name</Text>
                                    <TextInput
                                        value={coupleName}
                                        onChangeText={setCoupleName}
                                        placeholder="e.g., Alex & Jordan"
                                        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#1f2937' }}
                                    />
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>How you want to be referred to together</Text>
                                </View>

                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Calendar size={14} color="#6b7280" />
                                        <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>Anniversary Date</Text>
                                    </View>
                                    <TextInput
                                        value={anniversaryDate}
                                        onChangeText={setAnniversaryDate}
                                        placeholder="YYYY-MM-DD"
                                        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#1f2937' }}
                                    />
                                </View>

                                {couple && !couple.partner2_id && (
                                    <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(224, 122, 95, 0.3)', backgroundColor: 'rgba(224, 122, 95, 0.05)', borderRadius: 12, padding: 12 }}>
                                        <Text style={{ fontSize: 12, color: '#4b5563', marginBottom: 8, textAlign: 'center' }}>Invite your partner with this code:</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <Text style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2, color: '#e07a5f' }}>
                                                {couple.invite_code}
                                            </Text>
                                            <TouchableOpacity onPress={copyInviteCode} style={{ padding: 8 }}>
                                                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#9ca3af" />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                                <TouchableOpacity
                                    onPress={() => setActiveSection(null)}
                                    style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveCouple}
                                    disabled={loading}
                                    style={{ flex: 1, backgroundColor: '#e07a5f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600' }}>{loading ? 'Saving...' : 'Save'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Notifications Modal */}
            <Modal visible={activeSection === 'notifications'} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Bell size={20} color="#f59e0b" />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Notifications</Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>Trip Reminders</Text>
                                    <Text style={{ fontSize: 12, color: '#4b5563' }}>Get notified before upcoming trips</Text>
                                </View>
                                <Switch value={tripReminders} onValueChange={setTripReminders} />
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>Partner Activity</Text>
                                    <Text style={{ fontSize: 12, color: '#4b5563' }}>When your partner adds photos or trips</Text>
                                </View>
                                <Switch value={partnerActivity} onValueChange={setPartnerActivity} />
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>Flight Deals</Text>
                                    <Text style={{ fontSize: 12, color: '#4b5563' }}>Alerts for matched destinations</Text>
                                </View>
                                <Switch value={flightDeals} onValueChange={setFlightDeals} />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            style={{ backgroundColor: '#e07a5f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginTop: 24 }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Preferences Modal */}
            <Modal visible={activeSection === 'preferences'} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Globe size={20} color="#3b82f6" />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Preferences</Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '500' }}>Currency</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {['USD', 'EUR', 'GBP', 'JPY'].map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            onPress={() => setCurrency(c)}
                                            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 2, borderColor: currency === c ? '#e07a5f' : '#e5e7eb', backgroundColor: currency === c ? 'rgba(224, 122, 95, 0.1)' : 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: currency === c ? '#e07a5f' : '#374151' }}>
                                                {c}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '500' }}>Units</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {['metric', 'imperial'].map((u) => (
                                        <TouchableOpacity
                                            key={u}
                                            onPress={() => setUnits(u)}
                                            style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center', borderColor: units === u ? '#e07a5f' : '#e5e7eb', backgroundColor: units === u ? 'rgba(224, 122, 95, 0.1)' : 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '600', textTransform: 'capitalize', color: units === u ? '#e07a5f' : '#374151' }}>
                                                {u}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            style={{ backgroundColor: '#e07a5f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginTop: 24 }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>Save Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Account Modal */}
            <Modal visible={activeSection === 'account'} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <User size={20} color="#64748b" />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Account</Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: '500' }}>Email</Text>
                                <TextInput
                                    value={user?.email || ''}
                                    editable={false}
                                    style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#6b7280', backgroundColor: '#f3f4f6' }}
                                />
                            </View>

                            <TouchableOpacity
                                disabled
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f3f4f6' }}
                            >
                                <Lock size={16} color="#9ca3af" />
                                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Change Password</Text>
                            </TouchableOpacity>

                            {/* Danger Zone */}
                            <View style={{ borderWidth: 2, borderColor: '#fecaca', backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, marginTop: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                    <AlertTriangle size={20} color="#ef4444" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#b91c1c' }}>Danger Zone</Text>
                                        <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                                            Deleting your account will remove all your data permanently.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={handleDeleteAccount}
                                            style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
                                        >
                                            <Trash2 size={14} color="white" />
                                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Delete Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setActiveSection(null)}
                            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginTop: 24 }}
                        >
                            <Text style={{ color: '#374151', fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
