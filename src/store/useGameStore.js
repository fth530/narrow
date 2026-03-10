import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useGameStore = create((set) => ({
    gameState: 'MENU', // MENU, PLAYING, PAUSED, GAMEOVER
    highScore: 0,
    setGameState: (state) => set({ gameState: state }),
    loadHighScore: async () => {
        try {
            const val = await AsyncStorage.getItem('@highScore');
            if (val) set({ highScore: parseInt(val, 10) });
        } catch (e) { }
    },
    saveHighScore: async (newScore) => {
        set((state) => {
            if (newScore > state.highScore) {
                AsyncStorage.setItem('@highScore', newScore.toString());
                return { highScore: newScore };
            }
            return state;
        });
    }
}));
