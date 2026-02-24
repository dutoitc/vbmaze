import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { Input } from "./input.js";
import { Maze } from "./maze.js";
import { UI } from "./ui.js";

export const Player = {

  speed: 3,
  sprintMultiplier: 1.8,
  radius: 0.35,

  yaw: 0,
  pitch: 0,

  sensitivity: 0.0012,   // ? plus lent

  currentSpeed: 0,

  spawnPos: new THREE.Vector3(6, 1.7, 6),
  baseCamY: 1.7,

  stepAudio: null,
  teleportAudio: null,
  audioEnabled: false,

  stepTimer: 0,
  bobTime: 0,

  init(scene, camera) {

    this.camera = camera;
    this.camera.position.copy(this.spawnPos);

    this.stepAudio = new Audio("../assets/step.wav");
    this.stepAudio.volume = 0.5;

    this.teleportAudio = new Audio("../assets/step.wav"); // réilise step si pas dautre son
    this.teleportAudio.volume = 0.3;
    this.teleportAudio.playbackRate = 0.6;

    window.addEventListener("mousemove", (e) => {

      if (document.pointerLockElement !== document.body) return;

      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;

      this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));

      camera.rotation.order = "YXZ";
      camera.rotation.y = this.yaw;
      camera.rotation.x = this.pitch;
    });
  },

  enableAudio() {
    this.audioEnabled = true;
  },

  forcePointerLock() {
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
    }
  },

  respawn(withSound = true) {

    this.camera.position.copy(this.spawnPos);
    this.camera.position.y = this.baseCamY;
    this.pitch = 0;
    this.yaw = 0;

    Maze.resolveCollision(this.camera.position, this.radius);

    if (withSound && this.audioEnabled && !UI.settings.stepsMuted) {
      try {
        this.teleportAudio.pause();
        this.teleportAudio.currentTime = 0;
        this.teleportAudio.play().catch(()=>{});
      } catch {}
    }
  },

  update(dt) {
    this.updateMovement(dt);
  },

  updateMovement(dt) {

    const moveDir = new THREE.Vector3();

    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );

    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    if (Input.keys["w"]) moveDir.add(forward);
    if (Input.keys["s"]) moveDir.sub(forward);
    if (Input.keys["a"]) moveDir.sub(right);
    if (Input.keys["d"]) moveDir.add(right);

    if (moveDir.lengthSq() === 0) {
      this.currentSpeed = 0;
      this.applyHeadBob(dt, 0);
      return;
    }

    moveDir.normalize();

    const sprint = !!Input.keys["shift"];
    const speed = this.speed * (sprint ? this.sprintMultiplier : 1);
    this.currentSpeed = speed;

    this.camera.position.x += moveDir.x * speed * dt;
    this.camera.position.z += moveDir.z * speed * dt;

    Maze.resolveCollision(this.camera.position, this.radius);

    this.updateSteps(dt, speed);
    this.applyHeadBob(dt, speed);
  },

  updateSteps(dt, speed) {

    if (!this.audioEnabled) return;
    if (UI.settings.stepsMuted) return;

    const interval = 0.45 * (3 / Math.max(1, speed));
    this.stepTimer += dt;

    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      try {
        this.stepAudio.pause();
        this.stepAudio.currentTime = 0;
        this.stepAudio.play().catch(()=>{});
      } catch {}
    }
  },

  applyHeadBob(dt, speed) {
    if (speed > 0.01) {
      this.bobTime += dt * 8;
      const bob = Math.sin(this.bobTime) * 0.03;
      this.camera.position.y = this.baseCamY + bob;
    } else {
      this.camera.position.y += (this.baseCamY - this.camera.position.y) * Math.min(1, dt * 10);
    }
  }

};
