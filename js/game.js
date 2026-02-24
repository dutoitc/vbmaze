import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { Player } from "./player.js";
import { Maze } from "./maze.js";
import { UI } from "./ui.js";

const VERSION = "v1.2";

const Game = {

  scene: null,

  paused: false,
  gameOver: false,

  keysCount: 0,
  lives: 3,

  // items
  keyMesh: null,

  // door (animated)
  doorPivot: null,     // Object3D at hinge
  doorMesh: null,      // actual door mesh
  doorOpen: false,
  doorOpening: false,
  doorOpenProgress: 0, // 0..1
  doorOpenSpeed: 1.2,  // progress/sec

  // enemy
  enemyMesh: null,
  enemyRadius: 0.55,
  enemySpeed: 1.2,
  enemyBreathTime: 0,

  // hit control
  hitCooldown: 0,
  hitCooldownSeconds: 1.0,

  // audio
  music: null,

  // fx
  effects: [],

  init(scene) {

    this.scene = scene;

    this.initAudio();

    this.resetRunState();

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.togglePause();
    });
  },

  resetRunState() {

    // cleanup old meshes if any
    if (this.keyMesh) { this.scene.remove(this.keyMesh); this.keyMesh = null; }
    if (this.enemyMesh) { this.scene.remove(this.enemyMesh); this.enemyMesh = null; }
    if (this.doorPivot) { this.scene.remove(this.doorPivot); this.doorPivot = null; this.doorMesh = null; }
    this.clearEffects();

    this.keysCount = 0;
    this.lives = 3;

    this.paused = false;
    this.gameOver = false;

    this.hitCooldown = 0;

    this.createDoor();
    this.spawnKey();
    this.spawnEnemy();

    this.updateHUD();
  },

  /* ================= AUDIO ================= */

  initAudio() {
    this.music = new Audio("./assets/maze1.wav");
    this.music.loop = true;
    this.music.volume = 0.35;
  },

  enableAudio() {
    if (!UI.settings.musicMuted) {
      this.music.play().catch(() => {});
    }
  },

  stopAudio() {
    try { this.music.pause(); } catch {}
  },

  /* ================= HUD ================= */

  updateHUD() {
    UI.setInventory(`Clé ${this.keysCount} | Vies: ${this.lives} | ${VERSION}`);
  },

  /* ================= PAUSE / MENU ================= */

  togglePause() {

    if (this.gameOver) return;

    this.paused = !this.paused;

    if (this.paused) {

      document.exitPointerLock();
      this.stopAudio();

      UI.showPause(
        () => this.togglePause(),
        () => this.quitToMenu()
      );

    } else {

      UI.hidePause();
      Player.forcePointerLock();

      if (!UI.settings.musicMuted) {
        this.music.play().catch(() => {});
      }
    }
  },

  quitToMenu() {

    this.paused = true;
    this.stopAudio();
    document.exitPointerLock();

    UI.hidePause();
    UI.hideGameOver();

    // cacher crosshair/stats pendant menu
    if (UI.crosshair) UI.crosshair.style.display = "none";
    if (UI.stats) UI.stats.style.display = "none";

    UI.showStart(() => {
      this.resumeFromMenu();
    });
  },

  resumeFromMenu() {

    this.paused = false;
    this.gameOver = false;

    Player.forcePointerLock();
    Player.enableAudio();
    this.enableAudio();

    if (UI.crosshair) UI.crosshair.style.display = "block";
    if (UI.stats) UI.stats.style.display = "block";

    // respawn + fx au start (comme demandé    this.addTeleportEffect(Player.spawnPos.clone().setY(0.25));
    Player.respawn(true);
  },

  /* ================= DOOR ================= */

  createDoor() {

    // placement stable (couloir)
    const center = Maze.getCellCenter(4, 2, 0);

    const tex = new THREE.TextureLoader().load(
      "./assets/wood.jpg",
      (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 2);
        t.anisotropy = 4;
      },
      undefined,
      () => {}
    );

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.0,
      color: 0x6a3b15
    });

    const geo = new THREE.BoxGeometry(2.8, 3.6, 0.4);
    const door = new THREE.Mesh(geo, mat);

    // pivot côgauche (charniè)
    this.doorPivot = new THREE.Object3D();
    this.doorPivot.position.set(center.x - 1.4, 0, center.z);

    door.position.set(1.4, 1.8, 0);

    this.doorPivot.add(door);
    this.scene.add(this.doorPivot);

    this.doorMesh = door;

    this.doorOpen = false;
    this.doorOpening = false;
    this.doorOpenProgress = 0;

    console.log("Door created (auto-open) at cell center:", center);
  },

  startDoorOpening() {

    if (this.doorOpen || this.doorOpening) return;
    if (this.keysCount <= 0) return;

    console.log("Door opening started");

    this.doorOpening = true;
    this.keysCount = Math.max(0, this.keysCount - 1);
    this.updateHUD();

    this.playDoorSound();
    this.spawnKeyAbsorbFX();
  },

  playDoorSound() {
    // petit son cléorte simple et stable (HTMLAudio)
    const s = new Audio("./assets/step.wav");
    s.volume = 0.35;
    s.playbackRate = 0.75;
    s.play().catch(() => {});
  },

  spawnKeyAbsorbFX() {

    const pos = Player.camera.position.clone();
    pos.y = 1.0;

    for (let i = 0; i < 4; i++) {

      const geo = new THREE.TorusGeometry(0.45 + i * 0.22, 0.05, 12, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.9
      });

      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(pos);

      this.scene.add(ring);

      this.effects.push({
        mesh: ring,
        t: 0,
        duration: 0.55 + i * 0.08,
        vy: 2.4,
        grow: 1.2
      });
    }
  },

  updateDoor(dt) {

    if (!this.doorPivot || !this.doorMesh) return;

    // collision tant que porte pas ouverte
    if (!this.doorOpen) {
      this.updateDoorCollision();
      this.checkAutoDoorOpen();
    }

    // animation d'ouverture
    if (this.doorOpening) {

      this.doorOpenProgress += dt * this.doorOpenSpeed;

      if (this.doorOpenProgress >= 1) {
        this.doorOpenProgress = 1;
        this.doorOpening = false;
        this.doorOpen = true;
        console.log("Door fully open");
      }

      const angle = -Math.PI / 2 * this.doorOpenProgress;
      this.doorPivot.rotation.y = angle;
    }
  },

  updateDoorCollision() {

    if (!this.doorMesh) return;

    const box = new THREE.Box3().setFromObject(this.doorMesh);
    const playerPos = Player.camera.position;

    const closest = box.clampPoint(playerPos, new THREE.Vector3());
    const dx = playerPos.x - closest.x;
    const dz = playerPos.z - closest.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < Player.radius * Player.radius) {

      const dist = Math.sqrt(distSq);
      const push = Player.radius - dist;

      if (dist > 0.0001) {
        playerPos.x += (dx / dist) * push;
        playerPos.z += (dz / dist) * push;
      }
    }
  },

  checkAutoDoorOpen() {

    if (this.doorOpen || this.doorOpening) return;
    if (this.keysCount <= 0) return;

    // ? FIX: doorWorldPos correctement déni
    const doorWorldPos = new THREE.Vector3();
    this.doorMesh.getWorldPosition(doorWorldPos);

    const p = Player.camera.position;
    const dist = Math.hypot(p.x - doorWorldPos.x, p.z - doorWorldPos.z);

    // debug simple
    // console.log("Door dist:", dist, "keys:", this.keysCount);

    if (dist < 2.4) {
      this.startDoorOpening();
    }
  },

  /* ================= KEY ================= */

  spawnKey() {

    if (this.keyMesh) {
      this.scene.remove(this.keyMesh);
      this.keyMesh = null;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x553300
    });

    const group = new THREE.Group();

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 12, 24), mat);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.75), mat);
    shaft.position.z = 0.45;

    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.1), mat);
    tooth.position.set(0.16, 0, 0.78);

    group.add(ring, shaft, tooth);

    // clé plat
    group.rotation.x = Math.PI / 2;

    const p = Maze.getRandomSpawnPosition({ cellMargin: 1, y: 1.2 });
    group.position.copy(p);

    this.keyMesh = group;
    this.scene.add(group);
  },

  updateKey(dt) {

    if (!this.keyMesh) return;

    this.keyMesh.rotation.z += dt * 2;

    if (this.keyMesh.position.distanceTo(Player.camera.position) < 1.3) {
      this.scene.remove(this.keyMesh);
      this.keyMesh = null;

      this.keysCount++;
      this.updateHUD();
    }
  },

  /* ================= ENEMY ================= */

  spawnEnemy() {

    if (this.enemyMesh) {
      this.scene.remove(this.enemyMesh);
      this.enemyMesh = null;
    }

    const geo = new THREE.SphereGeometry(0.6, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.7 });

    this.enemyMesh = new THREE.Mesh(geo, mat);
    this.enemyMesh.position.copy(
      Maze.getRandomSpawnPosition({ cellMargin: 1, y: 1.2 })
    );

    this.scene.add(this.enemyMesh);
  },

  updateEnemy(dt) {

    if (!this.enemyMesh) return;

    const dir = Player.camera.position.clone().sub(this.enemyMesh.position);
    dir.y = 0;

    if (dir.length() > 0.05) {
      dir.normalize();
      this.enemyMesh.position.x += dir.x * this.enemySpeed * dt;
      this.enemyMesh.position.z += dir.z * this.enemySpeed * dt;

      // collision murs
      Maze.resolveCollision(this.enemyMesh.position, this.enemyRadius);
    }

    // respiration
    this.enemyBreathTime += dt;
    const scale = 1 + Math.sin(this.enemyBreathTime * 3) * 0.05;
    this.enemyMesh.scale.setScalar(scale);

    const d = this.enemyMesh.position.distanceTo(Player.camera.position);
    if (d < (this.enemyRadius + Player.radius + 0.05)) {
      this.playerHit();
    }
  },

  playerHit() {

    if (this.hitCooldown > 0) return;

    this.lives--;
    this.updateHUD();
    this.hitCooldown = this.hitCooldownSeconds;

    // respawn player + fx
    this.addTeleportEffect(Player.spawnPos.clone().setY(0.25));
    Player.respawn(true);

    // respawn enemy far
    this.enemyMesh.position.copy(
      Maze.getRandomSpawnPosition({ cellMargin: 1, y: 1.2 })
    );

    if (this.lives <= 0) {
      this.onGameOver();
    }
  },

  onGameOver() {

    this.gameOver = true;
    this.paused = true;

    this.stopAudio();
    document.exitPointerLock();

    UI.showGameOver(
      () => location.reload(),
      () => this.quitToMenu()
    );
  },

  /* ================= FX ================= */

  addTeleportEffect(pos) {

    for (let i = 0; i < 5; i++) {

      const geo = new THREE.TorusGeometry(0.55 + i * 0.22, 0.06, 12, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x55ccff,
        transparent: true,
        opacity: 0.95
      });

      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(pos);
      ring.position.y += i * 0.1;

      this.scene.add(ring);

      this.effects.push({
        mesh: ring,
        t: 0,
        duration: 0.8 + i * 0.08,
        vy: 3.0,
        grow: 1.6
      });
    }
  },

  updateEffects(dt) {

    if (this.effects.length === 0) return;

    for (let i = this.effects.length - 1; i >= 0; i--) {

      const e = this.effects[i];
      e.t += dt;
      const k = Math.min(1, e.t / e.duration);

      e.mesh.position.y += dt * e.vy;
      e.mesh.scale.setScalar(1 + k * e.grow);
      e.mesh.material.opacity = (1 - k) * 0.95;

      if (k >= 1) {
        this.scene.remove(e.mesh);
        e.mesh.geometry.dispose();
        e.mesh.material.dispose();
        this.effects.splice(i, 1);
      }
    }
  },

  clearEffects() {
    for (const e of this.effects) {
      this.scene.remove(e.mesh);
      e.mesh.geometry.dispose();
      e.mesh.material.dispose();
    }
    this.effects.length = 0;
  },

  /* ================= UPDATE ================= */

  update(dt) {

    if (this.paused) return;

    if (this.hitCooldown > 0) {
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    }

    this.updateDoor(dt);
    this.updateEnemy(dt);
    this.updateKey(dt);
    this.updateEffects(dt);
  }

};

export { Game, VERSION };
