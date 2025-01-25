import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
const gui = new GUI();

// Scene where everything will be rendered
const scene = new THREE.Scene();

// Mesh is a combination of geometry and material
const geometry = new THREE.SphereGeometry(1);
const material = new THREE.MeshBasicMaterial({ color: 'red' });
const mesh = new THREE.Mesh(geometry, material);

mesh.position.set(0, 0, 0);
mesh.scale.set(1, 1, 1);

gui.add(mesh.position, 'y').min(-2).max(2).step(0.01).name('Mesh Position Y');
gui.add(mesh, 'visible');
gui.add(material, 'wireframe');
gui.addColor(material, 'color').name('Material Color');

scene.add(mesh);

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight);
camera.position.set(0, 0, 10);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('.webgl'),
  antialias: true, //
});
renderer.setSize(window.innerWidth, window.innerHeight);
// Pixel Ratio // Optimization for high pixel density displays // So mesh doesn't have jagged edges
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Handle Windows Resize
window.addEventListener('resize', () => {
  // Update sizes
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const tick = () => {
  // Update controls
  controls.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
