# Declan vs The Mainframe

A playful, cinematic browser puzzle where kid hacker Declan battles five neon security layers. Built with Phaser 3, GSAP tweens, and Howler audio. Everything runs client-side—no servers required.

## Features
- Five distinct puzzle layers: Codebreaker Grid, Logic Wires, Password Brute Logic, Firewall Maze, and Pattern Decryption.
- Responsive layout that scales to desktop and tablet.
- HUD with layer tracking, Declan quips, hints, and tutorial overlays on first encounter.
- Animated buttons, glitchy feedback, sound effects, and a synthy background loop.
- LocalStorage progress so you can continue runs.

## Getting started

### Prerequisites
- Node.js 18+ and npm

### Install
```bash
npm install
```

### Run a dev server
```bash
npm run dev
```
Then open the printed localhost URL. Vite provides hot reload for rapid iteration.

### Build for production
```bash
npm run build
```
The optimized build lands in `dist/`. Use `npm run preview` to serve the build locally.

## Project structure
- `index.html` – entry point that mounts the Phaser canvas.
- `src/main.js` – bootstraps Phaser and scene configuration.
- `src/scenes/` – Boot, Menu, Game, UI, and End scenes encapsulating game flow.
- `public/assets/` – placeholder audio, art, and font notes ready for replacement.

## Notes
- All audio and art are simple placeholders so the game runs offline. Swap them with your own assets to dial in the vibe.
- No real hacking occurs; every interaction is a puzzle, animation, or sound effect.
