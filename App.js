import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameStore } from './src/store';
import MenuScreen from './src/MenuScreen';
import GameScreen from './src/GameScreen';
import GameOverScreen from './src/GameOverScreen';

export default function App() {
  const gameState = useGameStore((s) => s.gameState);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" hidden />
      {gameState === 'menu' && <MenuScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'gameOver' && <GameOverScreen />}
    </GestureHandlerRootView>
  );
}
