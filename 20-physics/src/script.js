import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import * as Cannon from 'cannon-es';

/**
 * Debug
 */
const gui = new GUI();
const debugObject = {};

debugObject.createSphere = () => {
  const positions = {
    x: (Math.random() - 0.5) * 3,
    y: Math.random() * 3 + 3,
    z: (Math.random() - 0.5) * 3,
  };
  createSphere(Math.random() * 0.5, positions, environmentMapTexture);
};
debugObject.createBox = () => {
  const positions = {
    x: (Math.random() - 0.5) * 3,
    y: Math.random() * 3 + 3,
    z: (Math.random() - 0.5) * 3,
  };
  createBox(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5, positions);
};
gui.add(debugObject, 'createBox');
gui.add(debugObject, 'createSphere');

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  '/textures/environmentMaps/0/px.png',
  '/textures/environmentMaps/0/nx.png',
  '/textures/environmentMaps/0/py.png',
  '/textures/environmentMaps/0/ny.png',
  '/textures/environmentMaps/0/pz.png',
  '/textures/environmentMaps/0/nz.png',
]);

//Sound
const hitSound = new Audio('/sounds/hit.mp3');
const playHitSound = (collision) => {
  const collisionStrength = collision.contact.getImpactVelocityAlongNormal();
  if (collisionStrength > 0.75) {
    hitSound.currentTime = 0; // rewind
    hitSound.play();
  }
};

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: '#777777',
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

// Cannon physics
const world = new Cannon.World();
world.broadphase = new Cannon.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

const concreteMaterial = new Cannon.Material('concrete');
const plasticMaterial = new Cannon.Material('plastic');

const contactMaterial = new Cannon.ContactMaterial(concreteMaterial, plasticMaterial, {
  friction: 0.1,
  restitution: 0.6,
});

world.addContactMaterial(contactMaterial);

const floorShape = new Cannon.Plane();
const floorBody = new Cannon.Body({
  mass: 0,
  shape: floorShape,
  position: new Cannon.Vec3(0, 0, 0),
  material: concreteMaterial,
});
floorBody.quaternion.setFromAxisAngle(new Cannon.Vec3(1, 0, 0), -Math.PI * 0.5);
world.addBody(floorBody);

const objectToUpdate = [];

const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
  envMapIntensity: 0.5,
});

const createSphere = (radius, position) => {
  // Mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(radius, radius, radius);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js
  const shape = new Cannon.Sphere(0.5);
  const body = new Cannon.Body({
    mass: 1,
    position: new Cannon.Vec3(0, 3, 0),
    shape: shape,
    material: plasticMaterial,
  });
  body.position.copy(position);
  // sphereBody.applyLocalForce(new Cannon.Vec3(150, 0, 0), new Cannon.Vec3(0, 0, 0));
  world.addBody(body);
  body.addEventListener('collide', playHitSound);
  objectToUpdate.push({ mesh, body });
};

// Boxes

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
  envMapIntensity: 0.5,
});

const createBox = (width, height, depth, position) => {
  // Mesh
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js
  const shape = new Cannon.Box(new Cannon.Vec3(width * 0.5, height * 0.5, depth * 0.5));
  const body = new Cannon.Body({
    mass: 1,
    position: new Cannon.Vec3(position),
    shape: shape,
    material: plasticMaterial,
  });
  body.position.copy(position);
  // sphereBody.applyLocalForce(new Cannon.Vec3(150, 0, 0), new Cannon.Vec3(0, 0, 0));
  world.addBody(body);
  body.addEventListener('collide', playHitSound);
  objectToUpdate.push({ mesh, body });
};
createBox(1, 1, 1, { x: 0, y: 3, z: 0 });

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(-3, 3, 3);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update physics world
  // sphereBody.applyForce(new Cannon.Vec3(-0.5, 0, 0), sphereBody.position);

  world.step(1 / 60, deltaTime, 3);

  objectToUpdate.forEach((object) => {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  });

  // sphere.position.copy(sphereBody.position);
  floor.position.copy(floorBody.position);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
