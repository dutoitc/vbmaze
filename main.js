const VERSION="v0.10-debug";

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
      m.position.set(x*SCALE + SCALE/2, SCALE/2, z*SCALE + SCALE/2);
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

// ===== SPAWN (FIXED: CENTER OF TILE) =====
function spawn(){
  for(let z=0;z<maze.length;z++){
    for(let x=0;x<maze[z].length;x++){
      if(maze[z][x]===0){
        return {x:x*SCALE + SCALE/2, z:z*SCALE + SCALE/2};
      }
    }
  }
  return {x:SCALE/2, z:SCALE/2};
}

const sp=spawn();
camera.position.set(sp.x,1.7,sp.z);

// ===== INPUT =====
const keys={};

addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  console.log("DOWN",e.key);
});

addEventListener("keyup",e=>{
  keys[e.key.toLowerCase()]=false;
  console.log("UP",e.key);
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

function move(){
  const dt=clock.getDelta();

  const f=(keys.w||keys.z||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  const s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.q||keys.arrowleft?1:0);

  if(f===0 && s===0) return;

  console.log("INPUT",f,s);

  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3(forward.z,0,-forward.x);

  const mv=new THREE.Vector3();
  mv.addScaledVector(forward,f);
  mv.addScaledVector(right,s);

  if(mv.lengthSq()===0){
    console.log("ZERO VECTOR");
    return;
  }

  mv.normalize();

  const nx=camera.position.x + mv.x*SPEED*dt;
  const nz=camera.position.z + mv.z*SPEED*dt;

  console.log("TRY",nx,nz);

  if(canMove(nx,nz)){
    camera.position.x=nx;
    camera.position.z=nz;
    console.log("MOVE OK");
  } else {
    console.log("BLOCKED");
  }
}

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

