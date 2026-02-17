const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
 camera.aspect = innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,1.2));

const light1 = new THREE.PointLight(0xffffff,1,50);
const light2 = new THREE.PointLight(0xffffff,1,50);
scene.add(light1);
scene.add(light2);

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

const SIZE = maze.length;
const OFFSET = SIZE/2;

const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(SIZE,SIZE),
 new THREE.MeshBasicMaterial({color:0x444444})
);
floor.rotation.x = -Math.PI/2;
floor.position.set(OFFSET-0.5,0,OFFSET-0.5);
scene.add(floor);

const walls=[];

maze.forEach((row,z)=>{
 row.forEach((cell,x)=>{
  if(cell){
   const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshLambertMaterial({color:0x00ffaa})
   );
   wall.position.set(x,1,z);
   scene.add(wall);
   walls.push(wall);
  }
 });
});

const goal = new THREE.Mesh(
 new THREE.BoxGeometry(0.6,0.6,0.6),
 new THREE.MeshBasicMaterial({color:0xffff00})
);
goal.position.set(6,0.3,6);
scene.add(goal);

camera.position.set(3.5,1.6,3.5);

light1.position.set(0,5,0);
light2.position.set(SIZE,5,SIZE);

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
  if(Math.abs(w.position.x-x)<0.55 && Math.abs(w.position.z-z)<0.55){
   return false;
  }
 }
 return true;
}

function checkGoal(){
 const dx=camera.position.x-goal.position.x;
 const dz=camera.position.z-goal.position.z;
 if(Math.sqrt(dx*dx+dz*dz)<0.6){
  alert("WIN");
  camera.position.set(3.5,1.6,3.5);
 }
}

function move(){
 const speed=0.06;
 const dir=new THREE.Vector3();

 if(keys["w"]) dir.z-=1;
 if(keys["s"]) dir.z+=1;
 if(keys["a"]) dir.x-=1;
 if(keys["d"]) dir.x+=1;

 dir.normalize();
 dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);

 const nx=camera.position.x+dir.x*speed;
 const nz=camera.position.z+dir.z*speed;

 if(canMove(nx,nz)){
  camera.position.x=nx;
  camera.position.z=nz;
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


