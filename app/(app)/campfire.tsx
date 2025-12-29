import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useGroup } from '../../contexts/GroupContext';
import { supabase } from '../../lib/supabase';
import { Send } from 'lucide-react-native';
import { format } from 'date-fns';

export default function CampfireScreen() {
    const { currentGroup } = useGroup();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setUser(session.user);
        });
    }, []);

    useEffect(() => {
        if (!currentGroup) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, sender:profiles(display_name, avatar_url)')
                .eq('group_id', currentGroup.id)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        const subscription = supabase
            .channel('campfire_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${currentGroup.id}` }, (payload) => {
                const newMessage = payload.new;
                supabase.from('messages').select('*, sender:profiles(display_name, avatar_url)').eq('id', newMessage.id).single()
                    .then(({ data }) => {
                        if (data) {
                            setMessages((prev) => {
                                if (prev.find(m => m.id === data.id)) return prev;
                                return [...prev, data];
                            });
                            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
                        }
                    });
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentGroup]);

    const handleSend = async () => {
        if (!input.trim() || !currentGroup || !user) return;

        const content = input.trim();
        const optimisticId = Date.now().toString();

        // 1. Optimistic UI: Show message immediately
        const optimisticMessage = {
            id: optimisticId,
            group_id: currentGroup.id,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            sender: { display_name: 'Me', avatar_url: null },
            type: 'text',
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setInput('');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

        // 2. Send to Server
        const messageData = {
            group_id: currentGroup.id,
            sender_id: user.id,
            content: content,
            type: 'text',
        };

        const { data, error } = await supabase.from('messages').insert(messageData).select().single();

        if (error) {
            console.error('Send error:', error);
            // In a real app, you'd show a "Failed to send" red exclamation mark
        } else if (data) {
            // Replace optimistic with real data (so we have the real ID)
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, ...data } : m));
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === user?.id;
        const showName = !isMe;

        return (
            <View style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                marginVertical: 4,
                flexDirection: 'row',
                alignItems: 'flex-end'
            }}>
                {!isMe && (
                    <View style={{ marginRight: 8 }}>
                        {item.sender?.avatar_url ? (
                            <Image
                                source={{ uri: item.sender.avatar_url }}
                                style={{ width: 32, height: 32, borderRadius: 16 }}
                            />
                        ) : (
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                    {item.sender?.display_name?.charAt(0) || '?'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View>
                    {showName && (
                        <Text style={{ fontSize: 12, color: '#888', marginBottom: 2, marginLeft: 4 }}>
                            {item.sender?.display_name || 'Partner'}
                        </Text>
                    )}
                    <View style={{
                        backgroundColor: isMe ? '#e07a5f' : '#ffffff', // Terracotta vs White
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        borderBottomRightRadius: isMe ? 4 : 20,
                        borderBottomLeftRadius: !isMe ? 4 : 20,
                        borderWidth: isMe ? 0 : 1,
                        borderColor: '#E5E5EA',
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        shadowOffset: { width: 0, height: 1 }
                    }}>
                        <Text style={{ color: isMe ? 'white' : '#1f2937', fontSize: 16, lineHeight: 22 }}>
                            {item.content}
                        </Text>
                    </View>
                    <Text style={{
                        color: '#9ca3af',
                        fontSize: 10,
                        marginTop: 4,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        marginRight: isMe ? 2 : 0,
                        marginLeft: !isMe ? 2 : 0
                    }}>
                        {format(new Date(item.created_at), 'h:mm a')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
            {/* Styled Header */}
            <View style={{
                paddingTop: 60,
                paddingBottom: 16,
                paddingHorizontal: 20,
                backgroundColor: '#FFF8F0',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.05)'
            }}>
                {/* Fallback to bold if Pacifico isn't loaded, but try to use it */}
                <Text style={{ fontSize: 28, fontFamily: 'Pacifico_400Regular', color: '#1f2937', fontWeight: 'bold' }}>Chat</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={{
                padding: 16,
                backgroundColor: '#FFF8F0',
                borderTopWidth: 1,
                borderTopColor: 'rgba(0,0,0,0.05)'
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: 'white',
                    padding: 8,
                    paddingHorizontal: 16,
                    borderRadius: 24,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2
                }}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#9ca3af"
                        style={{ flex: 1, fontSize: 16, maxHeight: 100, color: '#111827' }}
                        multiline
                    />

                    {input.trim().length > 0 && (
                        <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#e07a5f', padding: 10, borderRadius: 20 }}>
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
