import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, AppState, TextInput } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    runOnJS,
    useAnimatedProps,
    withSpring,
    FadeIn,
    SlideInDown,
    FadeOut,
    interpolateColor
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useGameStore } from '../store/useGameStore';
import { useGameEngine, POOL_SIZE } from '../engine/useGameEngine';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedObstacle } from '../components/AnimatedObstacle';
import { FINGER_RADIUS, OBSTACLE_COLOR, PLAYER_COLOR_SAFE, PLAYER_COLOR_DANGER, BG_COLOR, ACCENT_COLOR } from '../constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const GameScreen = () => {
    const insets = useSafeAreaInsets();
    const { gameState, setGameState, highScore, saveHighScore } = useGameStore();
    const [finalScore, setFinalScore] = useState(0);

    // JS Bridge trigger (C++ > JS)
    const handleGameOver = (achievedScore) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFinalScore(Math.floor(achievedScore));
        saveHighScore(Math.floor(achievedScore));
        setGameState('GAMEOVER');
    };

    // Motor (Engine) kurulumu
    const engine = useGameEngine({ triggerGameOver: handleGameOver });

    useEffect(() => {
        // İşletim sistemi kesintisi (Graceful Pause)
        const sub = AppState.addEventListener('change', (next) => {
            if (next.match(/inactive|background/) && gameState === 'PLAYING') {
                engine.pauseGameEngine();
                setGameState('PAUSED');
            }
        });
        return () => sub.remove();
    }, [gameState]);

    const onStart = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        engine.startGameEngine();
        setGameState('PLAYING');
    };

    const onResume = () => {
        // Kaldığı yerden devam
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        engine.resumeGameEngine();
        setGameState('PLAYING');
    };

    // --- KESİNTİSİZ JEST ALICISI --- //
    const panGesture = Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
            engine.isTouching.value = true;
            engine.fingerX.value = e.absoluteX;
            engine.fingerY.value = e.absoluteY;
        })
        .onUpdate((e) => {
            engine.fingerX.value = e.absoluteX;
            engine.fingerY.value = e.absoluteY;
        })
        .onTouchesUp(() => {
            engine.isTouching.value = false;
        })
        .onFinalize(() => {
            engine.isTouching.value = false;
        });

    // --- UI STYLES (Animasyonlu) --- //
    const fingerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: engine.fingerX.value - FINGER_RADIUS },
                { translateY: engine.fingerY.value - FINGER_RADIUS },
                { scale: withSpring(engine.isTouching.value ? 1 : 1.6, { damping: 12 }) }
            ],
            backgroundColor: engine.isTouching.value ? PLAYER_COLOR_SAFE : PLAYER_COLOR_DANGER,
            opacity: gameState === 'PLAYING' ? 1 : 0,
        };
    });

    const animatedScoreProps = useAnimatedProps(() => {
        return {
            text: `${Math.floor(engine.scoreValue.value)}`,
            defaultValue: `${Math.floor(engine.scoreValue.value)}`
        };
    });

    const animatedBgStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            engine.scoreValue.value,
            [0, 20, 50, 90, 150],
            [
                '#09090B', // Zinc 950 (Normal)
                '#1e1b4b', // Indigo 950 (Flow)
                '#4c1d95', // Violet 900 (Focus)
                '#7f1d1d', // Red 900 (Danger)
                '#450a0a'  // Red 950 (Nightmare)
            ]
        );
        return { backgroundColor: bg };
    });

    return (
        <Animated.View style={[styles.container, animatedBgStyle]}>
            {/* 1. OYUN ALANI (Sadece PLAYING sırasında jest okur) */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <GestureDetector gesture={panGesture}>
                    <View style={StyleSheet.absoluteFill}>
                        <View style={[styles.scorePill, { top: insets.top + 10 }]} hitSlop={30}>
                            <AnimatedTextInput
                                animatedProps={animatedScoreProps}
                                editable={false}
                                style={styles.liveScoreText}
                            />
                        </View>

                        {Array.from({ length: POOL_SIZE }).map((_, i) => (
                            <AnimatedObstacle key={i} index={i} obstaclesPool={engine.obstaclesPool} />
                        ))}

                        <Animated.View style={[styles.fingerHitbox, fingerStyle]} />
                    </View>
                </GestureDetector>
            )}

            {/* 2. MENÜ (MENU) */}
            {gameState === 'MENU' && (
                <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut} style={styles.menuContainer}>
                    <Animated.View entering={SlideInDown.duration(600).springify()}>
                        <Text style={styles.title}>NARROW</Text>
                        <Text style={styles.subtitle}>Parmağını ekrandan ayırma.</Text>

                        <View style={styles.highScoreBox}>
                            <Text style={styles.highScoreLabel}>EN YÜKSEK</Text>
                            <Text style={styles.highScoreValue}>{highScore}</Text>
                        </View>

                        <AnimatedButton title="SİSTEMİ BAŞLAT" onPress={onStart} />
                    </Animated.View>
                </Animated.View>
            )}

            {/* 3. DURAKLATILDI (PAUSED) */}
            {gameState === 'PAUSED' && (
                <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.menuContainer}>
                    <Animated.View entering={SlideInDown.duration(400).springify()} style={{ alignItems: 'center' }}>
                        <Text style={[styles.title, { color: ACCENT_COLOR }]}>DURAKLATILDI</Text>
                        <Text style={styles.subtitle}>Sistem kesintisi algılandı.</Text>

                        <AnimatedButton
                            title="DEVAM ET"
                            onPress={onResume}
                            style={{ marginTop: 20 }}
                        />

                        <AnimatedButton
                            title="PES ET (MENÜ)"
                            onPress={() => setGameState('MENU')}
                            style={{ backgroundColor: '#27272A', marginTop: 15 }}
                        />
                    </Animated.View>
                </Animated.View>
            )}

            {/* 4. OYUN BİTTİ (GAMEOVER) */}
            {gameState === 'GAMEOVER' && (
                <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut} style={styles.menuContainer}>
                    <Animated.View entering={SlideInDown.duration(500).springify()} style={{ alignItems: 'center' }}>
                        <Text style={[styles.title, { color: OBSTACLE_COLOR }]}>SİSTEM ÇÖKTÜ</Text>
                        <Text style={styles.subtitle}>Bağlantı kesildi veya duvar aşıldı.</Text>

                        <View style={styles.finalScoreBox}>
                            <Text style={styles.finalScoreLabel}>SON SKOR</Text>
                            <Text style={styles.finalScoreText}>{finalScore}</Text>
                        </View>

                        <AnimatedButton
                            title="TEKRAR DENE"
                            onPress={() => setGameState('MENU')}
                            style={{ backgroundColor: '#27272A', marginTop: 20 }}
                        />
                    </Animated.View>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    menuContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FAFAFA',
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#A1A1AA',
        letterSpacing: 0.5,
        textAlign: 'center',
        marginBottom: 48,
    },
    highScoreBox: { alignItems: 'center', marginBottom: 48 },
    highScoreLabel: { fontSize: 12, color: '#71717A', fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
    highScoreValue: { fontSize: 32, color: '#FAFAFA', fontWeight: '800' },
    finalScoreBox: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    finalScoreLabel: { fontSize: 14, color: '#A1A1AA', letterSpacing: 2, fontWeight: '600' },
    finalScoreText: { fontSize: 64, fontWeight: '900', color: '#FAFAFA' },
    fingerHitbox: {
        position: 'absolute',
        width: FINGER_RADIUS * 2,
        height: FINGER_RADIUS * 2,
        borderRadius: FINGER_RADIUS,
        left: 0,
        top: 0,
        zIndex: 10,
        shadowColor: PLAYER_COLOR_SAFE,
        shadowOpacity: 0.6,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
    scorePill: {
        position: 'absolute',
        zIndex: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(24, 24, 27, 0.7)',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    liveScoreText: {
        color: '#FAFAFA',
        fontSize: 20,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    }
});
