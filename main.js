const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
 camera.aspect = innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,0.5));

const light = new THREE.PointLight(0xffffff,1.4,200);
light.position.set(8,10,8);
scene.add(light);

const loader = new THREE.TextureLoader();

const floorTex = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(20,20);

const wallTex = loader.load("https://threejs.org/examples/textures/brick_bump.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(1,1);

const maze = [
 [1,1,1,1,1,1,1,1],
 [1,0,0,0,0,0,0,1],
 [1,0,1,1,1,1,0,1],
 [1,0,0,0,0,1,0,1],
 [1,1,1,1,0,1,0,1],
 [1,0,0,1,0,0,0,1],
 [1,0,0,0,0,1,0,1],
 [1,1,1,1,1,1,1,1]
];

const SCALE = 4;
const SIZE = maze.length * SCALE;

const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(SIZE,SIZE),
 new THREE.MeshStandardMaterial({
  map: floorTex,
  roughness:1
 })
);
floor.rotation.x = -Math.PI/2;
floor.position.set(SIZE/2-SCALE/2,0,SIZE/2-SCALE/2);
scene.add(floor);

const walls=[];

maze.forEach((row,z)=>{
 row.forEach((cell,x)=>{
  if(cell){
   const geo = new THREE.BoxGeometry(SCALE,3,SCALE);
   const mat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness:0.7
   });
   const wall = new THREE.Mesh(geo,mat);
   wall.position.set(x*SCALE,1.5,z*SCALE);
   scene.add(wall);
   walls.push(wall);

   const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({color:0x000000})
   );
   edges.position.copy(wall.position);
   scene.add(edges);
  }
 });
});

const goal = new THREE.Mesh(
 new THREE.IcosahedronGeometry(1,0),
 new THREE.MeshStandardMaterial({color:0xffcc00, emissive:0xaa7700})
);
goal.position.set(6*SCALE,1,6*SCALE);
scene.add(goal);

camera.position.set(3*SCALE,1.8,3*SCALE);

const keys={};
document.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

let yaw=0,pitch=0;

document.body.addEventListener("mousemove",e=>{
 if(document.pointerLockElement===document.body){
  yaw -= e.movementX*0.002;
  pitch -= e.movementY*0.002;
  pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
 }
});
document.body.addEventListener("click",()=>document.body.requestPointerLock());

function canMove(x,z){
 for(const w of walls){
  if(Math.abs(w.position.x-x)<SCALE*0.5 &&
     Math.abs(w.position.z-z)<SCALE*0.5){
   return false;
  }
 }
 return true;
}

function move(){
 const speed=0.15;
 const forward = new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 const right = new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));

 let nx=camera.position.x;
 let nz=camera.position.z;

 if(keys["w"]){ nx+=forward.x*speed; nz+=forward.z*speed; }
 if(keys["s"]){ nx-=forward.x*speed; nz-=forward.z*speed; }
 if(keys["a"]){ nx-=right.x*speed; nz-=right.z*speed; }
 if(keys["d"]){ nx+=right.x*speed; nz+=right.z*speed; }

 if(canMove(nx,nz)){
  camera.position.x=nx;
  camera.position.z=nz;
 }
}

function checkGoal(){
 const dx=camera.position.x-goal.position.x;
 const dz=camera.position.z-goal.position.z;
 if(Math.sqrt(dx*dx+dz*dz)<1.5){
  alert("Maze cleared");
  camera.position.set(3*SCALE,1.8,3*SCALE);
 }
}

function animate(){
 requestAnimationFrame(animate);

 move();
 checkGoal();

 camera.rotation.order="YXZ";
 camera.rotation.y=yaw;
 camera.rotation.x=pitch;

 renderer.render(scene,camera);
}
animate();

