import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";

const Maze = {

  SCALE: 4,

  grid: [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1],
    [1,0,0,0,0,1,0,1],
    [1,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1]
  ],

  width: 0,
  height: 0,

  wallMeshes: [],
  floorMesh: null,

  init(scene) {

    this.scene = scene;

    this.width = this.grid[0].length * this.SCALE;
    this.height = this.grid.length * this.SCALE;

    const texLoader = new THREE.TextureLoader();

    const wallTex = texLoader.load("../assets/wood.jpg");
    const floorTex = texLoader.load("../assets/floor.jpg");

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x777777,
      map: wallTex
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      map: floorTex,
      roughness: 1
    });

    const wallGeo = new THREE.BoxGeometry(this.SCALE, this.SCALE, this.SCALE);

    this.wallMeshes.length = 0;

    for (let z = 0; z < this.grid.length; z++) {
      for (let x = 0; x < this.grid[z].length; x++) {

        if (this.grid[z][x] !== 1) continue;

        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(
          x * this.SCALE + this.SCALE / 2,
          this.SCALE / 2,
          z * this.SCALE + this.SCALE / 2
        );

        this.wallMeshes.push(wall);
        scene.add(wall);
      }
    }

    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      floorMat
    );

    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(this.width / 2, 0, this.height / 2);
    scene.add(this.floorMesh);
  },

  isWall(cellX, cellZ) {

    if (cellZ < 0 || cellX < 0) return true;
    if (cellZ >= this.grid.length) return true;
    if (cellX >= this.grid[0].length) return true;

    return this.grid[cellZ][cellX] === 1;
  },

  clampToBounds(pos, radius) {
    pos.x = Math.max(radius, Math.min(this.width - radius, pos.x));
    pos.z = Math.max(radius, Math.min(this.height - radius, pos.z));
  },

  resolveCollision(pos, radius) {

    this.clampToBounds(pos, radius);

    const cellX = Math.floor(pos.x / this.SCALE);
    const cellZ = Math.floor(pos.z / this.SCALE);

    for (let z = cellZ - 1; z <= cellZ + 1; z++) {
      for (let x = cellX - 1; x <= cellX + 1; x++) {

        if (!this.isWall(x, z)) continue;

        const minX = x * this.SCALE;
        const maxX = minX + this.SCALE;
        const minZ = z * this.SCALE;
        const maxZ = minZ + this.SCALE;

        const closestX = Math.max(minX, Math.min(pos.x, maxX));
        const closestZ = Math.max(minZ, Math.min(pos.z, maxZ));

        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;

        const distSq = dx * dx + dz * dz;
        if (distSq >= radius * radius) continue;

        const dist = Math.sqrt(distSq);
        const push = radius - dist;

        if (dist > 0.0001) {
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        }
      }
    }
  },

  getCellCenter(cellX, cellZ, y = 0) {
    return new THREE.Vector3(
      cellX * this.SCALE + this.SCALE / 2,
      y,
      cellZ * this.SCALE + this.SCALE / 2
    );
  },

  getRandomSpawnPosition(options = {}) {

    const candidates = [];

    for (let z = 0; z < this.grid.length; z++) {
      for (let x = 0; x < this.grid[z].length; x++) {
        if (!this.isWall(x, z)) {
          candidates.push({ x, z });
        }
      }
    }

    const c = candidates[(Math.random() * candidates.length) | 0];
    return this.getCellCenter(c.x, c.z, 1.2);
  }

};

export { Maze };
