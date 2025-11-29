// Kriegsspiel Defender - Level 1 Skeleton (Waterloo)
// Compatible with p5.js 1.11.x
// Player art now loads from assets/player_block.png; swap other PNG minis and map art as desired.

let player;
let bullets = [];
let enemies = [];
let powerups = [];
let enemyProjectiles = [];
let explosions = [];
let boss = null;
let bossSpawned = false;
let gameState = "start"; // "start" | "playing" | "boss" | "victory" | "gameOver"
let score = 0;
let playerImg;
let imgInfantry;
let imgCavalry;
let imgCannon;
let imgBoss;
let imgSniper;
let imgBattalion;
let imgMap;
let imgHedge;
let imgPowerupShield;
let imgPowerupRapid;
let bgMusic;
let sCannon;
let sRapid;
let sShield;
let sPlayerShot;
let sSniperShot;

// Timing
let levelTimer = 0; // seconds
let tick = 0; // frame-ish counter
let nextWaveTime = 1; // seconds
let waveIndex = 0;
let sequenceCycle = 0;
let victoryRestartTimer = 0;

let sniperPhaseActive = false;
let sniperEndTime = 0;
let sniperNextSpawn = 0;
let cannonOnslaughtActive = false;
let cannonOnslaughtNextSpawn = 0;

// Background scroll
let mapOffsetX = 0;
const SCROLL_SPEED = 2;
const PLAYER_IMG_SCALE = 0.15; // scales the imported PNG down to gameplay size
const CACHE_BUSTER = `?cb=${Math.floor(Math.random() * 1_000_000_000)}`;

function loadOptionalImage(paths, setter) {
  let idx = 0;
  const tryNext = () => {
    if (idx >= paths.length) {
      setter(null);
      return;
    }
    const path = paths[idx] + CACHE_BUSTER;
    loadImage(
      path,
      (img) => setter(img),
      () => {
        idx++;
        tryNext();
      }
    );
  };
  tryNext();
}

function loadOptionalSound(paths, setter) {
  let idx = 0;
  const tryNext = () => {
    if (idx >= paths.length) {
      setter(null);
      return;
    }
    const path = paths[idx] + CACHE_BUSTER;
    loadSound(
      path,
      (snd) => setter(snd),
      () => {
        idx++;
        tryNext();
      }
    );
  };
  tryNext();
}

function sizeFromImage(img, fallbackW, fallbackH = fallbackW) {
  if (!img) return { w: fallbackW, h: fallbackH };
  const ratio = img.height / img.width;
  return { w: fallbackW, h: fallbackW * ratio };
}

function preload() {
  // Optional: drop art into /assets locally. Files stay untracked because the folder is gitignored.
  loadOptionalImage(["assets/player_block.png"], (img) => (playerImg = img));
  loadOptionalImage(["assets/french_infantry.png"], (img) => (imgInfantry = img));
  loadOptionalImage(["assets/french_cavalry.png"], (img) => (imgCavalry = img));
  loadOptionalImage(["assets/french_cannon.png"], (img) => (imgCannon = img));
  loadOptionalImage(["assets/french_commander_boss.png"], (img) => (imgBoss = img));
  loadOptionalImage(["assets/french_sniper.png"], (img) => (imgSniper = img));
  loadOptionalImage(["assets/powerup_battalion.png"], (img) => (imgBattalion = img));
  // Try PNG first, then JPEG for the map because some references ship as .jpg
  loadOptionalImage(["assets/waterloo_map.png", "assets/waterloo_map.jpg"], (img) => (imgMap = img));
  loadOptionalImage(["assets/hedgerow.png"], (img) => (imgHedge = img));
  loadOptionalImage(["assets/powerup_shield.png"], (img) => (imgPowerupShield = img));
  loadOptionalImage(["assets/powerup_rapid.png"], (img) => (imgPowerupRapid = img));
  loadOptionalSound(["assets/BG_Music_Lvl_1.wav"], (snd) => (bgMusic = snd));
  loadOptionalSound(["assets/Cannon.wav"], (snd) => (sCannon = snd));
  loadOptionalSound(["assets/Military_Drums_Level_Up.wav"], (snd) => (sRapid = snd));
  loadOptionalSound(["assets/PowerUp_Shields.wav"], (snd) => (sShield = snd));
  loadOptionalSound(["assets/Player_Shot.wav"], (snd) => (sPlayerShot = snd));
  loadOptionalSound(["assets/Sniper_Shot.wav"], (snd) => (sSniperShot = snd));
}

function setup() {
  createCanvas(800, 600);
  textFont("monospace");
  resetGame(true);
}

function draw() {
  const dt = deltaTime / 1000; // seconds
  if (gameState !== "start") {
    levelTimer += dt;
    tick++;
  }

  background(20);
  drawScrollingMap();

  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  if (gameState === "playing") {
    handleSpawns(true);
    updateAndDrawAll();
    maybeSpawnBoss();
  } else if (gameState === "boss") {
    handleSpawns(false); // freeze regular waves
    updateAndDrawAll();
    if (boss && boss.hp <= 0) {
      gameState = "victory";
      victoryRestartTimer = 3;
    }
  } else if (gameState === "victory") {
    updateAndDrawAll();
    victoryRestartTimer -= dt;
    drawOverlay(`Boss defeated! Restarting... ${max(1, Math.ceil(victoryRestartTimer))}s`);
    if (victoryRestartTimer <= 0) {
      resetGame();
    }
  } else if (gameState === "gameOver") {
    updateAndDrawAll();
    drawOverlay("GAME OVER - Press R to restart");
  }

  drawHUD();
}

function startBackgroundMusic() {
  if (!bgMusic) return;
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    ctx.resume();
  }
  if (!bgMusic.isPlaying()) {
    bgMusic.setLoop(true);
    bgMusic.play();
  }
}

function playSound(snd) {
  if (!snd) return;
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    ctx.resume();
  }
  snd.play();
}

// --- Map scrolling ---

function drawScrollingMap() {
  if (imgMap) {
    const mapScale = height / imgMap.height;
    const tileW = imgMap.width * mapScale;

    mapOffsetX -= SCROLL_SPEED;
    if (mapOffsetX <= -tileW) {
      mapOffsetX += tileW;
    }

    for (let x = mapOffsetX; x < width + tileW; x += tileW) {
      image(imgMap, x, 0, tileW, height);
    }
  } else {
    push();
    noStroke();
    fill(200, 190, 150);
    rect(0, 0, width, height);

    mapOffsetX -= SCROLL_SPEED;
    if (mapOffsetX <= -120) {
      mapOffsetX = 0;
    }

    stroke(120, 100, 70);
    strokeWeight(1);
    for (let x = mapOffsetX; x < width + 120; x += 120) {
      line(x, 0, x, height);
    }

    stroke(80, 120, 180);
    noFill();
    beginShape();
    for (let x = 0; x <= width; x += 50) {
      const y = height * 0.32 + 30 * sin((x + tick * 0.5) * 0.01);
      vertex(x, y);
    }
    endShape();
    pop();
  }
}

// --- Spawning logic ---

const wavePlan = [
  { type: "INFANTRY", min: 1, max: 2, spacing: 3 },
  { type: "INFANTRY", count: 5, spacing: 3 },
  { type: "CAVALRY", min: 1, max: 2, spacing: 3 },
  { type: "INFANTRY", min: 3, max: 6, spacing: 3 },
  { type: "CANNON", min: 1, max: 2, spacing: 4 },
  { type: "SNIPER_PHASE", duration: 8, spacing: 4 },
];

function handleSpawns(allowNormalEnemies = true) {
  if (!allowNormalEnemies || bossSpawned) return;

  if (cannonOnslaughtActive) {
    if (levelTimer >= cannonOnslaughtNextSpawn) {
      const currentCannons = enemies.filter((e) => e.type === "CANNON").length;
      const toAdd = max(0, 10 - currentCannons);
      if (toAdd > 0) {
        spawnCannonRush(toAdd);
      }
      cannonOnslaughtNextSpawn = levelTimer + 0.6;
    }
    return;
  }

  if (sniperPhaseActive) {
    if (levelTimer >= sniperNextSpawn) {
      const edge = random(["TOP", "BOTTOM"]);
      spawnSniper(edge);
      sniperNextSpawn = levelTimer + 0.75;
    }

    if (levelTimer >= sniperEndTime) {
      sniperPhaseActive = false;
      player.narrowing = false;
      advanceWave();
    }
    return;
  }

  if (levelTimer >= nextWaveTime && wavePlan.length > 0) {
    const step = wavePlan[waveIndex];
    if (step.type === "SNIPER_PHASE") {
      startSniperPhase(step);
    } else {
      spawnPlannedWave(step);
      advanceWave();
    }
  }
}

function spawnPlannedWave(step) {
  const count = step.count
    ? step.count + sequenceCycle
    : int(random(step.min, step.max + 1 + sequenceCycle));
  const cappedCount = step.type === "INFANTRY" ? min(count, 6) : min(count, 2);
  const baseY = random(120, height - 120);
  const spacing = step.type === "CAVALRY" ? 90 : step.type === "CANNON" ? 140 : 70;

  for (let i = 0; i < cappedCount; i++) {
    const y = baseY + (i - cappedCount / 2) * 45;
    enemies.push(new Enemy(width + i * spacing, constrain(y, 90, height - 90), step.type));
  }
}

function spawnCannonRush(count) {
  const spacing = 110;
  const baseY = random(140, height - 140);
  const clampedCount = min(count, 10);
  for (let i = 0; i < clampedCount; i++) {
    const y = baseY + (i - clampedCount / 2) * 55;
    enemies.push(new Enemy(width + i * spacing, constrain(y, 100, height - 100), "CANNON"));
  }
}

function advanceWave() {
  const step = wavePlan[waveIndex];
  nextWaveTime = levelTimer + (step?.spacing || 3);
  waveIndex++;

  if (waveIndex >= wavePlan.length) {
    waveIndex = 0;
    sequenceCycle++;
  }
}

function maybeSpawnBoss() {
  if (!cannonOnslaughtActive && !bossSpawned && levelTimer >= 170 && levelTimer < 180) {
    cannonOnslaughtActive = true;
    cannonOnslaughtNextSpawn = levelTimer;
  }

  if (!bossSpawned && gameState === "playing" && levelTimer >= 180 && !sniperPhaseActive) {
    bossSpawned = true;
    gameState = "boss";
    boss = new Enemy(width - 180, height / 2, "BOSS");
    enemies.push(boss);
    cannonOnslaughtActive = false;
  }
}

function startSniperPhase(step) {
  sniperPhaseActive = true;
  player.narrowing = true;
  sniperEndTime = levelTimer + step.duration + sequenceCycle * 1.5;
  sniperNextSpawn = levelTimer + 0.25;
}

function spawnSniper(edge) {
  const existing = enemies.some((e) => e.type === "SNIPER" && e.edge === edge && !e.dead);
  if (existing) return;
  const y = edge === "TOP" ? 60 : height - 60;
  const sniper = new Enemy(width + 50, y, "SNIPER");
  sniper.edge = edge;
  enemies.push(sniper);
}

// --- Core update/draw loop ---

function updateAndDrawAll() {
  if (player.narrowing) {
    drawNarrowBars();
  }

  player.update();
  handleAutoFire();
  player.updateBuddies();
  player.draw();
  player.drawBuddies();

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].draw();
    if (bullets[i].offscreen) {
      bullets.splice(i, 1);
    }
  }

  // Enemy projectiles
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const shot = enemyProjectiles[i];
    shot.update();
    shot.draw();

    if (shot.collidesWithPlayer(player)) {
      player.takeHit();
      shot.dead = true;
    }

    for (let bi = player.buddies.length - 1; bi >= 0; bi--) {
      const buddy = player.buddies[bi];
      if (!shot.dead && shot.collidesWithRect(buddy.x, buddy.y, buddy.w, buddy.h)) {
        player.removeBuddy(buddy);
        shot.dead = true;
      }
    }

    if (shot.dead) {
      enemyProjectiles.splice(i, 1);
    }
  }

  // Explosion hazards
  for (let i = explosions.length - 1; i >= 0; i--) {
    const cloud = explosions[i];
    cloud.update();
    cloud.draw();
    if (cloud.collidesWithPlayer(player)) {
      player.takeHit();
      cloud.marked = true;
    }
    for (let bi = player.buddies.length - 1; bi >= 0; bi--) {
      const buddy = player.buddies[bi];
      if (!cloud.marked && cloud.collidesWithRect(buddy.x, buddy.y, buddy.w, buddy.h)) {
        player.removeBuddy(buddy);
        cloud.marked = true;
      }
    }
    if (cloud.marked || cloud.life <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update();
    e.draw();

    if (!e.dead && e.collidesWithPlayer(player)) {
      e.dead = true;
      player.takeHit();
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (!e.dead && e.collidesWithBullet(b)) {
        e.hp--;
        b.offscreen = true;
        if (e.hp <= 0) {
          addKillScore(e.type);
          e.dead = true;
          maybeDropPowerup(e.x, e.y);
        }
      }
    }

    if (e.dead || e.x < -200) {
      enemies.splice(i, 1);
    }
  }

  // Power-ups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.update();
    p.draw();
    if (p.collidesWithPlayer(player)) {
      p.applyTo(player);
      powerups.splice(i, 1);
    } else if (p.x < -50) {
      powerups.splice(i, 1);
    }
  }
}

function drawNarrowBars() {
  const barHeight = 100;
  if (imgHedge) {
    imageMode(CORNER);

    const hedgeScale = barHeight / imgHedge.height;
    const tileW = imgHedge.width * hedgeScale;

    for (let x = 0; x < width + tileW; x += tileW) {
      image(imgHedge, x, 0, tileW, barHeight);
    }

    for (let x = 0; x < width + tileW; x += tileW) {
      image(imgHedge, x, height - barHeight, tileW, barHeight);
    }
  } else {
    noStroke();
    fill(0, 160);
    rect(0, 0, width, barHeight);
    rect(0, height - barHeight, width, barHeight);
  }
}

function handleAutoFire() {
  if (gameState !== "playing" && gameState !== "boss") return;

  const keyHeld = keyIsDown(32);
  const mouseHeld = mouseIsPressed && mouseButton === LEFT;

  if (keyHeld || mouseHeld) {
    player.shoot();
  }
}

// --- Power-up drop logic ---

function maybeDropPowerup(x, y) {
  if (random() < 0.25) {
    const type = random(["SHIELD", "RAPID"]);
    powerups.push(new Powerup(x, y, type));
  }
}

function addKillScore(type) {
  if (type === "INFANTRY") score += 10;
  else if (type === "CAVALRY") score += 20;
  else if (type === "CANNON") score += 20;
  else if (type === "SNIPER") score += 30;
  else if (type === "BOSS") score += 1000;
}

// --- HUD / overlay ---

function drawHUD() {
  push();
  fill(0, 160);
  rect(0, 0, width, 32);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Kriegsspiel Defender - Level 1: Waterloo", 10, 16);

  textAlign(RIGHT, CENTER);
  text(
    `HP: ${player.hp}  |  Power: ${player.powerLabel()}  |  Score: ${score}  |  Time: ${levelTimer.toFixed(1)}s`,
    width - 10,
    16
  );
  pop();
}

function drawOverlay(message) {
  push();
  fill(0, 180);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text(message, width / 2, height / 2);
  pop();
}

function drawStartScreen() {
  push();
  fill(0, 180);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("Kriegsspiel Defender", width / 2, height / 2 - 40);
  textSize(16);
  text(
    "Press Space or Enter to deploy.\nMouse or WASD/Arrows to move, hold Space or Left Click to fire.\nR to restart after defeat.",
    width / 2,
    height / 2 + 20
  );
  pop();
}

// --- Player ---

class Player {
  constructor() {
    this.x = width * 0.2;
    this.y = height / 2;
    this.w = playerImg ? playerImg.width * PLAYER_IMG_SCALE : 40;
    this.h = playerImg ? playerImg.height * PLAYER_IMG_SCALE : 40;
    this.speed = 5;
    this.hp = 3;
    this.fireCooldown = 0;
    this.baseCooldown = 24;
    this.narrowing = false;
    this.shield = 0;
    this.rapidTimer = 0;
    this.shieldCollected = 0;
    this.rapidCollected = 0;
    this.buddies = [];
    this.maxBuddies = 5;
  }

  addBuddy() {
    if (this.buddies.length >= this.maxBuddies) return;
    const buddy = new BattalionBuddy(this, this.buddies.length);
    this.buddies.push(buddy);
    this.refreshBuddyOffsets();
  }

  refreshBuddyOffsets() {
    this.buddies.forEach((b, idx) => b.setIndex(idx));
  }

  removeBuddy(buddy) {
    const idx = this.buddies.indexOf(buddy);
    if (idx >= 0) {
      this.buddies.splice(idx, 1);
      this.refreshBuddyOffsets();
    }
  }

  updateBuddies() {
    this.buddies.forEach((b) => b.update(this));
    this.buddies = this.buddies.filter((b) => !b.dead);
  }

  drawBuddies() {
    this.buddies.forEach((b) => b.draw());
  }

  update() {
    const maxX = width * 0.7;
    const minX = width * 0.05;

    let minY = 40;
    let maxY = height - 40;

    if (this.narrowing) {
      minY = 120;
      maxY = height - 120;
    }

    // Keyboard control
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed;

    // Mouse control (mirrors position when inside the canvas during play)
    const mouseUsable =
      (gameState === "playing" || gameState === "boss") &&
      mouseX >= 0 &&
      mouseX <= width &&
      mouseY >= 0 &&
      mouseY <= height;

    if (mouseUsable) {
      this.x = mouseX;
      this.y = mouseY;
    }

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);

    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }

    if (this.rapidTimer > 0) {
      this.rapidTimer--;
      if (this.rapidTimer === 0) {
        this.baseCooldown = 24;
      }
    }

    if (this.hp <= 0 && gameState !== "gameOver") {
      gameState = "gameOver";
    }
  }

  draw() {
    push();
    translate(this.x, this.y);

    if (this.shield > 0) {
      noFill();
      stroke(100, 200, 255);
      strokeWeight(3);
      ellipse(0, 0, this.w + 10, this.h + 10);
    }

    if (playerImg) {
      imageMode(CENTER);
      image(playerImg, 0, 0, this.w, this.h);
    } else {
      rectMode(CENTER);
      noStroke();
      fill(40, 60, 150);
      rect(0, 0, this.w, this.h, 4);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(12);
      text("PR", 0, 0);
    }

    pop();
  }

  shoot() {
    if (this.fireCooldown === 0 && (gameState === "playing" || gameState === "boss")) {
      const bulletSpeed = 10;
      const dirs = [{ x: 1, y: 0 }];

      if (this.rapidCollected >= 5) {
        dirs.push({ x: 1, y: -0.4 });
        dirs.push({ x: 1, y: 0.4 });
      }
      if (this.rapidCollected >= 10) {
        dirs.push({ x: -1, y: 0 });
      }

      dirs.forEach((d) => bullets.push(new Bullet(this.x + this.w / 2, this.y, d.x, d.y, bulletSpeed)));
      this.fireCooldown = this.baseCooldown;
    }
  }

  takeHit() {
    if (this.shield > 0) {
      this.shield--;
    } else {
      this.hp--;
      this.baseCooldown = 24;
      this.rapidTimer = 0;
      this.rapidCollected = 0;
    }
  }

  powerLabel() {
    if (this.shield > 0 && this.rapidTimer > 0) return "Shield + Rapid";
    if (this.shield > 0) return "Shield";
    if (this.rapidTimer > 0) return "Rapid Fire";
    return "Normal";
  }
}

// --- Bullet ---

class Bullet {
  constructor(x, y, dx = 1, dy = 0, speed = 10) {
    this.x = x;
    this.y = y;
    this.r = 4;
    const len = max(0.001, sqrt(dx * dx + dy * dy));
    this.vx = (dx / len) * speed;
    this.vy = (dy / len) * speed;
    this.offscreen = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > width + 40 || this.x < -40 || this.y < -40 || this.y > height + 40) {
      this.offscreen = true;
    }
  }

  draw() {
    push();
    noStroke();
    // Glow halo for visibility on darker maps
    fill(255, 235, 120, 140);
    circle(this.x, this.y, this.r * 3.2);
    fill(25, 90, 25);
    circle(this.x, this.y, this.r * 2);
    pop();
  }
}

class BattalionBuddy {
  constructor(player, index = 0) {
    const size = sizeFromImage(imgBattalion, 30, 30);
    this.w = size.w;
    this.h = size.h;
    this.x = player.x - 30;
    this.y = player.y;
    this.fireCooldown = 0;
    this.fireRate = 30;
    this.dead = false;
    this.setIndex(index);
  }

  setIndex(index) {
    this.index = index;
    const column = floor(index / 2);
    const row = index % 2;
    const yOffset = row === 0 ? -30 : 30;
    this.offset = { x: -60 - column * 28, y: yOffset };
  }

  update(player) {
    // Follow the player with a light easing
    this.x = lerp(this.x, player.x + this.offset.x, 0.12);
    this.y = lerp(this.y, player.y + this.offset.y, 0.12);

    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }

    if (gameState === "playing" || gameState === "boss") {
      this.tryFire();
    }
  }

  tryFire() {
    if (this.fireCooldown > 0) return;
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },
    ];
    const choice = random(dirs);
    bullets.push(new Bullet(this.x, this.y, choice.x, choice.y, 8));
    this.fireCooldown = this.fireRate;
  }

  draw() {
    push();
    if (imgBattalion) {
      imageMode(CENTER);
      image(imgBattalion, this.x, this.y, this.w, this.h);
    } else {
      rectMode(CENTER);
      noStroke();
      fill(70, 90, 190);
      rect(this.x, this.y, this.w, this.h, 4);
      fill(230);
      textAlign(CENTER, CENTER);
      textSize(10);
      text("Bn", this.x, this.y);
    }
    pop();
  }
}

// --- Enemy ---

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.dead = false;
    this.edge = null;
    this.initStats();
  }

  initStats() {
    if (this.type === "INFANTRY") {
      const size = sizeFromImage(imgInfantry, 60, 60);
      this.w = size.w;
      this.h = size.h;
      this.hp = 1;
      this.speed = 3.2;
    } else if (this.type === "CAVALRY") {
      const size = sizeFromImage(imgCavalry, 80, 60);
      this.w = size.w;
      this.h = size.h;
      this.hp = 2;
      this.speed = 6.5;
      this.zigzagAmp = 50;
      this.zigzagFreq = 0.16;
      this.phase = random(TWO_PI);
    } else if (this.type === "CANNON") {
      const size = sizeFromImage(imgCannon, 80, 80);
      this.w = size.w;
      this.h = size.h;
      this.hp = 3;
      this.speed = 2.2;
      this.fireTimer = int(random(90, 150));
    } else if (this.type === "SNIPER") {
      const size = sizeFromImage(imgSniper, 70, 70);
      this.w = size.w;
      this.h = size.h;
      this.hp = 1;
      this.speed = 0;
      this.fireTimer = int(random(45, 75));
    } else if (this.type === "BOSS") {
      const size = sizeFromImage(imgBoss, 280, 280);
      this.w = size.w;
      this.h = size.h;
      this.hp = 800;
      this.speed = 1.5;
      this.dirY = 1;
      this.attackPhase = 0;
      this.attackTimer = 0;
      this.attackCooldown = 0;
      this.dropTimer = int(random(480, 720));
    }
  }

  update() {
    if (this.type === "INFANTRY") {
      this.x -= this.speed;
      this.y += sin(tick * 0.04 + this.x * 0.02);
    } else if (this.type === "CAVALRY") {
      this.x -= this.speed;
      this.y += this.zigzagAmp * sin(tick * this.zigzagFreq + this.phase) * 0.6;
    } else if (this.type === "CANNON") {
      this.x -= this.speed;
      this.y += sin(tick * 0.03 + this.x * 0.015);
      this.fireTimer--;
      if (this.fireTimer <= 0) {
        enemyProjectiles.push(new CannonShot(this.x - this.w / 2, this.y));
        playSound(sCannon);
        this.fireTimer = int(random(110, 170));
      }
    } else if (this.type === "SNIPER") {
      if (this.x > width - 80) {
        this.x -= 3;
      }
      this.fireTimer--;
      if (this.fireTimer <= 0 && this.x <= width - 80) {
        enemyProjectiles.push(new SniperShot(this.x - this.w / 2, this.y, player));
        playSound(sSniperShot);
        this.fireTimer = int(random(75, 120));
      }
    } else if (this.type === "BOSS") {
      this.x = max(this.x, width * 0.65);
      this.y += this.dirY * this.speed;
      if (this.y < 120 || this.y > height - 120) {
        this.dirY *= -1;
      }
      this.updateBossAttacks();
      this.maybeDropBossPowerup();
    }
  }

  maybeDropBossPowerup() {
    if (!boss || boss.hp <= 0) return;
    if (this.dropTimer > 0) {
      this.dropTimer--;
      return;
    }

    if (random() < 0.45) {
      const type = random(["SHIELD", "RAPID"]);
      powerups.push(new Powerup(this.x - this.w / 2, this.y, type));
    }

    this.dropTimer = int(random(600, 900));
  }

  updateBossAttacks() {
    const phase = this.attackPhase % 3;
    if (phase === 0) {
      this.runDirectFire();
    } else if (phase === 1) {
      this.runSpreadFire();
    } else {
      this.runCannonBarrage();
    }
  }

  advanceBossPhase(cooldownFrames = 45) {
    this.attackPhase++;
    this.attackCooldown = cooldownFrames;
    this.phaseShotsLeft = 0;
    this.spreadLaunched = false;
    this.barrageQueued = false;
  }

  runDirectFire() {
    if (!this.phaseShotsLeft) {
      this.phaseShotsLeft = 8;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
      return;
    }

    if (this.phaseShotsLeft > 0) {
      enemyProjectiles.push(new BossDirectShot(this.x - this.w / 2, this.y, player));
      this.phaseShotsLeft--;
      this.attackCooldown = 24;
    } else {
      this.advanceBossPhase();
    }
  }

  runSpreadFire() {
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
      return;
    }

    if (!this.spreadLaunched) {
      const angles = [];
      for (let a = -80; a <= 80; a += 16) angles.push(radians(a));
      angles.forEach((ang) =>
        enemyProjectiles.push(new BossSpreadShot(this.x - this.w / 2, this.y, ang))
      );
      this.spreadLaunched = true;
      this.attackCooldown = 90;
    } else if (this.attackCooldown <= 0) {
      this.advanceBossPhase();
    }
  }

  runCannonBarrage() {
    if (!this.barrageQueued) {
      const blasts = 6;
      playSound(sCannon);
      for (let i = 0; i < blasts; i++) {
        const targetX = random(width * 0.15, width * 0.75);
        const targetY = random(110, height - 110);
        enemyProjectiles.push(new BossCannonStrike(targetX, targetY));
      }
      this.barrageQueued = true;
      this.attackCooldown = 110;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    } else {
      const pending = enemyProjectiles.some((p) => p instanceof BossCannonStrike);
      if (!pending) {
        this.advanceBossPhase();
      }
    }
  }

  draw() {
    push();

    const img = this.type === "INFANTRY"
      ? imgInfantry
      : this.type === "CAVALRY"
      ? imgCavalry
      : this.type === "CANNON"
      ? imgCannon
      : this.type === "SNIPER"
      ? imgSniper
      : this.type === "BOSS"
      ? imgBoss
      : null;

    if (img) {
      imageMode(CENTER);
      image(img, this.x, this.y, this.w, this.h);
    } else {
      rectMode(CENTER);
      if (this.type === "INFANTRY") {
        fill(30, 120, 40);
      } else if (this.type === "CAVALRY") {
        fill(120, 80, 40);
      } else if (this.type === "CANNON") {
        fill(80, 80, 80);
      } else if (this.type === "SNIPER") {
        fill(180, 40, 40);
      } else if (this.type === "BOSS") {
        fill(160, 40, 120);
      }

      rect(this.x, this.y, this.w, this.h, 4);

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(10);
      if (this.type === "INFANTRY") text("INF", this.x, this.y);
      if (this.type === "CAVALRY") text("CAV", this.x, this.y);
      if (this.type === "CANNON") text("CAN", this.x, this.y);
      if (this.type === "SNIPER") text("SNP", this.x, this.y);
      if (this.type === "BOSS") text("MARSHAL", this.x, this.y);
    }
    pop();
  }

  collidesWithPlayer(player) {
    return rectRectOverlap(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h);
  }

  collidesWithBullet(bullet) {
    return rectCircleOverlap(this.x, this.y, this.w, this.h, bullet.x, bullet.y, bullet.r);
  }
}

// --- Cannon projectile & explosion ---

class CannonShot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 4;
    this.r = 10;
    this.timer = 75;
    this.dead = false;
  }

  update() {
    this.x -= this.speed;
    this.timer--;
    if (this.timer <= 0 || this.x < -40) {
      explosions.push(new ExplosionCloud(this.x, this.y));
      this.dead = true;
    }
  }

  draw() {
    push();
    noStroke();
    fill(230, 150, 80);
    circle(this.x, this.y, this.r * 2);
    pop();
  }

  collidesWithPlayer(player) {
    return rectCircleOverlap(player.x, player.y, player.w, player.h, this.x, this.y, this.r);
  }

  collidesWithRect(x, y, w, h) {
    return rectCircleOverlap(x, y, w, h, this.x, this.y, this.r);
  }
}

class SniperShot {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    const dx = target.x - x;
    const dy = target.y - y;
    const len = max(0.001, sqrt(dx * dx + dy * dy));
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
    this.r = 6;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -40 || this.x > width + 40 || this.y < -40 || this.y > height + 40) {
      this.dead = true;
    }
  }

  draw() {
    push();
    noStroke();
    fill(200, 60, 60);
    circle(this.x, this.y, this.r * 2);
    pop();
  }

  collidesWithPlayer(player) {
    return rectCircleOverlap(player.x, player.y, player.w, player.h, this.x, this.y, this.r);
  }

  collidesWithRect(x, y, w, h) {
    return rectCircleOverlap(x, y, w, h, this.x, this.y, this.r);
  }
}

class BossDirectShot {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    const speed = 8;
    const dx = target.x - x;
    const dy = target.y - y;
    const len = max(0.001, sqrt(dx * dx + dy * dy));
    const baseDirX = dx / len;
    const baseDirY = dy / len;

    // Reduce accuracy by blending perfect aim with random aim (50/50)
    const randAngle = random(TWO_PI);
    const randX = cos(randAngle);
    const randY = sin(randAngle);
    const mixedX = baseDirX * 0.5 + randX * 0.5;
    const mixedY = baseDirY * 0.5 + randY * 0.5;
    const mixLen = max(0.001, sqrt(mixedX * mixedX + mixedY * mixedY));

    this.vx = (mixedX / mixLen) * speed;
    this.vy = (mixedY / mixLen) * speed;
    this.r = 7;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -60 || this.x > width + 60 || this.y < -60 || this.y > height + 60) {
      this.dead = true;
    }
  }

  draw() {
    push();
    noStroke();
    fill(255, 100, 80);
    circle(this.x, this.y, this.r * 2);
    pop();
  }

  collidesWithPlayer(player) {
    return rectCircleOverlap(player.x, player.y, player.w, player.h, this.x, this.y, this.r);
  }

  collidesWithRect(x, y, w, h) {
    return rectCircleOverlap(x, y, w, h, this.x, this.y, this.r);
  }
}

class BossSpreadShot {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 3.5;
    this.r = 6;
    this.dead = false;
  }

  update() {
    this.speed *= 1.02;
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;
    if (this.x < -80 || this.x > width + 80 || this.y < -80 || this.y > height + 80) {
      this.dead = true;
    }
  }

  draw() {
    push();
    noStroke();
    fill(255, 170, 90);
    circle(this.x, this.y, this.r * 2);
    pop();
  }

  collidesWithPlayer(player) {
    return rectCircleOverlap(player.x, player.y, player.w, player.h, this.x, this.y, this.r);
  }

  collidesWithRect(x, y, w, h) {
    return rectCircleOverlap(x, y, w, h, this.x, this.y, this.r);
  }
}

class BossCannonStrike {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.timer = 40;
    this.dead = false;
  }

  update() {
    this.timer--;
    if (this.timer <= 0) {
      explosions.push(new ExplosionCloud(this.x, this.y));
      this.dead = true;
    }
  }

  draw() {
    push();
    noFill();
    stroke(255, 180, 80, 200);
    strokeWeight(2);
    circle(this.x, this.y, 28 + (40 - this.timer));
    line(this.x - 10, this.y, this.x + 10, this.y);
    line(this.x, this.y - 10, this.x, this.y + 10);
    pop();
  }

  collidesWithPlayer() {
    return false; // damage happens via the spawned explosion
  }

  collidesWithRect() {
    return false;
  }
}

class ExplosionCloud {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseRadius = 25;
    this.maxRadius = 60;
    this.life = 90;
    this.marked = false;
  }

  update() {
    this.life--;
  }

  draw() {
    push();
    noStroke();
    const progress = 1 - this.life / 90;
    const radius = lerp(this.baseRadius, this.maxRadius, progress);
    fill(200, 200, 200, 180 - progress * 120);
    circle(this.x, this.y, radius * 2);
    pop();
  }

  collidesWithPlayer(player) {
    const progress = 1 - this.life / 90;
    const radius = lerp(this.baseRadius, this.maxRadius, progress);
    return rectCircleOverlap(player.x, player.y, player.w, player.h, this.x, this.y, radius);
  }

  collidesWithRect(x, y, w, h) {
    const progress = 1 - this.life / 90;
    const radius = lerp(this.baseRadius, this.maxRadius, progress);
    return rectCircleOverlap(x, y, w, h, this.x, this.y, radius);
  }
}

// --- Powerup ---

class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = 24;
    this.h = 24;
    this.speed = 3;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    push();
    rectMode(CENTER);
    noStroke();

    // Glow halo
    const glowColor = this.type === "SHIELD" ? color(120, 210, 255, 130) : color(255, 210, 120, 130);
    noStroke();
    fill(glowColor);
    circle(this.x, this.y, max(this.w, this.h) + 18);

    const img = this.type === "SHIELD" ? imgPowerupShield : imgPowerupRapid;
    if (img) {
      imageMode(CENTER);
      image(img, this.x, this.y, this.w, this.h);
    } else {
      if (this.type === "SHIELD") fill(100, 200, 255);
      else if (this.type === "RAPID") fill(255, 200, 80);
      rect(this.x, this.y, this.w, this.h, 3);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(this.type === "SHIELD" ? "S" : "R", this.x, this.y);
    }
    pop();
  }

  collidesWithPlayer(player) {
    return rectRectOverlap(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h);
  }

  applyTo(player) {
    if (this.type === "SHIELD") {
      player.shield = 1;
      player.shieldCollected++;
      const desiredBuddies = min(floor(player.shieldCollected / 5), player.maxBuddies);
      while (player.buddies.length < desiredBuddies) {
        player.addBuddy();
      }
      playSound(sShield);
    } else if (this.type === "RAPID") {
      player.baseCooldown = 8;
      player.rapidTimer = 60 * 6; // ~6 seconds at 60fps
      player.rapidCollected++;
      playSound(sRapid);
    }
    score += 10;
  }
}

// --- Collision helpers ---

function rectRectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return abs(x1 - x2) * 2 < w1 + w2 && abs(y1 - y2) * 2 < h1 + h2;
}

function rectCircleOverlap(rx, ry, rw, rh, cx, cy, cr) {
  const halfW = rw / 2;
  const halfH = rh / 2;
  const closestX = constrain(cx, rx - halfW, rx + halfW);
  const closestY = constrain(cy, ry - halfH, ry + halfH);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

// --- Input ---

function keyPressed() {
  if (gameState === "start" && (key === " " || key === "Enter")) {
    beginPlayFromStart();
    return;
  }

  if (key === " ") {
    player.shoot();
  }
  if ((key === "r" || key === "R") && (gameState === "victory" || gameState === "gameOver")) {
    resetGame();
  }
}

function mousePressed() {
  if (gameState === "start") {
    beginPlayFromStart();
    return;
  }

  if ((gameState === "playing" || gameState === "boss") && mouseButton === LEFT) {
    player.shoot();
  }
}

function beginPlayFromStart() {
  if (gameState !== "start") return;
  gameState = "playing";
  levelTimer = 0;
  tick = 0;
  nextWaveTime = 1;
  waveIndex = 0;
  sequenceCycle = 0;
  sniperPhaseActive = false;
  cannonOnslaughtActive = false;
  cannonOnslaughtNextSpawn = 0;
  startBackgroundMusic();
}

function resetGame(pauseAtStart = false) {
  bullets = [];
  enemies = [];
  powerups = [];
  enemyProjectiles = [];
  explosions = [];
  player = new Player();
  gameState = pauseAtStart ? "start" : "playing";
  boss = null;
  bossSpawned = false;
  score = 0;
  levelTimer = 0;
  tick = 0;
  nextWaveTime = 1;
  waveIndex = 0;
  sequenceCycle = 0;
  sniperPhaseActive = false;
  cannonOnslaughtActive = false;
  cannonOnslaughtNextSpawn = 0;
  victoryRestartTimer = 0;
  if (!pauseAtStart) {
    startBackgroundMusic();
  }
}
