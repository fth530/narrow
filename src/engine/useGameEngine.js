import { useState } from 'react';
import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FINGER_RADIUS } from '../constants/theme';

export const useGameEngine = ({ triggerGameOver }) => {
    // UI Thread State
    const fingerX = useSharedValue(SCREEN_WIDTH / 2);
    const fingerY = useSharedValue(SCREEN_HEIGHT - 150);
    const isTouching = useSharedValue(false);
    const isAlive = useSharedValue(false);

    // React State for mounting components (1 fps updates)
    const [activeObstacleIds, setActiveObstacleIds] = useState([]);

    // UI thread state for fast geometry math (60 fps updates)
    const obstaclesData = useSharedValue({});

    const lastObstacleSpawn = useSharedValue(0);
    const gameSpeed = useSharedValue(4.5);
    const scoreValue = useSharedValue(0);

    const addObstacleIdReact = (id) => {
        setActiveObstacleIds(prev => [...prev, id]);
    };

    const removeObstacleIdReact = (id) => {
        setActiveObstacleIds(prev => prev.filter(i => i !== id));
    };

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
            // Ekrana ilk dokunuşta grace period biter
            gracePeriod.value = false;
        }

        // Kural 2: Gerçek Labirent Oluştur (Duvar Kapıları)
        // Yeni bir duvar satırı üretme hızı (skor arttıkça zorlaşır)
        if (time - lastObstacleSpawn.value > Math.max(600, 1600 - scoreValue.value * 15)) {
            // Labirentin açık kalacak boşluğu (Giderek daralır!)
            const gapWidth = Math.max(FINGER_RADIUS * 3.5, 180 - (scoreValue.value * 1.5));
            const maxGapStart = SCREEN_WIDTH - gapWidth;
            let gapStart = Math.random() * maxGapStart;

            // Kenarlara çok yapışmayı hafifletelim
            if (gapStart < 10) gapStart = 10;
            if (gapStart > maxGapStart - 10) gapStart = maxGapStart - 10;

            const leftWallId = time.toString() + "L";
            const rightWallId = time.toString() + "R";

            const newDict = Object.assign({}, obstaclesData.value);

            // SOL DUVAR
            newDict[leftWallId] = { x: -20, y: -80, width: gapStart + 20, height: 50 };

            // SAĞ DUVAR
            const rightWallX = gapStart + gapWidth;
            newDict[rightWallId] = { x: rightWallX, y: -80, width: SCREEN_WIDTH - rightWallX + 20, height: 50 };

            obstaclesData.value = newDict;

            runOnJS(addObstacleIdReact)(leftWallId);
            runOnJS(addObstacleIdReact)(rightWallId);

            lastObstacleSpawn.value = time;
        }

        // Kural 3: Fiziği Hareket Ettir & Çarpışma Kontrolü
        let collisionDetected = false;

        gameSpeed.value += 0.0008 * elapsedFactor;

        // SKORU ÇOK YAVAŞLATTIK (Saniyede yaklaşık 1 puan artar)
        scoreValue.value += (0.015 * elapsedFactor);

        const currentDict = Object.assign({}, obstaclesData.value);
        let dictChanged = false;

        for (const id in currentDict) {
            const obs = currentDict[id];
            const newY = obs.y + gameSpeed.value * elapsedFactor;

            if (newY > SCREEN_HEIGHT + 100) {
                // Engel ekrandan çıktı, parçala
                delete currentDict[id];
                runOnJS(removeObstacleIdReact)(id);
                dictChanged = true;
                continue;
            }

            // Pozisyonu güncelle
            currentDict[id].y = newY;
            dictChanged = true;

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

        if (dictChanged) {
            obstaclesData.value = currentDict;
        }

        // Kural 4: Ölüm
        if (collisionDetected) {
            isAlive.value = false;
            runOnJS(triggerGameOver)(scoreValue.value);
        }
    });

    const startGameEngine = () => {
        gracePeriod.value = true;
        obstaclesData.value = {};
        setActiveObstacleIds([]);
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
        obstaclesData,
        activeObstacleIds,
        scoreValue,
        startGameEngine,
        pauseGameEngine,
        resumeGameEngine
    };
};
