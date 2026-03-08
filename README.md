# Narrow 🕹️
*(Formerly known as Parmak Labirenti)*

**Narrow** is an ultra-fast, minimalist, and punishing hypercasual mobile game built with **React Native (Expo)** and the power of **Reanimated's UI Thread S-Class engine**. The objective is simple: Put your finger on the screen and **never lift it**. Navigate through an infinitely falling, dynamic neon labyrinth that shrinks and speeds up as your score increases.

## 🌟 Key Features
*   **Rule #1: Don't Lift Your Finger:** A true test of nerves. The moment your finger leaves the screen, the system crashes.
*   **True Labyrinth Engine:** Obstacles aren't just random blocks; they are strategically generated narrowing tunnel walls.
*   **Dynamic Flow Palette:** The background color reacts organically to your high score. Transition from a calm Indigo to a stressful Nightmare Red as the game accelerates.
*   **S-Class Performance (60+ FPS):** Fully bridge-less game loop. Math, physics, and collision detection are exclusively executed on the UI Thread using `react-native-reanimated`'s `useFrameCallback` and Shared Values, achieving unparalleled zero-latency performance.
*   **Grace Period System:** An intelligent delayed-start mechanism ensuring the game only begins when the player commits their first touch.
*   **Immersive Sensory Design:** Deep haptic feedback integration for menus and collisions using `expo-haptics`.

## 🛠️ Tech Stack
*   **React Native** (Expo SDK)
*   **React Native Reanimated** - Math & Physics Engine
*   **React Native Gesture Handler** - Zero-latency touch tracking
*   **Zustand** - State Management
*   **AsyncStorage** - Local High Score persistence

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/fth530/narrow.git
   cd narrow
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Scan the QR code using the **Expo Go** app on your iOS or Android device.

## 🎮 Game Mechanics
As the game progresses, the `gameSpeed` multiplier linearly increases while the `gapWidth` (safety passage between the left and right walls) drastically shrinks. The score multiplier has been meticulously balanced to scale gracefully with player endurance.

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you want to add new features like "Time Slowdown Powerups" or "Ghost Player Mode"!

---
<p align="center">Made with ❤️ and extreme performance optimizations.</p>
