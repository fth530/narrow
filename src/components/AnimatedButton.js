import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ACCENT_COLOR } from '../constants/theme';

export const AnimatedButton = ({ title, onPress, style }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Pressable
            onPressIn={() => {
                scale.value = withSpring(0.95);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => {
                scale.value = withSpring(1);
                if (onPress) onPress();
            }}
        >
            <Animated.View style={[styles.premiumButton, animatedStyle, style]}>
                <Text style={styles.premiumButtonText}>{title}</Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    premiumButton: {
        backgroundColor: ACCENT_COLOR,
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ACCENT_COLOR,
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    premiumButtonText: {
        color: '#09090B',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
