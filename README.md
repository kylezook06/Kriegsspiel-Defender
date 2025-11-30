# Kriegsspiel-Defender

A p5.js (1.11.x) side-scrolling shoot 'em up where a classic Kriegsspiel block purges photo-realistic French minis on a scrolling Waterloo-style map. This repository contains a starter sketch that mirrors the R-Type-inspired loop described by the concept: constrained player movement, waves of infantry/cavalry/cannon enemies, a mid-level sniper squeeze, power-up drops, and a late-stage commander boss.

## Quick start

1. Open `index.html` in a browser or drop `index.html` + `sketch.js` into the p5 web editor.
2. Press **Space** or **Enter** to leave the start screen. Controls: move with **mouse**, **WASD**, or **arrow keys**; hold **Space** or **Left Click** to auto-fire (multi-shot upgrades fire extra angles automatically); press **P** to pause/unpause and restart with **R** after defeat (boss clears auto-restart the loop). Press **M** to toggle background music and **N** to toggle all audio. If you drop in background music (`assets/BG_Music_Lvl_1.wav`), it will loop after you start the level (unless muted).
3. Scoring: +10 (power-up pickup), +10 (infantry kill), +20 (cavalry kill), +20 (cannon kill), +30 (sniper kill), +40 (rear sniper kill), +1000 (boss kill).
4. Power-ups: Shields—every **5 shields** adds another battalion follower (up to **5 followers**). They line up alternately in front of and behind you (acting as a mini-shield wall), shoot randomly in all eight compass directions, and die in one hit from enemy fire. Rapid-fire—collect **5** tokens to fire east + northeast + southeast; collect **10** to add a rear shot. Losing 1 HP clears rapid-fire and its timer. Medical—rare drop that restores **+1 HP** and also raises your max HP if you were already full, glowing like the other pickups.
5. Damage scaling: Your shots get stronger the closer you are to the target—**0.5×** damage at long range (farther than two-thirds of the canvas width), **1×** at mid-range, and **2×** in close quarters (within one-third of the canvas width).
6. Drop your own art into a local `assets/` folder (create it if it doesn’t exist—this repo ignores `assets/` entirely). The sketch adds a cache-busting query parameter to each load so refreshed pages pull fresh art. It will auto-load these filenames if present (PNG or, for the map, PNG/JPG) and otherwise fall back to the placeholder shapes:
   - `assets/player_block.png`
   - `assets/french_infantry.png`
   - `assets/french_cavalry.png`
   - `assets/french_cannon.png`
   - `assets/french_sniper.png`
   - `assets/french_sniper2.png` (or `assets/french_sniper_2.png` / `assets/sniper_2.png`) for the rear sniper
   - `assets/french_commander_boss.png`
  - `assets/waterloo_map.jpg`
   - `assets/hedgerow.png` (tiled cover during the sniper squeeze)
   - `assets/powerup_shield.png`
   - `assets/powerup_rapid.png`
   - `assets/powerup_medical.png`
   - `assets/powerup_battalion.png` (art for the trailing followers)
   - `assets/BG_Music_Lvl_1.wav` (optional looping background music)
   - `assets/Cannon.wav` (fires when cannons or the boss artillery attack)
   - `assets/Military_Drums_Level_Up.wav` (plays on rapid-fire pickup)
   - `assets/PowerUp_Shields.wav` (plays on shield pickup)
   - `assets/powerup_medical.wav` (plays on medical pickup)
   - `assets/player_hit.wav` (plays when the player takes damage)
   - `assets/Player_Shot.wav` (player fire SFX; currently muted in code to reduce audio load)
   - `assets/Sniper_Shot.wav` (plays when snipers fire)
   - `assets/enemy_down.wav` (plays when the player kills a non-boss enemy)
   - `assets/boss_down.wav` (plays when the commander boss is defeated)
7. Audio headroom: the mix starts at 50% `masterVolume` with per-sound levels and light throttling on high-volume effects (cannons, sniper fire, kills) to avoid late-run clipping. Adjust the volumes or throttle timings in `normalizeSoundLevels()` / `playSound()` inside `sketch.js` if you want a louder or quieter mix.

## File overview

- `index.html` – Loads p5.js 1.11.x from a CDN, styles the page, and wires in the sketch.
- `sketch.js` – Contains the Level 1 skeleton: scrolling map background, structured wave sequencing (intro infantry → cavalry zig-zag → cannons with blast clouds → sniper squeeze), power-ups with score boosts and upgrade thresholds, boss fight, HUD, and reset flow.

## Level 1 flow at a glance

- Starts small: single infantry waves (1–2) then a tighter five-infantry formation.
- Cavalry arrive in fast zig-zags (only 1–2 at a time), then infantry return in formations capped at six.
- Cannons join with slow shells that burst into lingering smoke clouds.
- A narrowing sniper channel fires from top and bottom edges (snipers don’t stack on the same edge).
- A rear sniper variant periodically pops in from behind the player, fires for five seconds, and retreats off-screen to the left.
- Just before the boss (around **2:50–3:00**), a cannon onslaught floods the screen (up to ten cannons).
- The boss enters at the **3-minute mark** with 20× HP, rotating attacks (softer-aim direct shots, widening half-circle spreads, and random cannon strikes) and now drops aid at roughly triple the previous frequency during the fight. A health bar under the boss tracks damage. When the boss falls, the next stage begins with the same flow but spawns **one extra enemy per wave** and enemy firing timers sped up by **10%**; the start screen reset returns you to Stage 1.

## Customization ideas

- Swap in Waterloo or other Napoleonic map tiles for the background.
- Add enemy projectiles (e.g., cannonballs), spread-shot power-ups, or new boss patterns.
- Build additional levels by varying spawn timings, narrowing segments, and boss stats.
