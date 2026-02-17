const VERSION="v0.12";

// ===== CONFIG =====
const SCALE=4;
const SPEED=3;
const MOUSE=0.002;
const PLAYER_RADIUS=0.35;

// ===== LABEL =====
const label=document.createElement("div");
label.style.position="fixed";
label.style.top="5px";
label.style.right="10px";
label.style.color="white";
label.style.fontFamily="monospace";
label.innerText=VERSION;
document.body.appendChild(label);

// ===== HUD =====
const hud=document.createElement("div");
hud.style.position="fixed";
hud.style.left="10px";
hud.style.top="10px";
hud.style.color="white";
hud.style.fontFamily="monospace";
hud.style.opacity="0.85";
hud.innerText="WASD / Arrows = move | Click = lock mouse";
document.body.appendChild(hud);

// ===== SCENE =====
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050510);

const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.style.margin="0";
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const dl=new THREE.DirectionalLight(0xffffff,0.8);
dl.position.set(10,20,10);
scene.add(dl);

// ===== TEXTURES =====
const loader=new THREE.TextureLoader();
const wallTex=loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;

const floorTex=loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;
floorTex.repeat.set(20,20);

// ===== MAZE =====
const maze=[
[1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,0,1],
[1,0,1,1,0,1,0,1],
[1,0,0,0,0,1,0,1],
[1,0,1,0,0,0,0,1],
[1,0,1,0,1,1,0,1],
[1,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1]
];

// ===== BUILD =====
const wallGeo=new THREE.BoxGeometry(SCALE,SCALE,SCALE);
const wallMat=new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<maze.length;z++){
  for(let x=0;x<maze[z].length;x++){
    if(maze[z][x]){
      const m=new THREE.Mesh(wallGeo,wallMat);
      m.position.set(x*SCALE+SCALE/2,SCALE/2,z*SCALE+SCALE/2);
      scene.add(m);
    }
  }
}

// floor
const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(maze[0].length*SCALE,maze.length*SCALE),
  new THREE.MeshStandardMaterial({map:floorTex})
);
floor.rotation.x=-Math.PI/2;
floor.position.set(maze[0].length*SCALE/2,0,maze.length*SCALE/2);
scene.add(floor);

// ===== HELPERS =====
function cellCenter(x,z){
  return {x:x*SCALE+SCALE/2, z:z*SCALE+SCALE/2};
}
function isOpenCell(x,z){
  if(z<0||x<0||z>=maze.length||x>=maze[0].length) return false;
  return maze[z][x]===0;
}

// ===== SPAWN =====
function findFirstOpen(){
  for(let z=0;z<maze.length;z++){
    for(let x=0;x<maze[z].length;x++){
      if(maze[z][x]===0) return {x,z};
    }
  }
  return {x:1,z:1};
}
const spawnCell=findFirstOpen();

function doSpawn(){
  const c=cellCenter(spawnCell.x,spawnCell.z);
  camera.position.set(c.x,1.7,c.z);
}
doSpawn();

// ===== GOAL (on an OPEN CELL) =====
function findGoalCell(){
  // try near bottom-right but ensure empty
  const candidates=[
    {x:maze[0].length-2,z:maze.length-2},
    {x:maze[0].length-3,z:maze.length-2},
    {x:maze[0].length-2,z:maze.length-3},
    {x:maze[0].length-3,z:maze.length-3},
    {x:maze[0].length-4,z:maze.length-2},
    {x:maze[0].length-2,z:maze.length-4},
  ];
  for(const c of candidates){
    if(isOpenCell(c.x,c.z)) return c;
  }
  // fallback: last open cell scanning from end
  for(let z=maze.length-1;z>=0;z--){
    for(let x=maze[0].length-1;x>=0;x--){
      if(isOpenCell(x,z)) return {x,z};
    }
  }
  return {x:1,z:1};
}

const goalCell=findGoalCell();
const goalGeo=new THREE.SphereGeometry(0.6,32,32); // smaller
const goalMat=new THREE.MeshStandardMaterial({color:0x44ccff,emissive:0x2266aa});
const goal=new THREE.Mesh(goalGeo,goalMat);
{
  const g=cellCenter(goalCell.x,goalCell.z);
  goal.position.set(g.x,0.7,g.z);
}
scene.add(goal);

// ===== AUDIO (better than beep; noisy "step") =====
let audioCtx=null;

function ensureAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended") audioCtx.resume();
}

function playStep(){
  ensureAudio();

  const t=audioCtx.currentTime;

  // noise buffer
  const dur=0.06;
  const buffer=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*dur),audioCtx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){
    // soft noise with quick decay feel
    const n=(Math.random()*2-1);
    data[i]=n*Math.exp(-i/(data.length*0.35));
  }
  const src=audioCtx.createBufferSource();
  src.buffer=buffer;

  // bandpass-ish tone for "thump"
  const osc=audioCtx.createOscillator();
  osc.type="sine";
  osc.frequency.setValueAtTime(90,t);
  osc.frequency.exponentialRampToValueAtTime(70,t+dur);

  const noiseGain=audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.0,t);
  noiseGain.gain.linearRampToValueAtTime(0.06,t+0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001,t+dur);

  const toneGain=audioCtx.createGain();
  toneGain.gain.setValueAtTime(0.0,t);
  toneGain.gain.linearRampToValueAtTime(0.04,t+0.005);
  toneGain.gain.exponentialRampToValueAtTime(0.0001,t+dur);

  const filter=audioCtx.createBiquadFilter();
  filter.type="lowpass";
  filter.frequency.setValueAtTime(800,t);

  src.connect(noiseGain);
  osc.connect(toneGain);

  noiseGain.connect(filter);
  toneGain.connect(filter);
  filter.connect(audioCtx.destination);

  src.start(t);
  osc.start(t);
  src.stop(t+dur);
  osc.stop(t+dur);
}

// ===== INPUT =====
const keys={};

addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
});

addEventListener("keyup",e=>{
  keys[e.key.toLowerCase()]=false;
});

// ===== MOUSE =====
let yaw=0;
let pitch=0;

document.body.onclick=()=>{
  ensureAudio();
  document.body.requestPointerLock();
};

addEventListener("mousemove",e=>{
  if(document.pointerLockElement!==document.body) return;

  yaw-=e.movementX*MOUSE;
  pitch-=e.movementY*MOUSE;
  pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));

  camera.rotation.order="YXZ";
  camera.rotation.y=yaw;
  camera.rotation.x=pitch;
});

// ===== COLLISION =====
function wallAt(x,z){
  const gx=Math.floor(x/SCALE);
  const gz=Math.floor(z/SCALE);
  if(gx<0||gz<0||gz>=maze.length||gx>=maze[0].length) return true;
  return maze[gz][gx];
}
function canMove(x,z){
  return !(
    wallAt(x-PLAYER_RADIUS,z-PLAYER_RADIUS)||
    wallAt(x+PLAYER_RADIUS,z-PLAYER_RADIUS)||
    wallAt(x-PLAYER_RADIUS,z+PLAYER_RADIUS)||
    wallAt(x+PLAYER_RADIUS,z+PLAYER_RADIUS)
  );
}

// ===== WIN CHECK =====
function dist2(a,b){
  const dx=a.x-b.x, dz=a.z-b.z;
  return dx*dx+dz*dz;
}

let won=false;

// ===== LOOP =====
const clock=new THREE.Clock();
let stepTimer=0;

function move(){
  const dt=clock.getDelta();

  // inverted W/S as requested
  const f=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  const s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);

  if(f===0 && s===0) return;

  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3(forward.z,0,-forward.x);

  const mv=new THREE.Vector3();
  mv.addScaledVector(forward,f);
  mv.addScaledVector(right,s);
  if(mv.lengthSq()===0) return;
  mv.normalize();

  const nx=camera.position.x + mv.x*SPEED*dt;
  const nz=camera.position.z + mv.z*SPEED*dt;

  if(canMove(nx,nz)){
    camera.position.x=nx;
    camera.position.z=nz;

    stepTimer+=dt;
    if(stepTimer>0.32){
      playStep();
      stepTimer=0;
    }
  }
}

function animateGoal(){
  const t=performance.now()*0.002;
  const scale=1+Math.sin(t)*0.12;
  goal.scale.set(scale,scale,scale);
}

function checkWin(){
  if(won) return;

  const p={x:camera.position.x,z:camera.position.z};
  const g={x:goal.position.x,z:goal.position.z};

  if(dist2(p,g) < 0.9*0.9){
    won=true;

    // stop movement until respawn (avoid stuck keys)
    for(const k in keys) keys[k]=false;

    setTimeout(()=>{
      alert("🎉 Gagné ! Retour au départ.");
      doSpawn();
      won=false;
    }, 10);
  }
}

function loop(){
  requestAnimationFrame(loop);
  if(!won) move();
  animateGoal();
  checkWin();
  renderer.render(scene,camera);
}
loop();

// ===== RESIZE =====
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

