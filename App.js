import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BG_COLOR } from './src/constants/theme';
import { GameScreen } from './src/screens/GameScreen';
import { useGameStore } from './src/store/useGameStore';

export default function App() {
  const loadHighScore = useGameStore(state => state.loadHighScore);

  // Initialize store cache
  useEffect(() => {
    loadHighScore();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG_COLOR }}>
        <GameScreen />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
