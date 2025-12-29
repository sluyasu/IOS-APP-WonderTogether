import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, MapPin, Check, Trash2, Globe, Heart, X, Edit2, MoreHorizontal } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useGroup } from '../../../contexts/GroupContext';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function BucketListScreen() {
    const router = useRouter();
    const { currentGroup } = useGroup();
    const [filter, setFilter] = useState<'all' | 'wishlist' | 'visited'>('all');

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({ title: '', country: '', note: '', icon: '🌍' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentGroup?.id) fetchItems();
    }, [currentGroup?.id]);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('bucket_list_items')
                .select('*')
                .eq('group_id', currentGroup?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching bucket list:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ title: '', country: '', note: '', icon: '🌍' });
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            country: item.country || '',
            note: item.note || '',
            icon: item.icon || '🌍'
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;

        if (!currentGroup?.id) {
            Alert.alert('Error', 'No active group found. Please restart the app.');
            return;
        }

        setSaving(true);
        try {
            if (editingItem) {
                // Update existing
                const { error } = await supabase
                    .from('bucket_list_items')
                    .update({
                        title: formData.title.trim(),
                        country: formData.country.trim(),
                        note: formData.note.trim(),
                        icon: formData.icon
                    })
                    .eq('id', editingItem.id);
                if (error) throw error;
            } else {
                // Create new
                const { error } = await supabase
                    .from('bucket_list_items')
                    .insert({
                        group_id: currentGroup?.id,
                        title: formData.title.trim(),
                        country: formData.country.trim(),
                        note: formData.note.trim(),
                        icon: formData.icon,
                        is_completed: false
                    });
                if (error) throw error;
            }

            setShowModal(false);
            fetchItems();
        } catch (error) {
            console.error('Error saving bucket list item:', error);
            Alert.alert('Error', 'Could not save destination. See console for details.');
        } finally {
            setSaving(false);
        }
    };

    const toggleVisited = async (id: string, currentStatus: boolean) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setItems(items.map(i => i.id === id ? { ...i, is_completed: !currentStatus } : i));

        try {
            const { error } = await supabase
                .from('bucket_list_items')
                .update({ is_completed: !currentStatus })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            fetchItems();
        }
    };

    const deleteItem = async (id: string) => {
        Alert.alert(
            "Delete Destination",
            "Are you sure you want to remove this from your list?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setItems(items.filter(i => i.id !== id));
                        await supabase.from('bucket_list_items').delete().eq('id', id);
                    }
                }
            ]
        );
    };

    const filteredItems = items.filter(item => {
        if (filter === 'wishlist') return !item.is_completed;
        if (filter === 'visited') return item.is_completed;
        return true;
    });

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Minimalist Header */}
            <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <ArrowLeft size={24} color="#3d405b" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3d405b', textTransform: 'uppercase', letterSpacing: 1 }}>Bucket List</Text>
                    <TouchableOpacity onPress={openAddModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Plus size={24} color="#e07a5f" />
                    </TouchableOpacity>
                </View>

                {/* Clean Tabs */}
                <View style={{ flexDirection: 'row', gap: 24, paddingVertical: 8 }}>
                    {['all', 'wishlist', 'visited'].map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setFilter(t as any);
                            }}
                            style={{
                                paddingBottom: 8,
                                borderBottomWidth: 2,
                                borderBottomColor: filter === t ? '#e07a5f' : 'transparent'
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: filter === t ? '600' : '400',
                                color: filter === t ? '#1f2937' : '#9ca3af',
                                textTransform: 'capitalize'
                            }}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {loading ? (
                    <ActivityIndicator color="#e07a5f" style={{ marginTop: 40 }} />
                ) : filteredItems.length === 0 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 100, opacity: 0.5 }}>
                        <Globe size={48} color="#d1d5db" />
                        <Text style={{ marginTop: 16, color: '#9ca3af', fontSize: 16 }}>No destinations here yet</Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {filteredItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => openEditModal(item)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 16,
                                    padding: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 16,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 1,
                                    opacity: item.is_completed ? 0.8 : 1
                                }}
                            >
                                {/* Emoji Icon Box */}
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: item.is_completed ? '#ecfdf5' : '#fff7ed',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {item.is_completed ? (
                                        <Check size={24} color="#10b981" />
                                    ) : (
                                        <Text style={{ fontSize: 24 }}>{item.icon || '🌍'}</Text>
                                    )}
                                </View>

                                {/* Content */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: item.is_completed ? '#9ca3af' : '#1f2937',
                                        textDecorationLine: item.is_completed ? 'line-through' : 'none'
                                    }}>
                                        {item.title}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <MapPin size={12} color="#9ca3af" />
                                        <Text style={{ fontSize: 13, color: '#6b7280' }}>
                                            {item.country || 'Unknown'}
                                            {item.note ? ` • ${item.note}` : ''}
                                        </Text>
                                    </View>
                                </View>

                                {/* Actions */}
                                <TouchableOpacity
                                    onPress={() => toggleVisited(item.id, item.is_completed)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: item.is_completed ? '#10b981' : '#e5e7eb',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: item.is_completed ? '#ecfdf5' : 'transparent'
                                    }}
                                >
                                    {item.is_completed && <Check size={14} color="#10b981" strokeWidth={3} />}
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Same Modal Logic - Styled to match */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>{editingItem ? 'Edit Item' : 'New Adventure'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 4 }}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Title</Text>
                                <TextInput
                                    placeholder="e.g. See Northern Lights"
                                    style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                                    value={formData.title}
                                    onChangeText={(t) => setFormData({ ...formData, title: t })}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Location (Optional)</Text>
                                    <TextInput
                                        placeholder="e.g. Iceland"
                                        style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 }}
                                        value={formData.country}
                                        onChangeText={(t) => setFormData({ ...formData, country: t })}
                                    />
                                </View>
                                <View style={{ width: 80 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Icon</Text>
                                    <TextInput
                                        placeholder="✨"
                                        style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, textAlign: 'center' }}
                                        value={formData.icon}
                                        onChangeText={(t) => setFormData({ ...formData, icon: t })}
                                        maxLength={2}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Note (Optional)</Text>
                                <TextInput
                                    placeholder="Why do you want to go?"
                                    style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, minHeight: 80 }}
                                    multiline
                                    textAlignVertical="top"
                                    value={formData.note}
                                    onChangeText={(t) => setFormData({ ...formData, note: t })}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                {editingItem && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowModal(false);
                                            deleteItem(editingItem.id);
                                        }}
                                        style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', alignItems: 'center' }}
                                    >
                                        <Trash2 size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={saving}
                                    style={{ flex: 1, backgroundColor: '#e07a5f', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                            {editingItem ? 'Save Changes' : 'Add to List'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
