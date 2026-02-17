const VERSION = "v0.5";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1217);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const label = document.createElement("div");
label.style.position="fixed";
label.style.bottom="10px";
label.style.right="10px";
label.style.color="#fff";
label.style.fontFamily="monospace";
label.textContent=VERSION;
document.body.appendChild(label);

const hint = document.createElement("div");
hint.style.position="fixed";
hint.style.top="10px";
hint.style.left="10px";
hint.style.color="#fff";
hint.style.fontFamily="Arial";
hint.textContent="WASD (or ZQSD) = move | Mouse = look | Click to lock";
document.body.appendChild(hint);

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

// keyboard (use e.code, works across layouts)
const pressed = new Set();
function clearPressed(){ pressed.clear(); }

window.addEventListener("keydown",(e)=>{
 pressed.add(e.code);
 // avoid page scroll etc.
 if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
},{passive:false});

window.addEventListener("keyup",(e)=>pressed.delete(e.code));
window.addEventListener("blur",()=>clearPressed());

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

// step sound (procedural)
let audioCtx=null;
function stepSound(){
 if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 const o=audioCtx.createOscillator();
 const g=audioCtx.createGain();
 o.type="triangle";
 o.frequency.value=155+Math.random()*35;
 g.gain.value=0.05;
 o.connect(g);
 g.connect(audioCtx.destination);
 o.start();
 o.stop(audioCtx.currentTime+0.04);
}
let lastStep=0;

// movement
function move(t){
 let vx=0,vz=0;

 const forward = pressed.has("KeyW") || pressed.has("KeyZ") || pressed.has("ArrowUp");
 const back    = pressed.has("KeyS") || pressed.has("ArrowDown");
 const left    = pressed.has("KeyA") || pressed.has("KeyQ") || pressed.has("ArrowLeft");
 const right   = pressed.has("KeyD") || pressed.has("ArrowRight");

 if(forward) vz-=1;
 if(back)    vz+=1;
 if(left)    vx-=1;
 if(right)   vx+=1;

 if(vx||vz){
  const len=Math.hypot(vx,vz);
  vx/=len; vz/=len;

  const sin=Math.sin(yaw);
  const cos=Math.cos(yaw);

  const dx = vx*cos - vz*sin;
  const dz = vz*cos + vx*sin;

  const speed=0.22;

  const nx=camera.position.x+dx*speed;
  const nz=camera.position.z+dz*speed;

  if(canMove(nx,camera.position.z)) camera.position.x=nx;
  if(canMove(camera.position.x,nz)) camera.position.z=nz;

  if(t-lastStep>240){
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
  clearPressed();
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

