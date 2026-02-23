const VERSION = "v0.14";

// ===== CONFIG =====
const SCALE = 4;
const SPEED = 3;
const MOUSE = 0.0012;        // ↓ rotation plus lente
const PLAYER_RADIUS = 0.35;
const FOV = 68;              // ↓ FOV moins large
const STEP_VOLUME_MULT = 1.8; // ↑ son plus fort

const COLLISION_ITERS = 4;
const SUBSTEP_MAX_DIST = SCALE * 0.25;
const COLLISION_LOG_COOLDOWN = 0.75;

// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// ===== UI CLEAN =====
const uiContainer = document.createElement("div");
uiContainer.style.position = "fixed";
uiContainer.style.top = "10px";
uiContainer.style.left = "10px";
uiContainer.style.color = "white";
uiContainer.style.fontFamily = "monospace";
uiContainer.style.lineHeight = "1.4";
uiContainer.style.opacity = "0.85";
uiContainer.innerHTML = `
WASD / Arrows = move<br>
Click = lock mouse
`;
document.body.appendChild(uiContainer);

// bottom-right watermark
const watermark = document.createElement("div");
watermark.style.position = "fixed";
watermark.style.right = "10px";
watermark.style.bottom = "8px";
watermark.style.color = "white";
watermark.style.fontFamily = "monospace";
watermark.style.opacity = "0.6";
watermark.innerText = `VBMaze ${VERSION}`;
document.body.appendChild(watermark);

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dl = new THREE.DirectionalLight(0xffffff, 0.8);
dl.position.set(10, 20, 10);
scene.add(dl);

// ===== TEXTURES =====
const loader = new THREE.TextureLoader();
const wallTex = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;

const floorTex = loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(20, 20);

// ===== MAZE =====
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
  new THREE.PlaneGeometry(maze[0].length * SCALE, maze.length * SCALE),
  new THREE.MeshStandardMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(MAZE_W / 2, 0, MAZE_H / 2);
scene.add(floor);

// ===== HELPERS =====
function cellCenter(x, z) {
  return { x: x * SCALE + SCALE / 2, z: z * SCALE + SCALE / 2 };
}
function isOpenCell(x, z) {
  if (z < 0 || x < 0 || z >= maze.length || x >= maze[0].length) return false;
  return maze[z][x] === 0;
}
function isWallCell(x, z) {
  if (z < 0 || x < 0 || z >= maze.length || x >= maze[0].length) return true;
  return maze[z][x] === 1;
}

console.log(`[VBMaze] Boot ${VERSION}`);

// ===== SPAWN =====
function findFirstOpen() {
  for (let z = 0; z < maze.length; z++)
    for (let x = 0; x < maze[z].length; x++)
      if (maze[z][x] === 0) return { x, z };
  return { x: 1, z: 1 };
}

const spawnCell = findFirstOpen();
function doSpawn() {
  const c = cellCenter(spawnCell.x, spawnCell.z);
  camera.position.set(c.x, 1.7, c.z);
  console.log(`[VBMaze] Spawn`);
}
doSpawn();

// ===== GOAL =====
function findGoalCell() {
  for (let z = maze.length - 1; z >= 0; z--)
    for (let x = maze[0].length - 1; x >= 0; x--)
      if (isOpenCell(x, z)) return { x, z };
  return { x: 1, z: 1 };
}

const goalCell = findGoalCell();
const goalGeo = new THREE.SphereGeometry(0.6, 32, 32);
const goalMat = new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x2266aa });
const goal = new THREE.Mesh(goalGeo, goalMat);
{
  const g = cellCenter(goalCell.x, goalCell.z);
  goal.position.set(g.x, 0.7, g.z);
}
scene.add(goal);

// ===== AUDIO =====
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playStep() {
  ensureAudio();

  const t = audioCtx.currentTime;
  const dur = 0.06;

  const buffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.35));

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + dur);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0, t);
  gain.gain.linearRampToValueAtTime(0.08 * STEP_VOLUME_MULT, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(gain);
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(t);
  osc.start(t);
  src.stop(t + dur);
  osc.stop(t + dur);
}

// ===== INPUT =====
const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ===== MOUSE =====
let yaw = 0, pitch = 0;

document.body.onclick = () => {
  ensureAudio();
  document.body.requestPointerLock();
};

addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;

  yaw -= e.movementX * MOUSE;
  pitch -= e.movementY * MOUSE;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ===== COLLISION =====
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function resolveCircleVsAABB(pos,r,minX,maxX,minZ,maxZ){
  const cx = clamp(pos.x,minX,maxX);
  const cz = clamp(pos.z,minZ,maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const d2 = dx*dx + dz*dz;
  if(d2===0) return 0;
  const dist=Math.sqrt(d2);
  if(dist>=r) return 0;
  const push=r-dist;
  pos.x+=dx/dist*push;
  pos.z+=dz/dist*push;
  return 1;
}

function resolveCollisions(pos,r){
  let pushes=0;
  pos.x=clamp(pos.x,r,MAZE_W-r);
  pos.z=clamp(pos.z,r,MAZE_H-r);

  const gx=Math.floor(pos.x/SCALE);
  const gz=Math.floor(pos.z/SCALE);

  for(let z=gz-1;z<=gz+1;z++)
    for(let x=gx-1;x<=gx+1;x++)
      if(isWallCell(x,z)){
        const minX=x*SCALE;
        const maxX=minX+SCALE;
        const minZ=z*SCALE;
        const maxZ=minZ+SCALE;
        pushes+=resolveCircleVsAABB(pos,r,minX,maxX,minZ,maxZ);
      }
  return pushes;
}

// ===== LOOP =====
const clock=new THREE.Clock();
let stepTimer=0;
let won=false;

function computeDir(){
  const f=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  const s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  if(!f&&!s)return null;

  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3(forward.z,0,-forward.x);
  const dir=new THREE.Vector3();
  dir.addScaledVector(forward,f);
  dir.addScaledVector(right,s);
  dir.normalize();
  return dir;
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(0.05,clock.getDelta());

  if(!won){
    const dir=computeDir();
    if(dir){
      camera.position.x+=dir.x*SPEED*dt;
      camera.position.z+=dir.z*SPEED*dt;
      resolveCollisions(camera.position,PLAYER_RADIUS);

      stepTimer+=dt;
      if(stepTimer>0.32){
        playStep();
        stepTimer=0;
      }
    }
  }

  const t=performance.now()*0.002;
  const s=1+Math.sin(t)*0.12;
  goal.scale.set(s,s,s);

  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
