const VERSION = "v0.19";

// ================= CONFIG =================
const SCALE = 4;
const BASE_SPEED = 3;
const SPRINT_MULT = 1.8;
const MOUSE = 0.0012;
const PLAYER_RADIUS = 0.35;
const FOV = 68;

const MUSIC_VOLUME = 0.25;
const STEP_VOLUME_MULT = 1.6;

const ENEMY_RADIUS = 0.55;
const ENEMY_SPEED = 1.6; // patrol speed (units/sec)

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);

const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// ================= HUD =================
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.left = "10px";
hud.style.bottom = "10px";
hud.style.color = "white";
hud.style.fontFamily = "monospace";
hud.style.fontSize = "13px";
hud.style.opacity = "0.85";
document.body.appendChild(hud);

const watermark = document.createElement("div");
watermark.style.position = "fixed";
watermark.style.right = "10px";
watermark.style.bottom = "8px";
watermark.style.color = "white";
watermark.style.fontFamily = "monospace";
watermark.style.opacity = "0.5";
watermark.innerText = `VBMaze ${VERSION}`;
document.body.appendChild(watermark);

const crosshair = document.createElement("div");
crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.width = "8px";
crosshair.style.height = "8px";
crosshair.style.marginLeft = "-4px";
crosshair.style.marginTop = "-4px";
crosshair.style.border = "1px solid white";
crosshair.style.opacity = "0.6";
document.body.appendChild(crosshair);

// ================= CONFIG SCREEN =================
const settings = {
  musicMuted: false,
  stepsMuted: false,
};

let _savedSettingsForCancel = null;

const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.inset = "0";
overlay.style.background = "rgba(0,0,0,0.72)";
overlay.style.display = "flex";
overlay.style.alignItems = "center";
overlay.style.justifyContent = "center";
overlay.style.zIndex = "9999";
overlay.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
document.body.appendChild(overlay);

const panel = document.createElement("div");
panel.style.width = "min(520px, 92vw)";
panel.style.background = "rgba(15,18,25,0.95)";
panel.style.border = "1px solid rgba(255,255,255,0.12)";
panel.style.borderRadius = "14px";
panel.style.boxShadow = "0 10px 40px rgba(0,0,0,0.5)";
panel.style.padding = "18px 18px 14px 18px";
panel.style.color = "white";
overlay.appendChild(panel);

const title = document.createElement("div");
title.innerText = "VBMaze";
title.style.fontSize = "32px";
title.style.fontWeight = "800";
title.style.letterSpacing = "0.5px";
title.style.marginBottom = "8px";
panel.appendChild(title);

const subtitle = document.createElement("div");
subtitle.innerText = "Configuration";
subtitle.style.fontSize = "16px";
subtitle.style.opacity = "0.85";
subtitle.style.marginBottom = "14px";
panel.appendChild(subtitle);

function mkRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.justifyContent = "space-between";
  row.style.padding = "10px 0";
  row.style.borderTop = "1px solid rgba(255,255,255,0.08)";

  const label = document.createElement("div");
  label.innerText = labelText;
  label.style.fontSize = "15px";
  label.style.opacity = "0.95";

  row.appendChild(label);
  row.appendChild(inputEl);
  return row;
}

const chkMusic = document.createElement("input");
chkMusic.type = "checkbox";
chkMusic.checked = settings.musicMuted;

const chkSteps = document.createElement("input");
chkSteps.type = "checkbox";
chkSteps.checked = settings.stepsMuted;

panel.appendChild(mkRow("Mute musique", chkMusic));
panel.appendChild(mkRow("Mute bruit des pas", chkSteps));

const hint = document.createElement("div");
hint.style.marginTop = "12px";
hint.style.fontSize = "12px";
hint.style.opacity = "0.75";
hint.innerText = "OK = appliquer | Annuler = revenir à l’état précédent. (ESC rouvre ce menu)";
panel.appendChild(hint);

const btnRow = document.createElement("div");
btnRow.style.display = "flex";
btnRow.style.gap = "10px";
btnRow.style.justifyContent = "flex-end";
btnRow.style.marginTop = "14px";
panel.appendChild(btnRow);

function mkBtn(text, primary) {
  const b = document.createElement("button");
  b.innerText = text;
  b.style.padding = "10px 14px";
  b.style.borderRadius = "10px";
  b.style.border = primary ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.12)";
  b.style.background = primary ? "rgba(80,140,255,0.25)" : "rgba(255,255,255,0.08)";
  b.style.color = "white";
  b.style.cursor = "pointer";
  b.style.fontWeight = "700";
  return b;
}

const btnCancel = mkBtn("Annuler", false);
const btnOk = mkBtn("OK", true);
btnRow.appendChild(btnCancel);
btnRow.appendChild(btnOk);

function showConfig() {
  _savedSettingsForCancel = { ...settings };
  chkMusic.checked = settings.musicMuted;
  chkSteps.checked = settings.stepsMuted;
  overlay.style.display = "flex";
  console.log(`[VBMaze] Config OPEN`);
}

function hideConfig() {
  overlay.style.display = "none";
  console.log(`[VBMaze] Config CLOSE`);
}

function applySettingsFromUI() {
  settings.musicMuted = !!chkMusic.checked;
  settings.stepsMuted = !!chkSteps.checked;
  syncAudioSettings();
  console.log(`[VBMaze] Settings applied musicMuted=${settings.musicMuted} stepsMuted=${settings.stepsMuted}`);
}

function cancelSettings() {
  if (_savedSettingsForCancel) {
    settings.musicMuted = _savedSettingsForCancel.musicMuted;
    settings.stepsMuted = _savedSettingsForCancel.stepsMuted;
    _savedSettingsForCancel = null;
  }
  syncAudioSettings();
  hideConfig();
  console.log(`[VBMaze] Settings canceled`);
}

btnOk.onclick = () => {
  applySettingsFromUI();
  hideConfig();
};

btnCancel.onclick = () => {
  cancelSettings();
};

// Open config on ESC (ESC also exits pointerlock, so it’s a nice UX)
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // small delay so pointerlock state updates first
    setTimeout(() => showConfig(), 0);
  }
});

// ================= LIGHT =================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dl = new THREE.DirectionalLight(0xffffff, 0.8);
dl.position.set(10, 20, 10);
scene.add(dl);

// ================= TEXTURES =================
const loader = new THREE.TextureLoader();
const wallTex = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;

const floorTex = loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(20, 20);

// Door texture generated (no 404)
function createDoorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // base
  ctx.fillStyle = "#5a3b1e";
  ctx.fillRect(0, 0, 256, 256);

  // wood streaks
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.18})`;
    ctx.fillRect(Math.random() * 256, 0, 2 + Math.random() * 6, 256);
  }

  // panels
  ctx.strokeStyle = "rgba(20,10,5,0.8)";
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 220, 220);
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, 176, 176);

  // knob
  ctx.fillStyle = "#caa24a";
  ctx.beginPath();
  ctx.arc(200, 140, 10, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
const doorTexture = createDoorTexture();

// ================= MAZE =================
const maze = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1],
  [1,0,0,0,0,1,0,1],
  [1,0,1,0,0,0,0,1],
  [1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1]
];

const MAZE_W = maze[0].length * SCALE;
const MAZE_H = maze.length * SCALE;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function isWallCell(x, z) {
  if (z < 0 || x < 0 || z >= maze.length || x >= maze[0].length) return true;
  return maze[z][x] === 1;
}
function cellCenter(cx, cz) {
  return { x: cx * SCALE + SCALE / 2, z: cz * SCALE + SCALE / 2 };
}
function toCellX(x) { return Math.floor(x / SCALE); }
function toCellZ(z) { return Math.floor(z / SCALE); }

function buildOpenCells() {
  const list = [];
  for (let z = 0; z < maze.length; z++)
    for (let x = 0; x < maze[0].length; x++)
      if (maze[z][x] === 0) list.push({ x, z });
  return list;
}
const OPEN_CELLS = buildOpenCells();

// ================= BUILD GEOMETRY =================
const wallGeo = new THREE.BoxGeometry(SCALE, SCALE, SCALE);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex });

for (let z = 0; z < maze.length; z++) {
  for (let x = 0; x < maze[z].length; x++) {
    if (maze[z][x]) {
      const m = new THREE.Mesh(wallGeo, wallMat);
      m.position.set(x * SCALE + SCALE / 2, SCALE / 2, z * SCALE + SCALE / 2);
      scene.add(m);
    }
  }
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(MAZE_W, MAZE_H),
  new THREE.MeshStandardMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(MAZE_W / 2, 0, MAZE_H / 2);
scene.add(floor);

// ================= SPAWN SAFE =================
function findSpawnCell() {
  for (let z = 0; z < maze.length; z++)
    for (let x = 0; x < maze[0].length; x++)
      if (maze[z][x] === 0) return { x, z };
  return { x: 1, z: 1 };
}

const SPAWN_CELL = findSpawnCell();
function doSpawn() {
  const c = cellCenter(SPAWN_CELL.x, SPAWN_CELL.z);
  camera.position.set(c.x, 1.7, c.z);
  console.log(`[VBMaze] Spawn cell(${SPAWN_CELL.x},${SPAWN_CELL.z}) pos(${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)})`);
}
doSpawn();

// ================= GOAL =================
const goalGeo = new THREE.SphereGeometry(0.6, 32, 32);
const goalMat = new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x2266aa });
const goal = new THREE.Mesh(goalGeo, goalMat);
goal.position.set(MAZE_W - SCALE, 0.7, MAZE_H - SCALE);
scene.add(goal);

// ================= KEY (sprite 2.5D visible) =================
let hasKey = false;

function createKeySpriteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // glow
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, "rgba(255,220,90,0.85)");
  grad.addColorStop(1, "rgba(255,220,90,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // key shape
  ctx.fillStyle = "rgba(255,215,0,1.0)";
  ctx.beginPath();
  ctx.arc(105, 128, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(105, 112, 120, 32);
  ctx.fillStyle = "rgba(220,180,0,1.0)";
  ctx.fillRect(190, 104, 18, 48);

  // outline
  ctx.strokeStyle = "rgba(90,60,0,0.85)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(105, 128, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(105, 112, 120, 32);

  return new THREE.CanvasTexture(canvas);
}

const keyTex = createKeySpriteTexture();
const keyMat = new THREE.SpriteMaterial({ map: keyTex, transparent: true, depthWrite: false });
const keySprite = new THREE.Sprite(keyMat);
keySprite.scale.set(2.0, 2.0, 2.0);
scene.add(keySprite);

// Choose a key cell: open, far from spawn, not too close to door (set later)
function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.z - b.z); }

// ================= DOOR (blocking cell) =================
let doorOpen = false;
const DOOR_CELL = { x: 6, z: 3 }; // must be open in original maze
maze[DOOR_CELL.z][DOOR_CELL.x] = 1; // block until opened

const doorMesh = new THREE.Mesh(
  new THREE.BoxGeometry(SCALE, SCALE, 0.6),
  new THREE.MeshStandardMaterial({ map: doorTexture })
);
doorMesh.position.set(
  DOOR_CELL.x * SCALE + SCALE / 2,
  SCALE / 2,
  DOOR_CELL.z * SCALE + SCALE / 2
);
scene.add(doorMesh);

function chooseKeyCell() {
  // pick farthest from spawn with extra constraints
  let best = null;
  let bestScore = -1;

  for (const c of OPEN_CELLS) {
    const dSpawn = manhattan(c, SPAWN_CELL);
    const dDoor = manhattan(c, DOOR_CELL);

    // not too close to spawn (avoid instant pickup), not too close to door
    if (dSpawn < 4) continue;
    if (dDoor < 3) continue;

    // prefer far
    const score = dSpawn * 10 + dDoor;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  // fallback
  if (!best) best = OPEN_CELLS[Math.floor(OPEN_CELLS.length / 2)];
  return best;
}

const KEY_CELL = chooseKeyCell();
{
  const p = cellCenter(KEY_CELL.x, KEY_CELL.z);
  keySprite.position.set(p.x, 1.35, p.z);
}
console.log(`[VBMaze] Key cell(${KEY_CELL.x},${KEY_CELL.z}) pos(${keySprite.position.x.toFixed(2)},${keySprite.position.z.toFixed(2)})`);
console.log(`[VBMaze] Door cell(${DOOR_CELL.x},${DOOR_CELL.z}) pos(${doorMesh.position.x.toFixed(2)},${doorMesh.position.z.toFixed(2)})`);

// ================= AUDIO (music WAV + step synth) =================
let music = null;
let audioCtx = null;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playStep() {
  if (settings.stepsMuted) return;
  ensureAudioCtx();

  const t = audioCtx.currentTime;
  const dur = 0.06;

  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(85, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + dur);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0, t);
  gain.gain.linearRampToValueAtTime(0.08 * STEP_VOLUME_MULT, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function ensureMusic() {
  if (!music) {
    music = new Audio("maze1.wav");
    music.loop = true;
    music.volume = MUSIC_VOLUME;
  }
}

function syncAudioSettings() {
  ensureMusic();
  if (settings.musicMuted) {
    music.pause();
  } else {
    // play only if user already interacted (we call ensureMusic on click anyway)
    // try/catch because browsers may block autoplay until click
    try { music.play(); } catch (e) {}
  }
}

document.body.onclick = () => {
  ensureMusic();
  ensureAudioCtx();

  if (!settings.musicMuted) {
    music.volume = MUSIC_VOLUME;
    music.play();
  }

  hideConfig(); // first click: close config and start game
  document.body.requestPointerLock();
  console.log(`[VBMaze] Start (click) pointerLock requested`);
};

// ================= INPUT =================
const keys = {};
addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// ================= MOUSE =================
let yaw = 0, pitch = 0;
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== document.body) return;
  yaw -= e.movementX * MOUSE;
  pitch -= e.movementY * MOUSE;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ================= COLLISION (circle vs wall AABB) =================
function resolveCircleVsAABB(pos, r, minX, maxX, minZ, maxZ) {
  const cx = clamp(pos.x, minX, maxX);
  const cz = clamp(pos.z, minZ, maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const d2 = dx * dx + dz * dz;

  if (d2 <= 0) return 0;
  const d = Math.sqrt(d2);
  if (d >= r) return 0;

  const push = (r - d);
  pos.x += (dx / d) * push;
  pos.z += (dz / d) * push;
  return 1;
}

function resolveCollisions(pos, r) {
  pos.x = clamp(pos.x, r, MAZE_W - r);
  pos.z = clamp(pos.z, r, MAZE_H - r);

  const gx = toCellX(pos.x);
  const gz = toCellZ(pos.z);

  for (let z = gz - 1; z <= gz + 1; z++) {
    for (let x = gx - 1; x <= gx + 1; x++) {
      if (!isWallCell(x, z)) continue;

      const minX = x * SCALE;
      const maxX = minX + SCALE;
      const minZ = z * SCALE;
      const maxZ = minZ + SCALE;

      resolveCircleVsAABB(pos, r, minX, maxX, minZ, maxZ);
    }
  }
}

// ================= ENEMY AI (patrol) =================
const enemy = new THREE.Mesh(
  new THREE.SphereGeometry(ENEMY_RADIUS, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xff4455, emissive: 0x330000 })
);
scene.add(enemy);

function pickEnemySpawnCell() {
  // far from spawn so it doesn't spawn on top of player
  let best = null, bestScore = -1;
  for (const c of OPEN_CELLS) {
    const d = manhattan(c, SPAWN_CELL);
    if (d < 5) continue;
    const score = d;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best) best = OPEN_CELLS[OPEN_CELLS.length - 1];
  return best;
}

function pickPatrolWaypoints(count) {
  // simple: choose far-ish random open cells, avoid too near each other
  const pts = [];
  const maxAttempts = 2000;

  for (let i = 0; i < count; i++) {
    let chosen = null;
    for (let a = 0; a < maxAttempts; a++) {
      const c = OPEN_CELLS[(Math.random() * OPEN_CELLS.length) | 0];
      if (manhattan(c, SPAWN_CELL) < 4) continue; // avoid player start area
      if (manhattan(c, DOOR_CELL) < 2) continue;
      if (manhattan(c, KEY_CELL) < 2) continue;

      let ok = true;
      for (const p of pts) {
        if (manhattan(c, p) < 3) { ok = false; break; }
      }
      if (ok) { chosen = c; break; }
    }
    pts.push(chosen || OPEN_CELLS[(Math.random() * OPEN_CELLS.length) | 0]);
  }
  return pts;
}

const ENEMY_SPAWN_CELL = pickEnemySpawnCell();
{
  const p = cellCenter(ENEMY_SPAWN_CELL.x, ENEMY_SPAWN_CELL.z);
  enemy.position.set(p.x, ENEMY_RADIUS, p.z);
}

let patrol = pickPatrolWaypoints(6);
let patrolIndex = 0;
console.log(`[VBMaze] Enemy spawn cell(${ENEMY_SPAWN_CELL.x},${ENEMY_SPAWN_CELL.z})`);
console.log(`[VBMaze] Patrol points: ${patrol.map(p => `(${p.x},${p.z})`).join(" -> ")}`);

function enemyTargetPos() {
  const c = patrol[patrolIndex % patrol.length];
  const p = cellCenter(c.x, c.z);
  return new THREE.Vector3(p.x, ENEMY_RADIUS, p.z);
}

function stepEnemy(dt) {
  const target = enemyTargetPos();
  const to = new THREE.Vector3(target.x - enemy.position.x, 0, target.z - enemy.position.z);
  const dist = to.length();

  if (dist < 0.25) {
    patrolIndex = (patrolIndex + 1) % patrol.length;
    return;
  }

  to.normalize();
  enemy.position.x += to.x * ENEMY_SPEED * dt;
  enemy.position.z += to.z * ENEMY_SPEED * dt;
  resolveCollisions(enemy.position, ENEMY_RADIUS);
}

// ================= GAMEPLAY (door/key) =================
function tryPickupKey() {
  if (hasKey) return;
  const dx = camera.position.x - keySprite.position.x;
  const dz = camera.position.z - keySprite.position.z;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.1) {
    hasKey = true;
    scene.remove(keySprite);
    console.log(`[VBMaze] Key picked`);
  }
}

function tryOpenDoor() {
  if (doorOpen || !hasKey) return;

  const px = toCellX(camera.position.x);
  const pz = toCellZ(camera.position.z);

  // If player is adjacent to door cell => open
  const md = Math.abs(px - DOOR_CELL.x) + Math.abs(pz - DOOR_CELL.z);
  if (md === 1) {
    doorOpen = true;
    maze[DOOR_CELL.z][DOOR_CELL.x] = 0;
    scene.remove(doorMesh);
    console.log(`[VBMaze] Door opened`);
  }
}

// ================= LOOP =================
const clock = new THREE.Clock();
let fps = 0, acc = 0, frames = 0;

let stepTimer = 0;

function computeDir() {
  const f = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  const s = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  if (!f && !s) return null;

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  const dir = new THREE.Vector3();
  dir.addScaledVector(forward, f);
  dir.addScaledVector(right, s);
  if (dir.lengthSq() === 0) return null;
  dir.normalize();
  return dir;
}

function respawn(reason) {
  console.log(`[VBMaze] Respawn reason=${reason}`);
  doSpawn();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  acc += dt; frames++;
  if (acc > 0.5) { fps = Math.round(frames / acc); acc = 0; frames = 0; }

  // Animate key (bobbing) if still present
  if (!hasKey) {
    const t = performance.now() * 0.003;
    keySprite.position.y = 1.35 + Math.sin(t) * 0.18;
    // face camera automatically (sprite does it), just a tiny spin feel:
    keySprite.material.rotation += 0.01;
  }

  // Enemy patrol
  stepEnemy(dt);

  // Player movement
  const sprint = keys["shift"];
  const speed = BASE_SPEED * (sprint ? SPRINT_MULT : 1);

  let actualSpeed = 0;
  const dir = computeDir();
  if (dir) {
    const px = camera.position.x, pz = camera.position.z;

    camera.position.x += dir.x * speed * dt;
    camera.position.z += dir.z * speed * dt;
    resolveCollisions(camera.position, PLAYER_RADIUS);

    const dx = camera.position.x - px;
    const dz = camera.position.z - pz;
    actualSpeed = Math.sqrt(dx * dx + dz * dz) / dt;

    stepTimer += dt;
    const cadence = sprint ? 0.22 : 0.32;
    if (stepTimer > cadence) {
      playStep();
      stepTimer = 0;
    }
  } else {
    stepTimer = 0;
  }

  // Key/Door interactions
  tryPickupKey();
  tryOpenDoor();

  // Enemy hit => respawn
  {
    const dx = camera.position.x - enemy.position.x;
    const dz = camera.position.z - enemy.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < (PLAYER_RADIUS + ENEMY_RADIUS) * 1.05) {
      respawn("enemy");
    }
  }

  // Goal animation
  {
    const t = performance.now() * 0.002;
    const s = 1 + Math.sin(t) * 0.12;
    goal.scale.set(s, s, s);
  }

  hud.innerText =
    `FPS:${fps}\n` +
    `Speed:${actualSpeed.toFixed(2)}\n` +
    `Key:${hasKey ? "YES" : "NO"}\n` +
    `Music:${settings.musicMuted ? "OFF" : "ON"}  Steps:${settings.stepsMuted ? "OFF" : "ON"}`;

  renderer.render(scene, camera);
}

console.log(`[VBMaze] Boot ${VERSION}`);
console.log(`[VBMaze] Spawn cell(${SPAWN_CELL.x},${SPAWN_CELL.z}) | Key cell(${KEY_CELL.x},${KEY_CELL.z}) | Door cell(${DOOR_CELL.x},${DOOR_CELL.z})`);
showConfig();
animate();

// ================= RESIZE =================
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
