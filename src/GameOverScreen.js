import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from './store';

export default function GameOverScreen() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const startGame = useGameStore((s) => s.startGame);
  const setGameState = useGameStore((s) => s.setGameState);
  const isNewBest = score >= highScore && score > 0;

  const handleRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startGame();
  };

  const handleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameState('menu');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.crashText}>SYSTEM CRASH</Text>

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        {isNewBest && <Text style={styles.newBest}>NEW BEST!</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{highScore}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MAX COMBO</Text>
          <Text style={[styles.statValue, { color: '#ffcc00' }]}>x{maxCombo >= 3 ? (1 + Math.floor(maxCombo / 3) * 0.5).toFixed(1) : '1.0'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.retryButton} onPress={handleRestart}>
        <Text style={styles.retryText}>RETRY</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuText}>MENU</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crashText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ff0044',
    letterSpacing: 6,
    marginBottom: 50,
    textShadowColor: '#ff0044',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  newBest: {
    fontSize: 14,
    color: '#00ffcc',
    letterSpacing: 4,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  retryButton: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ffcc',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ffcc',
    letterSpacing: 4,
  },
  menuButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
  },
});
