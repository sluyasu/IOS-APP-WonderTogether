import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { Plus, MapPin, Star, Check, Trash2, Edit2, Sparkles, ArrowLeft } from 'lucide-react-native';

interface BucketListItem {
    id: string;
    destination: string;
    country: string;
    reason: string | null;
    priority: number;
    status: 'wishlist' | 'completed';
    best_time_to_visit: string | null;
}

export default function BucketListScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [couple, setCouple] = useState<any>(null);
    const [items, setItems] = useState<BucketListItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'wishlist' | 'completed'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [destination, setDestination] = useState('');
    const [country, setCountry] = useState('');
    const [reason, setReason] = useState('');
    const [priority, setPriority] = useState('2');
    const [bestTime, setBestTime] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/auth/login');
                return;
            }

            const { data: coupleData } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .single();
            setCouple(coupleData);

            if (coupleData) {
                const { data } = await supabase
                    .from('bucket_list')
                    .select('*')
                    .eq('couple_id', coupleData.id)
                    .order('priority', { ascending: false })
                    .order('created_at', { ascending: false });

                setItems(data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setDestination('');
        setCountry('');
        setReason('');
        setPriority('2');
        setBestTime('');
        setEditingItem(null);
    };

    const openEditModal = (item: BucketListItem) => {
        setEditingItem(item);
        setDestination(item.destination);
        setCountry(item.country);
        setReason(item.reason || '');
        setPriority(item.priority.toString());
        setBestTime(item.best_time_to_visit || '');
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!destination.trim() || !country.trim()) {
            Alert.alert('Error', 'Please fill in destination and country');
            return;
        }

        setSaving(true);
        try {
            const itemData = {
                couple_id: couple.id,
                destination: destination.trim(),
                country: country.trim(),
                reason: reason.trim() || null,
                priority: parseInt(priority),
                best_time_to_visit: bestTime.trim() || null,
                image_url: null,
            };

            if (editingItem) {
                await supabase.from('bucket_list').update(itemData).eq('id', editingItem.id);
            } else {
                await supabase.from('bucket_list').insert(itemData);
            }

            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            Alert.alert('Error', 'Failed to save destination');
        } finally {
            setSaving(false);
        }
    };

    const toggleComplete = async (item: BucketListItem) => {
        const newStatus = item.status === 'completed' ? 'wishlist' : 'completed';
        await supabase
            .from('bucket_list')
            .update({
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            })
            .eq('id', item.id);
        fetchData();
    };

    const deleteItem = async (id: string) => {
        Alert.alert(
            'Delete Destination',
            'Are you sure you want to remove this from your bucket list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('bucket_list').delete().eq('id', id);
                        fetchData();
                    },
                },
            ]
        );
    };

    const filteredItems = items.filter((item) => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    const completedCount = items.filter(i => i.status === 'completed').length;
    const totalCount = items.length;

    if (loading) {
        return (
            <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#e07a5f" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} className="flex-1">
            <ScrollView className="flex-1 px-4 py-4">
                {/* Header */}
                <View className="flex-row items-center gap-3 mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
                        <ArrowLeft size={20} color="#3d405b" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-800">Dream Destinations</Text>
                        <Text className="text-xs text-gray-600">
                            {completedCount} of {totalCount} explored
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => { resetForm(); setShowAddModal(true); }}
                        className="bg-terracotta px-3 py-2 rounded-lg"
                    >
                        <Plus size={16} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                {totalCount > 0 && (
                    <View className="mb-4">
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-gradient-to-r from-terracotta to-amber-500 rounded-full"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                        </View>
                        <Text className="text-xs text-center text-gray-600 mt-1">
                            {Math.round((completedCount / totalCount) * 100)}% of your dream list complete!
                        </Text>
                    </View>
                )}

                {/* Filter Tabs */}
                <View className="flex-row gap-2 mb-4">
                    {(['all', 'wishlist', 'completed'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full ${filter === f ? 'bg-terracotta' : 'bg-white'
                                }`}
                        >
                            <Text className={`text-xs font-semibold capitalize ${filter === f ? 'text-white' : 'text-gray-700'
                                }`}>
                                {f === 'all' ? 'All' : f === 'wishlist' ? 'Wishlist' : 'Visited'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <View className="items-center justify-center py-12">
                        <View className="w-16 h-16 rounded-full bg-terracotta/10 items-center justify-center mb-4">
                            <MapPin size={32} color="#e07a5f" />
                        </View>
                        <Text className="text-lg font-semibold text-gray-800 mb-2">No destinations yet</Text>
                        <Text className="text-sm text-gray-600 mb-4 text-center px-8">
                            Start adding your dream destinations to explore together!
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowAddModal(true)}
                            className="bg-terracotta px-6 py-3 rounded-xl flex-row items-center gap-2"
                        >
                            <Plus size={16} color="white" />
                            <Text className="text-white font-semibold">Add First Destination</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bucket List Grid */}
                <View className="flex-row flex-wrap gap-3">
                    {filteredItems.map((item) => (
                        <View key={item.id} className="w-[48%]">
                            <View className="bg-white rounded-2xl shadow-md overflow-hidden">
                                {/* Image Placeholder */}
                                <View className="aspect-[4/3] bg-gradient-to-br from-terracotta/20 to-amber-100 relative">
                                    <LinearGradient
                                        colors={['#e07a5f20', '#f2cc8f40']}
                                        className="absolute inset-0 items-center justify-center"
                                    >
                                        <Text className="text-5xl">🌍</Text>
                                    </LinearGradient>

                                    {/* Priority Stars */}
                                    <View className="absolute top-2 left-2 flex-row gap-0.5">
                                        {Array.from({ length: item.priority }).map((_, i) => (
                                            <Star key={i} size={12} color="#f2cc8f" fill="#f2cc8f" />
                                        ))}
                                    </View>

                                    {/* Action Buttons */}
                                    <View className="absolute top-2 right-2 flex-row gap-1">
                                        <TouchableOpacity
                                            onPress={() => openEditModal(item)}
                                            className="w-6 h-6 bg-white/90 rounded-full items-center justify-center"
                                        >
                                            <Edit2 size={12} color="#3d405b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => deleteItem(item.id)}
                                            className="w-6 h-6 bg-white/90 rounded-full items-center justify-center"
                                        >
                                            <Trash2 size={12} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Completed Badge */}
                                    {item.status === 'completed' && (
                                        <View className="absolute inset-0 bg-emerald-500/20 items-center justify-center">
                                            <View className="w-12 h-12 bg-emerald-500 rounded-full items-center justify-center">
                                                <Check size={24} color="white" />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Content */}
                                <View className="p-3">
                                    <Text className="text-sm font-bold text-gray-800 mb-0.5" numberOfLines={1}>
                                        {item.destination}
                                    </Text>
                                    <View className="flex-row items-center gap-1 mb-1">
                                        <MapPin size={10} color="#9ca3af" />
                                        <Text className="text-xs text-gray-600">{item.country}</Text>
                                    </View>
                                    {item.reason && (
                                        <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>
                                            {item.reason}
                                        </Text>
                                    )}
                                    {item.best_time_to_visit && (
                                        <View className="bg-amber-100 px-2 py-1 rounded-full flex-row items-center gap-1 mb-2 self-start">
                                            <Sparkles size={10} color="#f59e0b" />
                                            <Text className="text-[10px] text-amber-700 font-medium">
                                                {item.best_time_to_visit}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => toggleComplete(item)}
                                        className="bg-gray-100 rounded-lg px-3 py-2 items-center"
                                    >
                                        <Text className="text-xs text-gray-700 font-medium">
                                            {item.status === 'completed' ? 'Mark as Wishlist' : 'Mark as Visited'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
                        <Text className="text-xl font-bold text-gray-800 mb-4">
                            {editingItem ? 'Edit Destination' : 'Add Dream Destination'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="gap-4">
                                {/* Destination */}
                                <View>
                                    <Text className="text-sm text-gray-700 mb-1 font-medium">Destination</Text>
                                    <TextInput
                                        value={destination}
                                        onChangeText={setDestination}
                                        placeholder="e.g., Santorini"
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    />
                                </View>

                                {/* Country */}
                                <View>
                                    <Text className="text-sm text-gray-700 mb-1 font-medium">Country</Text>
                                    <TextInput
                                        value={country}
                                        onChangeText={setCountry}
                                        placeholder="e.g., Greece"
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    />
                                </View>

                                {/* Reason */}
                                <View>
                                    <Text className="text-sm text-gray-700 mb-1 font-medium">Why do you want to go?</Text>
                                    <TextInput
                                        value={reason}
                                        onChangeText={setReason}
                                        placeholder="The beautiful sunsets and romantic vibes..."
                                        multiline
                                        numberOfLines={3}
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Priority & Best Time */}
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-sm text-gray-700 mb-1 font-medium">Priority</Text>
                                        <View className="flex-row gap-2">
                                            {['1', '2', '3'].map((p) => (
                                                <TouchableOpacity
                                                    key={p}
                                                    onPress={() => setPriority(p)}
                                                    className={`flex-1 border-2 rounded-xl px-3 py-2 items-center ${priority === p ? 'border-terracotta bg-terracotta/10' : 'border-gray-200'
                                                        }`}
                                                >
                                                    <Text className={`text-xs font-semibold ${priority === p ? 'text-terracotta' : 'text-gray-600'
                                                        }`}>
                                                        {p} ⭐
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                {/* Best Time */}
                                <View>
                                    <Text className="text-sm text-gray-700 mb-1 font-medium">Best Time to Visit</Text>
                                    <TextInput
                                        value={bestTime}
                                        onChangeText={setBestTime}
                                        placeholder="e.g., Spring"
                                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                                    />
                                </View>
                            </View>

                            {/* Buttons */}
                            <View className="flex-row gap-3 mt-6">
                                <TouchableOpacity
                                    onPress={() => { setShowAddModal(false); resetForm(); }}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 items-center"
                                >
                                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={saving || !destination.trim() || !country.trim()}
                                    className={`flex-1 rounded-xl px-4 py-3 items-center ${saving || !destination.trim() || !country.trim()
                                            ? 'bg-gray-300'
                                            : 'bg-terracotta'
                                        }`}
                                >
                                    <Text className="text-white font-semibold">
                                        {saving ? 'Saving...' : editingItem ? 'Update' : 'Add to List'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
