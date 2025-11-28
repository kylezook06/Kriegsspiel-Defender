# Kriegsspiel-Defender

A p5.js (1.11.x) side-scrolling shoot 'em up where a classic Kriegsspiel block purges photo-realistic French minis on a scrolling Waterloo-style map. This repository contains a starter sketch that mirrors the R-Type-inspired loop described by the concept: constrained player movement, waves of infantry/cavalry/cannon enemies, a mid-level sniper squeeze, power-up drops, and a late-stage commander boss.

## Quick start

1. Open `index.html` in a browser or drop `index.html` + `sketch.js` into the p5 web editor.
2. Controls: move with **WASD** or **arrow keys**, fire with **Space**, restart with **R** after victory/defeat.
3. Drop your own PNGs into a local `assets/` folder (create it if it doesn’t exist—this repo ignores `assets/` entirely). If `assets/player_block.png` exists, it will auto-load; otherwise the player falls back to the rectangle sprite. Extend `preload()` in `sketch.js` to swap in minis, bosses, and a map tile.

## File overview

- `index.html` – Loads p5.js 1.11.x from a CDN, styles the page, and wires in the sketch.
- `sketch.js` – Contains the Level 1 skeleton: scrolling map background, enemy waves, sniper phase, power-ups, boss fight, HUD, and reset flow.

## Customization ideas

- Swap in Waterloo or other Napoleonic map tiles for the background.
- Add enemy projectiles (e.g., cannonballs), spread-shot power-ups, or new boss patterns.
- Build additional levels by varying spawn timings, narrowing segments, and boss stats.
