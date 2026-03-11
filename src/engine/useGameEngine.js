import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FINGER_RADIUS } from '../constants/theme';
import { calculateGapWidth, calculateSpawnInterval } from './gameMath';

export const POOL_SIZE = 16; // 8 pairs of walls (enough for mobile screen)

export const useGameEngine = ({ triggerGameOver }) => {
    // UI Thread State
    const fingerX = useSharedValue(SCREEN_WIDTH / 2);
    const fingerY = useSharedValue(SCREEN_HEIGHT - 150);
    const isTouching = useSharedValue(false);
    const isAlive = useSharedValue(false);

    // Object Pooling (Sıfır Mount/Unmount, Önceden Tahsis Edilmiş Bellek)
    // dictionary yerine sabit boyutlu DİZİ kullanıyoruz.
    const initialPool = Array.from({ length: POOL_SIZE }, () => ({
        x: -1000, y: -1000, width: 0, height: 0, active: false
    }));
    const obstaclesPool = useSharedValue(initialPool);
    const poolIndex = useSharedValue(0); // Havuzda (Pool) sıradaki ayrılacak indeks

    const lastObstacleSpawn = useSharedValue(0);
    const gameSpeed = useSharedValue(4.5);
    const scoreValue = useSharedValue(0);

    // HARDCORE UI THREAD GAME LOOP
    const gracePeriod = useSharedValue(true);

    useFrameCallback((frameInfo) => {
        if (!isAlive.value) return;

        const dt = frameInfo.timeDiff || 16.6;
        const elapsedFactor = dt / 16.6;
        const time = frameInfo.timestamp;

        // Kural 1: Parmak ekranda olmalı (Grace period ile)
        if (!isTouching.value) {
            if (!gracePeriod.value) {
                isAlive.value = false;
                runOnJS(triggerGameOver)(scoreValue.value);
                return;
            }
        } else {
            gracePeriod.value = false; // Ekrana ilk dokunuşta kurtulma payı biter
        }

        // Objeleri güncellemek için referansı kopartıyoruz (Reactivity için)
        const currentPool = obstaclesPool.value.slice();
        let poolChanged = false;

        // Kural 2: Gerçek Labirent Oluştur (Duvar Kapıları)
        if (time - lastObstacleSpawn.value > calculateSpawnInterval(scoreValue.value)) {
            const gapWidth = calculateGapWidth(scoreValue.value, FINGER_RADIUS);
            const maxGapStart = SCREEN_WIDTH - gapWidth;
            let gapStart = Math.random() * maxGapStart;

            if (gapStart < 10) gapStart = 10;
            if (gapStart > maxGapStart - 10) gapStart = maxGapStart - 10;

            const idx = poolIndex.value;
            const rightWallX = gapStart + gapWidth;

            // Havuzdaki mevcut boş objeleri (geri dönüştürülen) tekrar kullan
            // SOL DUVAR
            currentPool[idx] = { x: -20, y: -80, width: gapStart + 20, height: 50, active: true };
            // SAĞ DUVAR
            currentPool[(idx + 1) % POOL_SIZE] = { x: rightWallX, y: -80, width: SCREEN_WIDTH - rightWallX + 20, height: 50, active: true };

            poolIndex.value = (idx + 2) % POOL_SIZE;
            poolChanged = true;
            lastObstacleSpawn.value = time;
        }

        // Kural 3: Fiziği Hareket Ettir & Çarpışma Kontrolü
        let collisionDetected = false;

        gameSpeed.value += 0.0008 * elapsedFactor;
        scoreValue.value += (0.015 * elapsedFactor);

        for (let i = 0; i < POOL_SIZE; i++) {
            if (!currentPool[i].active) continue;

            const obs = currentPool[i];
            const newY = obs.y + gameSpeed.value * elapsedFactor;

            if (newY > SCREEN_HEIGHT + 100) {
                // Ekrandan çıktı -> Objeyi geri dönüştür (Deactivate)
                currentPool[i] = { ...obs, active: false, y: -1000 };
                poolChanged = true;
                continue;
            }

            // Pozisyonu güncelle
            currentPool[i] = { ...obs, y: newY };
            poolChanged = true;

            // Çarpışma Testi
            let testX = fingerX.value;
            let testY = fingerY.value;

            if (fingerX.value < obs.x) testX = obs.x;
            else if (fingerX.value > obs.x + obs.width) testX = obs.x + obs.width;

            if (fingerY.value < newY) testY = newY;
            else if (fingerY.value > newY + obs.height) testY = newY + obs.height;

            const distX = fingerX.value - testX;
            const distY = fingerY.value - testY;
            const distanceSq = (distX * distX) + (distY * distY);

            const forgivenessRadius = FINGER_RADIUS * 0.82;
            if (distanceSq <= (forgivenessRadius * forgivenessRadius)) {
                collisionDetected = true;
                break;
            }
        }

        if (poolChanged) {
            obstaclesPool.value = currentPool; // Reanimated trigger
        }

        // Kural 4: Ölüm
        if (collisionDetected) {
            isAlive.value = false;
            runOnJS(triggerGameOver)(scoreValue.value);
        }
    });

    const startGameEngine = () => {
        gracePeriod.value = true;
        obstaclesPool.value = Array.from({ length: POOL_SIZE }, () => ({
            x: -1000, y: -1000, width: 0, height: 0, active: false
        }));
        poolIndex.value = 0;
        scoreValue.value = 0;
        gameSpeed.value = 4.5;
        isAlive.value = true;
    };

    const pauseGameEngine = () => {
        isAlive.value = false;
    };

    const resumeGameEngine = () => {
        isAlive.value = true;
    };

    return {
        fingerX,
        fingerY,
        isTouching,
        isAlive,
        obstaclesPool,
        scoreValue,
        startGameEngine,
        pauseGameEngine,
        resumeGameEngine
    };
};
