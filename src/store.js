import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = '@narrow_high_score';

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu', // 'menu' | 'playing' | 'gameOver'
  score: 0,
  highScore: 0,

  // Dynamic difficulty
  gameSpeed: 3,
  gapWidth: 160,

  // Combo
  combo: 0,
  maxCombo: 0,
  comboMultiplier: 1,

  // Power-ups
  activePowerUp: null, // 'slow' | 'shield' | 'widen' | null
  powerUpTimer: 0,
  hasShield: false,

  // Lantern mode (activates at score 50+)
  lanternMode: false,
  lanternRadius: 120,

  // Speed burst
  speedBurstActive: false,

  // Lives (heart system)
  lives: 1,

  // Actions
  setGameState: (state) => set({ gameState: state }),

  startGame: () =>
    set({
      gameState: 'playing',
      score: 0,
      gameSpeed: 3,
      gapWidth: 160,
      combo: 0,
      maxCombo: 0,
      comboMultiplier: 1,
      activePowerUp: null,
      powerUpTimer: 0,
      hasShield: false,
      lanternMode: false,
      lanternRadius: 120,
      speedBurstActive: false,
      lives: 1,
    }),

  incrementScore: () => {
    const { score, highScore, combo } = get();
    const newCombo = combo + 1;
    const newMultiplier = 1 + Math.floor(newCombo / 3) * 0.5; // x1, x1.5, x2, x2.5...
    const scoreAdd = Math.floor(1 * newMultiplier);
    const newScore = score + scoreAdd;
    const newSpeed = 3 + newScore * 0.012;
    const newGap = Math.max(55, 160 - newScore * 0.45);

    // Lantern mode activates at score 40+
    const lanternMode = newScore >= 40;
    const lanternRadius = lanternMode
      ? Math.max(70, 120 - (newScore - 40) * 0.5)
      : 120;

    set({
      score: newScore,
      gameSpeed: newSpeed,
      gapWidth: newGap,
      combo: newCombo,
      maxCombo: Math.max(get().maxCombo, newCombo),
      comboMultiplier: newMultiplier,
      lanternMode,
      lanternRadius,
    });

    if (newScore > highScore) {
      set({ highScore: newScore });
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(newScore)).catch(() => {});
    }
  },

  resetCombo: () => set({ combo: 0, comboMultiplier: 1 }),

  activatePowerUp: (type) => {
    if (type === 'shield') {
      set({ hasShield: true, activePowerUp: 'shield', powerUpTimer: 5 });
    } else if (type === 'slow') {
      set({ activePowerUp: 'slow', powerUpTimer: 4 });
    } else if (type === 'widen') {
      set({ activePowerUp: 'widen', powerUpTimer: 4 });
    }
  },

  deactivatePowerUp: () =>
    set({ activePowerUp: null, powerUpTimer: 0, hasShield: false }),

  useShield: () => set({ hasShield: false, activePowerUp: null }),

  setSpeedBurst: (active) => set({ speedBurstActive: active }),

  collectHeart: () => {
    const { lives } = get();
    if (lives < 2) {
      set({ lives: 2 });
    }
  },

  loseLife: () => {
    const { lives } = get();
    if (lives > 1) {
      set({ lives: lives - 1 });
      return true; // survived
    }
    return false; // dead
  },

  gameOver: () => {
    set({ gameState: 'gameOver' });
  },

  loadHighScore: async () => {
    try {
      const val = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (val !== null) {
        set({ highScore: parseInt(val, 10) });
      }
    } catch {}
  },
}));
