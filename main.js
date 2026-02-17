const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1217);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
 camera.aspect = innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,0.6));
const light = new THREE.PointLight(0xffffff,1.3,500);
light.position.set(40,60,40);
scene.add(light);

// textures
const loader = new THREE.TextureLoader();
const floorTex = loader.load("assets/floor.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(40,40);

const wallTex = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;

// maze
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

const SCALE=4;
const WALL_H=3;
const W=maze[0].length;
const H=maze.length;

// floor
const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(W*SCALE,H*SCALE),
 new THREE.MeshStandardMaterial({map:floorTex})
);
floor.rotation.x=-Math.PI/2;
floor.position.set((W-1)*SCALE/2,0,(H-1)*SCALE/2);
scene.add(floor);

// walls
const walls=[];
const wallMat = new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<H;z++){
 for(let x=0;x<W;x++){
  if(maze[z][x]){
   const wall=new THREE.Mesh(
    new THREE.BoxGeometry(SCALE,WALL_H,SCALE),
    wallMat
   );
   wall.position.set(x*SCALE,WALL_H/2,z*SCALE);
   scene.add(wall);
   walls.push(wall);
  }
 }
}

// goal
const goal=new THREE.Mesh(
 new THREE.SphereGeometry(1.2,32,32),
 new THREE.MeshStandardMaterial({color:0xffcc33,emissive:0x663300})
);
goal.position.set((W-2)*SCALE,1.2,(H-2)*SCALE);
scene.add(goal);

// spawn
camera.position.set(1.5*SCALE,1.8,1.5*SCALE);

// input
const keys={};
document.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
function clearKeys(){for(const k in keys) delete keys[k];}

// mouse
let yaw=0,pitch=0;
document.body.addEventListener("mousemove",e=>{
 if(document.pointerLockElement===document.body){
  yaw-=e.movementX*0.002;
  pitch-=e.movementY*0.002;
  pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
 }
});
document.body.addEventListener("click",()=>document.body.requestPointerLock());

// collision
const PLAYER_R=0.8;
function canMove(x,z){
 for(const w of walls){
  const dx=Math.abs(w.position.x-x);
  const dz=Math.abs(w.position.z-z);
  if(dx<(SCALE/2+PLAYER_R)&&dz<(SCALE/2+PLAYER_R)) return false;
 }
 return true;
}

// fallback procedural step sound
let audioCtx=null;
function stepSound(){
 if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 const o=audioCtx.createOscillator();
 const g=audioCtx.createGain();
 o.type="triangle";
 o.frequency.value=180+Math.random()*40;
 g.gain.value=0.04;
 o.connect(g);
 g.connect(audioCtx.destination);
 o.start();
 o.stop(audioCtx.currentTime+0.04);
}

let lastStep=0;

// movement FIXED
function move(t){
 const speed=0.18;

 let vx=0,vz=0;

 if(keys["w"]) vz-=1;
 if(keys["s"]) vz+=1;
 if(keys["a"]) vx-=1;
 if(keys["d"]) vx+=1;

 if(vx!==0||vz!==0){
  const len=Math.hypot(vx,vz);
  vx/=len;
  vz/=len;

  const sin=Math.sin(yaw);
  const cos=Math.cos(yaw);

  const dx = vx*cos - vz*sin;
  const dz = vz*cos + vx*sin;

  const nx=camera.position.x+dx*speed;
  const nz=camera.position.z+dz*speed;

  if(canMove(nx,camera.position.z)) camera.position.x=nx;
  if(canMove(camera.position.x,nz)) camera.position.z=nz;

  if(t-lastStep>250){
   stepSound();
   lastStep=t;
  }
 }
}

// goal
function checkGoal(){
 const dx=camera.position.x-goal.position.x;
 const dz=camera.position.z-goal.position.z;
 if(Math.sqrt(dx*dx+dz*dz)<2){
  alert("Maze cleared");
  clearKeys();
  camera.position.set(1.5*SCALE,1.8,1.5*SCALE);
 }
}

function animate(t){
 requestAnimationFrame(animate);

 const s=1+Math.sin(t*0.004)*0.08;
 goal.scale.set(s,s,s);

 move(t);
 checkGoal();

 camera.rotation.order="YXZ";
 camera.rotation.y=yaw;
 camera.rotation.x=pitch;

 renderer.render(scene,camera);
}
requestAnimationFrame(animate);

