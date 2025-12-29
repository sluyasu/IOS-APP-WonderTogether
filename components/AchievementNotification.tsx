import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { Achievement } from '../lib/achievementStorage';

interface AchievementNotificationProps {
    achievement: Achievement | null;
    visible: boolean;
    onDismiss: () => void;
}

export default function AchievementNotification({ achievement, visible, onDismiss }: AchievementNotificationProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (visible && achievement) {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss after 5 seconds
            autoHideTimer.current = setTimeout(() => {
                handleDismiss();
            }, 5000);
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.5,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        return () => {
            if (autoHideTimer.current) {
                clearTimeout(autoHideTimer.current);
            }
        };
    }, [visible, achievement]);

    const handleDismiss = () => {
        if (autoHideTimer.current) {
            clearTimeout(autoHideTimer.current);
        }
        onDismiss();
    };

    if (!achievement) return null;

    const { width } = Dimensions.get('window');

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDismiss}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                }}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                        backgroundColor: 'white',
                        borderRadius: 24,
                        padding: 32,
                        width: Math.min(width - 48, 350),
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                    }}
                >
                    {/* Trophy Icon */}
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#fef3c7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <Trophy size={40} color="#f59e0b" />
                    </View>

                    {/* Achievement Emoji */}
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>{achievement.icon}</Text>

                    {/* Congratulations */}
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#f59e0b',
                            marginBottom: 8,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                    >
                        Achievement Unlocked!
                    </Text>

                    {/* Achievement Name */}
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: '#1f2937',
                            marginBottom: 8,
                            textAlign: 'center',
                        }}
                    >
                        {achievement.name}
                    </Text>

                    {/* Progress Info */}
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#6b7280',
                            marginBottom: 20,
                            textAlign: 'center',
                        }}
                    >
                        {achievement.progress} / {achievement.target}
                    </Text>

                    {/* Dismiss Button */}
                    <TouchableOpacity
                        onPress={handleDismiss}
                        style={{
                            backgroundColor: '#f59e0b',
                            paddingVertical: 12,
                            paddingHorizontal: 32,
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                            Awesome!
                        </Text>
                    </TouchableOpacity>

                    {/* Tap anywhere hint */}
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#9ca3af',
                            marginTop: 12,
                        }}
                    >
                        Tap anywhere to dismiss
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}
