export const calculateGapWidth = (scoreValue, fingerRadius) => {
    // Skor arttıkça geçit daralır, en fazla parmak kalınlığının 3.5 katı kadar daralabilir
    return Math.max(fingerRadius * 3.5, 180 - (scoreValue * 1.5));
};

export const calculateSpawnInterval = (scoreValue) => {
    // Skor arttıkça engeller daha sık doğar. Minimum doğma süresi 600ms'dir.
    return Math.max(600, 1600 - scoreValue * 15);
};
