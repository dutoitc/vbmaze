const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
 camera.aspect = innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,0.55));

const light = new THREE.PointLight(0xffffff,1.3,400);
light.position.set(40,35,40);
scene.add(light);

const loader = new THREE.TextureLoader();
const floorTex = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(60,60);

const wallTex = loader.load("https://threejs.org/examples/textures/brick_bump.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(1,1);

// Bigger maze (handmade but larger)
const maze = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
 [1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1],
 [1,0,1,0,0,1,0,0,0,1,0,0,0,1,0,1],
 [1,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1],
 [1,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1],
 [1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1],
 [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
 [1,0,1,1,0,1,1,1,1,1,1,1,0,1,0,1],
 [1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
 [1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1],
 [1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1],
 [1,1,1,0,1,0,1,1,0,1,1,1,0,1,0,1],
 [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
 [1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const SCALE = 4;
const WALL_H = 3;

const W = maze[0].length;
const H = maze.length;

const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(W*SCALE, H*SCALE),
 new THREE.MeshStandardMaterial({map: floorTex, roughness:1})
);
floor.rotation.x = -Math.PI/2;
floor.position.set((W-1)*SCALE/2,0,(H-1)*SCALE/2);
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({map: wallTex, roughness:0.75});
const walls = [];

for(let z=0; z<H; z++){
 for(let x=0; x<W; x++){
  if(maze[z][x]===1){
   const wall = new THREE.Mesh(
    new THREE.BoxGeometry(SCALE, WALL_H, SCALE),
    wallMat
   );
   wall.position.set(x*SCALE, WALL_H/2, z*SCALE);
   scene.add(wall);
   walls.push(wall);
  }
 }
}

// Goal "breathing" orb
const goal = new THREE.Mesh(
 new THREE.SphereGeometry(1.1, 24, 24),
 new THREE.MeshStandardMaterial({color:0xffcc33, emissive:0x553300, roughness:0.2, metalness:0.1})
);
goal.position.set((W-2)*SCALE, 1.1, (H-2)*SCALE);
scene.add(goal);

camera.position.set(1.5*SCALE, 1.8, 1.5*SCALE);

// Input
const keys = Object.create(null);
function clearKeys(){ for(const k in keys) delete keys[k]; }
document.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

let yaw=0, pitch=0;
document.body.addEventListener("mousemove", e=>{
 if(document.pointerLockElement===document.body){
  yaw -= e.movementX*0.002;
  pitch -= e.movementY*0.002;
  pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
 }
});
document.body.addEventListener("click", ()=>document.body.requestPointerLock());

// Collision with player radius
const PLAYER_R = 0.8;

function canMove(x,z){
 for(const w of walls){
  const dx = Math.abs(w.position.x - x);
  const dz = Math.abs(w.position.z - z);
  if(dx < (SCALE/2 + PLAYER_R) && dz < (SCALE/2 + PLAYER_R)){
   return false;
  }
 }
 return true;
}

// Footsteps (WebAudio, tiny synth click)
let audioCtx = null;
function stepSound(){
 if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
 const o = audioCtx.createOscillator();
 const g = audioCtx.createGain();
 o.type = "square";
 o.frequency.value = 140 + Math.random()*25;
 g.gain.value = 0.03;
 o.connect(g); g.connect(audioCtx.destination);
 o.start();
 o.stop(audioCtx.currentTime + 0.03);
}

let lastStepT = 0;

function move(t){
 const speed = 0.18;

 // FIX: forward should be -Z in camera space, so use (-cos) for z when yaw=0
 const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
 const right   = new THREE.Vector3(Math.cos(yaw), 0,  Math.sin(yaw));

 let vx = 0, vz = 0;

 if(keys["w"]) { vx += forward.x; vz += forward.z; }
 if(keys["s"]) { vx -= forward.x; vz -= forward.z; }
 if(keys["a"]) { vx -= right.x;   vz -= right.z; }
 if(keys["d"]) { vx += right.x;   vz += right.z; }

 const len = Math.hypot(vx,vz);
 if(len > 0){
  vx /= len; vz /= len;

  const nx = camera.position.x + vx*speed;
  const nz = camera.position.z + vz*speed;

  if(canMove(nx, camera.position.z)) camera.position.x = nx;
  if(canMove(camera.position.x, nz)) camera.position.z = nz;

  if(t - lastStepT > 220){
   stepSound();
   lastStepT = t;
  }
 }
}

function checkGoal(){
 const dx = camera.position.x - goal.position.x;
 const dz = camera.position.z - goal.position.z;
 if(Math.sqrt(dx*dx + dz*dz) < 2.0){
  alert("Maze cleared");
  clearKeys();
  camera.position.set(1.5*SCALE, 1.8, 1.5*SCALE);
 }
}

function animate(t){
 requestAnimationFrame(animate);

 // breathing orb
 const s = 1 + 0.08*Math.sin(t*0.004);
 goal.scale.set(s,s,s);

 move(t);
 checkGoal();

 camera.rotation.order="YXZ";
 camera.rotation.y = yaw;
 camera.rotation.x = pitch;

 renderer.render(scene, camera);
}
requestAnimationFrame(animate);

