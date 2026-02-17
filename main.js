const VERSION = "v0.7-debug";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1217);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const label=document.createElement("div");
label.style.position="fixed";
label.style.bottom="10px";
label.style.right="10px";
label.style.color="#fff";
label.style.fontFamily="monospace";
label.textContent=VERSION;
document.body.appendChild(label);

window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,0.7));
const light=new THREE.PointLight(0xffffff,1.4,500);
light.position.set(40,60,40);
scene.add(light);

const loader=new THREE.TextureLoader();

const floorTex=loader.load("assets/floor.jpg");
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;
floorTex.repeat.set(40,40);

const wallTex=loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;

const maze=[
 [1,1,1,1,1,1,1,1],
 [1,0,0,0,0,0,0,1],
 [1,0,1,1,1,1,0,1],
 [1,0,0,0,0,1,0,1],
 [1,1,1,1,0,1,0,1],
 [1,0,0,1,0,0,0,1],
 [1,0,0,0,0,1,0,1],
 [1,1,1,1,1,1,1,1]
];

const SCALE=6;
const W=maze[0].length;
const H=maze.length;

const floor=new THREE.Mesh(
 new THREE.PlaneGeometry(W*SCALE,H*SCALE),
 new THREE.MeshStandardMaterial({map:floorTex})
);
floor.rotation.x=-Math.PI/2;
floor.position.set((W-1)*SCALE/2,0,(H-1)*SCALE/2);
scene.add(floor);

const walls=[];
const wallMat=new THREE.MeshStandardMaterial({map:wallTex});

for(let z=0;z<H;z++){
 for(let x=0;x<W;x++){
  if(maze[z][x]){
   const wall=new THREE.Mesh(
    new THREE.BoxGeometry(SCALE,4,SCALE),
    wallMat
   );
   wall.position.set(x*SCALE,2,z*SCALE);
   scene.add(wall);
   walls.push(wall);
  }
 }
}

camera.position.set(1.5*SCALE,2,1.5*SCALE);

const pressed=new Set();

window.addEventListener("keydown",e=>{
 pressed.add(e.code);
 console.log("KEYDOWN",e.code);
});

window.addEventListener("keyup",e=>{
 pressed.delete(e.code);
 console.log("KEYUP",e.code);
});

window.addEventListener("blur",()=>pressed.clear());

let yaw=0,pitch=0;

document.body.addEventListener("mousemove",e=>{
 if(document.pointerLockElement===document.body){
  yaw-=e.movementX*0.002;
  pitch-=e.movementY*0.002;
  pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
 }
});

document.body.addEventListener("click",()=>document.body.requestPointerLock());

const PLAYER_R=0.5;

function canMove(x,z){
 for(const w of walls){
  const dx=Math.abs(x-w.position.x);
  const dz=Math.abs(z-w.position.z);
  if(dx<SCALE/2+PLAYER_R && dz<SCALE/2+PLAYER_R){
   return false;
  }
 }
 return true;
}

function move(){
 let vx=0,vz=0;

 if(pressed.has("KeyW")||pressed.has("ArrowUp")) vz-=1;
 if(pressed.has("KeyS")||pressed.has("ArrowDown")) vz+=1;
 if(pressed.has("KeyA")||pressed.has("ArrowLeft")) vx-=1;
 if(pressed.has("KeyD")||pressed.has("ArrowRight")) vx+=1;

 if(vx||vz){
  console.log("MOVE VECTOR",vx,vz);

  const len=Math.hypot(vx,vz);
  vx/=len;
  vz/=len;

  const sin=Math.sin(yaw);
  const cos=Math.cos(yaw);

  const dx=vx*cos - vz*sin;
  const dz=vz*cos + vx*sin;

  const speed=0.2;

  const nx=camera.position.x+dx*speed;
  const nz=camera.position.z+dz*speed;

  console.log("TRY MOVE",nx,nz);

  if(canMove(nx,camera.position.z)) camera.position.x=nx;
  if(canMove(camera.position.x,nz)) camera.position.z=nz;
 }
}

function animate(){
 requestAnimationFrame(animate);

 move();

 camera.rotation.order="YXZ";
 camera.rotation.y=yaw;
 camera.rotation.x=pitch;

 renderer.render(scene,camera);
}
animate();

