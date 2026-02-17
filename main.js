const VERSION="v0.11";

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
const dl=new THREE.DirectionalLight(0xffffff,0.7);
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
floor.position.set(
maze[0].length*SCALE/2,
0,
maze.length*SCALE/2
);
scene.add(floor);

// ===== SPAWN =====
function spawn(){
for(let z=0;z<maze.length;z++){
for(let x=0;x<maze[z].length;x++){
if(maze[z][x]===0){
return {x:x*SCALE+SCALE/2,z:z*SCALE+SCALE/2};
}
}
}
return {x:SCALE/2,z:SCALE/2};
}
const sp=spawn();
camera.position.set(sp.x,1.7,sp.z);

// ===== GOAL SPHERE =====
const goalGeo=new THREE.SphereGeometry(1.2,32,32);
const goalMat=new THREE.MeshStandardMaterial({color:0x44ccff,emissive:0x2266aa});
const goal=new THREE.Mesh(goalGeo,goalMat);
goal.position.set((maze[0].length-2)*SCALE,SCALE/2,(maze.length-2)*SCALE);
scene.add(goal);

// ===== AUDIO =====
let audioCtx=null;
function playStep(){
if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
const osc=audioCtx.createOscillator();
const gain=audioCtx.createGain();
osc.type="square";
osc.frequency.value=120;
gain.gain.value=0.03;
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start();
osc.stop(audioCtx.currentTime+0.05);
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

document.body.onclick=()=>document.body.requestPointerLock();

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

// ===== LOOP =====
const clock=new THREE.Clock();
let stepTimer=0;

function move(){
const dt=clock.getDelta();

const f=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0); // inversé
const s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);

if(f===0 && s===0) return;

const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
const right=new THREE.Vector3(forward.z,0,-forward.x);

const mv=new THREE.Vector3();
mv.addScaledVector(forward,f);
mv.addScaledVector(right,s);
mv.normalize();

const nx=camera.position.x + mv.x*SPEED*dt;
const nz=camera.position.z + mv.z*SPEED*dt;

if(canMove(nx,nz)){
camera.position.x=nx;
camera.position.z=nz;

stepTimer+=dt;
if(stepTimer>0.35){
playStep();
stepTimer=0;
}
}
}

function animateGoal(){
const t=performance.now()*0.002;
const scale=1+Math.sin(t)*0.2;
goal.scale.set(scale,scale,scale);
}

function loop(){
requestAnimationFrame(loop);
move();
animateGoal();
renderer.render(scene,camera);
}
loop();

// ===== RESIZE =====
addEventListener("resize",()=>{
camera.aspect=innerWidth/innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(innerWidth,innerHeight);
});

