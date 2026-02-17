const VERSION="v0.7";

// ===== CONFIG =====
const SCALE=4;
const SPEED=0.08;
const MOUSE_SENS=0.002;

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
scene.background=new THREE.Color(0x000010);

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

// ===== MAZE GRID =====
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

// ===== BUILD =====
const wallGeo=new THREE.BoxGeometry(SCALE,SCALE,SCALE);
const wallMat=new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<maze.length;z++){
 for(let x=0;x<maze[z].length;x++){
  if(maze[z][x]){
   const w=new THREE.Mesh(wallGeo,wallMat);
   w.position.set(x*SCALE,SCALE/2,z*SCALE);
   scene.add(w);
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

// ===== SPAWN SAFE CENTER =====
function findSpawn(){
 for(let z=0;z<maze.length;z++){
  for(let x=0;x<maze[z].length;x++){
   if(maze[z][x]===0){
    return {x:x*SCALE,z:z*SCALE};
   }
  }
}
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

document.addEventListener("mousemove",e=>{
 if(document.pointerLockElement!==document.body) return;
 yaw-=e.movementX*MOUSE_SENS;
 pitch-=e.movementY*MOUSE_SENS;
 pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
 camera.rotation.set(pitch,yaw,0);
});

// ===== COLLISION =====
function canMove(x,z){
 const gx=Math.floor(x/SCALE);
 const gz=Math.floor(z/SCALE);

 if(gx<0||gz<0||gz>=maze.length||gx>=maze[0].length) return false;
 return maze[gz][gx]===0;
}

// ===== SOUND =====
const step=new Audio("https://cdn.jsdelivr.net/gh/jshawl/AudioFX/footstep.wav");
step.volume=0.25;

// ===== MOVE =====
function move(){
 let forward=(keys["w"]||keys["arrowup"]?1:0) - (keys["s"]||keys["arrowdown"]?1:0);
 let strafe=(keys["d"]||keys["arrowright"]?1:0) - (keys["a"]||keys["arrowleft"]?1:0);

 if(!forward && !strafe) return;

 const dir=new THREE.Vector3();
 camera.getWorldDirection(dir);
 dir.y=0;
 dir.normalize();

 const right=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize();

 const moveVec=new THREE.Vector3();
 moveVec.addScaledVector(dir,forward);
 moveVec.addScaledVector(right,strafe);
 moveVec.normalize();

 const nx=camera.position.x+moveVec.x*SPEED*SCALE;
 const nz=camera.position.z+moveVec.z*SPEED*SCALE;

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
function animate(){
 requestAnimationFrame(animate);
 move();
 renderer.render(scene,camera);
}
animate();

// ===== RESIZE =====
addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

