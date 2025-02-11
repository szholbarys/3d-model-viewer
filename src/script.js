import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import anime from "animejs/lib/anime.es.js";

let scene, camera, renderer, controls, mixer, model;
let animations = [];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("scene-container").appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 4);
  scene.add(light);

  camera.position.z = 5;
  controls = new OrbitControls(camera, renderer.domElement);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
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
        animations.push({ name: clip.name, action: action });
      });
      updateAnimationList();
    } else {
      updateAnimationList();
    }

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, 0, maxDim * 2);
    camera.lookAt(0, 0, 0);
    controls.update();
  });
}

function updateAnimationList() {
  const list = document.getElementById("animation-list");
  list.innerHTML = "";
  if (animations.length === 0) {
    list.innerHTML = "<p>Animation is not available</p>";
  } else {
    animations.forEach((anim, index) => {
      const button = document.createElement("button");
      button.textContent = anim.name;
      button.onclick = () => playAnimation(index);
      list.appendChild(button);
    });
  }
}

function playAnimation(index) {
  const loopCheckbox = document.getElementById("loop-animation");
  animations.forEach((anim, i) => {
    if (i === index) {
      anim.action.setLoop(
        loopCheckbox.checked ? THREE.LoopRepeat : THREE.LoopOnce
      );
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

init();

document.getElementById("file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadModel(file);
});

document.getElementById("recolor-btn").addEventListener("click", recolorModel);
document
  .getElementById("disappear-btn")
  .addEventListener("click", disappearModel);

anime({
  targets: "#ui-container",
  translateY: [-50, 0],
  opacity: [0, 1],
  duration: 1000,
  easing: "easeOutElastic(1, .8)",
});

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("mouseenter", (e) => {
    anime({
      targets: e.target,
      scale: 1.1,
      duration: 300,
    });
  });
  button.addEventListener("mouseleave", (e) => {
    anime({
      targets: e.target,
      scale: 1,
      duration: 300,
    });
  });
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
