<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tree, TreePreset, TreeOptions } from '@dgreenheck/ez-tree';
import { applyTreeTextures, loadPresetWithTextures } from '../utilities/textures.js';
import { Environment } from '../utilities/environment.js';

const props = defineProps({
  options: { type: Object, default: () => ({}) },
  preset: { type: String, default: null },
  autoGenerate: { type: Boolean, default: true },
  grassCount: { type: Number, default: 2000 },
  skybox: { type: [Boolean, Object], default: true },
  showGround: { type: Boolean, default: true },
  shadows: { type: Boolean, default: true },
  cameraTarget: { type: Object, default: () => ({ x: 0, y: 25, z: 0 }) },
  cameraPosition: { type: Object, default: () => ({ x: 40, y: 20, z: 40 }) },
  showControls: { type: Boolean, default: true },
  controlsPosition: { type: String, default: 'top-right' },
  leafColor: { type: [Number, String], default: null },
  leafCount: { type: Number, default: null },
});

const emit = defineEmits(['generate', 'error']);

const canvasContainer = ref(null);
let renderer, scene, camera, controls, tree, environment, clock, rafId;
let isReady = false;

function normalizeColor(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof THREE.Color) return value.getHex();
  if (typeof value === 'string') {
    const c = new THREE.Color(value);
    return c.getHex();
  }
  return Number(value);
}

function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(props.skybox === false ? 0x94b9f8 : 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = props.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 2;
  canvasContainer.value.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x94b9f8, 0.0015);

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.set(props.cameraPosition.x, props.cameraPosition.y, props.cameraPosition.z);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minPolarAngle = Math.PI / 2 - 0.2;
  controls.maxPolarAngle = Math.PI / 2 + 0.13;
  controls.minDistance = 10;
  controls.maxDistance = 150;
  controls.target.set(props.cameraTarget.x, props.cameraTarget.y, props.cameraTarget.z);

  environment = new Environment({
    grassCount: props.grassCount,
    skybox: props.skybox,
    showGround: props.showGround,
    shadows: props.shadows,
  });
  scene.add(environment);

  tree = new Tree();
  scene.add(tree);

  clock = new THREE.Clock();

  resize();
  window.addEventListener('resize', onResize);
}

async function setupTree() {
  if (props.preset && TreePreset[props.preset]) {
    await loadPresetWithTextures(tree, props.preset, false);
  } else {
    tree.options = new TreeOptions();
  }

  const internalOptions = tree.options;
  internalOptions.copy(props.options, internalOptions);

  const leafColorHex = normalizeColor(props.leafColor);
  if (leafColorHex !== null) {
    internalOptions.leaves.tint = leafColorHex;
  }

  if (props.leafCount !== null && props.leafCount !== undefined) {
    tree.options.leaves.count = props.leafCount;
  }

  applyTreeTextures(tree);

  if (props.autoGenerate) {
    generate();
  }
}

function generate() {
  try {
    const t0 = performance.now();
    tree.generate();
    const ms = performance.now() - t0;
    emit('generate', { vertices: tree.vertexCount, triangles: tree.triangleCount, ms });
  } catch (err) {
    emit('error', err);
  }
}

function onResize() {
  resize();
}

function resize() {
  if (!renderer || !canvasContainer.value) return;
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  const t = clock.getElapsedTime();
  if (tree) tree.update(t);
  controls.update();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(animate);
}

function updateEnvironment() {
  if (!environment) return;
  environment.updateConfig({
    grassCount: props.grassCount,
    skybox: props.skybox,
    showGround: props.showGround,
    shadows: props.shadows,
  });
}

onMounted(async () => {
  try {
    await nextTick();
    initScene();
    await setupTree();
    isReady = true;
    animate();
  } catch (err) {
    emit('error', err);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(rafId);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  if (tree) {
    tree.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
});

watch(() => props.preset, (name) => {
  if (!tree) return;
  if (TreePreset[name]) {
    loadPresetWithTextures(tree, name, false);
    const leafColorHex = normalizeColor(props.leafColor);
    if (leafColorHex !== null) tree.options.leaves.tint = leafColorHex;
    if (props.leafCount !== null && props.leafCount !== undefined) {
      tree.options.leaves.count = props.leafCount;
    }
    generate();
  }
});

watch(() => props.options, (newOptions) => {
  if (!tree) return;
  tree.options.copy(newOptions, tree.options);
  const leafColorHex = normalizeColor(props.leafColor);
  if (leafColorHex !== null) tree.options.leaves.tint = leafColorHex;
  if (props.leafCount !== null && props.leafCount !== undefined) {
    tree.options.leaves.count = props.leafCount;
  }
  applyTreeTextures(tree);
  if (props.autoGenerate) generate();
}, { deep: true });

watch(() => props.leafColor, (value) => {
  if (!tree) return;
  const hex = normalizeColor(value);
  if (hex !== null) {
    tree.options.leaves.tint = hex;
    applyTreeTextures(tree);
    if (props.autoGenerate) generate();
  }
});

watch(() => props.leafCount, (value) => {
  console.log('EzTreeView leafCount prop changed:', value);
  if (!tree || value === null || value === undefined) return;
  tree.options.leaves.count = value;
  applyTreeTextures(tree);
  if (props.autoGenerate) generate();
});

watch(() => props.grassCount, updateEnvironment);
watch(() => props.skybox, updateEnvironment);
watch(() => props.showGround, updateEnvironment);
watch(() => props.shadows, (value) => {
  if (renderer) renderer.shadowMap.enabled = value;
  updateEnvironment();
});

watch(() => props.cameraTarget, (target) => {
  if (controls) controls.target.set(target.x, target.y, target.z);
}, { deep: true });

defineExpose({ generate, getTree: () => tree });
</script>

<template>
  <div ref="canvasContainer" class="ez-tree-view"></div>
</template>

<style scoped>
.ez-tree-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
</style>
