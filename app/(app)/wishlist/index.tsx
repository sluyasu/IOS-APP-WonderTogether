
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Image, Switch, KeyboardAvoidingView, Platform, Dimensions, DimensionValue, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { Plus, Gift, ShoppingBag, ExternalLink, Trash2, Check, ArrowLeft, Heart, Coins, Sparkles, CreditCard, Landmark, Repeat } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useStripe } from '@stripe/stripe-react-native';

// Updated Interface matching new Schema
interface WishlistItem {
    id: string;
    title: string;
    price?: string;
    url?: string;
    description?: string;
    image_url?: string;
    priority: number;
    status: 'active' | 'purchased' | 'granted';
    claimed_by?: string;

    // Store & Payments
    current_amount: number;
    target_amount?: number;
    category?: string;

    // New Pro Fields
    receiving_method: 'product' | 'cash_fund'; // 'product' = Physical, 'cash_fund' = Money
    iban?: string;
    currency: string;
    is_crowdfund?: boolean;
}

const SUGGESTIONS = [
    { label: "Cinema Date", icon: "🎬", price: "40", method: 'product' },
    { label: "Massage", icon: "💆‍♀️", price: "80", method: 'product' },
    { label: "Honeymoon Fund", icon: "✈️", price: "2000", method: 'cash_fund' },
    { label: "Dinner", icon: "🍽️", price: "100", method: 'product' },
];

export default function WishlistScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
    const [couple, setCouple] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    // ... rest of component

    // Contribution Form
    const [contributionAmount, setContributionAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'iban' | 'cash'>('stripe');

    // --- PRO ADD FORM STATE ---
    const [formStep, setFormStep] = useState(0); // 0 = Method Select, 1 = Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [receivingMethod, setReceivingMethod] = useState<'product' | 'cash_fund'>('product');
    const [participationMode, setParticipationMode] = useState<'complete' | 'open'>('complete'); // UI helper
    const [iban, setIban] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: groupMember } = await supabase
                .from('group_members')
                .select('group_id, groups(*)')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single();

            if (!groupMember || !groupMember.groups) {
                console.log('No group found for user');
                setLoading(false);
                return;
            }

            const rawGroup = groupMember.groups;
            const group = Array.isArray(rawGroup) ? rawGroup[0] : rawGroup;
            setCouple(group);

            try {
                const { data, error } = await supabase
                    .from('wishlists')
                    .select('*')
                    .eq('group_id', group.id)
                    .order('created_at', { ascending: false });

                if (data) setItems(data as WishlistItem[]);
            } catch (e) {
                console.log('Wishlist fetch error', e);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title (e.g., "New Sofa")');
            return;
        }

        setSaving(true);
        try {
            const numericPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : null;

            // Logic: If 'Open Participation' (Crowdfund), we treat it as a target amount.
            // If 'Cash Fund', we also treat it as target.
            const target = numericPrice || 0;

            // Map UI 'Participation Mode' to DB logic if needed, 
            // generally 'Open' implies we want a progress bar (target_amount > 0).

            const newItem = {
                group_id: couple.id,
                title: title.trim(),
                url: url.trim() || null,
                description: description.trim() || null,
                price: price.trim() || null, // Display string
                image_url: imageUrl || null,
                target_amount: target,
                current_amount: 0,
                receiving_method: receivingMethod,
                iban: receivingMethod === 'cash_fund' ? iban : null,
                currency: 'EUR', // Default for now
                status: 'active',
            };

            const { data, error } = await supabase.from('wishlists').insert(newItem).select().single();
            if (error) throw error;

            if (data) {
                setItems([data, ...items]);
                setShowAddModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving:', error);
            Alert.alert('Error', 'Could not save item.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setPrice('');
        setUrl('');
        setDescription('');
        setImageUrl('');
        setReceivingMethod('product');
        setParticipationMode('complete');
        setIban('');
        setFormStep(0);
    };

    const handleQuickAdd = (s: any) => {
        setTitle(s.label);
        setPrice(s.price);
        setReceivingMethod(s.method);
        setParticipationMode(s.method === 'cash_fund' ? 'open' : 'complete');
        setFormStep(1); // Skip selection
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Delete', 'Remove this?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await supabase.from('wishlists').delete().eq('id', id);
                    setItems(items.filter(i => i.id !== id));
                }
            }
        ]);
    };

    const handleGrantWish = (item: WishlistItem) => {
        // If it's a "Cash Fund" or "Open Participation" item, show Contribution Modal
        // "Open Participation" is implied if receiver chose 'cash_fund' OR explicitly set it.
        // For simplicity: If receiving_method is 'cash_fund', always contribute money.
        // If 'product', standard toggle OR partial if target_amount > 0.

        const isCrowdfundLike = item.receiving_method === 'cash_fund' || (item.target_amount && item.target_amount > 0);

        if (isCrowdfundLike) {
            setSelectedItem(item);
            setShowContributionModal(true);
        } else {
            // Standard "I bought it" toggle
            toggleStatus(item);
        }
    };

    const toggleStatus = async (item: WishlistItem) => {
        const newStatus: WishlistItem['status'] = item.status === 'active' ? 'purchased' : 'active';
        await supabase.from('wishlists').update({ status: newStatus }).eq('id', item.id);
        const updatedItems = items.map(i => i.id === item.id ? { ...i, status: newStatus } : i);
        setItems(updatedItems);
    };

    const handleContribute = async () => {
        if (!selectedItem) return;
        const amount = parseFloat(contributionAmount);
        if (isNaN(amount) || amount <= 0) return;

        setSaving(true);
        try {
            let stripePaymentId = null;

            // 1. Handle Stripe Payment
            if (paymentMethod === 'stripe') {
                // Fetch PaymentIntent from Edge Function
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch('https://tronwccudryfxeuipgzk.supabase.co/functions/v1/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token} `,
                    },
                    body: JSON.stringify({ amount, currency: 'eur' }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Server error ${response.status}: ${text}`);
                }

                const { paymentIntent, error: backendError } = await response.json();
                if (backendError) throw new Error(backendError);

                // Initialize Sheet
                const { error: initError } = await initPaymentSheet({
                    merchantDisplayName: "WonderTogether",
                    paymentIntentClientSecret: paymentIntent,
                    returnURL: 'wondertogether://stripe-redirect',
                });
                if (initError) throw initError;

                // Present Sheet
                const { error: paymentError } = await presentPaymentSheet();
                if (paymentError) throw paymentError;

                stripePaymentId = paymentIntent; // simplified, ideally store ID
            }

            // 2. Create Contribution Record (Only if payment succeeded or manual)
            const { error: contribError } = await supabase.from('contributions').insert({
                wishlist_id: selectedItem.id,
                amount: amount,
                payment_method: paymentMethod,
                stripe_payment_id: stripePaymentId,
                message: 'Contribution via App'
            });
            if (contribError) throw contribError;

            // 3. Update Wishlist Amount
            const newAmount = (selectedItem.current_amount || 0) + amount;
            const updates: any = { current_amount: newAmount };
            if (selectedItem.target_amount && newAmount >= selectedItem.target_amount) {
                updates.status = 'purchased';
            }

            const { error: updateError } = await supabase.from('wishlists').update(updates).eq('id', selectedItem.id);
            if (updateError) throw updateError;

            // Update Local State
            setItems(items.map(i => i.id === selectedItem.id ? { ...i, ...updates } : i));

            setShowContributionModal(false);
            setContributionAmount('');
            setSelectedItem(null);
            Alert.alert("Success", paymentMethod === 'iban' ? "Please send the transfer using the details provided." : "Payment successful! Contribution added.");

        } catch (e: any) {
            if (e.code !== 'Canceled') {
                console.error(e);
                Alert.alert('Error', e.message || 'Payment failed');
            }
        } finally {
            setSaving(false);
        }
    };

    const renderProgressBar = (current: number, target: number) => {
        const percent = Math.min((current / target) * 100, 100);
        return (
            <View style={{ height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                <View style={{ height: '100%', backgroundColor: '#f59e0b', width: `${percent}%` as DimensionValue }} />
            </View>
        );
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#e07a5f" />;

    return (
        <LinearGradient colors={['#fffbf0', '#fff1f2', '#f0f9ff']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#3d405b" /></TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3d405b', textTransform: 'uppercase', letterSpacing: 1 }}>Wishlist</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)}><Plus size={24} color="#e07a5f" /></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {SUGGESTIONS.map(s => (
                        <TouchableOpacity key={s.label} onPress={() => handleQuickAdd(s)} style={{ backgroundColor: 'white', padding: 8, borderRadius: 20, flexDirection: 'row', gap: 6 }}>
                            <Text>{s.icon}</Text><Text style={{ fontWeight: '600', fontSize: 12 }}>{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Grid */}
            <ScrollView contentContainerStyle={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {items.map(item => {
                    const isCashFund = item.receiving_method === 'cash_fund';
                    const isCrowdfund = isCashFund || (item.target_amount || 0) > 0;

                    return (
                        <View key={item.id} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 12, marginBottom: 4, opacity: item.status === 'purchased' ? 0.8 : 1 }}>
                            {/* Card Header */}
                            <View style={{ height: 100, backgroundColor: item.status === 'purchased' ? '#ecfdf5' : '#fff7ed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                                {item.image_url ? (
                                    <View style={{ width: '100%', height: '100%' }}>
                                        <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%', opacity: item.status === 'purchased' ? 0.5 : 1 }} resizeMode="cover" />
                                        {item.status === 'purchased' && (
                                            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(236, 253, 245, 0.6)' }}>
                                                <Check size={32} color="#10b981" />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    item.status === 'purchased' ? <Check size={32} color="#10b981" /> :
                                        isCashFund ? <Coins size={32} color="#f59e0b" /> : <Gift size={32} color="#e07a5f" />
                                )}
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: 4 }}><Trash2 size={12} color="#ef4444" opacity={0.6} /></TouchableOpacity>
                            </View>

                            {/* Body */}
                            <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{item.title}</Text>
                            <Text style={{ fontSize: 12, color: '#e07a5f', fontWeight: 'bold' }}>{item.price ? `${item.currency === 'USD' ? '$' : '€'}${item.price} ` : 'Priceless'}</Text>

                            {item.is_crowdfund && item.target_amount ? (
                                <View style={{ marginVertical: 8 }}>
                                    <View style={{ height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                                        <View style={{ height: '100%', backgroundColor: '#f59e0b', width: `${Math.min(((item.current_amount || 0) / item.target_amount) * 100, 100)}%` as DimensionValue }} />
                                    </View>
                                    <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'right' }}>
                                        ${(item.target_amount - (item.current_amount || 0)).toFixed(0)} remaining
                                    </Text>
                                </View>
                            ) : null}

                            {/* Action */}
                            <TouchableOpacity onPress={() => handleGrantWish(item)} disabled={item.status === 'purchased'} style={{ marginTop: 12, backgroundColor: item.status === 'purchased' ? '#f3f4f6' : '#fff1f2', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: item.status === 'purchased' ? '#9ca3af' : '#e11d48' }}>
                                    {item.status === 'purchased' ? 'Fulfilled' : isCrowdfund ? 'Participate' : 'Offer Gift'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>

            {/* PRO ADD MODAL (Split Layout) */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                    {/* Modal Header */}
                    <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                            {formStep === 0 ? 'Add New Gift' : 'Edit Details'}
                        </Text>
                        <TouchableOpacity onPress={() => { resetForm(); setShowAddModal(false); }}><Text style={{ color: '#6b7280' }}>Cancel</Text></TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        <View style={{ padding: 20, gap: 24 }}>
                            {/* STEP 0: METHOD SELECTION */}
                            {formStep === 0 && (
                                <View style={{ gap: 20 }}>
                                    <Text style={{ textAlign: 'center', color: '#6b7280', marginBottom: 10 }}>Choose how you want to add a gift</Text>

                                    {/* OPTION A: MAGIC LINK */}
                                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eff6ff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 10 }}><Sparkles size={24} color="#3b82f6" /></View>
                                            <View>
                                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Import from Web</Text>
                                                <Text style={{ color: '#6b7280', fontSize: 12 }}>Auto-fill details from any link</Text>
                                            </View>
                                        </View>

                                        {/* Magic Input */}
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TextInput
                                                value={url}
                                                onChangeText={setUrl}
                                                placeholder="Paste product URL..."
                                                style={{ flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}
                                                autoCapitalize="none"
                                            />
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    if (!url) return;
                                                    setLoading(true);
                                                    try {
                                                        const { data: { session } } = await supabase.auth.getSession();
                                                        const res = await fetch('https://tronwccudryfxeuipgzk.supabase.co/functions/v1/fetch-metadata', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${session?.access_token}`
                                                            },
                                                            body: JSON.stringify({ url })
                                                        });
                                                        const meta = await res.json();
                                                        if (meta.title) setTitle(meta.title);
                                                        if (meta.description) setDescription(meta.description);
                                                        if (meta.price) setPrice(meta.price.toString());
                                                        if (meta.image) setImageUrl(meta.image);

                                                        setFormStep(1); // Advance to form
                                                    } catch (e) {
                                                        Alert.alert('Fetch failed', 'Could not get details. Please enter manually.');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' }}
                                            >
                                                {loading ? <ActivityIndicator color="#3b82f6" size="small" /> : <Sparkles size={20} color="#3b82f6" />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* OPTION B: MANUAL */}
                                    <TouchableOpacity onPress={() => setFormStep(1)} style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ backgroundColor: '#fff7ed', padding: 10, borderRadius: 10 }}><LinearGradient colors={['#fbbf24', '#f59e0b']} style={{ borderRadius: 8, padding: 2 }}><Gift size={20} color="#b45309" /></LinearGradient></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Create Personalized Gift</Text>
                                            <Text style={{ color: '#6b7280', fontSize: 12 }}>Enter details manually</Text>
                                        </View>
                                        <ArrowLeft size={16} color="#9ca3af" style={{ transform: [{ rotate: '180deg' }] }} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* STEP 1: REST OF THE FORM (Show only if Step > 0) */}
                            {formStep > 0 && (
                                <>
                                    {/* SECTION 1: DETAILS */}
                                    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 12, letterSpacing: 1 }}>GIFT DETAILS</Text>

                                        {/* Image Preview */}
                                        {imageUrl ? (
                                            <View style={{ marginBottom: 16, position: 'relative' }}>
                                                <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
                                                <TouchableOpacity onPress={() => setImageUrl('')} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 }}>
                                                    <Trash2 size={14} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : null}

                                        <TextInput value={title} onChangeText={setTitle} placeholder="Name (e.g. iPad, Rome Trip)" style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, borderBottomWidth: 1, borderColor: '#f3f4f6', paddingBottom: 8 }} />
                                        <TextInput value={description} onChangeText={setDescription} placeholder="Description / Brand / Details..." multiline style={{ marginBottom: 16, minHeight: 60 }} />

                                        {!imageUrl && (
                                            <TextInput value={url} onChangeText={setUrl} placeholder="Product URL..." style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, color: '#6b7280' }} autoCapitalize="none" />
                                        )}
                                    </View>

                                    {/* SECTION 2: PRICE & PARTICIPATION */}
                                    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 12, letterSpacing: 1 }}>PRICE & PARTICIPATION</Text>
                                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                            <TextInput value={price} onChangeText={setPrice} placeholder="Price" keyboardType="numeric" style={{ flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 16 }} />
                                            <View style={{ backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, justifyContent: 'center' }}><Text>EUR (€)</Text></View>
                                        </View>

                                        {/* Participation Toggle */}
                                        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Receiving Preference:</Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => setReceivingMethod('product')}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: receivingMethod === 'product' ? '#e07a5f' : '#e5e7eb', backgroundColor: receivingMethod === 'product' ? '#fff7ed' : 'white', alignItems: 'center' }}
                                            >
                                                <Gift size={20} color={receivingMethod === 'product' ? '#e07a5f' : '#9ca3af'} />
                                                <Text style={{ marginTop: 4, fontWeight: '500', color: receivingMethod === 'product' ? '#e07a5f' : '#6b7280' }}>Physical</Text>
                                                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Complete Participation</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => setReceivingMethod('cash_fund')}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: receivingMethod === 'cash_fund' ? '#f59e0b' : '#e5e7eb', backgroundColor: receivingMethod === 'cash_fund' ? '#fffbeb' : 'white', alignItems: 'center' }}
                                            >
                                                <Coins size={20} color={receivingMethod === 'cash_fund' ? '#f59e0b' : '#9ca3af'} />
                                                <Text style={{ marginTop: 4, fontWeight: '500', color: receivingMethod === 'cash_fund' ? '#f59e0b' : '#6b7280' }}>Cash Fund</Text>
                                                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Open / Crowdfund</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {receivingMethod === 'cash_fund' && (
                                            <View style={{ marginTop: 16 }}>
                                                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>IBAN (Optional, for Bank Transfer)</Text>
                                                <TextInput value={iban} onChangeText={setIban} placeholder="BE12 3456..." style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 }} />
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    </ScrollView>

                    <View style={{ padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#f3f4f6' }}>
                        {formStep === 0 ? (
                            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ padding: 16, alignItems: 'center' }}>
                                <Text style={{ color: '#6b7280' }}>Close</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={() => setFormStep(0)} style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: '#4b5563', fontWeight: '600' }}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flex: 2, backgroundColor: '#e07a5f', padding: 16, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{saving ? 'Creating...' : 'Create Gift'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* CONTRIBUTION MODAL */}
            <Modal visible={showContributionModal} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
                        <TouchableWithoutFeedback>
                            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8 }}>Participate</Text>
                                <Text style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>Contribute to {selectedItem?.title}</Text>

                                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                    <TextInput
                                        value={contributionAmount}
                                        onChangeText={setContributionAmount}
                                        placeholder="€0"
                                        keyboardType="numeric"
                                        autoFocus
                                        style={{ fontSize: 40, fontWeight: 'bold', color: '#e07a5f', borderBottomWidth: 2, borderBottomColor: '#f3f4f6', minWidth: 120, textAlign: 'center' }}
                                    />
                                </View>

                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 12 }}>PAYMENT METHOD</Text>
                                <View style={{ gap: 8, marginBottom: 24 }}>
                                    <TouchableOpacity onPress={() => setPaymentMethod('stripe')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: paymentMethod === 'stripe' ? '#eff6ff' : '#f9fafb', borderWidth: 1, borderColor: paymentMethod === 'stripe' ? '#3b82f6' : 'transparent' }}>
                                        <CreditCard size={20} color={paymentMethod === 'stripe' ? '#3b82f6' : '#6b7280'} />
                                        <Text style={{ marginLeft: 12, fontWeight: '600', color: paymentMethod === 'stripe' ? '#3b82f6' : '#374151' }}>Pay with Card / Apple Pay</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPaymentMethod('iban')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: paymentMethod === 'iban' ? '#fff7ed' : '#f9fafb', borderWidth: 1, borderColor: paymentMethod === 'iban' ? '#ea580c' : 'transparent' }}>
                                        <Landmark size={20} color={paymentMethod === 'iban' ? '#ea580c' : '#6b7280'} />
                                        <Text style={{ marginLeft: 12, fontWeight: '600', color: paymentMethod === 'iban' ? '#ea580c' : '#374151' }}>Bank Transfer (IBAN)</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={handleContribute} style={{ backgroundColor: '#e07a5f', padding: 16, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Contribution</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowContributionModal(false)} style={{ marginTop: 16, alignItems: 'center' }}>
                                    <Text style={{ color: '#6b7280' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </LinearGradient>
    );
}
