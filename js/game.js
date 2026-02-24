import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { Player } from "./player.js";
import { Maze } from "./maze.js";
import { UI } from "./ui.js";
import { Input } from "./input.js";

const VERSION = "v1.0";

const Game = {

  scene: null,
  paused: false,
  gameOver: false,

  keysCount: 0,
  lives: 3,

  keyMesh: null,
  doorMesh: null,
  enemyMesh: null,

  enemyRadius: 0.55,
  enemySpeed: 1.2,
  enemyBreathTime: 0,

  hitCooldown: 0,
  hitCooldownSeconds: 1.0,

  music: null,
  effects: [],

  doorPosition: new THREE.Vector3(),

  init(scene) {

    this.scene = scene;

    this.initAudio();
    this.createDoor();
    this.spawnKey();
    this.spawnEnemy();
    this.updateHUD();

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.togglePause();
    });
  },

  /* ================= AUDIO ================= */

  initAudio() {
    this.music = new Audio("../assets/maze1.wav");
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

  /* ================= PAUSE ================= */

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
  },

  /* ================= HUD ================= */

  updateHUD() {
    UI.setInventory(`Clé ${this.keysCount} | Vies: ${this.lives} | ${VERSION}`);
  },

  /* ================= DOOR ================= */

  createDoor() {

    const pos = Maze.getCellCenter(4, 2, 1.8);
    this.doorPosition.copy(pos);

    const tex = new THREE.TextureLoader().load("../assets/wood.jpg");

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9
    });

    const geo = new THREE.BoxGeometry(2.8, 3.6, 0.5);

    this.doorMesh = new THREE.Mesh(geo, mat);
    this.doorMesh.position.copy(pos);

    this.scene.add(this.doorMesh);

    console.log("Door created at:", pos);
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

  checkDoor() {

    if (!this.doorMesh) return;
    if (this.keysCount <= 0) return;

    const dist = this.doorPosition.distanceTo(Player.camera.position);

    console.log("Door distance:", dist);

    if (dist < 3 && Input.keys["e"]) {

      console.log("Door opened");

      this.scene.remove(this.doorMesh);
      this.doorMesh = null;

      this.keysCount--;
      this.updateHUD();
    }
  },

  /* ================= KEY ================= */

  spawnKey() {

    if (this.keyMesh) this.scene.remove(this.keyMesh);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2
    });

    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 12, 24), mat));

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.75), mat);
    shaft.position.z = 0.45;
    group.add(shaft);

    const p = Maze.getRandomSpawnPosition({ cellMargin: 1, y: 1.2 });
    group.position.copy(p);
    group.rotation.x = Math.PI / 2;

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

    if (this.enemyMesh) this.scene.remove(this.enemyMesh);

    const geo = new THREE.SphereGeometry(0.6, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

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
      Maze.resolveCollision(this.enemyMesh.position, this.enemyRadius);
    }

    this.enemyBreathTime += dt;
    const scale = 1 + Math.sin(this.enemyBreathTime * 3) * 0.05;
    this.enemyMesh.scale.setScalar(scale);

    const d = this.enemyMesh.position.distanceTo(Player.camera.position);

    if (d < this.enemyRadius + Player.radius) {
      this.playerHit();
    }
  },

  playerHit() {

    if (this.hitCooldown > 0) return;

    this.lives--;
    this.updateHUD();
    this.hitCooldown = this.hitCooldownSeconds;

    Player.respawn(true);

    this.enemyMesh.position.copy(
      Maze.getRandomSpawnPosition({ cellMargin: 1, y: 1.2 })
    );

    if (this.lives <= 0) {
      this.gameOver = true;
      this.paused = true;
      this.stopAudio();
      document.exitPointerLock();

      UI.showGameOver(
        () => location.reload(),
        () => this.quitToMenu()
      );
    }
  },

  /* ================= UPDATE ================= */

  update(dt) {

    if (this.paused) return;

    if (this.hitCooldown > 0) {
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    }

    this.updateDoorCollision();
    this.checkDoor();
    this.updateEnemy(dt);
    this.updateKey(dt);
  }

};

export { Game, VERSION };
