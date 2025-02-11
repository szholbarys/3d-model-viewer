import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, controls, model;
let mixer,
  animations = [];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("scene-container").appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 4);
  scene.add(light);

  controls = new OrbitControls(camera, renderer.domElement);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function loadModel(file) {
  const loader = new GLTFLoader();
  const url = URL.createObjectURL(file);

  loader.load(url, (gltf) => {
    if (model) {
      scene.remove(model);
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(model);
      }
    }

    animations = [];
    model = gltf.scene;
    scene.add(model);

    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        animations.push({ name: clip.name, action });
      });
      updateAnimationList();
    }
  });
}

function updateAnimationList() {
  const list = document.getElementById("animation-list");
  list.innerHTML = animations.length ? "" : "<p>Animation is not available</p>";

  animations.forEach((anim, index) => {
    const button = document.createElement("button");
    button.textContent = anim.name;
    button.onclick = () => playAnimation(index);
    list.appendChild(button);
  });
}

function playAnimation(index) {
  animations.forEach((anim, i) => {
    if (i === index) {
      anim.action.reset().play();
    } else {
      anim.action.stop();
    }
  });
}

function recolorModel() {
  if (model) {
    const newColor = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
    model.traverse((child) => {
      if (child.isMesh) {
        child.material.color = newColor;
      }
    });
  }
}

document.getElementById("recolor-btn").addEventListener("click", recolorModel);

function disappearModel() {
  if (model) {
    let visibleParts = [];
    model.traverse((child) => {
      if (child.isMesh) {
        visibleParts.push(child);
      }
    });

    const disappearInterval = setInterval(() => {
      if (visibleParts.length > 0) {
        const randomIndex = Math.floor(Math.random() * visibleParts.length);
        visibleParts[randomIndex].visible = false;
        visibleParts.splice(randomIndex, 1);
      } else {
        clearInterval(disappearInterval);
      }
    }, 100);
  }
}

document
  .getElementById("disappear-btn")
  .addEventListener("click", disappearModel);

animate = function () {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
  controls.update();
  renderer.render(scene, camera);
};

init();
