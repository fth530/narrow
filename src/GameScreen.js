import React, { useEffect, useCallback, useState, memo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useFrameCallback,
  useAnimatedStyle,
  interpolateColor,
  runOnJS,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useGameStore } from './store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OBSTACLE_COUNT = 6;
const OBSTACLE_HEIGHT = 28;
const PLAYER_RADIUS = 12;
const TRAIL_LENGTH = 8;
const POWERUP_SIZE = 24;

const OBS_NORMAL = 0;
const OBS_ZIGZAG = 1;
const OBS_CLOSING = 2;
const OBS_DOUBLE = 3;

const PU_TYPES = ['slow', 'shield', 'widen'];
const PU_COLORS = { slow: '#4488ff', shield: '#44ff88', widen: '#ffcc44' };
const PU_LABELS = { slow: 'S', shield: '\u2605', widen: 'W' };

// --- Isolated UI components to prevent full re-renders ---
const ScoreDisplay = memo(() => {
  const score = useGameStore((s) => s.score);
  return <Text style={styles.scoreText}>{score}</Text>;
});

const ComboDisplay = memo(() => {
  const combo = useGameStore((s) => s.combo);
  const comboMultiplier = useGameStore((s) => s.comboMultiplier);
  if (combo < 3) return null;
  return <Text style={styles.comboText}>x{comboMultiplier.toFixed(1)} COMBO</Text>;
});

const LivesDisplay = memo(() => {
  const lives = useGameStore((s) => s.lives);
  return (
    <View style={styles.livesContainer}>
      {Array.from({ length: lives }, (_, i) => (
        <Text key={i} style={styles.heartIcon}>{'\u2764'}</Text>
      ))}
    </View>
  );
});

const BurstWarning = memo(() => {
  const speedBurstActive = useGameStore((s) => s.speedBurstActive);
  if (!speedBurstActive) return null;
  return (
    <View style={styles.burstWarning}>
      <Text style={styles.burstText}>SPEED BURST!</Text>
    </View>
  );
});

const PowerUpIndicator = memo(() => {
  const activePowerUp = useGameStore((s) => s.activePowerUp);
  if (!activePowerUp) return null;
  const label = activePowerUp === 'slow' ? 'SLOW MODE' :
                activePowerUp === 'shield' ? 'SHIELDED' : 'WIDE GAP';
  return (
    <View style={[styles.puIndicator, { backgroundColor: PU_COLORS[activePowerUp] + '33' }]}>
      <Text style={[styles.puIndicatorText, { color: PU_COLORS[activePowerUp] }]}>{label}</Text>
    </View>
  );
});

// --- Main Game ---
export default function GameScreen() {
  const gameOverAction = useGameStore((s) => s.gameOver);
  const incrementScore = useGameStore((s) => s.incrementScore);
  const activatePowerUp = useGameStore((s) => s.activatePowerUp);
  const deactivatePowerUp = useGameStore((s) => s.deactivatePowerUp);
  const useShieldAction = useGameStore((s) => s.useShield);
  const setSpeedBurst = useGameStore((s) => s.setSpeedBurst);
  const collectHeart = useGameStore((s) => s.collectHeart);
  const loseLife = useGameStore((s) => s.loseLife);

  // Player
  const playerX = useSharedValue(SCREEN_W / 2);
  const playerY = useSharedValue(SCREEN_H * 0.75);
  const isTouching = useSharedValue(false);
  const hasStarted = useSharedValue(false);
  const isGameOver = useSharedValue(false);
  const colorProgress = useSharedValue(0);
  const [showHint, setShowHint] = useState(true);

  // Shake
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  // Heartbeat
  const heartbeatOpacity = useSharedValue(0);
  const heartbeatTimer = useSharedValue(0);

  // Trail (reduced)
  const trailXs = Array.from({ length: TRAIL_LENGTH }, () => useSharedValue(SCREEN_W / 2));
  const trailYs = Array.from({ length: TRAIL_LENGTH }, () => useSharedValue(SCREEN_H * 0.75));
  const trailIndex = useSharedValue(0);
  const trailTimer = useSharedValue(0);

  // Obstacles
  const obstacleYs = Array.from({ length: OBSTACLE_COUNT }, (_, i) =>
    useSharedValue(-OBSTACLE_HEIGHT - i * (SCREEN_H / OBSTACLE_COUNT))
  );
  const obstacleGapXs = Array.from({ length: OBSTACLE_COUNT }, () =>
    useSharedValue(SCREEN_W / 2)
  );
  const obstacleScored = Array.from({ length: OBSTACLE_COUNT }, () =>
    useSharedValue(false)
  );
  const obstacleTypes = Array.from({ length: OBSTACLE_COUNT }, () =>
    useSharedValue(OBS_NORMAL)
  );
  const obstaclePhase = Array.from({ length: OBSTACLE_COUNT }, () =>
    useSharedValue(0)
  );
  const obstacleClosing = Array.from({ length: OBSTACLE_COUNT }, () =>
    useSharedValue(0)
  );

  // Power-up
  const puActive = useSharedValue(false);
  const puX = useSharedValue(SCREEN_W / 2);
  const puY = useSharedValue(-50);
  const puType = useSharedValue(0);

  // Heart item
  const heartItemActive = useSharedValue(false);
  const heartItemX = useSharedValue(SCREEN_W / 2);
  const heartItemY = useSharedValue(-50);
  const heartSpawnCooldown = useSharedValue(0);

  // Store-synced shared values (read from store only when needed)
  const speedSV = useSharedValue(3);
  const gapSV = useSharedValue(160);
  const hasShieldSV = useSharedValue(false);
  const activePowerUpSV = useSharedValue(null);
  const scoreSV = useSharedValue(0);
  const livesSV = useSharedValue(1);

  // Speed burst
  const speedBurstTimer = useSharedValue(0);
  const speedBurstCooldown = useSharedValue(0);
  const puEffectTimer = useSharedValue(0);

  // Lantern
  const lanternOpacity = useSharedValue(0);

  // Subscribe to store changes efficiently
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      speedSV.value = state.gameSpeed;
      gapSV.value = state.gapWidth;
      hasShieldSV.value = state.hasShield;
      activePowerUpSV.value = state.activePowerUp;
      scoreSV.value = state.score;
      livesSV.value = state.lives;
    });
    return unsub;
  }, []);

  const randomObstacleType = (currentScore) => {
    'worklet';
    if (currentScore < 10) return OBS_NORMAL;
    const r = Math.random();
    if (currentScore < 25) return r < 0.7 ? OBS_NORMAL : OBS_ZIGZAG;
    if (currentScore < 50) {
      if (r < 0.5) return OBS_NORMAL;
      if (r < 0.75) return OBS_ZIGZAG;
      return OBS_CLOSING;
    }
    if (r < 0.35) return OBS_NORMAL;
    if (r < 0.6) return OBS_ZIGZAG;
    if (r < 0.85) return OBS_CLOSING;
    return OBS_DOUBLE;
  };

  useEffect(() => {
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      obstacleYs[i].value = -OBSTACLE_HEIGHT - i * (SCREEN_H / OBSTACLE_COUNT);
      const margin = 110;
      obstacleGapXs[i].value = margin + Math.random() * (SCREEN_W - 2 * margin);
      obstacleScored[i].value = false;
      obstacleTypes[i].value = OBS_NORMAL;
      obstaclePhase[i].value = Math.random() * Math.PI * 2;
      obstacleClosing[i].value = 0;
    }
  }, []);

  const handleGameOver = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    gameOverAction();
  }, [gameOverAction]);

  const handleScore = useCallback(() => {
    incrementScore();
  }, [incrementScore]);

  const handleHideHint = useCallback(() => setShowHint(false), []);

  const handlePowerUpCollect = useCallback((typeIndex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    activatePowerUp(PU_TYPES[typeIndex]);
  }, [activatePowerUp]);

  const handleShieldUse = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    useShieldAction();
  }, [useShieldAction]);

  const handleDeactivatePowerUp = useCallback(() => deactivatePowerUp(), [deactivatePowerUp]);

  const handleSpeedBurst = useCallback((active) => {
    setSpeedBurst(active);
    if (active) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [setSpeedBurst]);

  const handleCollectHeart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    collectHeart();
  }, [collectHeart]);

  const handleLoseLife = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    loseLife();
  }, [loseLife]);

  // --- Main game loop (UI thread) ---
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || isGameOver.value) return;

    if (!hasStarted.value) {
      if (isTouching.value) {
        hasStarted.value = true;
        runOnJS(handleHideHint)();
      }
      return;
    }

    // Finger lifted
    if (!isTouching.value) {
      if (livesSV.value > 1) {
        runOnJS(handleLoseLife)();
        livesSV.value = 1;
        hasStarted.value = false;
        shakeX.value = withSequence(
          withTiming(8, { duration: 40 }),
          withTiming(-8, { duration: 40 }),
          withTiming(0, { duration: 40 })
        );
        return;
      }
      isGameOver.value = true;
      runOnJS(handleGameOver)();
      return;
    }

    const dtNorm = dt / 16.67;

    // Speed burst
    speedBurstCooldown.value -= dt;
    if (speedBurstTimer.value > 0) {
      speedBurstTimer.value -= dt;
      if (speedBurstTimer.value <= 0) {
        speedBurstTimer.value = 0;
        runOnJS(handleSpeedBurst)(false);
      }
    } else if (scoreSV.value > 15 && speedBurstCooldown.value <= 0 && Math.random() < 0.001) {
      speedBurstTimer.value = 1500;
      speedBurstCooldown.value = 8000;
      runOnJS(handleSpeedBurst)(true);
    }

    let speed = speedSV.value;
    if (speedBurstTimer.value > 0) speed *= 1.8;
    if (activePowerUpSV.value === 'slow') speed *= 0.5;

    let gap = gapSV.value;
    if (activePowerUpSV.value === 'widen') gap = Math.min(200, gap * 1.6);

    // Power-up timer
    if (activePowerUpSV.value && activePowerUpSV.value !== 'shield') {
      puEffectTimer.value += dt;
      if (puEffectTimer.value > 4000) {
        puEffectTimer.value = 0;
        runOnJS(handleDeactivatePowerUp)();
      }
    }

    const delta = dtNorm * speed;

    // Trail (every 50ms instead of 30ms)
    trailTimer.value += dt;
    if (trailTimer.value > 50) {
      trailTimer.value = 0;
      const idx = trailIndex.value % TRAIL_LENGTH;
      trailXs[idx].value = playerX.value;
      trailYs[idx].value = playerY.value;
      trailIndex.value = idx + 1;
    }

    // Heartbeat
    if (scoreSV.value > 20) {
      heartbeatTimer.value += dt;
      const heartRate = 800 - Math.min(400, scoreSV.value * 3);
      const phase = (heartbeatTimer.value % heartRate) / heartRate;
      heartbeatOpacity.value = phase < 0.15 ? phase / 0.15 * 0.25 :
                               phase < 0.3 ? (0.3 - phase) / 0.15 * 0.25 : 0;
    }

    // Lantern opacity (smooth transition)
    if (scoreSV.value >= 40) {
      lanternOpacity.value = Math.min(0.82, lanternOpacity.value + dt * 0.0003);
    }

    // Obstacles
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      obstacleYs[i].value += delta;
      const obsType = obstacleTypes[i].value;

      if (obsType === OBS_ZIGZAG) {
        obstaclePhase[i].value += dt * 0.003;
      }
      if (obsType === OBS_CLOSING && obstacleYs[i].value > -OBSTACLE_HEIGHT && obstacleYs[i].value < SCREEN_H) {
        obstacleClosing[i].value = Math.min(0.55, obstacleClosing[i].value + dt * 0.0003);
      }

      // Score
      if (!obstacleScored[i].value && obstacleYs[i].value > playerY.value + PLAYER_RADIUS) {
        obstacleScored[i].value = true;
        runOnJS(handleScore)();
      }

      // Recycle
      if (obstacleYs[i].value > SCREEN_H + OBSTACLE_HEIGHT) {
        obstacleYs[i].value = -OBSTACLE_HEIGHT - 40 - Math.random() * 80;
        const margin = gap / 2 + 30;
        obstacleGapXs[i].value = margin + Math.random() * (SCREEN_W - 2 * margin);
        obstacleScored[i].value = false;
        obstacleTypes[i].value = randomObstacleType(scoreSV.value);
        obstaclePhase[i].value = Math.random() * Math.PI * 2;
        obstacleClosing[i].value = 0;
      }

      // Collision
      const obsTop = obstacleYs[i].value;
      const obsBottom = obsTop + OBSTACLE_HEIGHT;
      if (playerY.value + PLAYER_RADIUS > obsTop && playerY.value - PLAYER_RADIUS < obsBottom) {
        let eg = gap;
        let egx = obstacleGapXs[i].value;
        if (obsType === OBS_ZIGZAG) egx += Math.sin(obstaclePhase[i].value) * 40;
        if (obsType === OBS_CLOSING) eg *= (1 - obstacleClosing[i].value);

        if (playerX.value - PLAYER_RADIUS < egx - eg / 2 || playerX.value + PLAYER_RADIUS > egx + eg / 2) {
          if (hasShieldSV.value) {
            runOnJS(handleShieldUse)();
            playerX.value = egx;
          } else if (livesSV.value > 1) {
            runOnJS(handleLoseLife)();
            livesSV.value = 1;
            playerX.value = egx;
            shakeX.value = withSequence(
              withTiming(10, { duration: 50 }),
              withTiming(-10, { duration: 50 }),
              withTiming(0, { duration: 50 })
            );
          } else {
            isGameOver.value = true;
            shakeX.value = withSequence(
              withTiming(10, { duration: 50 }),
              withTiming(-10, { duration: 50 }),
              withTiming(5, { duration: 50 }),
              withTiming(0, { duration: 50 })
            );
            shakeY.value = withSequence(
              withTiming(-8, { duration: 50 }),
              withTiming(8, { duration: 50 }),
              withTiming(0, { duration: 50 })
            );
            runOnJS(handleGameOver)();
            return;
          }
        }
      }
    }

    // Power-up item
    if (puActive.value) {
      puY.value += delta * 0.8;
      const dx = playerX.value - puX.value;
      const dy = playerY.value - puY.value;
      if (dx * dx + dy * dy < (PLAYER_RADIUS + POWERUP_SIZE / 2) * (PLAYER_RADIUS + POWERUP_SIZE / 2)) {
        puActive.value = false;
        runOnJS(handlePowerUpCollect)(puType.value);
      }
      if (puY.value > SCREEN_H + 50) puActive.value = false;
    } else if (scoreSV.value > 5 && Math.random() < 0.002) {
      puActive.value = true;
      puX.value = 40 + Math.random() * (SCREEN_W - 80);
      puY.value = -40;
      puType.value = Math.floor(Math.random() * PU_TYPES.length);
    }

    // Heart item
    heartSpawnCooldown.value -= dt;
    if (heartItemActive.value) {
      heartItemY.value += delta * 0.7;
      const hdx = playerX.value - heartItemX.value;
      const hdy = playerY.value - heartItemY.value;
      if (hdx * hdx + hdy * hdy < (PLAYER_RADIUS + 16) * (PLAYER_RADIUS + 16)) {
        heartItemActive.value = false;
        runOnJS(handleCollectHeart)();
      }
      if (heartItemY.value > SCREEN_H + 50) heartItemActive.value = false;
    } else if (scoreSV.value > 10 && livesSV.value < 2 && heartSpawnCooldown.value <= 0 && Math.random() < 0.0008) {
      heartItemActive.value = true;
      heartItemX.value = 40 + Math.random() * (SCREEN_W - 80);
      heartItemY.value = -40;
      heartSpawnCooldown.value = 15000;
    }

    colorProgress.value = Math.min((speed - 3) / 7, 1);
  });

  // Gesture
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      isTouching.value = true;
      playerX.value = e.absoluteX;
      playerY.value = e.absoluteY;
    })
    .onUpdate((e) => {
      playerX.value = e.absoluteX;
      playerY.value = e.absoluteY;
    })
    .onEnd(() => { isTouching.value = false; })
    .onFinalize(() => { isTouching.value = false; })
    .minDistance(0)
    .minPointers(1);

  // --- Animated styles ---
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.value, [0, 0.5, 1], ['#1a0a3e', '#4a0e4e', '#8b0000']),
    transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }],
  }));

  const playerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: playerX.value - PLAYER_RADIUS },
      { translateY: playerY.value - PLAYER_RADIUS },
    ],
    opacity: isTouching.value ? 1 : 0.4,
  }));

  const trailStyles = trailXs.map((tx, i) =>
    useAnimatedStyle(() => {
      const age = ((trailIndex.value - i + TRAIL_LENGTH) % TRAIL_LENGTH) / TRAIL_LENGTH;
      const size = PLAYER_RADIUS * 2 * (1 - age * 0.6);
      return {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#00ffcc',
        opacity: (1 - age) * 0.35,
        transform: [
          { translateX: tx.value - size / 2 },
          { translateY: trailYs[i].value - size / 2 },
        ],
      };
    })
  );

  const obstacleLeftStyles = obstacleYs.map((y, i) =>
    useAnimatedStyle(() => {
      let egx = obstacleGapXs[i].value;
      let eg = gapSV.value;
      const t = obstacleTypes[i].value;
      if (activePowerUpSV.value === 'widen') eg = Math.min(200, eg * 1.6);
      if (t === OBS_ZIGZAG) egx += Math.sin(obstaclePhase[i].value) * 40;
      if (t === OBS_CLOSING) eg *= (1 - obstacleClosing[i].value);
      return {
        transform: [{ translateY: y.value }],
        width: Math.max(0, egx - eg / 2),
        left: 0,
        backgroundColor: t === OBS_ZIGZAG ? '#ff66cc' : t === OBS_CLOSING ? '#ff4444' : t === OBS_DOUBLE ? '#ffaa00' : '#00ffcc',
      };
    })
  );

  const obstacleRightStyles = obstacleYs.map((y, i) =>
    useAnimatedStyle(() => {
      let egx = obstacleGapXs[i].value;
      let eg = gapSV.value;
      const t = obstacleTypes[i].value;
      if (activePowerUpSV.value === 'widen') eg = Math.min(200, eg * 1.6);
      if (t === OBS_ZIGZAG) egx += Math.sin(obstaclePhase[i].value) * 40;
      if (t === OBS_CLOSING) eg *= (1 - obstacleClosing[i].value);
      return {
        transform: [{ translateY: y.value }],
        width: Math.max(0, SCREEN_W - (egx + eg / 2)),
        right: 0,
        backgroundColor: t === OBS_ZIGZAG ? '#ff66cc' : t === OBS_CLOSING ? '#ff4444' : t === OBS_DOUBLE ? '#ffaa00' : '#00ffcc',
      };
    })
  );

  const puStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    left: puX.value - POWERUP_SIZE / 2,
    top: puY.value - POWERUP_SIZE / 2,
    opacity: puActive.value ? 1 : 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    backgroundColor: '#4488ff',
  }));

  const heartItemStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: heartItemX.value - 14,
    top: heartItemY.value - 14,
    width: 28,
    height: 28,
    opacity: heartItemActive.value ? 1 : 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  }));

  // Simplified lantern: 4 dark rectangles around player instead of huge border
  const lanternTop = useAnimatedStyle(() => ({
    position: 'absolute', left: 0, right: 0, top: 0,
    height: Math.max(0, playerY.value - 80),
    backgroundColor: 'rgba(0,0,0,0.85)',
    opacity: lanternOpacity.value,
  }));
  const lanternBottom = useAnimatedStyle(() => ({
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: Math.max(0, SCREEN_H - playerY.value - 80),
    backgroundColor: 'rgba(0,0,0,0.85)',
    opacity: lanternOpacity.value,
  }));
  const lanternLeft = useAnimatedStyle(() => ({
    position: 'absolute', left: 0,
    top: Math.max(0, playerY.value - 80),
    width: Math.max(0, playerX.value - 80),
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.85)',
    opacity: lanternOpacity.value,
  }));
  const lanternRight = useAnimatedStyle(() => ({
    position: 'absolute', right: 0,
    top: Math.max(0, playerY.value - 80),
    width: Math.max(0, SCREEN_W - playerX.value - 80),
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.85)',
    opacity: lanternOpacity.value,
  }));

  const heartbeatStyle = useAnimatedStyle(() => ({
    opacity: heartbeatOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, bgStyle]}>
        <LivesDisplay />

        <View style={styles.scoreContainer}>
          <ScoreDisplay />
          <ComboDisplay />
        </View>

        <BurstWarning />
        <PowerUpIndicator />

        {showHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Touch and hold to start</Text>
          </View>
        )}

        {trailStyles.map((style, i) => (
          <Animated.View key={`t${i}`} style={style} />
        ))}

        {obstacleLeftStyles.map((style, i) => (
          <Animated.View key={`ol${i}`} style={[styles.obstacle, style]} />
        ))}
        {obstacleRightStyles.map((style, i) => (
          <Animated.View key={`or${i}`} style={[styles.obstacle, style]} />
        ))}

        <Animated.View style={puStyle}>
          <Text style={styles.puLabel}>P</Text>
        </Animated.View>

        <Animated.View style={heartItemStyle}>
          <Text style={styles.heartItem}>{'\u2764'}</Text>
        </Animated.View>

        <Animated.View style={[styles.player, playerStyle]} />

        {/* Lantern (4 rects - much cheaper than huge border) */}
        <Animated.View style={lanternTop} pointerEvents="none" />
        <Animated.View style={lanternBottom} pointerEvents="none" />
        <Animated.View style={lanternLeft} pointerEvents="none" />
        <Animated.View style={lanternRight} pointerEvents="none" />

        <Animated.View style={[styles.heartbeatBorder, heartbeatStyle]} pointerEvents="none" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a3e', overflow: 'hidden' },
  scoreContainer: {
    position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 10,
  },
  scoreText: {
    fontSize: 48, fontWeight: '900', color: 'rgba(255,255,255,0.15)', fontVariant: ['tabular-nums'],
  },
  comboText: {
    fontSize: 16, fontWeight: '800', color: '#ffcc00', letterSpacing: 2, marginTop: 4,
    textShadowColor: '#ffcc00', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  burstWarning: {
    position: 'absolute', top: 130, left: 0, right: 0, alignItems: 'center', zIndex: 10,
  },
  burstText: {
    fontSize: 14, fontWeight: '900', color: '#ff4444', letterSpacing: 4,
    textShadowColor: '#ff4444', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  puIndicator: {
    position: 'absolute', top: 150, alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, zIndex: 10,
  },
  puIndicatorText: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  hintContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 5,
  },
  hintText: { fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  obstacle: {
    position: 'absolute', height: OBSTACLE_HEIGHT, borderRadius: 4,
  },
  player: {
    position: 'absolute', width: PLAYER_RADIUS * 2, height: PLAYER_RADIUS * 2,
    borderRadius: PLAYER_RADIUS, backgroundColor: '#fff',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
    zIndex: 20,
  },
  heartbeatBorder: {
    ...StyleSheet.absoluteFillObject, borderWidth: 12, borderColor: '#ff0044', zIndex: 24,
  },
  puLabel: { color: '#fff', fontSize: 12, fontWeight: '900' },
  livesContainer: {
    position: 'absolute', top: 60, right: 20, flexDirection: 'row', zIndex: 30, gap: 4,
  },
  heartIcon: {
    fontSize: 22, color: '#ff2255',
    textShadowColor: '#ff2255', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },
  heartItem: {
    fontSize: 26, color: '#ff2255',
    textShadowColor: '#ff2255', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
});
