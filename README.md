# Kriegsspiel-Defender

A p5.js (1.11.x) side-scrolling shoot 'em up where a classic Kriegsspiel block purges photo-realistic French minis on a scrolling Waterloo-style map. This repository contains a starter sketch that mirrors the R-Type-inspired loop described by the concept: constrained player movement, waves of infantry/cavalry/cannon enemies, a mid-level sniper squeeze, power-up drops, and a late-stage commander boss.

## Quick start

1. Open `index.html` in a browser or drop `index.html` + `sketch.js` into the p5 web editor.
2. Controls: move with **WASD** or **arrow keys**, hold **Space** to auto-fire, restart with **R** after defeat (boss clears auto-restart the loop).
3. Drop your own art into a local `assets/` folder (create it if it doesn’t exist—this repo ignores `assets/` entirely). The sketch will auto-load these filenames if present (PNG or, for the map, PNG/JPG) and otherwise fall back to the placeholder shapes:
   - `assets/player_block.png`
   - `assets/french_infantry.png`
   - `assets/french_cavalry.png`
   - `assets/french_cannon.png`
   - `assets/french_commander_boss.png`
   - `assets/waterloo_map.png` **or** `assets/waterloo_map.jpg`
   - `assets/powerup_shield.png`
   - `assets/powerup_rapid.png`

## File overview

- `index.html` – Loads p5.js 1.11.x from a CDN, styles the page, and wires in the sketch.
- `sketch.js` – Contains the Level 1 skeleton: scrolling map background, structured wave sequencing (intro infantry → cavalry zig-zag → cannons with blast clouds → sniper squeeze), power-ups, boss fight, HUD, and reset flow.

## Level 1 flow at a glance

- Starts small: single infantry waves (1–2) then a tighter five-infantry formation.
- Cavalry arrive in fast zig-zags (only 1–2 at a time), then infantry return in formations capped at six.
- Cannons join with slow shells that burst into lingering smoke clouds.
- A narrowing sniper channel fires from top and bottom edges.
- The sequence loops with small variations, then a boss enters; when the boss falls, the level automatically restarts.

## Customization ideas

- Swap in Waterloo or other Napoleonic map tiles for the background.
- Add enemy projectiles (e.g., cannonballs), spread-shot power-ups, or new boss patterns.
- Build additional levels by varying spawn timings, narrowing segments, and boss stats.
