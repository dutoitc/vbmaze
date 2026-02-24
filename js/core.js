import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { Input } from "./input.js";
import { UI } from "./ui.js";
import { Maze } from "./maze.js";
import { Player } from "./player.js";
import { Game } from "./game.js";

let scene;
let camera;
let renderer;
let clock;

let started = false;

// fps smoothing
let fpsSmoothed = 60;

init();
animate();

function init() {

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1420);
  scene.fog = new THREE.Fog(0x0f1420, 8, 45);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  document.body.appendChild(renderer.domElement);

  // lighting readable
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const hemi = new THREE.HemisphereLight(0xddeeff, 0x223344, 0.5);
  hemi.position.set(0, 20, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.65);
  dir.position.set(5, 12, 5);
  scene.add(dir);

  clock = new THREE.Clock();

  Input.init();

  // ? UI before Game.init (HUD used early)
  UI.init(() => startGame());

  Maze.init(scene);
  Player.init(scene, camera);
  Game.init(scene);

  window.addEventListener("resize", onResize);
}

function startGame() {

  started = true;

  // pointer lock must be in user gesture (button click)
  document.body.requestPointerLock();

  Player.enableAudio();
  Game.enableAudio();
}

function animate() {

  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (started) {

    Player.update(dt);
    Game.update(dt);

    const fpsInstant = dt > 0 ? (1 / dt) : 0;
    fpsSmoothed = fpsSmoothed * 0.9 + fpsInstant * 0.1;

    UI.setStats({
      fps: fpsSmoothed,
      speed: Player.currentSpeed
    });
  }

  renderer.render(scene, camera);
}

function onResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
