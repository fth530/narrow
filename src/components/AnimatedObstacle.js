
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { OBSTACLE_COLOR } from '../constants/theme';

export const AnimatedObstacle = ({ id, obstaclesData }) => {
    const style = useAnimatedStyle(() => {
        const obstacle = obstaclesData.value[id];
        if (!obstacle) {
            return { transform: [{ translateX: -1000 }, { translateY: -1000 }] }; // hide if deleted
        }
        return {
            transform: [
                { translateX: obstacle.x },
                { translateY: obstacle.y }
            ],
            width: obstacle.width,
            height: obstacle.height,
        };
    });

    return <Animated.View style={[styles.obstacleBox, style]} />;
};

const styles = StyleSheet.create({
    obstacleBox: {
        position: 'absolute',
        left: 0,
        top: 0,
        backgroundColor: '#18181B', // Dark Zinc
        borderColor: OBSTACLE_COLOR,
        borderWidth: 1.5,
        borderRadius: 6,
        shadowColor: OBSTACLE_COLOR,
        shadowOpacity: 0.8,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
});
