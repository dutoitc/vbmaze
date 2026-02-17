const VERSION="v0.8";

const SCALE=4;
const SPEED=3.2;
const MOUSE=0.002;
const PLAYER_RADIUS=0.6;

// ===== UI VERSION =====
const v=document.createElement("div");
v.style.position="fixed";
v.style.top="5px";
v.style.right="10px";
v.style.color="white";
v.style.fontFamily="monospace";
v.innerText=VERSION;
document.body.appendChild(v);

// ===== SCENE =====
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050510);

const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff,0.45));
const dl=new THREE.DirectionalLight(0xffffff,0.6);
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
[1,1,1,1,1,1,1,1,1,1],
[1,0,0,0,1,0,0,0,0,1],
[1,0,1,0,1,0,1,1,0,1],
[1,0,1,0,0,0,0,1,0,1],
[1,0,1,1,1,1,0,1,0,1],
[1,0,0,0,0,1,0,1,0,1],
[1,1,1,1,0,1,0,1,0,1],
[1,0,0,1,0,0,0,1,0,1],
[1,0,0,0,0,1,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1]
];

// ===== BUILD MAZE =====
const wallGeo=new THREE.BoxGeometry(SCALE,SCALE,SCALE);
const wallMat=new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<maze.length;z++){
for(let x=0;x<maze[z].length;x++){
 if(maze[z][x]){
  const m=new THREE.Mesh(wallGeo,wallMat);
  m.position.set(x*SCALE,SCALE/2,z*SCALE);
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
 maze[0].length*SCALE/2 - SCALE/2,
 0,
 maze.length*SCALE/2 - SCALE/2
);
scene.add(floor);

// ===== SPAWN CENTER SAFE =====
function findSpawn(){
 for(let z=0;z<maze.length;z++)
 for(let x=0;x<maze[z].length;x++)
 if(maze[z][x]===0)
 return {x:x*SCALE,z:z*SCALE};
}
const spawn=findSpawn();
camera.position.set(spawn.x,1.7,spawn.z);

// ===== INPUT =====
const keys={};
addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

// ===== MOUSE LOOK =====
let yaw=0;
let pitch=0;

document.body.onclick=()=>document.body.requestPointerLock();

addEventListener("mousemove",e=>{
 if(document.pointerLockElement!==document.body) return;

 yaw -= e.movementX*MOUSE;
 pitch -= e.movementY*MOUSE;

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
 return maze[gz][gx]===1;
}

function canMove(nx,nz){
 const r=PLAYER_RADIUS;

 return !(
 wallAt(nx+r,nz+r)||
 wallAt(nx-r,nz+r)||
 wallAt(nx+r,nz-r)||
 wallAt(nx-r,nz-r)
 );
}

// ===== SOUND =====
const step=new Audio("https://cdn.jsdelivr.net/gh/jshawl/AudioFX/footstep.wav");
step.volume=0.2;

// ===== MOVE =====
const clock=new THREE.Clock();

function move(){
 const dt=clock.getDelta();

 let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
 let s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 if(!f && !s) return;

 const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 const right=new THREE.Vector3(forward.z,0,-forward.x);

 const move=new THREE.Vector3();
 move.addScaledVector(forward,f);
 move.addScaledVector(right,s);
 move.normalize();

 const nx=camera.position.x + move.x*SPEED*dt;
 const nz=camera.position.z + move.z*SPEED*dt;

 if(canMove(nx,nz)){
  camera.position.x=nx;
  camera.position.z=nz;

  if(step.paused){
   step.currentTime=0;
   step.play();
  }
 }
}

// ===== LOOP =====
function loop(){
 requestAnimationFrame(loop);
 move();
 renderer.render(scene,camera);
}
loop();

// ===== RESIZE =====
addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

