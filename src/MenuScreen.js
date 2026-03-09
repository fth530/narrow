import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from './store';

const { width: SCREEN_W } = Dimensions.get('window');

export default function MenuScreen() {
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);
  const loadHighScore = useGameStore((s) => s.loadHighScore);

  useEffect(() => {
    loadHighScore();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startGame();
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>NARROW</Text>
        <Text style={styles.subtitle}>Don't lift your finger</Text>
      </View>

      <TouchableOpacity style={styles.playButton} onPress={handleStart}>
        <Text style={styles.playButtonText}>PLAY</Text>
      </TouchableOpacity>

      {highScore > 0 && (
        <Text style={styles.highScore}>Best: {highScore}</Text>
      )}

      <View style={styles.rulesContainer}>
        <Text style={styles.ruleText}>Touch the screen</Text>
        <Text style={styles.ruleText}>Navigate through the gaps</Text>
        <Text style={styles.ruleText}>Never lift your finger</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a3e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#00ffcc',
    letterSpacing: 12,
    textShadowColor: '#00ffcc',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    marginTop: 8,
  },
  playButton: {
    width: SCREEN_W * 0.5,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ffcc',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00ffcc',
    letterSpacing: 6,
  },
  highScore: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 40,
  },
  rulesContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  ruleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
    marginVertical: 3,
  },
});
