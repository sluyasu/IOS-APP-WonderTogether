import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Check, Plus, Trash2, List } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface BucketListItem {
    id: string;
    title: string;
    is_completed: boolean;
}

interface BucketListWidgetProps {
    groupId: string;
}

export default function BucketListWidget({ groupId }: BucketListWidgetProps) {
    const [items, setItems] = useState<BucketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [groupId]);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('bucket_list_items')
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching bucket list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemTitle.trim()) return;

        setAdding(true);
        try {
            const { error } = await supabase
                .from('bucket_list_items')
                .insert({
                    group_id: groupId,
                    title: newItemTitle.trim(),
                    is_completed: false
                });

            if (error) throw error;

            setNewItemTitle('');
            fetchItems(); // Refresh list
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', 'Could not add item');
        } finally {
            setAdding(false);
        }
    };

    const toggleItem = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, is_completed: !currentStatus } : i));

        try {
            const { error } = await supabase
                .from('bucket_list_items')
                .update({ is_completed: !currentStatus })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error toggling item:', error);
            // Revert on error
            setItems(items.map(i => i.id === id ? { ...i, is_completed: currentStatus } : i));
        }
    };

    const deleteItem = async (id: string) => {
        Alert.alert(
            "Delete Item",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        // Optimistic update
                        setItems(items.filter(i => i.id !== id));

                        try {
                            const { error } = await supabase
                                .from('bucket_list_items')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            fetchItems(); // Revert/Refresh
                        }
                    }
                }
            ]
        );
    };

    if (loading) return null;

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <List size={20} color="#e07a5f" />
                    <Text style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#1f2937', fontSize: 18 }}>Our Bucket List</Text>
                </View>
                <View style={{ backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, color: '#e07a5f', fontWeight: 'bold' }}>
                        {items.filter(i => i.is_completed).length}/{items.length} Done
                    </Text>
                </View>
            </View>

            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                {/* List Items */}
                <View style={{ gap: 12, marginBottom: 16 }}>
                    {items.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', paddingVertical: 12 }}>
                            Add your first dream together!
                        </Text>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => toggleItem(item.id, item.is_completed)}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 6,
                                        borderWidth: 2,
                                        borderColor: item.is_completed ? '#e07a5f' : '#d1d5db',
                                        backgroundColor: item.is_completed ? '#e07a5f' : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {item.is_completed && <Check size={14} color="white" strokeWidth={3} />}
                                </TouchableOpacity>

                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: item.is_completed ? '#9ca3af' : '#1f2937',
                                        textDecorationLine: item.is_completed ? 'line-through' : 'none'
                                    }}
                                >
                                    {item.title}
                                </Text>

                                <TouchableOpacity onPress={() => deleteItem(item.id)} hitSlop={10}>
                                    <Trash2 size={16} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Add New Item */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                    <TextInput
                        style={{ flex: 1, fontSize: 14, color: '#1f2937', paddingVertical: 8 }}
                        placeholder="Add a new dream..."
                        placeholderTextColor="#9ca3af"
                        value={newItemTitle}
                        onChangeText={setNewItemTitle}
                        onSubmitEditing={handleAddItem}
                    />
                    <TouchableOpacity
                        onPress={handleAddItem}
                        disabled={!newItemTitle.trim() || adding}
                        style={{
                            backgroundColor: newItemTitle.trim() ? '#e07a5f' : '#f3f4f6',
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {adding ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Plus size={18} color={newItemTitle.trim() ? 'white' : '#d1d5db'} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
