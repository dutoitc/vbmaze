// ===== VERSION =====
const VERSION = "v0.6";

// ===== CONFIG =====
const SCALE = 4;
const SPEED = 0.06;

// ===== DEBUG UI =====
const v=document.createElement("div");
v.style.position="fixed";
v.style.top="5px";
v.style.right="10px";
v.style.color="white";
v.style.fontFamily="monospace";
v.style.fontSize="14px";
v.innerText=VERSION;
document.body.appendChild(v);

// ===== SCENE =====
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x000010);

const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
camera.position.set(2,1.6,2);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff,0.4));
const dl=new THREE.DirectionalLight(0xffffff,0.6);
dl.position.set(10,20,10);
scene.add(dl);

// ===== TEXTURES =====
const loader=new THREE.TextureLoader();

const wallTex=loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;
wallTex.repeat.set(1,1);

const floorTex=loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;
floorTex.repeat.set(10,10);

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

// ===== BUILD MAZE =====
const wallGeo=new THREE.BoxGeometry(SCALE,SCALE,SCALE);
const wallMat=new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<maze.length;z++){
 for(let x=0;x<maze[z].length;x++){
  if(maze[z][x]){
   const w=new THREE.Mesh(wallGeo,wallMat);
   w.position.set(x*SCALE,2,z*SCALE);
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
scene.add(floor);

// ===== CONTROLS =====
const keys={};
document.addEventListener("keydown",e=>{
 keys[e.key.toLowerCase()]=true;
 console.log("KEYDOWN",e.key);
});
document.addEventListener("keyup",e=>{
 keys[e.key.toLowerCase()]=false;
 console.log("KEYUP",e.key);
});

// ===== COLLISION GRID =====
function canMove(x,z){
 const gx=Math.floor(x/SCALE);
 const gz=Math.floor(z/SCALE);

 if(gx<0||gz<0||gz>=maze.length||gx>=maze[0].length) return false;

 return maze[gz][gx]===0;
}

// ===== SOUND =====
const stepSound=new Audio("https://cdn.jsdelivr.net/gh/jshawl/AudioFX/footstep.wav");
stepSound.volume=0.25;

// ===== MOVE =====
function move(){
 let dx=0,dz=0;

 if(keys["w"]||keys["arrowup"]) dz-=1;
 if(keys["s"]||keys["arrowdown"]) dz+=1;
 if(keys["a"]||keys["arrowleft"]) dx-=1;
 if(keys["d"]||keys["arrowright"]) dx+=1;

 if(dx===0 && dz===0) return;

 console.log("MOVE VECTOR",dx,dz);

 const len=Math.hypot(dx,dz);
 dx/=len;
 dz/=len;

 const nx=camera.position.x+dx*SPEED*SCALE;
 const nz=camera.position.z+dz*SPEED*SCALE;

 console.log("TRY",nx,nz);

 if(canMove(nx,nz)){
  camera.position.x=nx;
  camera.position.z=nz;

  if(stepSound.paused){
   stepSound.currentTime=0;
   stepSound.play();
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

