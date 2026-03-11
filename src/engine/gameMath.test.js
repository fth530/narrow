import { calculateGapWidth, calculateSpawnInterval } from './gameMath';

describe('Game Math Engine Tests', () => {

    describe('calculateGapWidth', () => {
        const fingerRadius = 28;

        it('should return initial width for score 0', () => {
            const width = calculateGapWidth(0, fingerRadius);
            expect(width).toBe(180);
        });

        it('should return narrower width for higher score', () => {
            const widthLow = calculateGapWidth(10, fingerRadius);
            const widthHigh = calculateGapWidth(50, fingerRadius);
            expect(widthLow).toBeLessThan(180);
            expect(widthHigh).toBeLessThan(widthLow);
        });

        it('should respect minimum limit based on finger radius', () => {
            // Skoru çok abartılı versek bile en fazla parmak kalınlığının 3.5 katı kadar daralmalı
            const extremelyHighScore = 1000;
            const minAllowedWidth = fingerRadius * 3.5;
            const width = calculateGapWidth(extremelyHighScore, fingerRadius);
            expect(width).toBe(minAllowedWidth);
        });
    });

    describe('calculateSpawnInterval', () => {
        it('should return highest interval for score 0', () => {
            const interval = calculateSpawnInterval(0);
            expect(interval).toBe(1600);
        });

        it('should spawn obstacles faster as score increases', () => {
            const intervalLow = calculateSpawnInterval(10);
            const intervalHigh = calculateSpawnInterval(20);
            expect(intervalLow).toBe(1450); // 1600 - 150
            expect(intervalHigh).toBe(1300); // 1600 - 300
        });

        it('should respect minimum spawn interval 600ms', () => {
            const extremelyHighScore = 1000;
            const interval = calculateSpawnInterval(extremelyHighScore);
            expect(interval).toBe(600); // Limit altına inmemeli
        });
    });

});
