const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
 camera.aspect = innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,7);
scene.add(light);

const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(50,50),
 new THREE.MeshPhongMaterial({color:0x222222})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

const wallMat = new THREE.MeshPhongMaterial({color:0x00ffcc});

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

maze.forEach((row,z)=>{
 row.forEach((cell,x)=>{
  if(cell){
   const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    wallMat
   );
   wall.position.set(x,1,z);
   scene.add(wall);
  }
 });
});

const keys = {};
document.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

let yaw=0, pitch=0;
document.body.addEventListener("mousemove",e=>{
 if(document.pointerLockElement===document.body){
  yaw -= e.movementX*0.002;
  pitch -= e.movementY*0.002;
  pitch = Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
 }
});

document.body.addEventListener("click",()=>document.body.requestPointerLock());

function move(){
 const speed=0.05;
 const dir = new THREE.Vector3();

 if(keys["w"]) dir.z-=1;
 if(keys["s"]) dir.z+=1;
 if(keys["a"]) dir.x-=1;
 if(keys["d"]) dir.x+=1;

 dir.normalize();
 dir.applyAxisAngle(new THREE.Vector3(0,1,0), yaw);

 camera.position.x += dir.x*speed;
 camera.position.z += dir.z*speed;
}

function animate(){
 requestAnimationFrame(animate);

 move();

 camera.rotation.order="YXZ";
 camera.rotation.y = yaw;
 camera.rotation.x = pitch;

 renderer.render(scene,camera);
}
animate();



