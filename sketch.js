// Kriegsspiel Defender - Level 1 Skeleton (Waterloo)
// Compatible with p5.js 1.11.x
// Swap placeholder rectangles for your PNG minis and map art by uncommenting preload().

let player;
let bullets = [];
let enemies = [];
let powerups = [];
let boss = null;
let bossSpawned = false;
let gameState = "playing"; // "playing" | "boss" | "victory" | "gameOver"

// Timing
let levelTimer = 0; // seconds
let tick = 0; // frame-ish counter
let enemySpawnTimer = 0;

// Background scroll
let mapOffsetX = 0;
const SCROLL_SPEED = 2;

// Assets (uncomment and supply your PNGs)
// let imgPlayer, imgInfantry, imgCavalry, imgCannon, imgBoss, imgMap, imgPowerupShield, imgPowerupRapid;
// function preload() {
//   imgPlayer = loadImage("assets/player_block.png");
//   imgInfantry = loadImage("assets/french_infantry.png");
//   imgCavalry = loadImage("assets/french_cavalry.png");
//   imgCannon = loadImage("assets/french_cannon.png");
//   imgBoss = loadImage("assets/french_commander_boss.png");
//   imgMap = loadImage("assets/waterloo_map.png");
//   imgPowerupShield = loadImage("assets/powerup_shield.png");
//   imgPowerupRapid = loadImage("assets/powerup_rapid.png");
// }

function setup() {
  createCanvas(800, 600);
  player = new Player();
  textFont("monospace");
  enemySpawnTimer = 60; // initial delay in frames
}

function draw() {
  const dt = deltaTime / 1000; // seconds
  levelTimer += dt;
  tick++;

  background(20);
  drawScrollingMap();

  if (gameState === "playing") {
    handleSpawns(true);
    updateAndDrawAll();
    maybeEnterSniperPhase();
    maybeSpawnBoss();
  } else if (gameState === "boss") {
    handleSpawns(false); // freeze regular waves
    updateAndDrawAll();
    if (boss && boss.hp <= 0) {
      gameState = "victory";
    }
  } else if (gameState === "victory") {
    updateAndDrawAll();
    drawOverlay("VICTORY! Press R to restart");
  } else if (gameState === "gameOver") {
    updateAndDrawAll();
    drawOverlay("GAME OVER - Press R to restart");
  }

  drawHUD();
}

// --- Map scrolling ---

function drawScrollingMap() {
  push();
  noStroke();
  fill(200, 190, 150);
  rect(0, 0, width, height);

  mapOffsetX -= SCROLL_SPEED;
  if (mapOffsetX <= -120) {
    mapOffsetX = 0;
  }

  // Vertical grid lines for a map feel
  stroke(120, 100, 70);
  strokeWeight(1);
  for (let x = mapOffsetX; x < width + 120; x += 120) {
    line(x, 0, x, height);
  }

  // Wavy "river" for motion
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

// --- Spawning logic ---

function handleSpawns(allowNormalEnemies = true) {
  enemySpawnTimer--;

  if (allowNormalEnemies && enemySpawnTimer <= 0 && !bossSpawned) {
    spawnEnemyWave();
    enemySpawnTimer = int(random(45, 80));
  }
}

function spawnEnemyWave() {
  const count = int(random(2, 5));
  const baseY = random(100, height - 100);

  for (let i = 0; i < count; i++) {
    const type = random(["INFANTRY", "CAVALRY", "CANNON"]);
    const y = baseY + (i - count / 2) * 40;
    enemies.push(new Enemy(width + i * 40, constrain(y, 80, height - 80), type));
  }
}

function maybeSpawnBoss() {
  if (!bossSpawned && levelTimer > 60) {
    bossSpawned = true;
    gameState = "boss";
    boss = new Enemy(width - 150, height / 2, "BOSS");
    enemies.push(boss);
  }
}

function maybeEnterSniperPhase() {
  if (levelTimer > 20 && levelTimer < 30) {
    player.narrowing = true;

    if (tick % 45 === 0) {
      const edge = random(["TOP", "BOTTOM"]);
      spawnSniper(edge);
    }
  } else {
    player.narrowing = false;
  }
}

function spawnSniper(edge) {
  const y = edge === "TOP" ? 40 : height - 40;
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
  player.draw();

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].draw();
    if (bullets[i].offscreen) {
      bullets.splice(i, 1);
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
  noStroke();
  fill(0, 160);
  rect(0, 0, width, barHeight);
  rect(0, height - barHeight, width, barHeight);
}

// --- Power-up drop logic ---

function maybeDropPowerup(x, y) {
  if (random() < 0.25) {
    const type = random(["SHIELD", "RAPID"]);
    powerups.push(new Powerup(x, y, type));
  }
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
    `HP: ${player.hp}  |  Power: ${player.powerLabel()}  |  Time: ${levelTimer.toFixed(1)}s`,
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

// --- Player ---

class Player {
  constructor() {
    this.x = width * 0.2;
    this.y = height / 2;
    this.w = 40;
    this.h = 40;
    this.speed = 5;
    this.hp = 3;
    this.fireCooldown = 0;
    this.baseCooldown = 12;
    this.narrowing = false;
    this.shield = 0;
    this.rapidTimer = 0;
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

    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed;

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);

    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }

    if (this.rapidTimer > 0) {
      this.rapidTimer--;
      if (this.rapidTimer === 0) {
        this.baseCooldown = 12;
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

    rectMode(CENTER);
    noStroke();
    fill(40, 60, 150);
    rect(0, 0, this.w, this.h, 4);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text("PR", 0, 0);

    pop();
  }

  shoot() {
    if (this.fireCooldown === 0 && (gameState === "playing" || gameState === "boss")) {
      const bulletSpeed = 10;
      bullets.push(new Bullet(this.x + this.w / 2, this.y, bulletSpeed));
      this.fireCooldown = this.baseCooldown;
    }
  }

  takeHit() {
    if (this.shield > 0) {
      this.shield--;
    } else {
      this.hp--;
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
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.r = 4;
    this.speed = speed;
    this.offscreen = false;
  }

  update() {
    this.x += this.speed;
    if (this.x > width + 20) {
      this.offscreen = true;
    }
  }

  draw() {
    push();
    noStroke();
    fill(255, 230, 0);
    circle(this.x, this.y, this.r * 2);
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
      this.w = 30;
      this.h = 30;
      this.hp = 1;
      this.speed = 3;
    } else if (this.type === "CAVALRY") {
      this.w = 40;
      this.h = 30;
      this.hp = 2;
      this.speed = 4.5;
    } else if (this.type === "CANNON") {
      this.w = 40;
      this.h = 40;
      this.hp = 3;
      this.speed = 2;
    } else if (this.type === "SNIPER") {
      this.w = 35;
      this.h = 35;
      this.hp = 1;
      this.speed = 0;
    } else if (this.type === "BOSS") {
      this.w = 120;
      this.h = 120;
      this.hp = 40;
      this.speed = 1.5;
      this.dirY = 1;
    }
  }

  update() {
    if (this.type === "INFANTRY" || this.type === "CAVALRY" || this.type === "CANNON") {
      this.x -= this.speed;
      this.y += sin(tick * 0.05 + this.x * 0.02);
    } else if (this.type === "SNIPER") {
      if (this.x > width - 80) {
        this.x -= 3;
      }
    } else if (this.type === "BOSS") {
      this.x = max(this.x, width * 0.65);
      this.y += this.dirY * this.speed;
      if (this.y < 120 || this.y > height - 120) {
        this.dirY *= -1;
      }
    }
  }

  draw() {
    push();
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
    pop();
  }

  collidesWithPlayer(player) {
    return rectRectOverlap(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h);
  }

  collidesWithBullet(bullet) {
    return rectCircleOverlap(this.x, this.y, this.w, this.h, bullet.x, bullet.y, bullet.r);
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
    if (this.type === "SHIELD") fill(100, 200, 255);
    else if (this.type === "RAPID") fill(255, 200, 80);
    rect(this.x, this.y, this.w, this.h, 3);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(this.type === "SHIELD" ? "S" : "R", this.x, this.y);
    pop();
  }

  collidesWithPlayer(player) {
    return rectRectOverlap(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h);
  }

  applyTo(player) {
    if (this.type === "SHIELD") {
      player.shield = 1;
    } else if (this.type === "RAPID") {
      player.baseCooldown = 4;
      player.rapidTimer = 60 * 6; // ~6 seconds at 60fps
    }
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
  if (key === " ") {
    player.shoot();
  }
  if ((key === "r" || key === "R") && (gameState === "victory" || gameState === "gameOver")) {
    resetGame();
  }
}

function resetGame() {
  bullets = [];
  enemies = [];
  powerups = [];
  player = new Player();
  gameState = "playing";
  boss = null;
  bossSpawned = false;
  levelTimer = 0;
  tick = 0;
  enemySpawnTimer = 60;
}
