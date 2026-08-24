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
    generate();
  }
});

watch(() => props.options, (newOptions, oldOptions) => {
  if (!tree) return;

  const leafOnlyKeys = ['count', 'size', 'sizeVariance', 'start', 'angle', 'billboard', 'type', 'tint', 'alphaTest', 'roundedNormals'];
  const changedKeys = [];
  if (oldOptions) {
    for (const key of leafOnlyKeys) {
      if (JSON.stringify(newOptions.leaves?.[key]) !== JSON.stringify(oldOptions.leaves?.[key])) {
        changedKeys.push(key);
      }
    }
  }

  const branchKeysChanged = [];
  if (oldOptions) {
    for (const topKey of Object.keys(newOptions)) {
      if (topKey === 'leaves') continue;
      if (JSON.stringify(newOptions[topKey]) !== JSON.stringify(oldOptions[topKey])) {
        branchKeysChanged.push(topKey);
      }
    }
  }

  tree.options.copy(newOptions, tree.options);
  const leafColorHex = normalizeColor(props.leafColor);
  if (leafColorHex !== null) tree.options.leaves.tint = leafColorHex;
  applyTreeTextures(tree);

  if (!props.autoGenerate) return;

  if (branchKeysChanged.length === 0 && changedKeys.length > 0) {
    tree.regenerateLeaves();
  } else {
    generate();
  }
}, { deep: true });

watch(() => props.leafColor, (value) => {
  if (!tree) return;
  const hex = normalizeColor(value);
  if (hex !== null) {
    tree.options.leaves.tint = hex;
    applyTreeTextures(tree);
    if (props.autoGenerate) tree.regenerateLeaves();
  }
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

function handlePresetChange(name) {
  if (TreePreset[name]) {
    loadPresetWithTextures(tree, name, false);
    const leafColorHex = normalizeColor(props.leafColor);
    if (leafColorHex !== null) tree.options.leaves.tint = leafColorHex;
    generate();
  }
}

function randomizeSeed() {
  tree.options.seed = Math.floor(Math.random() * 65536);
  generate();
}

function hexString(value) {
  const hex = normalizeColor(value) ?? tree?.options?.leaves?.tint ?? 0xffffff;
  return '#' + hex.toString(16).padStart(6, '0');
}

function setLeafColorFromEvent(event) {
  const hex = parseInt(event.target.value.slice(1), 16);
  tree.options.leaves.tint = hex;
  applyTreeTextures(tree);
  if (props.autoGenerate) tree.regenerateLeaves();
}

defineExpose({ generate, getTree: () => tree });
</script>

<template>
  <div ref="canvasContainer" class="ez-tree-view">
    <div v-if="showControls" class="controls" :class="controlsPosition">
      <select :value="preset ?? ''" @change="(e) => handlePresetChange(e.target.value)">
        <option value="">Custom</option>
        <option v-for="key in Object.keys(TreePreset)" :key="key" :value="key">{{ key }}</option>
      </select>
      <button @click="randomizeSeed">Randomize Seed</button>
      <label class="color-label">
        Leaf color
        <input
          type="color"
          :value="hexString(leafColor)"
          @input="setLeafColorFromEvent"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.ez-tree-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.controls {
  position: absolute;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  align-items: center;
}

.controls.top-right { top: 8px; right: 8px; }
.controls.top-left { top: 8px; left: 8px; }
.controls.bottom-right { bottom: 8px; right: 8px; }
.controls.bottom-left { bottom: 8px; left: 8px; }

select, button {
  font-family: system-ui, sans-serif;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  cursor: pointer;
}

.color-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  color: #fff;
}

.color-label input[type="color"] {
  width: 32px;
  height: 22px;
  border: none;
  padding: 0;
  cursor: pointer;
}
</style>
